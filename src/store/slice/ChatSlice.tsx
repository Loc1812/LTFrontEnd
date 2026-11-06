import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface ChatMessage {
    id: string;
    sender: string;
    content: string;
    time?: string;
}
interface ChatState {
    messages: ChatMessage[];
}
const initialState: ChatState = {
    messages: []
};
const chatSlice = createSlice({
    name: "chat",
    initialState,
    reducers: {
        addMessage: (state, action: PayloadAction<ChatMessage>) => {
            state.messages.push(action.payload);
        },
        setMessages: (state, action: PayloadAction<ChatMessage[]>) => {
            state.messages = action.payload;
        },
        clearMessages: (state) => {
            state.messages = [];
        }
    }
});
export const {
    addMessage,
    setMessages,
    clearMessages
} = chatSlice.actions;
export default chatSlice.reducer;