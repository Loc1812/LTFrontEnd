import Slot from "./Slot";

function ChatPanel() {
    return (
        <main className="chat-main">
            <Slot className="cp-header" label="Header đoạn chat" hint="Chứa tên nhóm và các chức năng giống như zalo"/>
            <Slot className="cp-messages" label="Khu vực tin nhắn"/>
            <Slot className="cp-toolbar" label="Thanh công cụ(nếu có)"/>
            <Slot className="cp-input" label="Khu nhập tin nhắn"/>
        </main>
    );
}

export default ChatPanel;
