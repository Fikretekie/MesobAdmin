/**
 * Mesob Store — customer support chat API.
 * AWS Lambda, Node.js 20.x or 22.x. No npm dependencies (AWS SDK v3 ships with the runtime).
 *
 * One POST endpoint, routed by `action` in the JSON body. Customers (the mobile app) send their
 * Cognito ID token in the Authorization header; it is verified here against the user pool's
 * public keys, so no API Gateway authorizer is needed.
 *
 * Customers act on their own conversation. Admins (the admin portal, which sends no token, or
 * callers sending X-Admin-Key) pass `userId` to act on a customer's conversation, and can list
 * every conversation.
 *
 * Each customer has one thread, made of tickets: either side can mark the conversation solved
 * (resolveConversation), and the customer starts a new one (startNewConversation) or simply writes
 * again. Both leave a `sender: "system"` message in the thread (`event`: "solved" | "reopened"), so
 * clients can draw a divider; the conversation's `status` is "open" or "solved".
 *
 * Attachments: JPEG/PNG/WebP/GIF images and PDFs, up to 10 MB each and 5 per message, stored in
 * the S3 bucket ATTACHMENTS_BUCKET. The client asks for an upload URL (getUploadUrl), PUTs the
 * file straight to S3, then sends the message with the returned keys. Messages come back with a
 * short-lived download `url` per attachment; getAttachmentUrl issues a fresh one.
 */
import crypto from 'node:crypto';
import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {S3Client, HeadObjectCommand} from '@aws-sdk/client-s3';
import {
  CreatePlatformEndpointCommand,
  PublishCommand,
  SetEndpointAttributesCommand,
  SNSClient,
} from '@aws-sdk/client-sns';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  TransactWriteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

const TABLE = process.env.TABLE_NAME || 'MesobSupportChat';
const ACTIVITY_INDEX = process.env.ACTIVITY_INDEX || 'byActivity';
const USER_POOL_ID = process.env.USER_POOL_ID || '';
const CLIENT_IDS = (process.env.USER_POOL_CLIENT_IDS || '')
  .split(',')
  .map(id => id.trim())
  .filter(Boolean);
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';
const NOTIFY_MAIL_URL = process.env.NOTIFY_MAIL_URL || '';
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || '';
// The SNS platform application the app's broadcast pushes already use (FCM, for iOS and Android).
// Set it to an empty string to turn support-reply pushes off.
const PUSH_PLATFORM_APP_ARN =
  process.env.PUSH_PLATFORM_APP_ARN ?? 'arn:aws:sns:us-east-1:807954077262:app/GCM/Mesob';
// Comma-separated, e.g. "https://admin.mesobstore.com,http://localhost:5173". Only browsers
// (the admin portal) enforce this; the mobile app isn't subject to CORS.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGIN || '*')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
// Must be in the same region as this function, and have no dots in its name.
const ATTACHMENTS_BUCKET = process.env.ATTACHMENTS_BUCKET || '';

const MAX_TEXT_LENGTH = 2000;
const TYPING_TTL_MS = 6000;
// Polls re-read this far behind the client's cursor, so a message whose write committed
// slightly out of timestamp order is never skipped. Clients de-duplicate by id.
const POLL_OVERLAP_MS = 10000;
const CONVERSATION_GSI_PK = 'CONVERSATION';

const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const ATTACHMENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);
const UPLOAD_URL_TTL_SECONDS = 300;
// Download links can also stop working earlier, when the function's own credentials rotate;
// clients ask getAttachmentUrl for a fresh one when a link fails.
const DOWNLOAD_URL_TTL_SECONDS = 3600;

const ISSUER = `https://cognito-idp.${USER_POOL_ID.split('_')[0]}.amazonaws.com/${USER_POOL_ID}`;

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: {removeUndefinedValues: true},
});
const s3 = new S3Client({});
const sns = new SNSClient({});

function corsHeaders(origin) {
  const allowOrigin = ALLOWED_ORIGINS.includes('*')
    ? '*'
    : ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Admin-Key',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    // The admin portal polls every few seconds; don't preflight every request.
    'Access-Control-Max-Age': '600',
    ...(allowOrigin !== '*' && {Vary: 'Origin'}),
  };
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const reply = (cors, statusCode, body) => ({
  statusCode,
  headers: {'Content-Type': 'application/json', ...cors},
  body: JSON.stringify(body),
});

