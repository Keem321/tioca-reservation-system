import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PodFloor, PodQuality } from "../types/room";
import type { Room } from "../types/room";
import type { Reservation } from "../types/reservation";

/**
 * bookingSlice - Redux Slice for Booking Form State
 *
 * Manages the state of the booking form (check-in, check-out, guests, zone, quality)
 * and selected room/reservation data for the booking flow.
 * This state is shared across components and can be used to trigger room searches.
 *
 * See: https://redux-toolkit.js.org/api/createslice
 */

export interface BookingState {
	checkIn: string;
	checkOut: string;
	guests: number;
	zone: PodFloor | "";
	quality: PodQuality | "";
	selectedRoom: Room | null;
	pendingReservation: Reservation | null;
}

const initialState: BookingState = {
	checkIn: "",
	checkOut: "",
	guests: 1,
	zone: "",
	quality: "",
	selectedRoom: null,
	pendingReservation: null,
};

const bookingSlice = createSlice({
	name: "booking",
	initialState,
	reducers: {
		setCheckIn: (state, action: PayloadAction<string>) => {
			state.checkIn = action.payload;
		},
		setCheckOut: (state, action: PayloadAction<string>) => {
			state.checkOut = action.payload;
		},
		setGuests: (state, action: PayloadAction<number>) => {
			state.guests = action.payload;
		},
		setZone: (state, action: PayloadAction<PodFloor | "">) => {
			state.zone = action.payload;
			// Reset quality if zone changes and quality is not compatible
			if (action.payload !== "women-only" && state.quality === "matcha") {
				state.quality = "";
			}
		},
		setQuality: (state, action: PayloadAction<PodQuality | "">) => {
			state.quality = action.payload;
		},
		setSelectedRoom: (state, action: PayloadAction<Room | null>) => {
			state.selectedRoom = action.payload;
		},
		setPendingReservation: (
			state,
			action: PayloadAction<Reservation | null>
		) => {
			state.pendingReservation = action.payload;
		},
		resetBooking: (state) => {
			state.checkIn = "";
			state.checkOut = "";
			state.guests = 1;
			state.zone = "";
			state.quality = "";
			state.selectedRoom = null;
			state.pendingReservation = null;
		},
	},
});

export const {
	setCheckIn,
	setCheckOut,
	setGuests,
	setZone,
	setQuality,
	setSelectedRoom,
	setPendingReservation,
	resetBooking,
} = bookingSlice.actions;
export default bookingSlice.reducer;
