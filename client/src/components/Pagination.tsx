import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./Pagination.css";

interface PaginationProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	totalItems: number;
	itemsPerPage: number;
	onItemsPerPageChange?: (itemsPerPage: number) => void;
}

/**
 * Pagination Component
 *
 * Reusable pagination controls for tables and lists.
 * Shows page numbers, navigation arrows, and items per page selector.
 */
const Pagination: React.FC<PaginationProps> = ({
	currentPage,
	totalPages,
	onPageChange,
	totalItems,
	itemsPerPage,
	onItemsPerPageChange,
}) => {
	// Calculate the range of page numbers to show
	const getPageNumbers = () => {
		const pages: (number | string)[] = [];
		const maxVisiblePages = 5;

		if (totalPages <= maxVisiblePages + 2) {
			// Show all pages if there aren't many
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			// Always show first page
			pages.push(1);

			// Calculate start and end of middle section
			let start = Math.max(2, currentPage - 1);
			let end = Math.min(totalPages - 1, currentPage + 1);

			// Add ellipsis and adjust if needed
			if (start > 2) {
				pages.push("...");
			}

			for (let i = start; i <= end; i++) {
				pages.push(i);
			}

			if (end < totalPages - 1) {
				pages.push("...");
			}

			// Always show last page
			pages.push(totalPages);
		}

		return pages;
	};

	const startItem = (currentPage - 1) * itemsPerPage + 1;
	const endItem = Math.min(currentPage * itemsPerPage, totalItems);

	if (totalPages === 0) {
		return null;
	}

	return (
		<div className="pagination">
			<div className="pagination__info">
				Showing {startItem}-{endItem} of {totalItems} results
			</div>

			<div className="pagination__controls">
				<button
					className="pagination__button pagination__button--prev"
					onClick={() => onPageChange(currentPage - 1)}
					disabled={currentPage === 1}
					aria-label="Previous page"
				>
					<ChevronLeft size={18} />
					Previous
				</button>

				<div className="pagination__pages">
					{getPageNumbers().map((page, index) => {
						if (page === "...") {
							return (
								<span key={`ellipsis-${index}`} className="pagination__ellipsis">
									...
								</span>
							);
						}

						return (
							<button
								key={page}
								className={`pagination__page ${
									page === currentPage ? "pagination__page--active" : ""
								}`}
								onClick={() => onPageChange(page as number)}
							>
								{page}
							</button>
						);
					})}
				</div>

				<button
					className="pagination__button pagination__button--next"
					onClick={() => onPageChange(currentPage + 1)}
					disabled={currentPage === totalPages}
					aria-label="Next page"
				>
					Next
					<ChevronRight size={18} />
				</button>
			</div>

			{onItemsPerPageChange && (
				<div className="pagination__per-page">
					<label htmlFor="items-per-page">Per page:</label>
					<select
						id="items-per-page"
						value={itemsPerPage}
						onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
					>
						<option value={10}>10</option>
						<option value={25}>25</option>
						<option value={50}>50</option>
						<option value={100}>100</option>
					</select>
				</div>
			)}
		</div>
	);
};

export default Pagination;