export const handler = async event => {
  const headers = Object.fromEntries(
    Object.entries(event.headers || {}).map(([k, v]) => [k.toLowerCase(), v]),
  );
  const cors = corsHeaders(headers.origin);
  const method = event.requestContext?.http?.method || event.httpMethod;
  if (method === 'OPTIONS') {
    return {statusCode: 204, headers: cors, body: ''};
  }
  try {
    const caller = await authenticate(headers);
    return reply(cors, 200, await route(caller, parseBody(event)));
  } catch (err) {
    if (err instanceof HttpError) {
      return reply(cors, err.status, {message: err.message});
    }
    console.error(err);
    return reply(cors, 500, {message: 'Internal error'});
  }
};

function parseBody(event) {
  if (!event.body) {
    return {};
  }
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    throw new HttpError(400, 'Body must be JSON');
  }
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

async function authenticate(headers) {
  const adminKey = headers['x-admin-key'];
  if (adminKey) {
    if (!ADMIN_API_KEY || !safeEqual(adminKey, ADMIN_API_KEY)) {
      throw new HttpError(401, 'Invalid admin key');
    }
    return {isAdmin: true, sub: null, email: null, name: null};
  }

  const token = (headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) {
    // The admin portal sends no token: treat it as support.
    return {isAdmin: true, sub: null, email: null, name: null};
  }

  // The mobile app: a verified Cognito ID token is always a customer.
  // An invalid or expired token still throws 401 inside verifyIdToken.
  const claims = await verifyIdToken(token);
  return {
    isAdmin: false,
    sub: claims.sub,
    email: claims.email || null,
    name:
      claims.name ||
      [claims.given_name, claims.family_name].filter(Boolean).join(' ') ||
      null,
  };
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

let signingKeys = new Map();
let signingKeysFetchedAt = 0;

async function signingKey(kid) {
  // Unknown kid usually means Cognito rotated its keys; refetch, at most once a minute.
  if (!signingKeys.has(kid) && Date.now() - signingKeysFetchedAt > 60000) {
    const res = await fetch(`${ISSUER}/.well-known/jwks.json`);
    if (!res.ok) {
      throw new Error(`JWKS fetch failed with ${res.status}`);
    }
    const {keys} = await res.json();
    signingKeys = new Map(
      keys.map(jwk => [jwk.kid, crypto.createPublicKey({key: jwk, format: 'jwk'})]),
    );
    signingKeysFetchedAt = Date.now();
  }
  return signingKeys.get(kid);
}

async function verifyIdToken(token) {
  if (!USER_POOL_ID) {
    throw new Error('USER_POOL_ID is not configured');
  }
  const [encodedHeader, encodedPayload, signature] = token.split('.');
  if (!signature) {
    throw new HttpError(401, 'Malformed token');
  }
  let header;
  let claims;
  try {
    header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString('utf8'));
    claims = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
  } catch {
    throw new HttpError(401, 'Malformed token');
  }

  const key = header.alg === 'RS256' ? await signingKey(header.kid) : undefined;
  const valid =
    key &&
    crypto.verify(
      'RSA-SHA256',
      Buffer.from(`${encodedHeader}.${encodedPayload}`),
      key,
      Buffer.from(signature, 'base64url'),
    );
  if (!valid) {
    throw new HttpError(401, 'Invalid token signature');
  }
  if (claims.iss !== ISSUER || claims.token_use !== 'id') {
    throw new HttpError(401, 'Token was not issued for this app');
  }
  if (CLIENT_IDS.length && !CLIENT_IDS.includes(claims.aud)) {
    throw new HttpError(401, 'Token was not issued for this app');
  }
  if (claims.exp * 1000 <= Date.now()) {
    throw new HttpError(401, 'Token expired');
  }
  return claims;
}

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------

