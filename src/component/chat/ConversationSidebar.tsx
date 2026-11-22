import {useState, useEffect, useRef, type ChangeEvent, type KeyboardEvent} from "react";
import {useDispatch} from "react-redux";
import ConversationItem, {type Conversation} from "./ConversationItem";
import CreateRoomModal from "./CreateRoom";
import SearchUserModal, {type SearchUserResult} from "./SearchUser";
import {chatService} from "../../services/chatService";
import {websocketService} from "../../services/websocket";
import {setCurrentChat, setLoading, setMessages} from "../../store/slice/ChatSlice";

const MOCK_CONVERSATIONS: Conversation[] = [
    // Du lieu để Test giao dien
    {id: "1", name: "tranthib", type: "people", lastMessageAt: "2026-11-18T21:35:00"},
    {id: "2", name: "Phòng Datamining", type: "room", lastMessageAt: "2026-11-18T09:12:00"},
    {id: "3", name: "lethic", type: "people", lastMessageAt: "2026-11-17T20:48:00"},
    {id: "4", name: "Lớp CNTT K23", type: "room", lastMessageAt: "2026-11-16T14:03:00"},
    {id: "5", name: "phamvand", type: "people", lastMessageAt: "2026-11-12T08:30:00"},
    {id: "6", name: "Phòng đồ án Web", type: "room", lastMessageAt: "2026-11-05T19:20:00"},
];

interface Props {
    username: string | null;
    loading: boolean;
    error: string;
    onLogout: () => void;
}

function toSearchErrorText(error: unknown): string {
    const text = error instanceof Error ? error.message.trim() : "";
    if (!text) return "Không thể tìm kiếm, vui lòng thử lại.";
    if (/timeout$/i.test(text)) return "Máy chủ không phản hồi, vui lòng thử lại.";
    return text;
}

