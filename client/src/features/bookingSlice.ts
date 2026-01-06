import { createSlice } from "@reduxjs/toolkit";

/**
 * bookingSlice - Redux Slice for Booking Form State
 *
 * Manages the state of the booking form (check-in, check-out, guests)
 * This state is shared across components and can be used to trigger room searches.
 *
 * See: https://redux-toolkit.js.org/api/createslice
 */

export interface BookingState {
	checkIn: string;
	checkOut: string;
	guests: number;
}

const initialState: BookingState = {
	checkIn: "",
	checkOut: "",
	guests: 1,
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
		resetBooking: (state) => {
			state.checkIn = "";
			state.checkOut = "";
			state.guests = 1;
		},
	},
});

export const { setCheckIn, setCheckOut, setGuests, resetBooking } =
	bookingSlice.actions;
export default bookingSlice.reducer;