async function route(caller, body) {
  if (body.action === 'listConversations') {
    if (!caller.isAdmin) {
      throw new HttpError(403, 'Admins only');
    }
    return listConversations(body);
  }

  // A phone can only be linked to the signed-in customer holding it, never by an admin on
  // someone's behalf: that would let anyone receive another customer's support replies.
  if (body.action === 'registerDevice' || body.action === 'unregisterDevice') {
    if (!caller.sub) {
      throw new HttpError(403, 'Only a signed-in customer can register a device');
    }
    return body.action === 'registerDevice'
      ? registerDevice(caller.sub, body)
      : unregisterDevice(caller.sub, body);
  }

  // Admins act on a customer's conversation via `userId`; everyone else on their own.
  const actingAsAdmin =
    caller.isAdmin && typeof body.userId === 'string' && body.userId.length > 0;
  const userId = actingAsAdmin ? body.userId : caller.sub;
  if (!userId) {
    throw new HttpError(400, 'userId is required');
  }
  const thread = {
    userId,
    pk: `CONV#${userId}`,
    role: actingAsAdmin ? 'admin' : 'user',
    peer: actingAsAdmin ? 'user' : 'admin',
    caller,
  };

  switch (body.action) {
    case 'getMessages':
      return getMessages(thread, body);
    case 'sendMessage':
      return sendMessage(thread, body);
    case 'setTyping':
      return setTyping(thread, body);
    case 'markRead':
      return markRead(thread);
    case 'getUploadUrl':
      return getUploadUrl(thread, body);
    case 'getAttachmentUrl':
      return getAttachmentUrl(thread, body);
    case 'resolveConversation':
      return resolveConversation(thread);
    case 'startNewConversation':
      return startNewConversation(thread);
    default:
      throw new HttpError(400, `Unknown action: ${body.action}`);
  }
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

async function getMessages(thread, body) {
  const [page, meta] = await Promise.all([
    queryMessages(thread.pk, body),
    getMeta(thread.pk),
  ]);
  if (body.markRead && meta?.[`${thread.role}Unread`] > 0) {
    await markRead(thread);
  }
  return {
    messages: page.messages,
    hasMore: page.hasMore,
    conversation: {
      peerTyping: (meta?.[`${thread.peer}TypingUntil`] ?? 0) > Date.now(),
      peerLastReadAt: meta?.[`${thread.peer}LastReadAt`] ?? null,
      ...ticketState(meta),
    },
    serverTime: new Date().toISOString(),
  };
}

async function queryMessages(pk, body) {
  const after = typeof body.after === 'string' ? body.after : null;
  const before = typeof body.before === 'string' ? body.before : null;

  if (after) {
    const from = new Date(Date.parse(after.split('#')[0]) - POLL_OVERLAP_MS);
    if (Number.isNaN(from.getTime())) {
      throw new HttpError(400, 'Invalid cursor');
    }
    const res = await ddb.send(
      new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: 'pk = :pk AND sk > :from',
        ExpressionAttributeValues: {':pk': pk, ':from': `MSG#${from.toISOString()}`},
        ConsistentRead: true,
        Limit: 100,
      }),
    );
    return {messages: res.Items.map(toMessage), hasMore: !!res.LastEvaluatedKey};
  }

  // Newest page, or the page just before `before` when scrolling back through history.
  const limit = clampInt(body.limit, 1, 100, 30);
  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: before
        ? 'pk = :pk AND sk BETWEEN :lo AND :hi'
        : 'pk = :pk AND begins_with(sk, :lo)',
      ExpressionAttributeValues: {
        ':pk': pk,
        ':lo': 'MSG#',
        ...(before && {':hi': `MSG#${before}`}),
      },
      ScanIndexForward: false,
      ConsistentRead: true,
      // BETWEEN includes `before` itself, which is filtered out below.
      Limit: before ? limit + 1 : limit,
    }),
  );
  const messages = res.Items.map(toMessage)
    .filter(m => m.id !== before)
    .reverse();
  return {messages, hasMore: !!res.LastEvaluatedKey};
}

