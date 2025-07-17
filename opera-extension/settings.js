// Settings JavaScript
const API_BASE_URL = 'http://localhost:5000/api/automation';

class AutomationSettings {
    constructor() {
        this.apiUrlInput = document.getElementById("apiUrl");
        this.autoExecuteCheckbox = document.getElementById("autoExecute");
        this.notificationsCheckbox = document.getElementById("notifications");
        this.saveButton = document.getElementById("saveSettings");
        this.resetButton = document.getElementById("resetSettings");
        this.statusMessage = document.getElementById("statusMessage");

        this.initializeEventListeners();
        this.loadSettings();
    }

    initializeEventListeners() {
        this.saveButton.addEventListener("click", () => this.saveSettings());
        this.resetButton.addEventListener("click", () => this.resetSettings());
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.local.get(["settings"]);
            const settings = result.settings || this.getDefaultSettings();

            this.apiUrlInput.value = settings.apiUrl;
            this.autoExecuteCheckbox.checked = settings.autoExecute;
            this.notificationsCheckbox.checked = settings.notifications;
        } catch (error) {
            this.showStatus("Ayarlar yüklenirken hata oluştu", "error");
        }
    }

    async saveSettings() {
        const newSettings = {
            apiUrl: this.apiUrlInput.value.trim(),
            autoExecute: this.autoExecuteCheckbox.checked,
            notifications: this.notificationsCheckbox.checked,
        };

        try {
            await chrome.storage.local.set({ settings: newSettings });
            this.showStatus("Ayarlar başarıyla kaydedildi", "success");
        } catch (error) {
            this.showStatus("Ayarlar kaydedilirken hata oluştu", "error");
        }
    }

    async resetSettings() {
        if (confirm("Tüm ayarları varsayılanlara sıfırlamak istediğinizden emin misiniz?")) {
            try {
                const defaultSettings = this.getDefaultSettings();
                await chrome.storage.local.set({ settings: defaultSettings });
                this.loadSettings();
                this.showStatus("Ayarlar varsayılanlara sıfırlandı", "success");
            } catch (error) {
                this.showStatus("Ayarlar sıfırlanırken hata oluştu", "error");
            }
        }
    }

    getDefaultSettings() {
        return {
            apiUrl: API_BASE_URL,
            autoExecute: false,
            notifications: true,
        };
    }

    showStatus(message, type) {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message ${type}`;
        this.statusMessage.style.display = "block";

        setTimeout(() => {
            this.statusMessage.style.display = "none";
        }, 3000);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new AutomationSettings();
});

