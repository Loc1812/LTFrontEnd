import type {ServerMessage, ConnectionStatus} from "../types/websocket";

class WebSocketService {
    private socket: WebSocket | null = null;
    private listeners: Map<string, ((message: ServerMessage) => void)[]> = new Map();
    private statusListeners: (
        (status: ConnectionStatus) => void)[] = [];
    private connectPromise: Promise<void> | null = null;
    connect(): Promise<void> {
        if (this.socket?.readyState === WebSocket.OPEN) {
            return Promise.resolve();
        }
        if (this.connectPromise) {
            return this.connectPromise;
        }
        const url = import.meta.env.VITE_WS_URL;
        this.connectPromise = new Promise((resolve, reject) => {
            const socket = new WebSocket(url);
            this.socket = socket;
            this.notifyStatus("CONNECTING");
            socket.onopen = () => {
                this.notifyStatus("CONNECTED");
                resolve();
            };
            socket.onmessage = (event) => {
                try {
                    const message: ServerMessage = JSON.parse(event.data);
                    this.dispatch(message);
                } catch (error) {
                    console.error("Invalid WebSocket message:", error);
                }
            };
            socket.onerror = () => {
                this.notifyStatus("ERROR");
                reject(new Error("WebSocket connection error"));
            };
            socket.onclose = () => {
                if (this.socket === socket) {
                    this.socket = null;
                }
                this.connectPromise = null;
                this.notifyStatus("DISCONNECTED");
            };
        });
        return this.connectPromise;
    }
    send(event: string, data?: unknown): void {
        if (this.socket?.readyState !== WebSocket.OPEN) {
            throw new Error("WebSocket is not connected");
        }
        const message = {
            action: "onchat",
            data: {
                event, ...(data !== undefined ? { data } : {})
            }
        };
        this.socket.send(JSON.stringify(message));
    }
    subscribe(
        event: string,
        callback: (message: ServerMessage) => void): () => void {
        const currentListeners = this.listeners.get(event) ?? [];
        this.listeners.set(event, [...currentListeners, callback]);
        return () => {
            const updatedListeners =
                this.listeners.get(event)?.filter(listener => listener !== callback) ?? [];
            this.listeners.set(event, updatedListeners);
        };
    }
    subscribeStatus(callback: (status: ConnectionStatus) => void): () => void {
        this.statusListeners.push(callback);
        return () => {
            this.statusListeners =
                this.statusListeners.filter(listener => listener !== callback);
        };
    }
    private dispatch(message: ServerMessage): void {
        const callbacks = this.listeners.get(message.event) ?? [];
        callbacks.forEach(callback => callback(message));
    }
    private notifyStatus(status: ConnectionStatus): void {
        this.statusListeners.forEach(callback => callback(status));
    }
    close(): void {
        this.socket?.close();
        this.socket = null;
        this.connectPromise = null;
    }
    isConnected(): boolean {
        return this.socket?.readyState === WebSocket.OPEN;
    }
}
export const websocketService = new WebSocketService();