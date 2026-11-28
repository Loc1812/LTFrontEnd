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

export type ChatKind = "people" | "room";
export const chatKey = (kind: ChatKind, name: string): string => `${kind}-${name}`;

interface ChatState {
    messagesByChat: Record<string, ChatMessage[]>;
    pendingByChat: Record<string, ChatMessage[]>;
    currentChat: string | null;
    loading: boolean;
    conversations: Conversation[];
}

const initialState: ChatState = {
    messagesByChat: {},
    pendingByChat: {},
    currentChat: null,
    loading: false,
    conversations: []
};

function mergeHistoryWithPending(history: ChatMessage[], pending: ChatMessage[]): ChatMessage[] {
    if (pending.length === 0) return history;

    const windowStart = Math.max(0, history.length - (pending.length + 3));
    const used = new Set<number>();
    const extra: ChatMessage[] = [];

    for (const message of pending) {
        let found = -1;
        for (let index = history.length - 1; index >= windowStart; index--) {
            if (used.has(index)) continue;
            if (history[index].sender === message.sender && history[index].content === message.content) {
                found = index;
                break;
            }
        }
        if (found >= 0) used.add(found);
        else extra.push(message);
    }
    return [...history, ...extra];
}

const chatSlice = createSlice({
    name: "chat",
    initialState,
    reducers: {
        beginChatHistoryLoad: (state, action: PayloadAction<string>) => {
            if (state.pendingByChat[action.payload] === undefined) {
                state.pendingByChat[action.payload] = [];
            }
        },
        setChatHistory: (state, action: PayloadAction<{ key: string; messages: ChatMessage[] }>) => {
            const { key, messages } = action.payload;
            state.messagesByChat[key] = mergeHistoryWithPending(messages, state.pendingByChat[key] ?? []);
            delete state.pendingByChat[key];
        },
        cancelChatHistoryLoad: (state, action: PayloadAction<string>) => {
            delete state.pendingByChat[action.payload];
        },
        appendChatMessage: (state, action: PayloadAction<{ key: string; message: ChatMessage }>) => {
            const { key, message } = action.payload;
            if (state.messagesByChat[key] !== undefined) {
                state.messagesByChat[key].push(message);
            } else if (state.pendingByChat[key] !== undefined) {
                state.pendingByChat[key].push(message);
            }
        },
        clearAllMessages: (state) => {
            state.messagesByChat = {};
            state.pendingByChat = {};
        },
        setCurrentChat: (state, action: PayloadAction<string | null>) => {
            state.currentChat = action.payload;
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
    beginChatHistoryLoad,
    setChatHistory,
    cancelChatHistoryLoad,
    appendChatMessage,
    clearAllMessages,
    setCurrentChat,
    setLoading,
    mergeConversations,
    upsertConversation
} = chatSlice.actions;

export default chatSlice.reducer;