import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService.ts";
import { websocketService } from "../services/websocket";
import { logout } from "../store/slice/AuthSlice";
import type { RootState } from "../store/Store";
import ConversationSidebar from "../component/chat/ConversationSidebar";
import ChatPanel from "../component/chat/ChatPanel";
import "./chat.css";

function Chat() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const username = useSelector(
        (state: RootState) => state.auth.username
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const handleLogout = async () => {
        if (loading) return;
        setLoading(true);
        setError("");
        try {
            if (websocketService.isConnected()) {
                await authService.logout();
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : "Không thể gửi yêu cầu Logout.");
        } finally {
            authService.clearSession();
            websocketService.close();
            dispatch(logout());
            navigate("/login", { replace: true });
            setLoading(false);
        }
    };
    return (
        <div className="chat-layout">
            <ConversationSidebar
                username={username}
                loading={loading}
                error={error}
                onLogout={handleLogout}
            />
            <ChatPanel />
        </div>
    );
}
export default Chat;
