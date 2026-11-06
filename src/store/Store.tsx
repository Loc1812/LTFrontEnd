import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slice/AuthSlice";
import chatReducer from "./slice/ChatSlice";
export const store = configureStore({
    reducer: {
        auth: authReducer,
        chat: chatReducer
    }
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;