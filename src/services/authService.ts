import {websocketService} from "./websocket";
import type {
    ServerMessage,
    LoginPayload,
    RegisterPayload,
    ReLoginPayload,
    LoginResponseData,
    ConnectionStatus
} from "../types/websocket";

interface SavedSession {
    username: string;
    reLoginCode: string;
}

const SESSION_KEY = "appchat_session";
class AuthService {
    private readonly REQUEST_TIMEOUT = 10000;
    private reLoginPromise: Promise<string> | null = null;

    private async request(event: string, data?: LoginPayload | RegisterPayload | ReLoginPayload): Promise<ServerMessage> {
        await websocketService.connect();
        return new Promise((resolve, reject) => {
            let completed = false;
            let unsubscribeMessage = () => {
            };
            let unsubscribeStatus = () => {
            };
            const cleanup = () => {
                window.clearTimeout(timeout);
                unsubscribeMessage();
                unsubscribeStatus();
            };
            const finish = (error?: Error, message?: ServerMessage) => {
                if (completed) return;
                completed = true;
                cleanup();
                if (error) {
                    reject(error);
                } else if (message) {
                    resolve(message);
                } else {
                    reject(new Error("Response không hợp lệ."));
                }
            };
            const timeout = window.setTimeout(() => {
                finish(new Error(`${event}: Server không phản hồi sau 10 giây.`));
            }, this.REQUEST_TIMEOUT);
            unsubscribeMessage = websocketService.subscribe(
                event, (message) => {
                    if (message.status === "success") {
                        finish(undefined, message);
                    } else {
                        finish(new Error(message.mes || `${event} thất bại.`));
                    }
                }
            );
            unsubscribeStatus = websocketService.subscribeStatus(
                (status: ConnectionStatus) => {
                    if (status === "ERROR" || status === "DISCONNECTED") {
                        finish(new Error(`${event}: WebSocket đã mất kết nối.`));
                    }
                }
            );
            if (!websocketService.isConnected()) {
                finish(new Error(`${event}: WebSocket không còn kết nối.`));
                return;
            }
            try {
                websocketService.send(event, data);
            } catch (error) {
                finish(error instanceof Error ? error : new Error(`${event}: Không thể gửi request.`));
            }
        });
    }
    async login(user: string, pass: string): Promise<string> {
        const payload: LoginPayload = {user, pass};
        const response = await this.request("LOGIN", payload);
        const responseData = response.data as LoginResponseData | undefined;
        const code = responseData?.RE_LOGIN_CODE;
        if (!code) {
            throw new Error("Server không trả về RE_LOGIN_CODE.");
        }
        return code;
    }
    async register(user: string, pass: string): Promise<void> {
        const payload: RegisterPayload = {user, pass};
        await this.request("REGISTER", payload);
    }

    reLogin(user: string, code: string): Promise<string> {
        if (this.reLoginPromise) {
            return this.reLoginPromise;
        }
        const payload: ReLoginPayload = {user, code};
        const promise = this.request("RE_LOGIN", payload).then((response) => {
            const responseData = response.data as LoginResponseData | undefined;
            const newCode = responseData?.RE_LOGIN_CODE;
            if (!newCode) {
                throw new Error("Server không trả về RE_LOGIN_CODE mới.");
            }
            return newCode;
        })
            .finally(() => {this.reLoginPromise = null;});
        this.reLoginPromise = promise;
        return promise;
    }
    async logout(): Promise<void> {
        await this.request("LOGOUT");
    }
    saveSession(username: string, reLoginCode: string): void {
        const session: SavedSession = {username, reLoginCode};
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
    getSavedSession(): SavedSession | null {
        const savedData = sessionStorage.getItem(SESSION_KEY);
        if (!savedData) {
            return null;
        }
        try {
            const session = JSON.parse(savedData) as SavedSession;
            if (typeof session.username !== "string" || typeof session.reLoginCode !== "string" || !session.username || !session.reLoginCode) {
                this.clearSession();
                return null;
            }
            return session;
        } catch {
            this.clearSession();
            return null;
        }
    }
    clearSession(): void {
        sessionStorage.removeItem(SESSION_KEY);
    }
}
export const authService = new AuthService();
