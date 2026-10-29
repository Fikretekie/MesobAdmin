import React from "react";
import { Navigate, useParams } from "react-router-dom";
import { CHAT_PATH, conversationPath } from "./paths";

// Live chat used to be its own "Support" page at /admin/support.
function LegacySupportRedirect() {
  const { userId } = useParams();
  return <Navigate to={userId ? conversationPath(userId) : CHAT_PATH} replace />;
}

export default LegacySupportRedirect;
