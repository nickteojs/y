import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    open: false
}

export const modalSlice = createSlice({
    name: 'modal',
    initialState,
    reducers: {
        setOpen: (state) => {
            state.open = !state.open;
        }
    }
})

export const { setOpen } =  modalSlice.actions;
export default modalSlice.reducer;