async function sendMessage(thread, body) {
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (text.length > MAX_TEXT_LENGTH) {
    throw new HttpError(400, `Messages are limited to ${MAX_TEXT_LENGTH} characters`);
  }
  const attachments = await checkAttachments(thread, body.attachments);
  if (!text && attachments.length === 0) {
    throw new HttpError(400, 'Message text or an attachment is required');
  }
  const {pk, role, peer, caller} = thread;
  const meta = await getMeta(pk);
  const now = new Date().toISOString();
  // Writing to a solved conversation starts a new one; its divider goes just before the message.
  const reopened =
    ticketState(meta).status === 'solved'
      ? systemMessage('reopened', role, new Date(Date.parse(now) - 1).toISOString())
      : null;
  const message = {
    id: `${now}#${crypto.randomUUID().slice(0, 8)}`,
    sender: role,
    text,
    createdAt: now,
    clientId: typeof body.clientId === 'string' ? body.clientId.slice(0, 64) : undefined,
    attachments: attachments.length > 0 ? attachments : undefined,
  };
  const preview = text ? text.slice(0, 200) : attachmentPreview(attachments);

  // Email the support inbox only for the first message the admin hasn't read yet,
  // not for every message in a burst.
  const shouldNotify =
    role === 'user' && NOTIFY_MAIL_URL && NOTIFY_EMAIL && !(meta?.adminUnread > 0);

  const set = [
    'userId = :userId',
    'createdAt = if_not_exists(createdAt, :now)',
    'lastMessageAt = :now',
    'lastMessageText = :preview',
    'lastSender = :role',
    'gsi1pk = :gsi1pk',
    'gsi1sk = :now',
    // Sending implies the sender has read the thread and stopped typing.
    `${role}LastReadAt = :now`,
    `${role}Unread = :zero`,
    `${role}TypingUntil = :zero`,
    '#status = :open',
  ];
  const values = {
    ':userId': thread.userId,
    ':now': now,
    ':preview': preview,
    ':role': role,
    ':gsi1pk': CONVERSATION_GSI_PK,
    ':zero': 0,
    ':one': 1,
    ':open': 'open',
  };
  if (reopened) {
    set.push('ticketNumber = if_not_exists(ticketNumber, :one) + :one');
  }
  if (role === 'user') {
    set.push('userEmail = :email', 'userName = :name');
    values[':email'] = caller.email;
    values[':name'] = caller.name;
  }

  await ddb.send(
    new TransactWriteCommand({
      TransactItems: [
        ...(reopened
          ? [{Put: {TableName: TABLE, Item: {pk, sk: `MSG#${reopened.id}`, ...reopened}}}]
          : []),
        {Put: {TableName: TABLE, Item: {pk, sk: `MSG#${message.id}`, ...message}}},
        {
          Update: {
            TableName: TABLE,
            Key: {pk, sk: 'META'},
            UpdateExpression:
              `SET ${set.join(', ')} ADD ${peer}Unread :one` +
              (reopened ? ' REMOVE solvedAt, solvedBy' : ''),
            ExpressionAttributeNames: {'#status': 'status'},
            ExpressionAttributeValues: values,
          },
        },
      ],
    }),
  );

  if (shouldNotify) {
    await notifyAdmin(caller, preview);
  }
  if (role === 'admin') {
    await pushToCustomer(thread.userId, message, preview);
  }
  return {message: toMessage(message)};
}

async function setTyping({pk, role}, body) {
  await updateExistingMeta(pk, `SET ${role}TypingUntil = :until`, {
    ':until': body.isTyping ? Date.now() + TYPING_TTL_MS : 0,
  });
  return {ok: true};
}

async function markRead({pk, role}) {
  await updateExistingMeta(pk, `SET ${role}LastReadAt = :now, ${role}Unread = :zero`, {
    ':now': new Date().toISOString(),
    ':zero': 0,
  });
  return {ok: true};
}

async function listConversations(body) {
  if (body.status !== undefined && body.status !== 'open' && body.status !== 'solved') {
    throw new HttpError(400, 'status must be open or solved');
  }
  let startKey;
  if (body.cursor) {
    try {
      startKey = JSON.parse(Buffer.from(String(body.cursor), 'base64url').toString('utf8'));
    } catch {
      throw new HttpError(400, 'Invalid cursor');
    }
  }
  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: ACTIVITY_INDEX,
      KeyConditionExpression: 'gsi1pk = :gsi1pk',
      // Conversations from before tickets existed have no status: they count as open.
      ...(body.status && {
        FilterExpression:
          body.status === 'solved'
            ? '#status = :solved'
            : 'attribute_not_exists(#status) OR #status = :open',
        ExpressionAttributeNames: {'#status': 'status'},
      }),
      ExpressionAttributeValues: {
        ':gsi1pk': CONVERSATION_GSI_PK,
        ...(body.status === 'solved' && {':solved': 'solved'}),
        ...(body.status === 'open' && {':open': 'open'}),
      },
      ScanIndexForward: false,
      // With a status filter a page can hold fewer than `limit`; keep paging by nextCursor.
      Limit: clampInt(body.limit, 1, 100, 30),
      ExclusiveStartKey: startKey,
    }),
  );
  const now = Date.now();
  return {
    conversations: res.Items.map(c => ({
      userId: c.userId,
      userEmail: c.userEmail ?? null,
      userName: c.userName ?? null,
      lastMessageAt: c.lastMessageAt,
      lastMessageText: c.lastMessageText,
      lastSender: c.lastSender,
      unread: c.adminUnread ?? 0,
      userTyping: (c.userTypingUntil ?? 0) > now,
      ...ticketState(c),
    })),
    nextCursor: res.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(res.LastEvaluatedKey)).toString('base64url')
      : null,
  };
}

