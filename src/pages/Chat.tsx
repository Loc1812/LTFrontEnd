import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../store/Store";
import { logout } from "../store/slice/AuthSlice";
import { websocketService } from "../services/websocket";

function Chat() {
    const dispatch = useDispatch<AppDispatch>();
    const username = useSelector(
        (state: RootState) => state.auth.username
    );
    const handleLogout = () => {
        // todo add gửi sự kiện logout theo API.
        websocketService.close();
        dispatch(logout());
    };
    return (
        <div className="container mt-4">
            <h2>App Chat</h2>
            <p>Xin chào, {username}</p>
            <button className="btn btn-danger" onClick={handleLogout}>
                Logout
            </button>
        </div>
    );
}
export default Chat;