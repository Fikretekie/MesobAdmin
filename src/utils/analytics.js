// src/utils/analytics.js

const API_URL = "https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev";

export const trackEvent = async (eventType, metadata = {}) => {
  try {
    // Get userId from localStorage/session
    const userId = localStorage.getItem("userId") || "anonymous";
    
    // Get or create sessionId
    let sessionId = sessionStorage.getItem("sessionId");
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem("sessionId", sessionId);
    }
    
    const eventData = {
      eventType,
      userId,
      sessionId,
      deviceType: "web", // Change to "mobile" in your mobile app
      metadata: {
        ...metadata,
        url: window.location.href,
        referrer: document.referrer,
        timestamp: new Date().toISOString()
      }
    };
    
    await fetch(`${API_URL}/analytics/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(eventData)
    });
  } catch (error) {
    console.error("Analytics tracking error:", error);
    // Fail silently - don't disrupt user experience
  }
};

// Convenience functions
export const trackPageView = (pageName) => {
  trackEvent("PAGE_VIEW", { pageName });
};

export const trackProductView = (productId, productTitle) => {
  trackEvent("PRODUCT_VIEW", { productId, productTitle });
};

export const trackCategoryView = (categoryId, categoryName) => {
  trackEvent("CATEGORY_VIEW", { categoryId, categoryName });
};

export const trackAddToCart = (productId, productTitle, quantity) => {
  trackEvent("ADD_TO_CART", { productId, productTitle, quantity });
};

export const trackOrderPlaced = (orderId, orderTotal) => {
  trackEvent("ORDER_PLACED", { orderId, orderTotal });
};