// Step 1 of sending a file: a one-off URL the client PUTs the file to, straight into S3.
// The key is scoped to this conversation, so sendMessage can check it belongs here.
function getUploadUrl({userId}, body) {
  requireBucket();
  const contentType = typeof body.contentType === 'string' ? body.contentType.toLowerCase() : '';
  if (!ATTACHMENT_TYPES.has(contentType)) {
    throw new HttpError(400, 'Only JPEG, PNG, WebP or GIF images and PDFs can be attached');
  }
  const size = Number(body.size);
  if (!(size > 0) || size > MAX_ATTACHMENT_BYTES) {
    throw new HttpError(400, 'Attachments are limited to 10 MB');
  }
  const key = `chat/${userId}/${crypto.randomUUID()}/${safeKeyName(body.fileName)}`;
  return {
    key,
    // Content-Type is signed, so the upload must be the type that was approved here.
    uploadUrl: presignS3('PUT', key, UPLOAD_URL_TTL_SECONDS, {'content-type': contentType}),
    headers: {'Content-Type': contentType},
  };
}

function getAttachmentUrl({userId}, body) {
  requireBucket();
  if (!ownsKey(userId, body.key)) {
    throw new HttpError(400, 'Unknown attachment');
  }
  return {url: presignS3('GET', body.key, DOWNLOAD_URL_TTL_SECONDS)};
}

// ---------------------------------------------------------------------------
// Attachments
// ---------------------------------------------------------------------------

function requireBucket() {
  if (!ATTACHMENTS_BUCKET) {
    throw new HttpError(400, 'Attachments are not enabled (ATTACHMENTS_BUCKET is not set)');
  }
}

// Keys look like chat/<userId>/<uuid>/<file name>, as issued by getUploadUrl.
function ownsKey(userId, key) {
  const prefix = `chat/${userId}/`;
  return (
    typeof key === 'string' &&
    key.startsWith(prefix) &&
    /^[0-9a-f-]{36}\/[A-Za-z0-9._-]{1,80}$/.test(key.slice(prefix.length))
  );
}

// Checks each attachment of a message against what actually landed in S3 (type and size come
// from S3, not from the client).
async function checkAttachments({userId}, list) {
  if (list === undefined || list === null) {
    return [];
  }
  if (!Array.isArray(list) || list.length > MAX_ATTACHMENTS) {
    throw new HttpError(400, `Up to ${MAX_ATTACHMENTS} attachments per message`);
  }
  if (list.length > 0) {
    requireBucket();
  }
  return Promise.all(
    list.map(async item => {
      const key = item?.key;
      if (!ownsKey(userId, key)) {
        throw new HttpError(400, 'Unknown attachment');
      }
      let head;
      try {
        head = await s3.send(new HeadObjectCommand({Bucket: ATTACHMENTS_BUCKET, Key: key}));
      } catch (err) {
        if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
          throw new HttpError(400, 'Attachment upload not found; upload it again');
        }
        throw err;
      }
      const contentType = (head.ContentType || '').toLowerCase();
      if (!ATTACHMENT_TYPES.has(contentType) || head.ContentLength > MAX_ATTACHMENT_BYTES) {
        throw new HttpError(400, 'Attachment type or size is not allowed');
      }
      return {
        key,
        name: cleanFileName(item.name || key.split('/').pop()),
        contentType,
        size: head.ContentLength,
      };
    }),
  );
}

// Conversation-list preview for a message that has no text.
function attachmentPreview(attachments) {
  if (attachments.length > 1) {
    return `📎 ${attachments.length} attachments`;
  }
  return attachments[0].contentType.startsWith('image/') ? '📎 Photo' : `📎 ${attachments[0].name}`;
}

function safeKeyName(name) {
  const base = String(name || '').split(/[\\/]/).pop();
  return base.replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^[._]+/, '').slice(-80) || 'file';
}

function cleanFileName(name) {
  const base = String(name || '').split(/[\\/]/).pop();
  return base.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 120) || 'file';
}

