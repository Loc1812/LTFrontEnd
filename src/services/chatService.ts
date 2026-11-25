import { websocketService } from "./websocket";
import type { ServerMessage } from "../types/websocket";
import type { ChatMessage } from "../store/slice/ChatSlice";
import type { Conversation } from "../component/chat/ConversationItem";

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
        throw new Error("Dữ liệu tin nhắn không hợp lệ.");
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
            throw new Error("Dữ liệu lịch sử chat không hợp lệ.");
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
            throw new Error("Người nhận và nội dung không được để trống.");
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
            throw new Error("Tên phòng không được để trống.");
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
            throw new Error("Tên phòng không được để trống.");
        }
        const data = await this.request("JOIN_ROOM", {
            name: roomName
        });

        return isObject(data) && typeof data.name === "string"
            ? data.name
            : roomName;
    }

    // GET_USER_LIST: danh sách phòng (type 1) và chat 1-1 (type 0) gần nhất của người dùng
    async getUserList(): Promise<Conversation[]> {
        const data = await this.request("GET_USER_LIST", {});

        if (data === undefined || data === null) {
            return [];
        }
        if (!Array.isArray(data)) {
            throw new Error("Dữ liệu danh sách trò chuyện không hợp lệ.");
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
                // "2026-11-02 10:00:00" -> "2026-11-02T10:00:00" để mọi trình duyệt đều đọc được
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
            throw new Error("Invalid online status response.");
        }

        return data.status;
    }

    async checkUserExist(user: string): Promise<boolean> {
        const data = await this.request("CHECK_USER_EXIST", {
            user
        });

        if (!isObject(data) || typeof data.status !== "boolean") {
            throw new Error("Invalid user existence response.");
        }

        return data.status;
    }
}

export const chatService = new ChatService();