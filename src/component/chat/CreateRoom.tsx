import {useEffect, useRef, useState, type ChangeEvent, type FormEvent} from "react";
import {chatService} from "../../services/chatService";

interface CreateRoomModalProps {
    onClose: () => void;
    onCreated: (roomName: string) => void;
}

function toErrorText(error: unknown): string {
    const text = error instanceof Error ? error.message.trim() : "";
    if (!text) return "Không thể tạo phòng, vui lòng thử lại.";
    if (/timeout$/i.test(text)) return "Máy chủ không phản hồi, vui lòng thử lại.";
    return text;
}

function CreateRoom({onClose, onCreated}: CreateRoomModalProps) {
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !submitting) onClose();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose, submitting]);

    const askRetype = (message: string) => {
        setError(message);
        inputRef.current?.focus();
        inputRef.current?.select();
    };
    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (submitting) return;
        const roomName = name.trim();
        if (!roomName) {
            askRetype("Vui lòng nhập tên phòng.");
            return;
        }

        setSubmitting(true);
        setError("");
        try {
            const createdName = await chatService.createRoom(roomName);
            onCreated(createdName);
        } catch (err) {
            setSubmitting(false);
            askRetype(toErrorText(err));
        }
    };

    return (
        <>
            <div className="modal-backdrop fade show"></div>
            <div className="modal fade show d-block" role="dialog" aria-modal="true" aria-labelledby="create-room-title" tabIndex={-1} onMouseDown={(event) => {
                    if (event.target === event.currentTarget && !submitting) onClose();
                }}
            >
                <div className="modal-dialog modal-dialog-centered modal-sm">
                    <form className="modal-content" onSubmit={handleSubmit} noValidate>
                        <div className="modal-header py-2">
                            <h5 className="modal-title fs-6" id="create-room-title">Tạo phòng</h5>
                            <button type="button" className="btn-close" aria-label="Đóng" onClick={onClose}
                                    disabled={submitting}></button>
                        </div>

                        <div className="modal-body">
                            <label htmlFor="create-room-name" className="form-label">Tên phòng</label>
                            <input id="create-room-name" ref={inputRef} type="text" className={`form-control${error ? " is-invalid" : ""}`}
                                   placeholder="Nhập tên phòng" autoComplete="off" value={name} readOnly={submitting} aria-invalid={error !== ""}
                                   aria-describedby={error ? "create-room-error" : undefined}
                                   onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                       setName(event.target.value);
                                       if (error) setError("");
                                   }}/>
                            {error && (
                                <div id="create-room-error" className="invalid-feedback d-block" role="alert">
                                    {error}
                                </div>
                            )}
                        </div>

                        <div className="modal-footer py-2">
                            <button type="button" className="btn btn-outline-secondary" onClick={onClose}
                                    disabled={submitting}>Hủy
                            </button>
                            <button type="submit" className="btn btn-primary"
                                    disabled={submitting}>{submitting ? "Đang tạo..." : "Tạo phòng"}</button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

export default CreateRoom;