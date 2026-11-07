import { websocketService } from "./websocket";
import type {
    ServerMessage,
    LoginPayload,
    RegisterPayload,
    ReLoginPayload,
    LoginResponseData
} from "../types/websocket";
class AuthService {
    private async request(event: string, data?: LoginPayload | RegisterPayload | ReLoginPayload): Promise<ServerMessage> {
        await websocketService.connect();
        return new Promise((resolve, reject) => {
            let unsubscribe = () => {};
            const timeout = window.setTimeout(() => {
                unsubscribe();
                reject(new Error(`${event}: Server không phản hồi.`));
            }, 10000);
            unsubscribe = websocketService.subscribe(
                event, (message) => {
                    window.clearTimeout(timeout);
                    unsubscribe();
                    if (message.status === "success") {
                        resolve(message);
                    } else {
                        reject(
                            new Error(message.mes || `${event} thất bại.`)
                        );
                    }
                }
            );
            try {
                websocketService.send(event, data);
            } catch (error) {
                window.clearTimeout(timeout);
                unsubscribe();
                reject(error);
            }
        });
    }
    async login(user: string, pass: string): Promise<string> {
        const payload: LoginPayload = { user, pass };
        const response = await this.request("LOGIN", payload);
        const responseData = response.data as | LoginResponseData | undefined;
        const code = responseData?.RE_LOGIN_CODE;
        if (!code) {
            throw new Error("Server không trả về RE_LOGIN_CODE.");
        }
        return code;
    }
    async register(user: string, pass: string): Promise<void> {
        const payload: RegisterPayload = { user, pass };
        await this.request("REGISTER", payload);
    }
    async reLogin(user: string, code: string): Promise<string> {
        const payload: ReLoginPayload = { user, code };
        const response = await this.request("RE_LOGIN", payload);
        const responseData = response.data as | LoginResponseData | undefined;
        const newCode = responseData?.RE_LOGIN_CODE;
        if (!newCode) {
            throw new Error("Server không trả về RE_LOGIN_CODE mới.");
        }
        return newCode;
    }
    async logout(): Promise<void> {
        await this.request("LOGOUT");
    }
}
export const authService = new AuthService();
