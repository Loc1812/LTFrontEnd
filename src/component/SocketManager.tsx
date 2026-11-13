import {useEffect, type ReactNode} from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {authService, AuthServiceError} from "../services/authService";
import { websocketService } from "../services/websocket";
import {loginSuccess, logout} from "../store/slice/AuthSlice";
interface SocketManagerProps {
    children: ReactNode;
}
function SocketManager({children}: SocketManagerProps) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    useEffect(() => {
        let active = true;
        let retryTimer: number | null = null;
        let retryDelay = 1000;
        let reconnecting = false;
        const MAX_RETRY_DELAY = 30000;
        const clearRetryTimer = () => {
            if (retryTimer !== null) {
                window.clearTimeout(retryTimer);
                retryTimer = null;
            }
        };
        const hasSession = () => {
            return authService.getSavedSession() !== null;
        };
        const expireSession = () => {
            authService.clearSession();
            dispatch(logout());
            websocketService.close();
            navigate("/login", {
                replace: true
            });
        };
        const scheduleReconnect = () => {
            if (!active) return;
            if (!hasSession()) return;
            if (retryTimer !== null) return;
            const delay = retryDelay;
            retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY);
            console.log(`WebSocket sẽ kết nối lại sau ${delay / 1000} giây.`);
            retryTimer = window.setTimeout(() => {
                retryTimer = null;
                reconnect();
            }, delay);
        };
        const reconnect = async () => {
            if (!active || reconnecting) return;
            const savedSession = authService.getSavedSession();
            if (!savedSession) return;
            reconnecting = true;
            try {
                await websocketService.connect();
                if (!active) return;
                const currentSession = authService.getSavedSession();
                if (!currentSession) return;
                const newCode = await authService.reLogin(currentSession.username, currentSession.reLoginCode);
                if (!active) return;
                authService.saveSession(currentSession.username, newCode);
                dispatch(loginSuccess({username: currentSession.username, reLoginCode: newCode}));
                retryDelay = 1000;
                console.log("WebSocket reconnect và RE_LOGIN thành công.");
            } catch (error) {
                if (!active) return;
                console.error("Không thể khôi phục kết nối:", error);
                if (error instanceof AuthServiceError && error.code !== "REQUEST_FAILED") {
                    expireSession();
                    return;
                }
                websocketService.close();
                scheduleReconnect();
            } finally {
                reconnecting = false;
            }
        };
        const unsubscribe = websocketService.subscribeStatus((status) => {
                if (!active) return;
                console.log("WebSocket status:", status);
                if (status === "DISCONNECTED") {
                    scheduleReconnect();
                }
            });
        if (hasSession() && !websocketService.isConnected()) {
            scheduleReconnect();
        }
        return () => {
            active = false;
            clearRetryTimer();
            unsubscribe();
        };
    }, [dispatch, navigate]);
    return <>{children}</>;
}
export default SocketManager;