function ConversationSidebar({username, loading, error, onLogout}: Props) {
    const dispatch = useDispatch();
    const [keyword, setKeyword] = useState("");
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState("");
    const [searchNotice, setSearchNotice] = useState("");
    const [searchResult, setSearchResult] = useState<SearchUserResult | null>(null);
    const [groupMode, setGroupMode] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
    const [showCreateRoom, setShowCreateRoom] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showFrame, setShowFrame] = useState(false);
    const [showSetting, setShowSetting] = useState(false);
    const settingRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingRef.current && !settingRef.current.contains(event.target as Node)) {
                setShowFrame(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);
    const handleRoomCreated = (roomName: string) => {
        setConversations((previous) => [
            {
                id: `room-${roomName}`,
                name: roomName,
                type: "room",
                lastMessageAt: new Date().toISOString()
            }, ...previous,]);
        setShowCreateRoom(false);
    };

    const handleJoinRoom = async (roomName: string) => {
        setSearching(true);
        setSearchError("");
        setSearchNotice("");
        try {
            const joinedName = await chatService.joinRoom(roomName);
            setConversations((previous) => [
                {
                    id: `room-${joinedName}`,
                    name: joinedName,
                    type: "room",
                    lastMessageAt: new Date().toISOString()
                },
                ...previous.filter((item) => !(item.type === "room" && item.name === joinedName)),
            ]);
            setKeyword("");
            setSearchNotice(`Đã tham gia phòng "${joinedName}".`);
        } catch (err) {
            const text = err instanceof Error ? err.message : "";
            setSearchError(/room not found/i.test(text)
                ? `Không tìm thấy phòng "${roomName}".`
                : toSearchErrorText(err));
        } finally {
            setSearching(false);
        }
    };

    const handleSearch = async () => {
        const target = keyword.trim();
        if (!target || searching) return;

        if (!websocketService.isConnected()) {
            setSearchError("WebSocket chưa kết nối.");
            setSearchNotice("");
            return;
        }
        if (groupMode) {
            await handleJoinRoom(target);
            return;
        }
        if (target === username) {
            setSearchError("Bạn không thể tự chat với chính mình.");
            setSearchNotice("");
            return;
        }

        setSearching(true);
        setSearchError("");
        setSearchNotice("");
        try {
            const exists = await chatService.checkUserExist(target);
            if (!exists) {
                setSearchError(`Không tìm thấy người dùng "${target}".`);
                return;
            }

            let online: boolean | null = null;
            try {
                online = await chatService.checkUserOnline(target);
            } catch {
                online = null;
            }
            setSearchResult({name: target, online});
        } catch (err) {
            setSearchError(toSearchErrorText(err));
        } finally {
            setSearching(false);
        }
    };

    const handleStartChat = async (target: string) => {
        setSearchResult(null);
        setSearchError("");
        dispatch(setCurrentChat(target));
        dispatch(setLoading(true));
        try {
            const history = await chatService.getPeopleChatMessages(target, 1);
            dispatch(setMessages(history));
        } catch (err) {
            setSearchError(toSearchErrorText(err));
        } finally {
            dispatch(setLoading(false));
        }
    };

    return (
        <>
            <aside className="chat-sidebar">
                <div className="sb-search">
                    <div className="input-group input-group-sm">
                    <span className="input-group-text bg-light border-end-0">
                        <i className="fa-solid fa-magnifying-glass text-secondary" aria-hidden="true"></i>
                    </span>
                    <input type="text" className="form-control bg-light border-start-0"
                           placeholder={groupMode ? "Tìm phòng" : "Tìm kiếm"}
                           aria-label={groupMode ? "Tìm phòng" : "Tìm kiếm"} value={keyword}
                           onChange={(event: ChangeEvent<HTMLInputElement>) => {
                               setKeyword(event.target.value);
                               if (searchError) setSearchError("");
                               if (searchNotice) setSearchNotice("");
                           }}
                           onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                               if (event.key === "Enter") handleSearch();
                           }}/>
                </div>
                {searchError && <div className="text-danger small mt-1" role="alert">{searchError}</div>}
                {searchNotice && <div className="text-success small mt-1" role="status">{searchNotice}</div>}
            </div>

                <div className="sb-tabs d-flex align-items-center gap-2">
                    <div className="form-check mb-0 ms-2 me-auto text-nowrap">
                        <input className="form-check-input" type="checkbox" id="sb-group-mode" checked={groupMode}
                               onChange={(event: ChangeEvent<HTMLInputElement>) => setGroupMode(event.target.checked)}/>
                        <label className="form-check-label" htmlFor="sb-group-mode">Phòng</label>
                    </div>
                    <button type="button" className="btn btn-sm btn-outline-secondary"
                            onClick={() => setShowCreateRoom(true)}>
                        <i className="fa-solid fa-plus me-1" aria-hidden="true"></i>
                        Tạo phòng
                    </button>
                    <button type="button" className="btn btn-sm btn-primary" disabled={keyword.trim() === ""}>
                        <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
                    </button>
                </div>
                <button type="button" className="btn btn-sm btn-outline-secondary"
                        onClick={() => setShowCreateRoom(true)}>
                    <i className="fa-solid fa-plus me-1" aria-hidden="true"></i>
                    Tạo phòng
                </button>
                <button type="button" className="btn btn-sm btn-primary" aria-label="Tìm"
                        disabled={keyword.trim() === "" || searching} onClick={handleSearch}>
                    {searching
                        ? <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
                        : <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>}
                </button>
            </div>

                <div className="sb-list border bg-light rounded-3 p-2">
                    {conversations.map((conversation) => (
                        <ConversationItem key={conversation.id} conversation={conversation}/>))}
                </div>

                <div className="sb-footer">
                    <div className="setting_cont" ref={settingRef}>
                        <button type="button" className={`setting_btn ${showFrame ? "active" : ""}`}
                                onClick={() => setShowFrame(prev => !prev)}>
                            <i className="fa-solid fa-gear"></i>
                        </button>
                        {showFrame && (
                            <div className="setting_frame">
                                <button type="button" className="setting_option" onClick={() => setShowSetting(true)}>
                                    <span>Cài đặt</span>
                                </button>
                                <button type="button" className="btn btn-sm btn-danger" onClick={() => {
                                    setShowFrame(false);
                                    setShowLogoutConfirm(true);
                                }} disabled={loading}>
                                    <i className="fa-solid fa-right-from-bracket me-1"></i>
                                    <span>Đăng xuất</span>
                                </button>
                            </div>
                        )}
                    </div>
                    {error && (
                        <div className="alert alert-warning py-1 px-2 mb-2">
                            {error}
                        </div>
                    )}
                    <div className="d-flex align-items-center justify-content-between">
                    <span className="text-truncate">
                        Xin chào, <b>{username}</b>
                    </span>
                    </div>
                </div>
                {showCreateRoom && (
                    <CreateRoomModal onClose={() => setShowCreateRoom(false)} onCreated={handleRoomCreated}/>)}
                {showSetting && (
                    <div className="setting_overlay" onClick={() => setShowSetting(false)}>
                        <div className="setting_dialog" onClick={(event) => event.stopPropagation()}>
                            <div className="setting_header">
                                <h2>Cài đặt</h2>
                                <button type="button" className="setting_close" onClick={() => setShowSetting(false)}>
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </div>
                            <div className="setting_body">
                                Nội dung cài đặt
                            </div>
                        </div>
                    </div>
                )}
                {searchResult && (
                    <SearchUserModal user={searchResult} onClose={() => setSearchResult(null)}
                                 onMessage={handleStartChat}/>)}
            </aside>
            {loading && (
                <div className="loading_overlay">
                    <div className="loading_box">
                        <div className="loading_spinner"></div>
                        <span>Đang xử lý</span>
                    </div>
                </div>
            )}
            {showLogoutConfirm && (
                <div className="setting_overlay" onClick={() => setShowLogoutConfirm(false)}>
                    <div className="setting_dialog" onClick={(event) => event.stopPropagation()}>
                        <div className="setting_header">
                            <h2>Đăng xuất</h2>
                            <button type="button" className="logout_close" onClick={() => setShowLogoutConfirm(false)}>
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <div className="setting_body">
                            <p className="mb-4">
                                Bạn có chắc chắn muốn đăng xuất?
                            </p>
                            <div className="d-flex justify-content-end gap-2">
                                <button type="button" className="btn btn-sm btn-outline-secondary"
                                    onClick={() => setShowLogoutConfirm(false)}>
                                    Hủy
                                </button>
                                <button type="button" className="btn btn-sm btn-danger" onClick={() => {
                                    setShowLogoutConfirm(false);onLogout();}}>
                                    <i className="fa-solid fa-right-from-bracket me-1"></i>
                                    Đăng xuất
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default ConversationSidebar;