import { configureStore } from "@reduxjs/toolkit";
import tweetReducer from './features/tweet/tweetSlice'
import modalReducer from './features/modal/modalSlice'
import userSlice from "./features/user/userSlice";
import toastSlice from "./features/toast/toastSlice";
import { useDispatch } from "react-redux";

export const store = configureStore({
    reducer: {
        tweets: tweetReducer,
        modal: modalReducer,
        user: userSlice,
        toast: toastSlice
    }
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch