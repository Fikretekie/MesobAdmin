// Helper functions for Products

export const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "number") {
    return `$${value.toFixed(2)}`;
  }
  const parsed = parseFloat(
    String(value)
      .replace("$", "")
      .replace(",", "")
      .trim()
  );
  if (isNaN(parsed)) return value;
  return `$${parsed.toFixed(2)}`;
};

export const formatMoneyString = (value) => {
  if (value === undefined || value === null) return "";
  const trimmed = String(value).trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("$")) return trimmed;
  const numeric = Number(trimmed.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(numeric)) return trimmed;
  return `$ ${numeric.toFixed(2)}`;
};

export const parseCategoryTags = (input) => {
  if (!input) return [];
  return input
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
};

export const buildCategoriesArray = (menuId, tags) => {
  const list = [];
  if (menuId) list.push(String(menuId));
  return list.concat(tags);
};

export const sanitizeIdForSelector = (id) => {
  return String(id)
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

export const parseProductImages = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return [...new Set(value.flatMap((item) => parseProductImages(item)))];
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parseProductImages(parsed) : [];
      } catch (error) {
        // Fall back to simple delimiter parsing below.
      }
    }

    return [
      ...new Set(
        trimmed
          .split(/[\n,]+/)
          .map((item) => item.trim())
          .filter(Boolean)
      ),
    ];
  }

  return [];
};

export const stringifyProductImages = (value) => {
  return parseProductImages(value).join(", ");
};

export const getProductRequestId = (product) => {
  if (!product || typeof product !== "object") return "";

  return (
    product.productId ||
    product.product_id ||
    product.Product_id ||
    product.id ||
    ""
  );
};

export const mapApiProductToForm = (product) => {
  const rawCategories = Array.isArray(product.categories) ? product.categories : [];
  const derivedMenuId =
    rawCategories.length > 0
      ? String(rawCategories[0])
      : product.Menu_id
      ? String(product.Menu_id)
      : product.menuId
      ? String(product.menuId)
      : product.menu_id
      ? String(product.menu_id)
      : "";
  const categoryTags = rawCategories.slice(1).map((tag) => String(tag || "")).filter(Boolean);
  const normalizeToString = (value) => {
    if (value === undefined || value === null || value === "") return "";
    return String(value);
  };
  const imageList = parseProductImages(
    product.content?.images || product.content?.image || product.images || product.image
  );

  return {
    id: getProductRequestId(product),
    title: product.title || "",
    category: product.category || product.menu_name || "",
    categoriesInput: categoryTags.join(", "),
    country: product.country || product.content?.country || "",
    description: product.content?.description || "",
    price: product.content?.price || "",
    cost: product.content?.cost || "",
    image: imageList[0] || "",
    images: stringifyProductImages(imageList),
    stockQuantity: normalizeToString(
      product.stockQuantity ??
        product.quantity ??
        product.stock_quantity ??
        product.content?.stockQuantity
    ),
    availableQuantity: normalizeToString(
      product.availableQuantity ??
        product.available_quantity ??
        product.content?.availableQuantity ??
        product.quantityAvailable
    ),
    off_percentage: product.off_percentage || "",
    isRecommended: Boolean(product.isRecommended),
    menuId: derivedMenuId,
    subCategoryId:
      product.Sub_category_id !== undefined && product.Sub_category_id !== null
        ? String(product.Sub_category_id)
        : product.subCategoryId !== undefined && product.subCategoryId !== null
        ? String(product.subCategoryId)
        : product.sub_category_id !== undefined && product.sub_category_id !== null
        ? String(product.sub_category_id)
        : "",
  };
};

const parseQuantityValue = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const buildPayload = (formState) => {
  const tagList = parseCategoryTags(formState.categoriesInput);
  const categories = buildCategoriesArray(formState.menuId, tagList);
  const imageList = parseProductImages(formState.images || formState.image);
  const serializedImages = stringifyProductImages(imageList);
  const payload = {
    title: formState.title.trim(),
    category: formState.category.trim(),
    categories,
    content: {
      description: formState.description?.trim() || "",
      price: formatMoneyString(formState.price),
      cost: formatMoneyString(formState.cost),
      image: imageList[0] || "",
      images: serializedImages,
      country: formState.country.trim(),
      title: formState.title.trim(),
    },
    country: formState.country.trim(),
    off_percentage: formState.off_percentage?.trim() || "",
    isRecommended: Boolean(formState.isRecommended),
    menuId: formState.menuId || undefined,
  };

  const quantity = parseQuantityValue(formState.stockQuantity);
  const availableQuantity = parseQuantityValue(formState.availableQuantity);

  if (quantity !== undefined) {
    payload.stockQuantity = quantity;
    payload.quantity = quantity;
  }
  if (availableQuantity !== undefined) {
    payload.availableQuantity = availableQuantity;
  }

  if (formState.subCategoryId) {
    const numericId = Number(formState.subCategoryId);
    if (Number.isFinite(numericId)) {
      payload.subCategoryId = numericId;
    }
  }

  return payload;
};

export const initialProductState = {
  id: "",
  title: "",
  category: "",
  categoriesInput: "",
  country: "",
  description: "",
  price: "",
  cost: "",
  image: "",
  images: "",
  stockQuantity: "",
  availableQuantity: "",
  off_percentage: "",
  isRecommended: false,
  menuId: "",
  subCategoryId: "",
};