// AWS Signature V4 query-string presigning for one S3 object, using this function's own
// credentials (which Lambda provides as environment variables). Done by hand so the function
// keeps needing nothing beyond the runtime's built-in SDK clients.
function presignS3(method, key, expiresIn, signedHeaders = {}, now = new Date()) {
  const region = process.env.AWS_REGION;
  const host = `${ATTACHMENTS_BUCKET}.s3.${region}.amazonaws.com`;
  const amzDate = now.toISOString().replace(/[-:]|\.\d{3}/g, '');
  const date = amzDate.slice(0, 8);
  const scope = `${date}/${region}/s3/aws4_request`;
  const path = `/${key.split('/').map(encodeRfc3986).join('/')}`;

  const headers = {host, ...signedHeaders};
  const headerNames = Object.keys(headers).sort();
  const query = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${process.env.AWS_ACCESS_KEY_ID}/${scope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expiresIn),
    'X-Amz-SignedHeaders': headerNames.join(';'),
    ...(process.env.AWS_SESSION_TOKEN && {'X-Amz-Security-Token': process.env.AWS_SESSION_TOKEN}),
  };
  const canonicalQuery = Object.keys(query)
    .sort()
    .map(k => `${encodeRfc3986(k)}=${encodeRfc3986(query[k])}`)
    .join('&');
  const canonicalRequest = [
    method,
    path,
    canonicalQuery,
    headerNames.map(h => `${h}:${String(headers[h]).trim()}\n`).join(''),
    headerNames.join(';'),
    'UNSIGNED-PAYLOAD',
  ].join('\n');
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    scope,
    crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
  ].join('\n');

  const hmac = (k, v) => crypto.createHmac('sha256', k).update(v).digest();
  const signingKeyBytes = hmac(
    hmac(hmac(hmac(`AWS4${process.env.AWS_SECRET_ACCESS_KEY}`, date), region), 's3'),
    'aws4_request',
  );
  const signature = crypto.createHmac('sha256', signingKeyBytes).update(stringToSign).digest('hex');
  return `https://${host}${path}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}

const encodeRfc3986 = value =>
  encodeURIComponent(value).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getMeta(pk) {
  const res = await ddb.send(
    new GetCommand({TableName: TABLE, Key: {pk, sk: 'META'}, ConsistentRead: true}),
  );
  return res.Item;
}

/** Updates the conversation record, doing nothing if the conversation doesn't exist yet. */
async function updateExistingMeta(pk, expression, values) {
  try {
    await ddb.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: {pk, sk: 'META'},
        UpdateExpression: expression,
        ConditionExpression: 'attribute_exists(pk)',
        ExpressionAttributeValues: values,
      }),
    );
  } catch (err) {
    if (err.name !== 'ConditionalCheckFailedException') {
      throw err;
    }
  }
}

async function notifyAdmin(caller, text) {
  try {
    await fetch(NOTIFY_MAIL_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        email: NOTIFY_EMAIL,
        subject: 'New support chat message',
        message: `customer's email : ${caller.email ?? 'unknown'} , \ncustomer's message : "${text}"`,
      }),
      signal: AbortSignal.timeout(4000),
    });
  } catch (err) {
    console.warn('Admin notification failed', err);
  }
}

// ---------------------------------------------------------------------------
// Solved conversations
// ---------------------------------------------------------------------------

/** The ticket fields every client reads; conversations from before tickets count as open #1. */
const ticketState = meta => ({
  status: meta?.status ?? 'open',
  ticketNumber: meta?.ticketNumber ?? 1,
  solvedAt: meta?.solvedAt ?? null,
  solvedBy: meta?.solvedBy ?? null,
});

const systemMessage = (event, by, createdAt) => ({
  id: `${createdAt}#${crypto.randomUUID().slice(0, 8)}`,
  sender: 'system',
  event,
  by,
  text: '',
  createdAt,
});

/** A transaction whose condition failed: someone else changed the status first. */
const lostRace = err =>
  err.name === 'ConditionalCheckFailedException' ||
  (err.name === 'TransactionCanceledException' &&
    err.CancellationReasons?.some(r => r.Code === 'ConditionalCheckFailed'));

