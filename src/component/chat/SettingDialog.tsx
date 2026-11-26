import { useState } from "react";
import { useTranslation } from "react-i18next";
import "../../pages/setting.css";
interface Props {
    onClose: () => void;
}
function SettingDialog({ onClose }: Props) {
    const { t, i18n } = useTranslation();
    const [selectedSetting, setSelectedSetting] = useState("general");
    const [language, setLanguage] = useState(
        localStorage.getItem("language") || i18n.resolvedLanguage || "vi"
    );
    const [theme, setTheme] = useState(
        localStorage.getItem("theme") || "light"
    );
    const settingList = [
        { id: "general", label: "general" },
        { id: "account", label: "account" },
        { id: "privacy", label: "privacy" },
        { id: "sync", label: "sync" },
        { id: "data", label: "data" },
        { id: "notification", label: "notification" },
        { id: "message", label: "message" },
        { id: "call", label: "call" },
        { id: "utility", label: "utility" }
    ];
    const handleLanguageChange = (value: string) => {
        setLanguage(value);
        localStorage.setItem("language", value);
        i18n.changeLanguage(value);
    };
    const handleThemeChange = (value: string) => {
        setTheme(value);
        localStorage.setItem("theme", value);
        document.documentElement.setAttribute("data-theme", value);
    };
    return (
        <div className="setting_overlay" onClick={onClose}>
            <div className="setting_dialog" onClick={(event) => event.stopPropagation()}>
                <div className="setting_header">
                    <h2>{t("setting")}</h2>
                    <button type="button" className="setting_close" onClick={onClose}>
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div className="setting_container">
                    <div className="setting_sidebar">
                        {settingList.map((setting) => (
                            <button key={setting.id} type="button" className={`setting_menu ${selectedSetting === setting.id ? "active" : ""}`}
                                onClick={() => setSelectedSetting(setting.id)}>
                                {t(setting.label)}
                            </button>
                        ))}
                    </div>
                    <div className="setting_content">
                        <h3>{t(selectedSetting)}</h3>
                        {selectedSetting === "general" && (
                            <div className="setting_section">
                                <div className="setting_item">
                                    <div className="setting_item_info">
                                        <h5>{t("language")}</h5>
                                        <p>{t("changeLanguage")}</p>
                                    </div>
                                    <select className="form-select setting_part" value={language}
                                        onChange={
                                            (event) => handleLanguageChange(event.target.value)
                                        }>
                                        <option value="vi">
                                            {t("vietnamese")}
                                        </option>
                                        <option value="en">
                                            {t("english")}
                                        </option>
                                    </select>
                                </div>
                                <div className="setting_item">
                                    <div className="setting_item_info">
                                        <h5>{t("theme")}</h5>
                                        <p>{t("changeTheme")}</p>
                                    </div>
                                    <select className="form-select setting_part" value={theme}
                                        onChange={
                                            (event) => handleThemeChange(event.target.value)
                                        }>
                                        <option value="light">
                                            {t("light")}
                                        </option>
                                        <option value="dark">
                                            {t("dark")}
                                        </option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
export default SettingDialog;
