import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    result: ''
}

export const toastSlice = createSlice({
    name: 'toast',
    initialState,
    reducers: {
        setToast: (state, action) => {
            state.result = action.payload;
        },
        resetToast: (state) => {
            state.result = '';
        }
    }
})

export const { setToast, resetToast } =  toastSlice.actions;
export default toastSlice.reducer;