async function resolveConversation(thread) {
  const meta = await getMeta(thread.pk);
  if (!meta) {
    throw new HttpError(400, 'There is no conversation to mark as solved');
  }
  if (ticketState(meta).status === 'solved') {
    return {message: null, conversation: ticketState(meta)};
  }
  const now = new Date().toISOString();
  const event = systemMessage('solved', thread.role, now);
  try {
    await ddb.send(
      new TransactWriteCommand({
        TransactItems: [
          {Put: {TableName: TABLE, Item: {pk: thread.pk, sk: `MSG#${event.id}`, ...event}}},
          {
            Update: {
              TableName: TABLE,
              Key: {pk: thread.pk, sk: 'META'},
              UpdateExpression:
                'SET #status = :solved, solvedAt = :now, solvedBy = :by, ' +
                'userTypingUntil = :zero, adminTypingUntil = :zero',
              ConditionExpression: 'attribute_not_exists(#status) OR #status = :open',
              ExpressionAttributeNames: {'#status': 'status'},
              ExpressionAttributeValues: {
                ':solved': 'solved',
                ':open': 'open',
                ':now': now,
                ':by': thread.role,
                ':zero': 0,
              },
            },
          },
        ],
      }),
    );
  } catch (err) {
    if (!lostRace(err)) {
      throw err;
    }
    return {message: null, conversation: ticketState(await getMeta(thread.pk))};
  }
  return {
    message: toMessage(event),
    conversation: ticketState({...meta, status: 'solved', solvedAt: now, solvedBy: thread.role}),
  };
}

async function startNewConversation(thread) {
  const meta = await getMeta(thread.pk);
  if (ticketState(meta).status !== 'solved') {
    return {message: null, conversation: ticketState(meta)};
  }
  const now = new Date().toISOString();
  const event = systemMessage('reopened', thread.role, now);
  try {
    await ddb.send(
      new TransactWriteCommand({
        TransactItems: [
          {Put: {TableName: TABLE, Item: {pk: thread.pk, sk: `MSG#${event.id}`, ...event}}},
          {
            Update: {
              TableName: TABLE,
              Key: {pk: thread.pk, sk: 'META'},
              UpdateExpression:
                'SET #status = :open, ticketNumber = if_not_exists(ticketNumber, :one) + :one ' +
                'REMOVE solvedAt, solvedBy',
              ConditionExpression: '#status = :solved',
              ExpressionAttributeNames: {'#status': 'status'},
              ExpressionAttributeValues: {':open': 'open', ':solved': 'solved', ':one': 1},
            },
          },
        ],
      }),
    );
  } catch (err) {
    if (!lostRace(err)) {
      throw err;
    }
    return {message: null, conversation: ticketState(await getMeta(thread.pk))};
  }
  return {
    message: toMessage(event),
    conversation: ticketState({...meta, status: 'open', ticketNumber: (meta.ticketNumber ?? 1) + 1, solvedAt: null, solvedBy: null}),
  };
}

// ---------------------------------------------------------------------------
// Push notifications for support replies
// ---------------------------------------------------------------------------
// Each phone is stored twice: under its customer's conversation (CONV#<sub> / DEVICE#<id>), so a
// reply finds that customer's phones, and as PUSHTOKEN#<id> / OWNER, so a phone belongs only to
// the last customer who signed in on it. <id> is a hash of the FCM token.

const tokenId = token => crypto.createHash('sha256').update(token).digest('hex').slice(0, 32);

async function registerDevice(userId, body) {
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  if (!token || token.length > 4096) {
    throw new HttpError(400, 'token is required');
  }
  if (body.platform !== 'ios' && body.platform !== 'android') {
    throw new HttpError(400, 'platform must be ios or android');
  }
  if (body.pushService !== 'fcm') {
    throw new HttpError(400, 'pushService must be fcm');
  }
  if (!PUSH_PLATFORM_APP_ARN) {
    throw new HttpError(400, 'Push notifications are not enabled');
  }

  const endpointArn = await endpointFor(token);
  const id = tokenId(token);
  const owner = await ddb.send(
    new GetCommand({TableName: TABLE, Key: {pk: `PUSHTOKEN#${id}`, sk: 'OWNER'}}),
  );
  const previousUserId = owner.Item?.userId;
  if (previousUserId && previousUserId !== userId) {
    await ddb.send(
      new DeleteCommand({TableName: TABLE, Key: {pk: `CONV#${previousUserId}`, sk: `DEVICE#${id}`}}),
    );
  }
  const now = new Date().toISOString();
  await Promise.all([
    ddb.send(
      new PutCommand({
        TableName: TABLE,
        Item: {pk: `PUSHTOKEN#${id}`, sk: 'OWNER', userId, updatedAt: now},
      }),
    ),
    ddb.send(
      new PutCommand({
        TableName: TABLE,
        Item: {
          pk: `CONV#${userId}`,
          sk: `DEVICE#${id}`,
          platform: body.platform,
          endpointArn,
          updatedAt: now,
        },
      }),
    ),
  ]);
  return {ok: true};
}

