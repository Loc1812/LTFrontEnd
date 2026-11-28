import { useEffect, useRef, useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../store/Store";
import {addMessage, setCurrentChat, setLoading, setMessages, upsertConversation} from "../../store/slice/ChatSlice";
import { chatService } from "../../services/chatService";
import { websocketService } from "../../services/websocket";
import { useTranslation } from "react-i18next";
function ChatPanel() {
    const dispatch = useDispatch();
    const username = useSelector((state: RootState) => state.auth.username);
    const messages = useSelector((state: RootState) => state.chat.messages);
    const currentChat = useSelector((state: RootState) => state.chat.currentChat);
    const loading = useSelector((state: RootState) => state.chat.loading);
    const { t } = useTranslation();
    const [receiver, setReceiver] = useState("");
    const [messageInput, setMessageInput] = useState("");
    const [checking, setChecking] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [isOnline, setIsOnline] = useState<boolean | null>(null);
    const [showVoiceDialog, setShowVoiceDialog] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [messages]);

    useEffect(() => {
        if (!username || !currentChat) return;

        const unsubscribe = chatService.subscribeMessages((message) => {
            if (
                message.sender === currentChat &&
                message.receiver === username
            ) {
                dispatch(addMessage(message));
            }
        });

        return unsubscribe;
    }, [username, currentChat, dispatch]);

    useEffect(() => {
        setIsOnline(null);
        if (!username || !currentChat) return;
        let active = true;
        let isChecking = false;

        const checkOnline = async () => {
            if (isChecking) return;
            if (!websocketService.isConnected()) {
                if (active) setIsOnline(null);
                return;
            }
            isChecking = true;
            try {
                const status = await chatService.checkUserOnline(currentChat);
                if (active) {
                    setIsOnline(status);
                }
            } catch {
                if (active) {
                    setIsOnline(null);
                }
            } finally {
                isChecking = false;
            }
        };
        checkOnline();

        const interval = window.setInterval(checkOnline, 3000);

        return () => {
            active = false;
            window.clearInterval(interval);
        };
    }, [username, currentChat]);

    const handleSelectReceiver = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();
        const target = receiver.trim();

        if (!target) {
            setError("Vui lòng nhập username người nhận.");
            return;
        }

        if (target === username) {
            setError("Bạn không thể tự chat với chính mình.");
            return;
        }

        if (!websocketService.isConnected()) {
            setError("WebSocket chưa kết nối.");
            return;
        }

        setChecking(true);
        setError("");

        try {
            const exists = await chatService.checkUserExist(target);

            if (!exists) {
                setError("Tài khoản không tồn tại.");
                return;
            }

            dispatch(setCurrentChat(target));
            dispatch(setLoading(true));

            const history = await chatService.getPeopleChatMessages(target, 1);

            dispatch(setMessages(history));

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể tìm người dùng."
            );
        } finally {
            dispatch(setLoading(false));
            setChecking(false);
        }
    };

    const handleSendMessage = (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        const content = messageInput.trim();

        if (!currentChat || !content || !username || sending) return;

        if (!websocketService.isConnected()) {
            setError("WebSocket đã mất kết nối.");
            return;
        }

        try {
            setSending(true);
            setError("");

            chatService.sendPeopleMessage(currentChat, content);

            dispatch(addMessage({
                id: `local-${Date.now()}`,
                sender: username,
                receiver: currentChat,
                content,
                time: new Date().toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit"
                }),
                type: 0
            }));

            dispatch(upsertConversation({
                id: `people-${currentChat}`,
                name: currentChat,
                type: "people",
                lastMessageAt: new Date().toISOString()
            }));

            setMessageInput("");

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể gửi tin nhắn."
            );
        } finally {
            setSending(false);
        }
    };

    return (
        <main className="chat-main">
            <header className="chat-header">
                <div>
                    <h3>{currentChat || t("nonSelect")}</h3>

                    {currentChat && (
                        <span className={`online-status ${
                            isOnline === true
                                ? "online"
                                : isOnline === false
                                    ? "offline"
                                    : ""
                        }`}>
                            {isOnline === true
                                ? t("online")
                                : isOnline === false
                                    ? "● " + t("offline")
                                    : "● Chưa xác định"}
                        </span>
                    )}
                </div>
            </header>

            {error && (
                <div className="chat-alert chat-alert-error">{error}</div>
            )}

            <section className="chat-messages">
                {!currentChat ? (
                    <p>{t("plsSelect")}</p>
                ) : loading ? (
                    <p>{t("loadingMes")}...</p>
                ) : messages.length === 0 ? (
                    <p>{t("noMes")}</p>
                ) : (
                    messages.map((message, index) => (
                        <div key={message.id ?? index}
                             className={`message-row ${message.sender === username ? "message-mine" : "message-theirs"}`}>
                            <div className="message-bubble">
                                <div className="message-content">{message.content}</div>
                                {message.time && (
                                    <div className="message-time">{message.time}</div>
                                )}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </section>

            {currentChat && (
                <form className="message-input-form" onSubmit={handleSendMessage}>
                    <input value={messageInput} onChange={(e) => setMessageInput(e.target.value)} placeholder={t("enterMes")} disabled={sending}/>
                    <button type="button" className="voice-button" title="Ghi âm tin nhắn" aria-label="Ghi âm tin nhắn" onClick={() => setShowVoiceDialog(true)} disabled={sending}>
                        <i className="fa-solid fa-microphone"></i>
                    </button>
                    <button type="submit" disabled={!messageInput.trim() || sending}>{t("send")}</button>
                </form>
            )}
            {showVoiceDialog && (
                <div className="voice-dialog-overlay" onMouseDown={(event) => {
                    if (event.target === event.currentTarget) {
                        setShowVoiceDialog(false);
                    }
                }}>
                    <div className="voice-dialog" role="dialog" aria-modal="true" aria-labelledby="voice-dialog-title">
                        <div className="voice-dialog-header">
                            <h4 id="voice-dialog-title">Ghi âm tin nhắn</h4>
                            <button type="button" className="voice-dialog-close" aria-label="Đóng" onClick={() => setShowVoiceDialog(false)}>
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <div className="voice-dialog-body">
                            <div className="voice-microphone">
                                <i className="fa-solid fa-microphone"></i>
                            </div>
                            <h5>Đang ghi âm...</h5>
                            <p>Chức năng nhận diện giọng nói sẽ được tích hợp sau.</p>
                        </div>
                        <div className="voice-dialog-footer">
                            <button type="button" onClick={() => setShowVoiceDialog(false)}>
                                {t("cancel")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
export default ChatPanel;