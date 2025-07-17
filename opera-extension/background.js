// Background Service Worker
const API_BASE_URL = 'http://localhost:5000/api/automation';

class AutomationBackground {
    constructor() {
        this.initializeEventListeners();
        this.checkBackendHealth();
    }
    
    initializeEventListeners() {
        // Extension yüklendiğinde
        chrome.runtime.onInstalled.addListener(() => {
            console.log('Fırsat Avcısı eklentisi yüklendi');
            this.initializeStorage();
        });
        
        // Mesaj dinleyicisi
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Async response için
        });
        
        // Tab güncellendiğinde
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && tab.url) {
                this.onTabUpdated(tabId, tab);
            }
        });
        
        // Alarm dinleyicisi (periyodik görevler için)
        chrome.alarms.onAlarm.addListener((alarm) => {
            this.handleAlarm(alarm);
        });
    }
    
    async initializeStorage() {
        try {
            const storage = await chrome.storage.local.get(['settings', 'chatHistory']);
            
            if (!storage.settings) {
                await chrome.storage.local.set({
                    settings: {
                        apiUrl: API_BASE_URL,
                        autoExecute: false,
                        notifications: true,
                        theme: 'dark'
                    }
                });
            }
            
            if (!storage.chatHistory) {
                await chrome.storage.local.set({ chatHistory: [] });
            }
        } catch (error) {
            console.error('Storage initialization error:', error);
        }
    }
    
    async handleMessage(message, sender, sendResponse) {
        try {
            switch (message.type) {
                case 'EXECUTE_AUTOMATION':
                    const result = await this.executeAutomation(message.command);
                    sendResponse(result);
                    break;
                    
                case 'AUTOMATION_RESULT':
                    await this.handleAutomationResult(message.data);
                    sendResponse({ success: true });
                    break;
                    
                case 'GET_SETTINGS':
                    const settings = await this.getSettings();
                    sendResponse(settings);
                    break;
                    
                case 'UPDATE_SETTINGS':
                    await this.updateSettings(message.settings);
                    sendResponse({ success: true });
                    break;
                    
                case 'HEALTH_CHECK':
                    const health = await this.checkBackendHealth();
                    sendResponse(health);
                    break;
                    
                default:
                    sendResponse({ error: 'Unknown message type' });
            }
        } catch (error) {
            console.error('Message handling error:', error);
            sendResponse({ error: error.message });
        }
    }
    
    async executeAutomation(command) {
        try {
            const settings = await this.getSettings();
            
            const response = await fetch(`${settings.apiUrl}/full-automation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ command })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Başarılı sonucu bildirim olarak göster
                if (settings.notifications) {
                    chrome.notifications.create({
                        type: 'basic',
                        iconUrl: 'icons/icon48.png',
                        title: 'Fırsat Avcısı',
                        message: 'Görev başarıyla tamamlandı!'
                    });
                }
                
                // Sonucu kaydet
                await this.saveAutomationResult(command, data);
            }
            
            return data;
            
        } catch (error) {
            console.error('Automation execution error:', error);
            return { success: false, error: error.message };
        }
    }
    
    async handleAutomationResult(data) {
        try {
            // Sonuçları analiz et ve kullanıcıya önerilerde bulun
            if (data.automation_results) {
                const analysis = await this.analyzeResults(data);
                
                // Önemli sonuçları badge olarak göster
                if (analysis.importantFindings > 0) {
                    chrome.action.setBadgeText({ text: analysis.importantFindings.toString() });
                    chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
                }
            }
        } catch (error) {
            console.error('Result handling error:', error);
        }
    }
    
    async analyzeResults(data) {
        // Basit sonuç analizi
        let importantFindings = 0;
        
        if (data.automation_results) {
            data.automation_results.forEach(result => {
                if (result.includes('Scraped') && result.includes('items')) {
                    importantFindings++;
                }
            });
        }
        
        return { importantFindings };
    }
    
    async onTabUpdated(tabId, tab) {
        try {
            // Belirli sitelerde otomatik öneriler sunabilir
            const url = new URL(tab.url);
            const domain = url.hostname;
            
            // Desteklenen siteler için content script enjekte et
            const supportedSites = [
                'sahibinden.com',
                'hepsiburada.com',
                'trendyol.com',
                'google.com',
                'amazon.com.tr'
            ];
            
            if (supportedSites.some(site => domain.includes(site))) {
                // Content script'i her zaman enjekte et
                await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['content.js']
                });
            }
        } catch (error) {
            console.error('Tab update handling error:', error);
        }
    }
    
    async checkBackendHealth() {
        try {
            const settings = await this.getSettings();
            const response = await fetch(`${settings.apiUrl}/health`);
            const data = await response.json();
            
            if (data.status === 'healthy') {
                chrome.action.setIcon({ path: 'icons/icon48.png' });
                return { healthy: true, data };
            } else {
                chrome.action.setIcon({ path: 'icons/icon48-offline.png' });
                return { healthy: false, error: 'Backend unhealthy' };
            }
        } catch (error) {
            console.error('Health check error:', error);
            chrome.action.setIcon({ path: 'icons/icon48-offline.png' });
            return { healthy: false, error: error.message };
        }
    }
    
    async getSettings() {
        try {
            const result = await chrome.storage.local.get(['settings']);
            return result.settings || {
                apiUrl: API_BASE_URL,
                autoExecute: false,
                notifications: true,
                theme: 'dark'
            };
        } catch (error) {
            console.error('Settings get error:', error);
            return {};
        }
    }
    
    async updateSettings(newSettings) {
        try {
            const currentSettings = await this.getSettings();
            const updatedSettings = { ...currentSettings, ...newSettings };
            await chrome.storage.local.set({ settings: updatedSettings });
        } catch (error) {
            console.error('Settings update error:', error);
        }
    }
    
    async saveAutomationResult(command, result) {
        try {
            const historyItem = {
                timestamp: Date.now(),
                command: command,
                result: result,
                summary: `✅ ${result.task_plan?.task_type || 'Görev'} tamamlandı`
            };
            
            const storage = await chrome.storage.local.get(['automationHistory']);
            const history = storage.automationHistory || [];
            history.push(historyItem);
            
            // Son 100 öğeyi tut
            if (history.length > 100) {
                history.splice(0, history.length - 100);
            }
            
            await chrome.storage.local.set({ automationHistory: history });
        } catch (error) {
            console.error('Automation result save error:', error);
        }
    }
    
    handleAlarm(alarm) {
        switch (alarm.name) {
            case 'healthCheck':
                this.checkBackendHealth();
                break;
            case 'cleanupStorage':
                this.cleanupStorage();
                break;
        }
    }
    
    async cleanupStorage() {
        try {
            const storage = await chrome.storage.local.get(['chatHistory', 'automationHistory']);
            
            // Eski kayıtları temizle (30 gün öncesi)
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            
            if (storage.chatHistory) {
                const filteredChatHistory = storage.chatHistory.filter(
                    item => item.timestamp > thirtyDaysAgo
                );
                await chrome.storage.local.set({ chatHistory: filteredChatHistory });
            }
            
            if (storage.automationHistory) {
                const filteredAutomationHistory = storage.automationHistory.filter(
                    item => item.timestamp > thirtyDaysAgo
                );
                await chrome.storage.local.set({ automationHistory: filteredAutomationHistory });
            }
        } catch (error) {
            console.error('Storage cleanup error:', error);
        }
    }
}

// Background script başlat
new AutomationBackground();

// Periyodik görevleri ayarla
chrome.alarms.create('healthCheck', { periodInMinutes: 0.1 }); // Her 6 saniyede bir
chrome.alarms.create('cleanupStorage', { periodInMinutes: 60 * 24 }); // Günlük



