import {useEffect} from "react";

export interface SearchUserResult {
    name: string;
    // true: online, false: offline, null: chưa xác định được trạng thái
    online: boolean | null;
}

interface SearchUserModalProps {
    user: SearchUserResult;
    onClose: () => void;
    onMessage: (name: string) => void;
}

function SearchUser({user, onClose, onMessage}: SearchUserModalProps) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const statusClass = user.online === true ? "online" : user.online === false ? "offline" : "";
    const statusText = user.online === true
        ? "● Đang online"
        : user.online === false
            ? "● Đang offline"
            : "● Chưa xác định";

    return (
        <>
            <div className="modal-backdrop fade show"></div>
            <div className="modal fade show d-block" role="dialog" aria-modal="true" aria-labelledby="search-user-title"
                 tabIndex={-1}
                 onMouseDown={(event) => {
                     if (event.target === event.currentTarget) onClose();
                 }}
            >
                <div className="modal-dialog modal-dialog-centered modal-sm">
                    <div className="modal-content">
                        <div className="modal-header border-0 pb-0 justify-content-end">
                            <button type="button" className="btn-close" aria-label="Đóng" onClick={onClose}></button>
                        </div>

                        <div className="modal-body text-center pt-0">
                            <span className="su-avatar sb-avatar--people d-inline-flex align-items-center justify-content-center rounded-circle mb-2"
                                  aria-hidden="true">
                                <i className="fa-solid fa-user fs-1"></i>
                            </span>
                            <h5 id="search-user-title" className="fs-5 fw-semibold mb-1 text-break">{user.name}</h5>
                            <span className={`online-status ${statusClass}`}>{statusText}</span>
                        </div>

                        <div className="modal-footer border-0 pt-0 justify-content-end">
                            <button type="button" className="btn btn-primary" autoFocus
                                    onClick={() => onMessage(user.name)}>
                                <i className="fa-solid fa-comment me-1" aria-hidden="true"></i>
                                Nhắn tin
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default SearchUser;
