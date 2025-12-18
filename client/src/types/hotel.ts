/**
 * Hotel type definition for frontend usage.
 * Extend this interface as more hotel fields are added to the backend.
 */
export interface Hotel {
	_id: string;
	name: string;
	address: string;
	phone?: string;
	category: string;
	amenities?: string[];
	managerId?: string | null;
	createdAt?: string;
	updatedAt?: string;
}
