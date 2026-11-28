import { websocketService } from "./websocket";
import type { ServerMessage } from "../types/websocket";
import type { ChatMessage } from "../store/slice/ChatSlice";
import type { Conversation } from "../component/chat/ConversationItem";
import i18n from "../i18n";
interface ApiChatMessage {
    id?: number;
    name: string;
    to: string;
    mes: string;
    createAt?: string;
    type: number;
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function mapMessage(data: unknown): ChatMessage {
    if (
        !isObject(data) ||
        typeof data.name !== "string" ||
        typeof data.to !== "string" ||
        typeof data.mes !== "string" ||
        typeof data.type !== "number"
    ) {
        throw new Error(i18n.t("errInvalidChatMessage"));
    }

    return {
        id: typeof data.id === "number" ? data.id : undefined,
        sender: data.name,
        receiver: data.to,
        content: data.mes,
        time: typeof data.createAt === "string"
            ? data.createAt
            : undefined,
        type: data.type
    };
}

function getMessageTimestamp(time?: string): number {
    if (!time) return 0;
    const numeric = Number(time);
    if (time.trim() !== "" && Number.isFinite(numeric)) {
        return numeric < 1_000_000_000_000
            ? numeric * 1000
            : numeric;
    }
    const timestamp = Date.parse(time);
    return Number.isNaN(timestamp) ? 0 : timestamp;
}

class ChatService {
    private request(
        event: string,
        data: unknown
    ): Promise<unknown> {
        return new Promise((resolve, reject) => {
            let completed = false;

            const unsubscribe = websocketService.subscribe(event, (message: ServerMessage) => {
                    if (completed) return;

                    completed = true;
                    window.clearTimeout(timeout);
                    unsubscribe();

                    if (message.status === "error") {
                        reject(new Error(message.mes || `${event} failed`));
                        return;
                    }

                    resolve(message.data);
                }
            );

            const timeout = window.setTimeout(() => {
                if (completed) return;

                completed = true;
                unsubscribe();

                reject(new Error(`${event} timeout`));
            }, 10000);

            try {
                websocketService.send(event, data);
            } catch (error) {
                completed = true;
                window.clearTimeout(timeout);
                unsubscribe();
                reject(error);
            }
        });
    }

    async getPeopleChatMessages(
        name: string,
        page: number = 1
    ): Promise<ChatMessage[]> {
        const data = await this.request("GET_PEOPLE_CHAT_MES", {
            name,
            page
        });

        if (!Array.isArray(data)) {
            throw new Error(i18n.t("errInvalidChatHistory"));
        }

        const messages = data.map(mapMessage);
        return messages.sort(
            (a, b) =>
                getMessageTimestamp(a.time) -
                getMessageTimestamp(b.time)
        );
    }

    sendPeopleMessage(to: string, mes: string): void {
        if (!to.trim() || !mes.trim()) {
            throw new Error(i18n.t("errRecipientAndMessageRequired"));
        }

        websocketService.send("SEND_CHAT", {
            type: "people",
            to,
            mes
        });
    }

    subscribeMessages(
        callback: (message: ChatMessage) => void
    ): () => void {
        return websocketService.subscribe(
            "SEND_CHAT",
            (message: ServerMessage) => {
                console.log("[chat-debug] frame SEND_CHAT thô:", message); // log tạm, xóa sau khi xác nhận chạy đúng
                if (message.status !== "success") return;

                try {
                    const chatMessage = mapMessage(message.data);
                    callback(chatMessage);
                } catch (error) {
                    console.error("Invalid chat message:", error);
                }
            }
        );
    }

    async createRoom(name: string): Promise<string> {
        const roomName = name.trim();
        if (!roomName) {
            throw new Error(i18n.t("errRoomNameRequired"));
        }
        const data = await this.request("CREATE_ROOM", {
            name: roomName
        });

        return isObject(data) && typeof data.name === "string"
            ? data.name
            : roomName;
    }

    async joinRoom(name: string): Promise<string> {
        const roomName = name.trim();
        if (!roomName) {
            throw new Error(i18n.t("errRoomNameRequired"));

        }
        const data = await this.request("JOIN_ROOM", {
            name: roomName
        });

        return isObject(data) && typeof data.name === "string"
            ? data.name
            : roomName;
    }

    async getUserList(): Promise<Conversation[]> {
        const data = await this.request("GET_USER_LIST", {});

        if (data === undefined || data === null) {
            return [];
        }
        if (!Array.isArray(data)) {
            throw new Error(i18n.t("errInvalidConversationList"));
        }

        const list: Conversation[] = [];
        for (const item of data) {
            const rawType = isObject(item) ? Number(item.type) : NaN;
            if (!isObject(item) || typeof item.name !== "string" || (rawType !== 0 && rawType !== 1)) {
                console.warn("GET_USER_LIST: bỏ qua mục không hợp lệ", item);
                continue;
            }
            const type = rawType === 1 ? "room" : "people";
            list.push({
                id: `${type}-${item.name}`,
                name: item.name,
                type,
                lastMessageAt: typeof item.actionTime === "string"
                    ? item.actionTime.replace(" ", "T")
                    : ""
            });
        }
        return list;
    }

    async checkUserOnline(user: string): Promise<boolean> {
        const data = await this.request("CHECK_USER_ONLINE", {
            user
        });

        if (!isObject(data) || typeof data.status !== "boolean") {
            throw new Error(i18n.t("errInvalidOnlineStatus"));
        }

        return data.status;
    }

    async checkUserExist(user: string): Promise<boolean> {
        const data = await this.request("CHECK_USER_EXIST", {
            user
        });

        if (!isObject(data) || typeof data.status !== "boolean") {
            throw new Error(i18n.t("errInvalidUserExistence"));
        }

        return data.status;
    }
}

export const chatService = new ChatService();