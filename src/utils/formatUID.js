function formatUserId(userId) {
  const userIdStr = String(userId);
  if (userIdStr.length <= 6) {
    return userIdStr;
  }
  return `${userIdStr.slice(0, 3)} ... ${userIdStr.slice(-3)}`;
}

export default formatUserId;