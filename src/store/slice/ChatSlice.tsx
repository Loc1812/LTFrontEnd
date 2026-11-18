
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface ChatMessage {
    id?: number | string;
    sender: string;
    receiver: string;
    content: string;
    time?: string;
    type: number;
}

interface ChatState {
    messages: ChatMessage[];
    currentChat: string | null;
    loading: boolean;
}

const initialState: ChatState = {
    messages: [],
    currentChat: null,
    loading: false
};

const chatSlice = createSlice({
    name: "chat",
    initialState,
    reducers: {
        // Thêm một tin nhắn mới
        addMessage: (state, action: PayloadAction<ChatMessage>) => {
            state.messages.push(action.payload);
        },

        // Thay thế danh sách tin nhắn
        setMessages: (state, action: PayloadAction<ChatMessage[]>) => {
            state.messages = action.payload;
        },

        // Xóa tin nhắn
        clearMessages: (state) => {
            state.messages = [];
        },

        // Chọn người đang trò chuyện
        setCurrentChat: (state, action: PayloadAction<string | null>) => {
            state.currentChat = action.payload;
            state.messages = [];
        },

        // Trạng thái tải tin nhắn
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        }
    }
});

export const {
    addMessage,
    setMessages,
    clearMessages,
    setCurrentChat,
    setLoading
} = chatSlice.actions;

export default chatSlice.reducer;
