"use client";

export interface OasisPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function OasisPagination({
  page,
  totalPages,
  onPageChange,
  className = "",
}: OasisPaginationProps) {
  return (
    <div className={`oasis-pagination ${className}`.trim()} data-oasis="pagination">
      <button
        type="button"
        className="oasis-btn oasis-btn--outline oasis-btn--sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Page précédente"
      >
        Précédent
      </button>
      <span style={{ padding: "0 var(--oasis-spacing-3)", fontSize: "var(--oasis-text-sm)" }}>
        {page} / {totalPages}
      </span>
      <button
        type="button"
        className="oasis-btn oasis-btn--outline oasis-btn--sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Page suivante"
      >
        Suivant
      </button>
    </div>
  );
}
