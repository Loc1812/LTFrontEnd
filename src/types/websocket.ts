export interface ServerMessage {
    status: "success" | "error";
    event: string;
    data?: unknown;
    mes?: string;
}

export interface LoginPayload {
    user: string;
    pass: string;
}

export interface RegisterPayload {
    user: string;
    pass: string;
}

export interface ReLoginPayload {
    user: string;
    code: string;
}

export interface LoginResponseData {
    RE_LOGIN_CODE: string;
}

export type ConnectionStatus =
    | "CONNECTING"
    | "CONNECTED"
    | "DISCONNECTED"
    | "ERROR";