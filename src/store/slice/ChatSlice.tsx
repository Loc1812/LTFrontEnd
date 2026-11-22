import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Conversation } from "../../component/chat/ConversationItem";

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
    conversations: Conversation[];
}

const MOCK_CONVERSATIONS: Conversation[] = [
    // Du lieu để Test giao dien
    {id: "1", name: "tranthib", type: "people", lastMessageAt: "2026-11-18T21:35:00"},
    {id: "2", name: "Phòng Datamining", type: "room", lastMessageAt: "2026-11-18T09:12:00"},
    {id: "3", name: "lethic", type: "people", lastMessageAt: "2026-11-17T20:48:00"},
    {id: "4", name: "Lớp CNTT K23", type: "room", lastMessageAt: "2026-11-16T14:03:00"},
    {id: "5", name: "phamvand", type: "people", lastMessageAt: "2026-11-12T08:30:00"},
    {id: "6", name: "Phòng đồ án Web", type: "room", lastMessageAt: "2026-11-05T19:20:00"},
];

const initialState: ChatState = {
    messages: [],
    currentChat: null,
    loading: false,
    conversations: MOCK_CONVERSATIONS
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
        },

        upsertConversation: (state, action: PayloadAction<Conversation>) => {
            const {type, name} = action.payload;
            state.conversations = [
                action.payload,
                ...state.conversations.filter((item) => !(item.type === type && item.name === name))
            ];
        }
    }
});

export const {
    addMessage,
    setMessages,
    clearMessages,
    setCurrentChat,
    setLoading,
    upsertConversation
} = chatSlice.actions;

export default chatSlice.reducer;