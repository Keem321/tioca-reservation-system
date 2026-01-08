import React from "react";
import PodCard from "./PodCard";
import type { Room } from "../../types/room";
import "./SearchResults.css";

/**
 * SearchResults Component
 *
 * Displays search results for available pods.
 */

interface SearchResultsProps {
	results: Room[];
	nights: number;
	checkIn: string;
	checkOut: string;
}

const SearchResults: React.FC<SearchResultsProps> = ({
	results,
	nights,
	checkIn,
	checkOut,
}) => {
	if (results.length === 0) {
		return (
			<div className="search-results search-results--empty">
				<p className="search-results__empty-message">
					No pods available for your selected dates. Please try different dates or
					floor selections.
				</p>
			</div>
		);
	}

	return (
		<div className="search-results">
			<h2 className="search-results__title">
				Available Pods{" "}
				{nights > 0 && `(${nights} night${nights > 1 ? "s" : ""})`}
			</h2>
			<div className="search-results__grid">
				{results.map((pod) => (
					<PodCard
						key={pod._id}
						pod={pod}
						nights={nights}
						checkIn={checkIn}
						checkOut={checkOut}
					/>
				))}
			</div>
		</div>
	);
};

export default SearchResults;

