import {websocketService} from "./websocket";
import type {
    ServerMessage,
    LoginPayload,
    RegisterPayload,
    ReLoginPayload,
    LoginResponseData,
    ConnectionStatus
} from "../types/websocket";
export type AuthErrorCode = | "SESSION_EXPIRED" | "SERVER_ERROR" | "REQUEST_FAILED";
export class AuthServiceError extends Error {
    public code: AuthErrorCode;
    constructor(message: string, code: AuthErrorCode) {
        super(message);
        this.name = "AuthServiceError";
        this.code = code;
    }
}
interface SavedSession {
    username: string;
    reLoginCode: string;
}
const SESSION_KEY = "appchat_session";
class AuthService {
    private readonly REQUEST_TIMEOUT = 10000;
    private reLoginPromise: Promise<string> | null = null;
    private activeRequests = new Set<string>();
    private async request(event: string, data?: LoginPayload | RegisterPayload | ReLoginPayload): Promise<ServerMessage> {
        if (this.activeRequests.has(event)) {
            throw new AuthServiceError(`${event} request is already in progress.`, "REQUEST_FAILED");
        }
        this.activeRequests.add(event);
        try {
            try {
                await websocketService.connect();
            } catch {
                throw new AuthServiceError(`${event}: Không thể kết nối WebSocket.`, "REQUEST_FAILED");
            }
            return await new Promise<ServerMessage>(
                (resolve, reject) => {
                    let completed = false;
                    let unsubscribeMessage = () => {};
                    let unsubscribeStatus = () => {};
                    let timeout: number;
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
                            reject(new AuthServiceError("Response không hợp lệ.", "REQUEST_FAILED"));
                        }
                    };
                    timeout = window.setTimeout(() => {
                        finish(new AuthServiceError(`${event}: Server không phản hồi sau 10 giây.`, "REQUEST_FAILED"));
                    }, this.REQUEST_TIMEOUT);
                    unsubscribeMessage = websocketService.subscribe(event, (message) => {
                        if (message.status === "success") {
                            finish(undefined, message);
                        } else {
                            const messageText = message.mes || `${event} thất bại.`;
                            const isExpired = event === "RE_LOGIN" && /session expired|re-login error|invalid.*code/i.test(messageText);
                            finish(new AuthServiceError(messageText, isExpired ? "SESSION_EXPIRED" : "SERVER_ERROR"));
                        }
                    }
                    );
                    unsubscribeStatus = websocketService.subscribeStatus(
                        (status: ConnectionStatus) => {
                            if (status === "ERROR" || status === "DISCONNECTED") {
                                finish(new AuthServiceError(`${event}: WebSocket đã mất kết nối.`, "REQUEST_FAILED"));
                            }
                        });
                    if (!websocketService.isConnected()) {
                        finish(new AuthServiceError(`${event}: WebSocket không còn kết nối.`, "REQUEST_FAILED"));
                        return;
                    }
                    try {
                        websocketService.send(event, data);
                    } catch {
                        finish(new AuthServiceError(`${event}: Không thể gửi request.`, "REQUEST_FAILED"));
                    }
                }
            );
        } finally {
            this.activeRequests.delete(event);
        }
    }
    async login(user: string, pass: string): Promise<string> {
        const payload: LoginPayload = {user, pass};
        const response = await this.request("LOGIN", payload);
        const responseData = response.data as LoginResponseData | undefined;
        const code = responseData?.RE_LOGIN_CODE;
        if (!code) {
            throw new AuthServiceError("Server không trả về RE_LOGIN_CODE.", "SERVER_ERROR");
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
                    throw new AuthServiceError("Server không trả về RE_LOGIN_CODE mới.", "SERVER_ERROR");
                }
                return newCode;
            })
            .finally(() => {
                this.reLoginPromise = null;
            });
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
