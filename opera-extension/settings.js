// Geliştirilmiş Settings JavaScript - Opera AI Agent
const API_BASE_URL = 'http://127.0.0.1:5000/api/automation';

class OperaAISettings {
    constructor() {
        this.initializeElements();
        this.initializeEventListeners();
        this.loadSettings();
    }
    
    initializeElements() {
        this.apiUrlInput = document.getElementById("apiUrl");
        this.autoExecuteCheckbox = document.getElementById("autoExecute");
        this.notificationsCheckbox = document.getElementById("notifications");
        this.displayHighlightsCheckbox = document.getElementById("displayHighlights");
        this.maxRetriesInput = document.getElementById("maxRetries");
        this.timeoutInput = document.getElementById("timeout");
        this.themeSelect = document.getElementById("theme");
        this.debugModeCheckbox = document.getElementById("debugMode");
        this.saveHistoryCheckbox = document.getElementById("saveHistory");
        this.saveButton = document.getElementById("saveSettings");
        this.resetButton = document.getElementById("resetSettings");
        this.statusMessage = document.getElementById("statusMessage");
    }
    
    initializeEventListeners() {
        this.saveButton.addEventListener("click", () => this.saveSettings());
        this.resetButton.addEventListener("click", () => this.resetSettings());
        
        // Real-time validation
        this.apiUrlInput.addEventListener("blur", () => this.validateApiUrl());
        this.maxRetriesInput.addEventListener("input", () => this.validateMaxRetries());
        this.timeoutInput.addEventListener("input", () => this.validateTimeout());
    }
    
    async loadSettings() {
        try {
            const result = await chrome.storage.local.get(["settings"]);
            const settings = result.settings || this.getDefaultSettings();
            
            this.apiUrlInput.value = settings.apiUrl || API_BASE_URL;
            this.autoExecuteCheckbox.checked = settings.autoExecute || false;
            this.notificationsCheckbox.checked = settings.notifications !== false; // Default true
            this.displayHighlightsCheckbox.checked = settings.displayHighlights !== false; // Default true
            this.maxRetriesInput.value = settings.maxRetries || 3;
            this.timeoutInput.value = settings.timeout ? settings.timeout / 1000 : 30; // Convert to seconds
            this.themeSelect.value = settings.theme || 'dark';
            this.debugModeCheckbox.checked = settings.debugMode || false;
            this.saveHistoryCheckbox.checked = settings.saveHistory !== false; // Default true
            
            console.log('✅ Ayarlar yüklendi:', settings);
        } catch (error) {
            console.error('❌ Ayarlar yüklenirken hata:', error);
            this.showStatus("Ayarlar yüklenirken hata oluştu", "error");
        }
    }
    
    async saveSettings() {
        try {
            // Validation
            if (!this.validateAllInputs()) {
                return;
            }
            
            const newSettings = {
                apiUrl: this.apiUrlInput.value.trim(),
                autoExecute: this.autoExecuteCheckbox.checked,
                notifications: this.notificationsCheckbox.checked,
                displayHighlights: this.displayHighlightsCheckbox.checked,
                maxRetries: parseInt(this.maxRetriesInput.value),
                timeout: parseInt(this.timeoutInput.value) * 1000, // Convert to milliseconds
                theme: this.themeSelect.value,
                debugMode: this.debugModeCheckbox.checked,
                saveHistory: this.saveHistoryCheckbox.checked,
                lastUpdated: Date.now()
            };
            
            await chrome.storage.local.set({ settings: newSettings });
            
            // Backend bağlantısını test et
            await this.testBackendConnection(newSettings.apiUrl);
            
            this.showStatus("✅ Ayarlar başarıyla kaydedildi", "success");
            
            // Background script'e ayarların güncellendiğini bildir
            chrome.runtime.sendMessage({
                type: 'SETTINGS_UPDATED',
                settings: newSettings
            }).catch(error => {
                console.log('Background script bildirimi gönderilemedi:', error);
            });
            
            console.log('✅ Ayarlar kaydedildi:', newSettings);
            
        } catch (error) {
            console.error('❌ Ayarlar kaydedilirken hata:', error);
            this.showStatus("❌ Ayarlar kaydedilirken hata oluştu", "error");
        }
    }
    
