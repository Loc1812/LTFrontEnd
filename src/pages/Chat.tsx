import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService.ts";
import { websocketService } from "../services/websocket";
import { logout } from "../store/slice/AuthSlice";
import type { RootState } from "../store/Store";
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
        <div className="container mt-4">
            <h2>App Chat</h2>
            <p>Xin chào, {username}</p>
            {error && (
                <div className="alert alert-warning">
                    {error}
                </div>
            )}
            <button className="btn btn-danger" onClick={handleLogout} disabled={loading}>
                {loading ? "Đang đăng xuất..." : "Logout"}
            </button>
        </div>
    );
}
export default Chat;