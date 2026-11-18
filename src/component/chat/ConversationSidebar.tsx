import Slot from "./Slot";

interface Props {
    username: string | null;
    loading: boolean;
    error: string;
    onLogout: () => void;
}

function ConversationSidebar({username, loading, error, onLogout}: Props) {
    return (
        <aside className="chat-sidebar">
            <Slot className="sb-search" label="Tìm kiếm + thêm bạn / tạo nhóm"/>
            <Slot className="sb-tabs" label="Tabs lọc hội thoại(nếu có)"/>
            <div className="sb-list">
                {["Người / nhóm 1", "Người / nhóm 2", "Người / nhóm 3", "Người / nhóm 4", "Người / nhóm 5", "Người / nhóm 6"].map(
                    (name) => (
                        <Slot key={name} className="sb-item" label={name}/>
                    )
                )}
            </div>

            <div className="sb-footer">
                {error && <div className="alert alert-warning py-1 px-2 mb-2">{error}</div>}
                <div className="d-flex align-items-center justify-content-between">
                    <span className="text-truncate">
                        Xin chào, <b>{username}</b>
                    </span>
                    <button className="btn btn-sm btn-danger" onClick={onLogout} disabled={loading}>
                        {loading ? "Đang thoát..." : "Logout"}
                    </button>
                </div>
            </div>
        </aside>
    );
}

export default ConversationSidebar;
