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
              src={row.content.image}
              alt={row.title}
              style={thumbnailImageStyle}
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
      name: "Category",
      selector: (row) => row.category || "-",
      sortable: true,
      width: "160px",
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
      name: "Description",
      selector: (row) => row.content?.description || "-",
      cell: (row) => {
        const desc = row.content?.description || "-";
        return (
          <div style={{ maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={desc}>
            {desc}
          </div>
        );
      },
      sortable: false,
      wrap: false,
      width: "300px",
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
      name: "Off %",
      selector: (row) => row.off_percentage || "-",
      width: "100px",
    },
    {
      name: "Recommended",
      selector: (row) => row.isRecommended,
      cell: (row) =>
        row.isRecommended ? (
          <Badge color="success">Yes</Badge>
        ) : (
          <Badge color="secondary">No</Badge>
        ),
      width: "140px",
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
          <div className="d-flex align-items-center" style={{ gap: "0.4rem" }}>
            <Button
              id={editId}
              color="link"
              size="sm"
              className="btn-round btn-icon"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(row);
              }}
              aria-label="Edit product"
              style={{
                backgroundColor: "transparent",
                border: "none",
                padding: "0.25rem 0.5rem",
              }}
            >
              <FaEdit size={14} color="#17a2b8" />
            </Button>
            {/* <UncontrolledTooltip target={editId}>
              Edit or duplicate product
            </UncontrolledTooltip> */}
            <Button
              id={deleteId}
              color="link"
              size="sm"
              className="btn-round btn-icon"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(row);
              }}
              aria-label="Delete product"
              style={{
                backgroundColor: "transparent",
                border: "none",
                padding: "0.25rem 0.5rem",
              }}
            >
              <FaTrash size={13} color="#dc3545" />
            </Button>
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

