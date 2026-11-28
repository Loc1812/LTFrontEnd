import { useEffect, useRef, useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../store/Store";
import {addMessage, setCurrentChat, setLoading, setMessages, upsertConversation} from "../../store/slice/ChatSlice";
import { chatService } from "../../services/chatService";
import { websocketService } from "../../services/websocket";
import { useTranslation } from "react-i18next";
interface SpeechRecognitionResultItem {
    transcript: string;
}
interface SpeechRecognitionResultLike {
    isFinal: boolean;
    length: number;
    [index: number]: SpeechRecognitionResultItem;
}
interface SpeechRecognitionEventLike {
    results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionErrorEventLike {
    error: string;
}
interface SpeechRecognitionLike {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    onstart: (() => void) | null;
    onend: (() => void) | null;
    onresult: ((event: SpeechRecognitionEventLike) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
    start: () => void;
    stop: () => void;
    abort: () => void;
}
interface SpeechRecognitionWindow extends Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
}
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
    const [voiceLanguage, setVoiceLanguage] = useState("vi-VN");
    const [voiceText, setVoiceText] = useState("");
    const [voiceInterim, setVoiceInterim] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [voiceError, setVoiceError] = useState("");
    const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
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
            setError(t("errEnUName"));
            return;
        }

        if (target === username) {
            setError(t("errCanChatYourSelf"));
            return;
        }

        if (!websocketService.isConnected()) {
            setError(t("errConnWebSK"));
            return;
        }

        setChecking(true);
        setError("");

        try {
            const exists = await chatService.checkUserExist(target);

            if (!exists) {
                setError(t("errAccNotExist"));
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
                    : t("errNoUserFound")
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
            setError(t("errWSLostConn"));
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
                    : t("errSendMes")
            );
        } finally {
            setSending(false);
        }
    };
    const handleOpenVoiceDialog = () => {
        setVoiceText("");
        setVoiceInterim("");
        setVoiceError("");
        setShowVoiceDialog(true);
    };
    const handleStartRecording = () => {
        const speechWindow = window as SpeechRecognitionWindow;
        const SpeechRecognitionAPI = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) {
            setVoiceError(t("errChromeNotSupVoice"));
            return;
        }
        if (recognitionRef.current) {
            return;
        }
        setVoiceText("");
        setVoiceInterim("");
        setVoiceError("");
        const recognition = new SpeechRecognitionAPI();
        recognition.lang = voiceLanguage;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.onstart = () => {
            setIsRecording(true);
        };
        recognition.onresult = (event) => {
            let finalTranscript = "";
            let interimTranscript = "";
            for (let i = 0; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + " ";
                } else {
                    interimTranscript += transcript;
                }
            }
            setVoiceText(finalTranscript.trim());
            setVoiceInterim(interimTranscript.trim());
        };
        recognition.onerror = (event) => {
            const errorMessages: Record<string, string> = {
                "not-allowed": t("errVoiceNotAllowed"),
                "service-not-allowed": t("errVoiceServiceNotAllowed"),
                "audio-capture": t("errVoiceAudioCapture"),
                "no-speech": t("errVoiceNoSpeech"),
                "network": t("errVoiceNetwork"),
                "language-not-supported": t("errVoiceLanguageNotSupported")
            };
            setVoiceError(
                errorMessages[event.error] || t("errVoiceGeneric")
            );
            setIsRecording(false);
        };
        recognition.onend = () => {
            setIsRecording(false);
            recognitionRef.current = null;
        };
        recognitionRef.current = recognition;
        try {
            recognition.start();
        } catch {
            recognitionRef.current = null;
            setIsRecording(false);
            setVoiceError(t("errVoiceStart"));
        }
    };
    const handleStopRecording = () => {
        recognitionRef.current?.stop();
    };

    const handleCancelVoice = () => {
        recognitionRef.current?.abort();
        recognitionRef.current = null;

        setIsRecording(false);
        setShowVoiceDialog(false);
        setVoiceText("");
        setVoiceInterim("");
        setVoiceError("");
    };

    const handleInsertVoiceText = () => {
        const content = voiceText.trim();

        if (!content) return;

        setMessageInput(prev => {
            return prev.trim()
                ? `${prev.trim()} ${content}`
                : content;
        });

        handleCancelVoice();
    };
    useEffect(() => {
        return () => {
            recognitionRef.current?.abort();
            recognitionRef.current = null;
        };
    }, []);
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
                                    : "● " + t("unknownStatus")}
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
                    <button type="button" className="voice-button" title="Ghi âm tin nhắn" aria-label="Ghi âm tin nhắn" onClick={handleOpenVoiceDialog} disabled={sending}>
                        <i className="fa-solid fa-microphone"></i>
                    </button>
                    <button type="submit" disabled={!messageInput.trim() || sending}>{t("send")}</button>
                </form>
            )}
            {showVoiceDialog && (
                <div className="voice-dialog-overlay" onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            handleCancelVoice();
                        }
                    }}>
                    <div className="voice-dialog" role="dialog" aria-modal="true" aria-labelledby="voice-dialog-title">
                        <div className="voice-dialog-header">
                            <h4 id="voice-dialog-title">{t("recMes")}</h4>
                            <button type="button" className="voice-dialog-close" aria-label="Đóng" onClick={handleCancelVoice}>
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <div className="voice-dialog-body">
                            <div className={`voice-microphone ${isRecording ? "recording" : ""}`}>
                                <i className="fa-solid fa-microphone"></i>
                            </div>
                            <h5>
                                {isRecording ? t("listening") : ""}
                            </h5>
                            <div className="voice-language">
                                <label htmlFor="voice-language">{t("language")}</label>
                                <select id="voice-language" className="form-select" value={voiceLanguage}
                                    onChange={(event) => setVoiceLanguage(event.target.value)}
                                    disabled={isRecording}>
                                    <option value="vi-VN">{t("vietnamese")}</option>
                                    <option value="en-US">{t("english")}</option>
                                </select>
                            </div>
                            <div className="voice-transcript">
                                {voiceText || voiceInterim ? (
                                    <>
                                        <span>{voiceText}</span>
                                        {voiceInterim && (
                                            <span className="voice-interim">
                                                {voiceText ? " " : ""}{voiceInterim}
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    <span className="voice-placeholder">
                                        {isRecording ? t("voicePlaceholderRecording") : t("voicePlaceholderIdle")}
                                    </span>
                                )}
                            </div>
                            {voiceError && (
                                <div className="voice-error">
                                    {voiceError}
                                </div>
                            )}
                        </div>
                        <div className="voice-dialog-footer">
                            {!isRecording ? (
                                <button type="button" className="voice-start-button" onClick={handleStartRecording}>
                                    <i className="fa-solid fa-microphone me-1"></i>
                                    {t("start")}
                                </button>
                            ) : (
                                <button type="button" className="voice-stop-button" onClick={handleStopRecording}>
                                    <i className="fa-solid fa-stop me-1"></i>
                                    {t("stop")}
                                </button>
                            )}
                            <button type="button" className="voice-insert-button rounded-circle" onClick={handleInsertVoiceText} disabled={isRecording || !voiceText.trim()}>
                                <i className="fa-solid fa-arrow-right-long"></i>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
export default ChatPanel;