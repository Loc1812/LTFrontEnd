import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
    vi: {
        translation: {
            setting: "Cài đặt",
            general: "Cài đặt chung",
            account: "Tài khoản và bảo mật",
            privacy: "Quyền riêng tư",
            sync: "Đồng bộ và sao lưu",
            data: "Quản lý dữ liệu",
            appearance: "Giao diện",
            notification: "Thông báo",
            message: "Tin nhắn",
            call: "Cài đặt cuộc gọi",
            utility: "Tiện ích",
            language: "Ngôn ngữ",
            changeLanguage: "Thay đổi ngôn ngữ hiển thị",
            vietnamese: "Tiếng Việt",
            english: "Tiếng Anh",
            logout: "Đăng xuất",
            cancel: "Hủy",
            theme: "Giao diện",
            changeTheme: "Thay đổi màu nền giao diện",
            light: "Sáng",
            dark: "Tối",
        }
    },
    en: {
        translation: {
            setting: "Settings",
            general: "General",
            account: "Account and security",
            privacy: "Privacy",
            sync: "Sync and backup",
            data: "Data management",
            appearance: "Appearance",
            notification: "Notifications",
            message: "Messages",
            call: "Call settings",
            utility: "Utilities",
            language: "Language",
            changeLanguage: "Change display language",
            vietnamese: "Vietnamese",
            english: "English",
            logout: "Log out",
            cancel: "Cancel",
            theme: "Theme",
            changeTheme: "Change application appearance",
            light: "Light",
            dark: "Dark",
        }
    }
};

const savedLanguage = localStorage.getItem("language") || "vi";
i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: savedLanguage,
        fallbackLng: "vi",
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
