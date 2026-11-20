import { useEffect, useRef, useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../store/Store";
import {addMessage, setCurrentChat, setLoading, setMessages} from "../../store/slice/ChatSlice";
import { chatService } from "../../services/chatService";
import { websocketService } from "../../services/websocket";

function ChatPanel() {
    const dispatch = useDispatch();
    const username = useSelector((state: RootState) => state.auth.username);
    const messages = useSelector((state: RootState) => state.chat.messages);
    const currentChat = useSelector((state: RootState) => state.chat.currentChat);
    const loading = useSelector((state: RootState) => state.chat.loading);

    const [receiver, setReceiver] = useState("");
    const [messageInput, setMessageInput] = useState("");
    const [checking, setChecking] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [isOnline, setIsOnline] = useState<boolean | null>(null);

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
                    <h3>{currentChat || "Chat cá nhân"}</h3>

                    {currentChat && (
                        <span className={`online-status ${
                            isOnline === true
                                ? "online"
                                : isOnline === false
                                    ? "offline"
                                    : ""
                        }`}>
                            {isOnline === true
                                ? "● Đang online"
                                : isOnline === false
                                    ? "● Đang offline"
                                    : "● Chưa xác định"}
                        </span>
                    )}
                </div>
            </header>

            {!currentChat && (
                <form
                    className="receiver-form"
                    onSubmit={handleSelectReceiver}
                >
                    <input
                        value={receiver}
                        onChange={(e) => setReceiver(e.target.value)}
                        placeholder="Nhập username..."
                    />

                    <button type="submit" disabled={checking}>
                        Tìm người dùng
                    </button>
                </form>
            )}

            {error && (
                <div className="chat-alert chat-alert-error">
                    {error}
                </div>
            )}

            <section className="chat-messages">
                {!currentChat ? (
                    <p>Chưa chọn người chat.</p>
                ) : loading ? (
                    <p>Đang tải tin nhắn...</p>
                ) : messages.length === 0 ? (
                    <p>Chưa có tin nhắn.</p>
                ) : (
                    messages.map((message, index) => (
                        <div
                            key={message.id ?? index}
                            className={`message-row ${
                                message.sender === username
                                    ? "message-mine"
                                    : "message-theirs"
                            }`}
                        >
                            <div className="message-bubble">
                                <div className="message-content">
                                    {message.content}
                                </div>

                                {message.time && (
                                    <div className="message-time">
                                        {message.time}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </section>

            {currentChat && (
                <form
                    className="message-input-form"
                    onSubmit={handleSendMessage}
                >
                    <input
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Nhập tin nhắn..."
                        disabled={sending}
                    />

                    <button
                        type="submit"
                        disabled={!messageInput.trim() || sending}
                    >
                        Gửi
                    </button>
                </form>
            )}
        </main>
    );
}
export default ChatPanel;