export type ConversationType = "people" | "room";

export interface Conversation {
    id: string;
    name: string;
    type: ConversationType;
    lastMessageAt: string;
}

interface ConversationItemProps {
    conversation: Conversation;
}

function formatDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? ""
        : date.toLocaleDateString("vi-VN", {day: "2-digit", month: "2-digit", year: "numeric"});
}

function ConversationItem({conversation}: ConversationItemProps) {
    const isRoom = conversation.type === "room";

    return (
        <button type="button" className="sb-conv w-100 d-flex align-items-center gap-2 text-start border rounded-3 p-2">
            <span className={`sb-avatar ${isRoom ? "sb-avatar--room" : "sb-avatar--people"} d-flex align-items-center justify-content-center rounded-circle`} aria-hidden="true">
                <i className={`fa-solid ${isRoom ? "fa-users" : "fa-user"} fs-5`}></i>
            </span>
            <span className="flex-grow-1 text-truncate fw-semibold">{conversation.name}</span>
            <span className="small text-secondary text-nowrap">{formatDate(conversation.lastMessageAt)}</span>
        </button>
    );
}

export default ConversationItem;