async function unregisterDevice(userId, body) {
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  if (!token) {
    throw new HttpError(400, 'token is required');
  }
  await forgetDevice(userId, tokenId(token));
  return {ok: true};
}

/** Drops the device records. The SNS endpoint stays: the app's broadcasts use it too. */
async function forgetDevice(userId, id) {
  await ddb.send(
    new DeleteCommand({TableName: TABLE, Key: {pk: `CONV#${userId}`, sk: `DEVICE#${id}`}}),
  );
  try {
    await ddb.send(
      new DeleteCommand({
        TableName: TABLE,
        Key: {pk: `PUSHTOKEN#${id}`, sk: 'OWNER'},
        ConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {':userId': userId},
      }),
    );
  } catch (err) {
    // The phone has since been registered by another customer: leave their record alone.
    if (err.name !== 'ConditionalCheckFailedException') {
      throw err;
    }
  }
}

/**
 * The SNS endpoint for an FCM token, enabled. SNS returns the existing endpoint when the app has
 * already created one for its broadcasts, and disables endpoints whose token FCM rejected; a
 * fresh registration means the token works again.
 */
async function endpointFor(token) {
  let endpointArn;
  try {
    ({EndpointArn: endpointArn} = await sns.send(
      new CreatePlatformEndpointCommand({PlatformApplicationArn: PUSH_PLATFORM_APP_ARN, Token: token}),
    ));
  } catch (err) {
    // An endpoint for this token exists with other attributes; SNS names it in the message.
    endpointArn = /Endpoint (arn:aws:sns:\S+) already exists/.exec(err.message ?? '')?.[1];
    if (!endpointArn) {
      throw err;
    }
  }
  await sns.send(
    new SetEndpointAttributesCommand({
      EndpointArn: endpointArn,
      Attributes: {Enabled: 'true', Token: token},
    }),
  );
  return endpointArn;
}

/**
 * Pushes a support reply to every phone the customer is signed in on. Never fails the send: the
 * reply is already saved, and the app shows it the next time the chat polls.
 */
async function pushToCustomer(userId, message, body) {
  if (!PUSH_PLATFORM_APP_ARN) {
    return;
  }
  try {
    const pk = `CONV#${userId}`;
    const [devices, meta] = await Promise.all([
      ddb.send(
        new QueryCommand({
          TableName: TABLE,
          KeyConditionExpression: 'pk = :pk AND begins_with(sk, :device)',
          ExpressionAttributeValues: {':pk': pk, ':device': 'DEVICE#'},
        }),
      ),
      getMeta(pk),
    ]);
    if (!devices.Items?.length) {
      return;
    }
    // One FCM message for both platforms: the android block for Android, apns for iPhone.
    const fcm = {
      fcmV1Message: {
        message: {
          notification: {title: 'Mesob Support', body},
          data: {type: 'support_message', messageId: message.id},
          android: {
            priority: 'high',
            notification: {channel_id: 'support_messages', tag: 'support-chat', sound: 'default'},
          },
          apns: {
            payload: {
              aps: {sound: 'default', badge: meta?.userUnread ?? 1, 'thread-id': 'support-chat'},
            },
          },
        },
      },
    };
    const payload = JSON.stringify({GCM: JSON.stringify(fcm)});
    await Promise.all(
      devices.Items.map(async device => {
        try {
          await sns.send(
            new PublishCommand({
              TargetArn: device.endpointArn,
              MessageStructure: 'json',
              Message: payload,
            }),
          );
        } catch (err) {
          // FCM rejected the token (app uninstalled, token rotated): stop sending to it.
          if (err.name === 'EndpointDisabledException') {
            await forgetDevice(userId, device.sk.slice('DEVICE#'.length));
          } else {
            console.warn('Support push failed', err.name);
          }
        }
      }),
    );
  } catch (err) {
    console.warn('Support push skipped', err.name ?? err);
  }
}

// Stored attachments carry no URL; each read signs a fresh short-lived one.
const toMessage = ({id, sender, text, createdAt, clientId, attachments, event, by}) => ({
  id,
  sender,
  text,
  createdAt,
  clientId,
  event,
  by,
  attachments: attachments?.map(a => ({
    ...a,
    url: presignS3('GET', a.key, DOWNLOAD_URL_TTL_SECONDS),
  })),
});

function clampInt(value, min, max, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}
