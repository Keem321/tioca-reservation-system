import { createSlice } from "@reduxjs/toolkit";

/**
 * bookingSlice - Redux Slice for Booking Form State
 *
 * Manages the state of the booking form (check-in, check-out, guests)
 * This state is shared across components and can be used to trigger room searches.
 *
 * See: https://redux-toolkit.js.org/api/createslice
 */

import type { PodFloor, PodQuality } from "../types/room";

export interface BookingState {
	checkIn: string;
	checkOut: string;
	guests: number;
	zone: PodFloor | "";
	quality: PodQuality | "";
}

const initialState: BookingState = {
	checkIn: "",
	checkOut: "",
	guests: 1,
	zone: "",
	quality: "",
};

const bookingSlice = createSlice({
	name: "booking",
	initialState,
	reducers: {
		setCheckIn: (state, action) => {
			state.checkIn = action.payload;
		},
		setCheckOut: (state, action) => {
			state.checkOut = action.payload;
		},
		setGuests: (state, action) => {
			state.guests = action.payload;
		},
		setZone: (state, action) => {
			state.zone = action.payload;
			// Reset quality if zone changes and quality is not compatible
			if (action.payload !== "women-only" && state.quality === "matcha") {
				state.quality = "";
			}
		},
		setQuality: (state, action) => {
			state.quality = action.payload;
		},
		resetBooking: (state) => {
			state.checkIn = "";
			state.checkOut = "";
			state.guests = 1;
			state.zone = "";
			state.quality = "";
		},
	},
});

export const { setCheckIn, setCheckOut, setGuests, setZone, setQuality, resetBooking } =
	bookingSlice.actions;
export default bookingSlice.reducer;

