// Utility function to format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    day: "numeric",
    month: "short", // 'short' for abbreviated month
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true, // Use 12-hour clock with AM/PM
  });
}

export default formatDate;
