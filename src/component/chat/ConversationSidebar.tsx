import { useState, type ChangeEvent } from "react";
import Slot from "./Slot";

interface Props {
    username: string | null;
    loading: boolean;
    error: string;
    onLogout: () => void;
}

function ConversationSidebar({username, loading, error, onLogout}: Props) {
    const [keyword, setKeyword] = useState("");
    const [groupMode, setGroupMode] = useState(false);

    return (
        <aside className="chat-sidebar">
            {/* Tìm kiếm: kéo rộng hết cỡ 2 bên */}
            <div className="sb-search">
                <div className="input-group input-group-sm">
                    <span className="input-group-text bg-light border-end-0">
                        <i className="fa-solid fa-magnifying-glass text-secondary" aria-hidden="true"></i>
                    </span>
                    <input
                        type="text"
                        className="form-control bg-light border-start-0"
                        placeholder={groupMode ? "Tìm phòng" : "Tìm kiếm"}
                        aria-label={groupMode ? "Tìm phòng" : "Tìm kiếm"}
                        value={keyword}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => setKeyword(event.target.value)}
                    />
                </div>
            </div>

            {/* Hàng dưới: checkbox "Phòng" ngoài cùng bên trái; "+ Tạo phòng" và nút đi tiếp ở bên phải */}
            <div className="sb-tabs d-flex align-items-center gap-2">
                <div className="form-check mb-0 ms-2 me-auto text-nowrap">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        id="sb-group-mode"
                        checked={groupMode}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => setGroupMode(event.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="sb-group-mode">
                        Phòng
                    </label>
                </div>
                <button type="button" className="btn btn-sm btn-outline-secondary">
                    <i className="fa-solid fa-plus me-1" aria-hidden="true"></i>
                    Tạo phòng
                </button>
                <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    title="Tiếp tục"
                    aria-label="Tiếp tục"
                    disabled={keyword.trim() === ""}
                >
                    <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
                </button>
            </div>

            {/* Khung bao quanh danh sách để nhìn tách biệt nhẹ với phần trên và dưới */}
            <div className="sb-list border bg-light rounded-3 p-2">
                {["Người / phòng 1", "Người / phòng 2", "Người / phòng 3", "Người / phòng 4", "Người / phòng 5", "Người / phòng 6"].map(
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