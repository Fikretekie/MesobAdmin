import React from "react";
import { Badge, Button, UncontrolledTooltip } from "reactstrap";
import { FaEdit, FaTrash } from "react-icons/fa";
import { formatCurrency, sanitizeIdForSelector } from "./utils";

const thumbnailWrapperStyle = {
  width: 60,
  height: 60,
  borderRadius: 8,
  overflow: "hidden",
  background: "#f4f5f7",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid rgba(0,0,0,0.05)",
};

// The originals in S3 average ~565 kB each — far too big for a 60x60 cell,
// and unusable for staff on 2G. Pre-generated 120x120 JPEGs live alongside
// them under a "thumbs/" prefix (~5 kB each), so point at those instead.
// If a thumbnail is missing for any reason, onError falls back to the
// original so the image still shows.
const S3_BUCKET_HOST = "appimagesabrehet.s3.amazonaws.com";

const toThumbnailUrl = (url) => {
  if (!url || !url.includes(S3_BUCKET_HOST)) return url;
  try {
    const parsed = new URL(url);
    // S3 URLs encode spaces as "+" (and other characters as %XX), so decode
    // back to the real key name before building the thumbnail path —
    // otherwise "Eggs 30.PNG" is looked up as "Eggs+30.jpg" and 404s.
    const rawPath = parsed.pathname.replace(/^\//, "");
    const decoded = decodeURIComponent(rawPath.replace(/\+/g, " "));
    if (decoded.startsWith("thumbs/")) return url;
    const withoutExt = decoded.replace(/\.[^./]+$/, "");
    const encoded = `thumbs/${withoutExt}.jpg`
      .split("/")
      .map(encodeURIComponent)
      .join("/");
    return `${parsed.origin}/${encoded}`;
  } catch (err) {
    return url;
  }
};

const thumbnailImageStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const placeholderThumbStyle = {
  fontSize: 11,
  color: "#8898aa",
  textAlign: "center",
  padding: "0 4px",
};

export const buildColumns = (onEdit, onDelete, isSeller = false) => {
  const allColumns = [
    {
      name: "Image",
      width: "120px",
      cell: (row) => (
        <div style={thumbnailWrapperStyle}>
          {row.content?.image ? (
            <img
              src={toThumbnailUrl(row.content.image)}
              alt={row.title}
              style={thumbnailImageStyle}
              // Without this the browser requests a thumbnail for every row
              // at once, which stalls completely on a slow connection.
              loading="lazy"
              decoding="async"
              onError={(e) => {
                // Thumbnail missing (e.g. product added since the batch run)
                // — fall back to the original once, don't loop.
                if (e.target.src !== row.content.image) {
                  e.target.src = row.content.image;
                }
              }}
            />
          ) : (
            <div style={placeholderThumbStyle}>N/A</div>
          )}
        </div>
      ),
      ignoreRowClick: true,
    },
    {
      name: "Title",
      selector: (row) => row.title,
      sortable: true,
      wrap: true,
      width: "200px",
    },
    {
      name: "Subcategory",
      selector: (row) => {
        // Try to get subcategory name first
        if (row.subCategoryName) return row.subCategoryName;
        if (row.subCategoryName) return row.subCategoryName;
        // If no name, show ID if available
        if (row.Sub_category_id !== undefined && row.Sub_category_id !== null) {
          return `ID: ${row.Sub_category_id}`;
        }
        if (row.subCategoryId !== undefined && row.subCategoryId !== null) {
          return `ID: ${row.subCategoryId}`;
        }
        if (row.sub_category_id !== undefined && row.sub_category_id !== null) {
          return `ID: ${row.sub_category_id}`;
        }
        return "-";
      },
      cell: (row) => {
        // Try to get subcategory name first
        const subcategoryName = row.sub_category_name || row.subCategoryName;
        if (subcategoryName) {
          return <span>{subcategoryName}</span>;
        }
        // If no name, show ID if available
        const subcategoryId = row.Sub_category_id ?? row.subCategoryId ?? row.sub_category_id;
        if (subcategoryId !== undefined && subcategoryId !== null) {
          return <span className="text-muted">ID: {subcategoryId}</span>;
        }
        return <span className="text-muted">-</span>;
      },
      sortable: true,
      width: "160px",
    },
    {
      name: "Country",
      selector: (row) => row.country || "-",
      sortable: true,
      width: "140px",
    },
    {
      name: "Price",
      selector: (row) => row.content?.price || "-",
      cell: (row) => formatCurrency(row.content?.price),
      sortable: true,
      width: "130px",
    },
    {
      name: "Cost",
      selector: (row) => row.content?.cost || "-",
      cell: (row) => formatCurrency(row.content?.cost),
      sortable: true,
      width: "130px",
    },
    {
      name: "Updated",
      selector: (row) => row.updatedAt,
      cell: (row) =>
        row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "-",
      width: "210px",
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => {
        const editId = `edit-${sanitizeIdForSelector(row.id)}`;
        const deleteId = `delete-${sanitizeIdForSelector(row.id)}`;
        return (
          <div className="d-flex align-items-center" style={{ gap: "0.5rem" }}>
            <button
              id={editId}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(row);
              }}
              aria-label="Edit product"
              style={{
                background: "linear-gradient(90deg, #a78bfa, #60a5fa)",
                border: "none",
                borderRadius: "10px",
                padding: "0.4rem 0.6rem",
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <FaEdit size={16} color="#0a0612" />
            </button>
            <button
              id={deleteId}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(row);
              }}
              aria-label="Delete product"
              style={{
                background: "rgba(244,114,182,0.15)",
                border: "1px solid rgba(244,114,182,0.4)",
                borderRadius: "10px",
                padding: "0.4rem 0.6rem",
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <FaTrash size={15} color="#f9a8d4" />
            </button>
            {/* <UncontrolledTooltip target={deleteId}>
              Remove product from catalog
            </UncontrolledTooltip> */}
          </div>
        );
      },
      ignoreRowClick: true,
      allowOverflow: true,
      width: "200px",
    },
  ];

  // Filter out Price column for sellers
  if (isSeller) {
    return allColumns.filter((column) => column.name !== "Price");
  }

  return allColumns;
};