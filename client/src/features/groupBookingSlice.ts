import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PodFloor, PodQuality } from "../types/room";

/**
 * Group member room request
 */
export interface GroupMemberRequest {
	id: string; // Unique ID for this request
	quality: PodQuality | ""; // Desired room quality
	floor?: PodFloor; // Preferred floor (optional - can cross floors)
	assignedRoomId?: string; // Room assigned to this member
	numberOfGuests?: number; // Number of guests (1-2 for couples/business-crystal, 1 for others)
}

/**
 * Timeslot within a group booking (guests sharing same check-in/out dates)
 */
export interface GroupBookingTimeslot {
	id: string;
	checkIn: string; // ISO date string
	checkOut: string; // ISO date string
	members: GroupMemberRequest[];
}

/**
 * Group booking state
 */
export interface GroupBookingState {
	isGroupBooking: boolean;
	timeslots: GroupBookingTimeslot[];
}

const initialState: GroupBookingState = {
	isGroupBooking: false,
	timeslots: [],
};

const groupBookingSlice = createSlice({
	name: "groupBooking",
	initialState,
	reducers: {
		/**
		 * Toggle between group and individual booking
		 */
		setIsGroupBooking: (state, action: PayloadAction<boolean>) => {
			state.isGroupBooking = action.payload;
			if (!action.payload) {
				// Reset group booking state when switching to individual
				state.timeslots = [];
			} else if (state.timeslots.length === 0) {
				// Initialize with first timeslot when switching to group
				const initialTimeslot: GroupBookingTimeslot = {
					id: `timeslot-${Date.now()}`,
					checkIn: "",
					checkOut: "",
					members: [], // No initial member - will be created when floor is selected
				};
				state.timeslots.push(initialTimeslot);
			}
		},

		/**
		 * Add a new timeslot for a different check-in/out period
		 */
		addTimeslot: (state) => {
			const newTimeslot: GroupBookingTimeslot = {
				id: `timeslot-${Date.now()}-${Math.random()}`,
				checkIn: "",
				checkOut: "",
				members: [], // No initial member - will be created when floor is selected
			};
			state.timeslots.push(newTimeslot);
		},

		/**
		 * Remove a timeslot
		 */
		removeTimeslot: (state, action: PayloadAction<string>) => {
			if (state.timeslots.length > 1) {
				state.timeslots = state.timeslots.filter(
					(t) => t.id !== action.payload
				);
			}
		},

		/**
		 * Set check-in date for a timeslot
		 */
		setTimeslotCheckIn: (
			state,
			action: PayloadAction<{ timeslotId: string; checkIn: string }>
		) => {
			const timeslot = state.timeslots.find(
				(t) => t.id === action.payload.timeslotId
			);
			if (timeslot) {
				timeslot.checkIn = action.payload.checkIn;
			}
		},

		/**
		 * Set check-out date for a timeslot
		 */
		setTimeslotCheckOut: (
			state,
			action: PayloadAction<{ timeslotId: string; checkOut: string }>
		) => {
			const timeslot = state.timeslots.find(
				(t) => t.id === action.payload.timeslotId
			);
			if (timeslot) {
				timeslot.checkOut = action.payload.checkOut;
			}
		},

		/**
		 * Add a member to a timeslot
		 */
		addMemberToTimeslot: (
			state,
			action: PayloadAction<{
				timeslotId: string;
				quality?: PodQuality | "";
				floor?: PodFloor;
				numberOfGuests?: number;
			}>
		) => {
			const timeslot = state.timeslots.find(
				(t) => t.id === action.payload.timeslotId
			);
			if (timeslot) {
				const id = `member-${Date.now()}-${Math.random()}`;
				timeslot.members.push({
					id,
					quality: action.payload.quality || "",
					floor: action.payload.floor,
					numberOfGuests: action.payload.numberOfGuests || 1,
				});
			}
		},

		/**
		 * Remove a member from a timeslot
		 */
		removeMemberFromTimeslot: (
			state,
			action: PayloadAction<{ timeslotId: string; memberId: string }>
		) => {
			const timeslot = state.timeslots.find(
				(t) => t.id === action.payload.timeslotId
			);
			if (timeslot) {
				timeslot.members = timeslot.members.filter(
					(m) => m.id !== action.payload.memberId
				);
			}
		},

		/**
		 * Update member preferences in a timeslot
		 */
		updateMemberInTimeslot: (
			state,
			action: PayloadAction<{
				timeslotId: string;
				memberId: string;
				quality?: PodQuality | "";
				floor?: PodFloor;
				numberOfGuests?: number;
			}>
		) => {
			const timeslot = state.timeslots.find(
				(t) => t.id === action.payload.timeslotId
			);
			if (timeslot) {
				const member = timeslot.members.find(
					(m) => m.id === action.payload.memberId
				);
				if (member) {
					if (action.payload.quality !== undefined) {
						member.quality = action.payload.quality;
					}
					if (action.payload.floor !== undefined) {
						member.floor = action.payload.floor;
					}
					if (action.payload.numberOfGuests !== undefined) {
						member.numberOfGuests = action.payload.numberOfGuests;
					}
				}
			}
		},

		/**
		 * Assign a room to a member in a timeslot
		 */
		assignRoomToMemberInTimeslot: (
			state,
			action: PayloadAction<{
				timeslotId: string;
				memberId: string;
				roomId: string;
			}>
		) => {
			const timeslot = state.timeslots.find(
				(t) => t.id === action.payload.timeslotId
			);
			if (timeslot) {
				const member = timeslot.members.find(
					(m) => m.id === action.payload.memberId
				);
				if (member) {
					member.assignedRoomId = action.payload.roomId;
				}
			}
		},

		/**
		 * Reset group booking state
		 */
		resetGroupBooking: (state) => {
			state.isGroupBooking = false;
			state.timeslots = [];
		},
	},
});

export const {
	setIsGroupBooking,
	addTimeslot,
	removeTimeslot,
	setTimeslotCheckIn,
	setTimeslotCheckOut,
	addMemberToTimeslot,
	removeMemberFromTimeslot,
	updateMemberInTimeslot,
	assignRoomToMemberInTimeslot,
	resetGroupBooking,
} = groupBookingSlice.actions;

export default groupBookingSlice.reducer;