    async resetSettings() {
        if (confirm("⚠️ Tüm ayarları varsayılanlara sıfırlamak istediğinizden emin misiniz?\\n\\nBu işlem geri alınamaz.")) {
            try {
                const defaultSettings = this.getDefaultSettings();
                await chrome.storage.local.set({ settings: defaultSettings });
                this.loadSettings();
                this.showStatus("🔄 Ayarlar varsayılanlara sıfırlandı", "success");
                
                console.log('🔄 Ayarlar sıfırlandı');
            } catch (error) {
                console.error('❌ Ayarlar sıfırlanırken hata:', error);
                this.showStatus("❌ Ayarlar sıfırlanırken hata oluştu", "error");
            }
        }
    }
    
    getDefaultSettings() {
        return {
            apiUrl: API_BASE_URL,
            autoExecute: false,
            notifications: true,
            displayHighlights: true,
            maxRetries: 3,
            timeout: 30000, // 30 seconds in milliseconds
            theme: 'dark',
            debugMode: false,
            saveHistory: true
        };
    }
    
    validateAllInputs() {
        let isValid = true;
        
        if (!this.validateApiUrl()) isValid = false;
        if (!this.validateMaxRetries()) isValid = false;
        if (!this.validateTimeout()) isValid = false;
        
        return isValid;
    }
    
    validateApiUrl() {
        const url = this.apiUrlInput.value.trim();
        
        if (!url) {
            this.setInputError(this.apiUrlInput, "API URL'si gereklidir");
            return false;
        }
        
        try {
            new URL(url);
            this.clearInputError(this.apiUrlInput);
            return true;
        } catch (error) {
            this.setInputError(this.apiUrlInput, "Geçerli bir URL girin");
            return false;
        }
    }
    
    validateMaxRetries() {
        const value = parseInt(this.maxRetriesInput.value);
        
        if (isNaN(value) || value < 1 || value > 10) {
            this.setInputError(this.maxRetriesInput, "1-10 arası bir değer girin");
            return false;
        }
        
        this.clearInputError(this.maxRetriesInput);
        return true;
    }
    
    validateTimeout() {
        const value = parseInt(this.timeoutInput.value);
        
        if (isNaN(value) || value < 5 || value > 120) {
            this.setInputError(this.timeoutInput, "5-120 saniye arası bir değer girin");
            return false;
        }
        
        this.clearInputError(this.timeoutInput);
        return true;
    }
    
    setInputError(input, message) {
        input.style.borderColor = '#dc3545';
        input.style.backgroundColor = 'rgba(220, 53, 69, 0.1)';
        
        // Remove existing error message
        const existingError = input.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.color = '#dc3545';
        errorDiv.style.fontSize = '12px';
        errorDiv.style.marginTop = '5px';
        errorDiv.textContent = message;
        input.parentNode.appendChild(errorDiv);
    }
    
    clearInputError(input) {
        input.style.borderColor = '';
        input.style.backgroundColor = '';
        
        const errorMessage = input.parentNode.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }
    
    async testBackendConnection(apiUrl) {
        try {
            const response = await fetch(`${apiUrl}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });
            
            if (response.ok) {
                console.log('✅ Backend bağlantısı başarılı');
                return true;
            } else {
                console.warn('⚠️ Backend yanıt hatası:', response.status);
                return false;
            }
        } catch (error) {
            console.warn('⚠️ Backend bağlantı hatası:', error.message);
            return false;
        }
    }
    
    showStatus(message, type) {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message ${type}`;
        this.statusMessage.style.display = "block";
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            this.statusMessage.style.display = "none";
        }, 5000);
    }
}

// Settings sayfası yüklendiğinde başlat
document.addEventListener("DOMContentLoaded", () => {
    new OperaAISettings();
});

console.log('🚀 Opera AI Agent Settings başlatıldı');

