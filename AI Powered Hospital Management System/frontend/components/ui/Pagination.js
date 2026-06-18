'use client';

export default function Pagination({ currentPage = 1, totalPages = 1, totalItems = 0, itemsPerPage = 20, onPageChange }) {
  if (totalPages <= 1) return null;

  function getPages() {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="pagination">
      <span className="pagination-info">
        Showing {startItem}–{endItem} of {totalItems}
      </span>
      <div className="pagination-controls">
        <button
          className="btn btn-ghost btn-sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >← Prev</button>
        {getPages().map(p => (
          <button
            key={p}
            className={`btn btn-sm ${p === currentPage ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => onPageChange(p)}
          >{p}</button>
        ))}
        <button
          className="btn btn-ghost btn-sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >Next →</button>
      </div>
    </div>
  );
}
