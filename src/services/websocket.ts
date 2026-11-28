import type {ServerMessage, ConnectionStatus} from "../types/websocket";
import i18n from "../i18n";
class WebSocketService {
    private socket: WebSocket | null = null;
    private listeners: Map<string, ((message: ServerMessage) => void)[]> = new Map();
    private statusListeners: (
        (status: ConnectionStatus) => void)[] = [];
    private connectPromise: Promise<void> | null = null;
    private readonly CONNECT_TIMEOUT = 10000;
    connect(): Promise<void> {
        if (this.socket?.readyState === WebSocket.OPEN) {
            return Promise.resolve();
        }
        if (this.socket?.readyState === WebSocket.CONNECTING) {
            return this.connectPromise!;
        }
        if (this.socket?.readyState === WebSocket.CLOSING) {
            return Promise.reject(new Error(i18n.t("errWsClosing")));
        }
        const url = import.meta.env.VITE_WS_URL;
        if (!url) {
            return Promise.reject(new Error(i18n.t("errWsUrlNotConfigured")));
        }
        let socket: WebSocket;
        try {
            socket = new WebSocket(url);
        } catch (error) {
            return Promise.reject(error instanceof Error ? error : new Error(i18n.t("errWsCannotCreate")));
        }
        this.socket = socket;
        this.notifyStatus("CONNECTING");
        let resolveConnect!: () => void;
        let rejectConnect!: (error: Error) => void;
        const promise = new Promise<void>((resolve, reject) => {
            resolveConnect = resolve;
            rejectConnect = reject;
        });
        this.connectPromise = promise;
        let isSettled = false;
        let hasOpened = false;
        let timeout: number;
        const finish = (error?: Error) => {
            if (isSettled) return;
            isSettled = true;
            window.clearTimeout(timeout);
            if (error) {
                rejectConnect(error);
            } else {
                resolveConnect();
            }
        };
        timeout = window.setTimeout(() => {
            finish(new Error(i18n.t("errWsConnectionTimeout")));
            socket.close();
        }, this.CONNECT_TIMEOUT);
        socket.onopen = () => {
            if (this.socket !== socket || isSettled) {
                socket.close();
                return;
            }
            hasOpened = true;
            this.notifyStatus("CONNECTED");
            finish();
        };
        socket.onmessage = (event: MessageEvent) => {
            if (this.socket !== socket) return;
            try {
                const message: ServerMessage = JSON.parse(
                    event.data
                );
                if (!message || typeof message !== "object" || typeof message.event !== "string" || !["success", "error"].includes(message.status)) {
                    throw new Error(i18n.t("errWsInvalidMessage"));
                }
                this.dispatch(message);
            } catch (error) {
                console.error("Invalid WebSocket message:", error);
            }
        };
        socket.onerror = () => {
            if (this.socket !== socket) return;
            this.notifyStatus("ERROR");
            if (!hasOpened) {
                finish(new Error(i18n.t("errWsConnectionFailed")));
            }
            socket.close();
        };
        socket.onclose = () => {
            if (this.socket !== socket) return;
            if (!hasOpened) {
                finish(new Error(i18n.t("errWsClosedBeforeConnect")));
            }
            this.socket = null;
            this.connectPromise = null;
            this.notifyStatus("DISCONNECTED");
        };
        return promise;
    }
    send(event: string, data?: unknown): void {
        if (!this.isConnected()) {
            throw new Error(i18n.t("errWsNotConnectedYet"));
        }
        const message = {
            action: "onchat",
            data: {
                event,
                ...(data !== undefined ? { data } : {})
            }
        };
        this.socket!.send(JSON.stringify(message));
    }
    subscribe(event: string, callback: (message: ServerMessage) => void): () => void {
        const currentListeners = this.listeners.get(event) ?? [];
        this.listeners.set(event, [...currentListeners, callback]);
        return () => {
            const updatedListeners =
                this.listeners.get(event)?.filter(listener => listener !== callback) ?? [];
            if (updatedListeners.length === 0) {
                this.listeners.delete(event);
            } else {
                this.listeners.set(event, updatedListeners);
            }
        };
    }
    subscribeStatus(callback: (status: ConnectionStatus) => void): () => void {
        this.statusListeners.push(callback);
        return () => {
            this.statusListeners = this.statusListeners.filter(listener => listener !== callback);
        };
    }
    private dispatch(message: ServerMessage): void {
        const callbacks = [...(this.listeners.get(message.event) ?? [])];
        callbacks.forEach(callback => {
            try {
                callback(message);
            } catch (error) {
                console.error(`Error in ${message.event} listener:`, error);
            }
        });
    }
    private notifyStatus(status: ConnectionStatus): void {
        const callbacks = [...this.statusListeners];
        callbacks.forEach(callback => {
            try {
                callback(status);
            } catch (error) {
                console.error("Error in status listener:", error);
            }
        });
    }
    close(): void {
        const socket = this.socket;
        if (!socket) return;
        if (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN) {
            socket.close();
        }
    }
    isConnected(): boolean {
        return this.socket?.readyState === WebSocket.OPEN;
    }
}
export const websocketService = new WebSocketService();