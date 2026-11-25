import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Conversation } from "../../component/chat/ConversationItem";
import { logout } from "./AuthSlice";

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

const initialState: ChatState = {
    messages: [],
    currentChat: null,
    loading: false,
    conversations: []
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
        },
        setCurrentChat: (state, action: PayloadAction<string | null>) => {
            state.currentChat = action.payload;
            state.messages = [];
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        mergeConversations: (state, action: PayloadAction<Conversation[]>) => {
            const incoming = action.payload;
            const localOnly = state.conversations.filter(
                (local) => !incoming.some((item) => item.type === local.type && item.name === local.name)
            );
            state.conversations = [...localOnly, ...incoming];
        },

        upsertConversation: (state, action: PayloadAction<Conversation>) => {
            const {type, name} = action.payload;
            state.conversations = [
                action.payload,
                ...state.conversations.filter((item) => !(item.type === type && item.name === name))
            ];
        }
    },
    extraReducers: (builder) => {
        builder.addCase(logout, () => initialState);
    }
});

export const {
    addMessage,
    setMessages,
    clearMessages,
    setCurrentChat,
    setLoading,
    mergeConversations,
    upsertConversation
} = chatSlice.actions;

export default chatSlice.reducer;