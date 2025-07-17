// Geliştirilmiş Background Service Worker - Opera AI Agent
const API_BASE_URL = 'http://127.0.0.1:5000/api/automation';

class OperaAIAgent {
    constructor() {
        this.isBackendHealthy = false;
        this.currentTask = null;
        this.taskHistory = [];
        this.initializeEventListeners();
        this.checkBackendHealth();
    }
    
    initializeEventListeners() {
        // Extension yüklendiğinde
        chrome.runtime.onInstalled.addListener(() => {
            console.log('🎯 Opera AI Agent eklentisi yüklendi');
            this.initializeStorage();
        });
        
        // Mesaj dinleyicisi - popup ve sidebar'dan gelen mesajları işle
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Async response için
        });
        
        // Tab güncellendiğinde - sayfa analizi için
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && tab.url) {
                this.onTabUpdated(tabId, tab);
            }
        });
        
        // Alarm dinleyicisi (periyodik görevler için)
        chrome.alarms.onAlarm.addListener((alarm) => {
            this.handleAlarm(alarm);
        });
        
        // Context menu oluştur
        this.createContextMenus();
    }
    
    async initializeStorage() {
        try {
            const storage = await chrome.storage.local.get(['settings', 'chatHistory', 'taskHistory']);
            
            if (!storage.settings) {
                await chrome.storage.local.set({
                    settings: {
                        apiUrl: API_BASE_URL,
                        autoExecute: false,
                        notifications: true,
                        theme: 'dark',
                        maxRetries: 3,
                        timeout: 30000
                    }
                });
            }
            
            if (!storage.chatHistory) {
                await chrome.storage.local.set({ chatHistory: [] });
            }
            
            if (!storage.taskHistory) {
                await chrome.storage.local.set({ taskHistory: [] });
            }
            
            console.log('✅ Storage başlatıldı');
        } catch (error) {
            console.error('❌ Storage başlatma hatası:', error);
        }
    }
    
    createContextMenus() {
        chrome.contextMenus.create({
            id: 'analyze-page',
            title: 'Bu Sayfayı AI ile Analiz Et',
            contexts: ['page']
        });
        
        chrome.contextMenus.create({
            id: 'extract-data',
            title: 'Sayfa Verilerini Çıkar',
            contexts: ['page']
        });
        
        chrome.contextMenus.onClicked.addListener((info, tab) => {
            this.handleContextMenu(info, tab);
        });
    }
    
    async handleMessage(message, sender, sendResponse) {
        try {
            console.log('📨 Mesaj alındı:', message.type);
            
            switch (message.type) {
                case 'HEALTH_CHECK':
                    const healthStatus = await this.checkBackendHealth();
                    sendResponse({ 
                        healthy: healthStatus,
                        timestamp: Date.now(),
                        version: '2.0.0'
                    });
                    break;
                    
                case 'EXECUTE_AUTOMATION':
                    const result = await this.executeAutomation(message.command, sender.tab);
                    sendResponse(result);
                    break;
                    
                case 'ANALYZE_CURRENT_PAGE':
                    const analysis = await this.analyzeCurrentPage(sender.tab);
                    sendResponse(analysis);
                    break;
                    
                case 'OPEN_NEW_TAB':
                    const newTab = await this.openNewTab(message.url);
                    sendResponse({ success: true, tabId: newTab.id });
                    break;
                    
                case 'GET_PAGE_CONTENT':
                    const content = await this.getPageContent(message.tabId);
                    sendResponse(content);
                    break;
                    
                case 'INJECT_SCRIPT':
                    const scriptResult = await this.injectScript(message.tabId, message.script);
                    sendResponse(scriptResult);
                    break;
                    
                case 'GET_TASK_HISTORY':
                    const history = await this.getTaskHistory();
                    sendResponse(history);
                    break;
                    
                default:
                    sendResponse({ error: 'Bilinmeyen mesaj türü: ' + message.type });
            }
        } catch (error) {
            console.error('❌ Mesaj işleme hatası:', error);
            sendResponse({ 
                error: error.message,
                timestamp: Date.now()
            });
        }
    }
    
    async checkBackendHealth() {
        try {
            console.log('🔍 Backend sağlık kontrolü yapılıyor...');
            
            const response = await fetch(`${API_BASE_URL}/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(5000) // 5 saniye timeout
            });
            
            if (response.ok) {
                const data = await response.json();
                this.isBackendHealthy = true;
                console.log('✅ Backend sağlıklı:', data);
                return true;
            } else {
                this.isBackendHealthy = false;
                console.error('❌ Backend yanıt hatası:', response.status);
                return false;
            }
        } catch (error) {
            this.isBackendHealthy = false;
            console.error('❌ Backend bağlantı hatası:', error);
            return false;
        }
    }
    
    async executeAutomation(command, currentTab) {
        try {
            if (!this.isBackendHealthy) {
                throw new Error('Backend servisi sağlıklı değil');
            }
            
            console.log('🤖 Otomasyon başlatılıyor:', command);
            
            // Görev geçmişine ekle
            const taskId = Date.now().toString();
            this.currentTask = {
                id: taskId,
                command: command,
                startTime: Date.now(),
                status: 'running',
                currentTab: currentTab
            };
            
            // Backend'e istek gönder
            const response = await fetch(`${API_BASE_URL}/full-automation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    command: command,
                    tabId: currentTab?.id,
                    taskId: taskId
                })
            });
            
            if (!response.ok) {
                throw new Error(`Backend hatası: ${response.status}`);
            }
            
            const result = await response.json();
            
            // Görev tamamlandı
            this.currentTask.status = result.success ? 'completed' : 'failed';
            this.currentTask.endTime = Date.now();
            this.currentTask.result = result;
            
            // Geçmişe kaydet
            await this.saveTaskToHistory(this.currentTask);
            
            // Bildirim gönder
            if (result.success) {
                this.showNotification('Görev Tamamlandı', `"${command}" başarıyla gerçekleştirildi`);
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ Otomasyon hatası:', error);
            
            if (this.currentTask) {
                this.currentTask.status = 'error';
                this.currentTask.endTime = Date.now();
                this.currentTask.error = error.message;
                await this.saveTaskToHistory(this.currentTask);
            }
            
            return {
                success: false,
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
    
    async analyzeCurrentPage(tab) {
        try {
            console.log('📊 Sayfa analizi başlatılıyor:', tab.url);
            
            // Sayfa içeriğini al
            const content = await this.getPageContent(tab.id);
            
            // Backend'e analiz için gönder
            const response = await fetch(`${API_BASE_URL}/analyze-page`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: tab.url,
                    title: tab.title,
                    content: content.text,
                    timestamp: Date.now()
                })
            });
            
            if (!response.ok) {
                throw new Error(`Analiz hatası: ${response.status}`);
            }
            
            const analysis = await response.json();
            
            // Analiz sonucunu bildirim olarak göster
            this.showNotification('Sayfa Analizi Tamamlandı', `${tab.title} analiz edildi`);
            
            return {
                success: true,
                analysis: analysis,
                timestamp: Date.now()
            };
            
        } catch (error) {
            console.error('❌ Sayfa analizi hatası:', error);
            return {
                success: false,
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
    
    async openNewTab(url) {
        try {
            const tab = await chrome.tabs.create({
                url: url,
                active: true
            });
            
            console.log('🆕 Yeni sekme açıldı:', tab.id, url);
            return tab;
            
        } catch (error) {
            console.error('❌ Yeni sekme açma hatası:', error);
            throw error;
        }
    }
    
    async getPageContent(tabId) {
        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: () => {
                    return {
                        text: document.body.innerText,
                        html: document.documentElement.outerHTML,
                        title: document.title,
                        url: window.location.href,
                        links: Array.from(document.links).map(link => ({
                            text: link.textContent.trim(),
                            href: link.href
                        })).slice(0, 50), // İlk 50 link
                        images: Array.from(document.images).map(img => ({
                            src: img.src,
                            alt: img.alt
                        })).slice(0, 20) // İlk 20 resim
                    };
                }
            });
            
            return results[0].result;
            
        } catch (error) {
            console.error('❌ Sayfa içeriği alma hatası:', error);
            throw error;
        }
    }
    
    async injectScript(tabId, script) {
        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: new Function(script)
            });
            
            return {
                success: true,
                result: results[0].result
            };
            
        } catch (error) {
            console.error('❌ Script enjeksiyon hatası:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async saveTaskToHistory(task) {
        try {
            const storage = await chrome.storage.local.get(['taskHistory']);
            const history = storage.taskHistory || [];
            
            history.push(task);
            
            // Son 100 görevi tut
            if (history.length > 100) {
                history.splice(0, history.length - 100);
            }
            
            await chrome.storage.local.set({ taskHistory: history });
            
        } catch (error) {
            console.error('❌ Görev geçmişi kaydetme hatası:', error);
        }
    }
    
    async getTaskHistory() {
        try {
            const storage = await chrome.storage.local.get(['taskHistory']);
            return storage.taskHistory || [];
        } catch (error) {
            console.error('❌ Görev geçmişi alma hatası:', error);
            return [];
        }
    }
    
    showNotification(title, message) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: title,
            message: message
        });
    }
    
    async onTabUpdated(tabId, tab) {
        // Sayfa yüklendiğinde otomatik analiz (ayarlarda etkinse)
        try {
            const storage = await chrome.storage.local.get(['settings']);
            const settings = storage.settings || {};
            
            if (settings.autoExecute && tab.url && tab.url.startsWith('http')) {
                console.log('🔄 Otomatik sayfa analizi:', tab.url);
                // Otomatik analiz burada yapılabilir
            }
        } catch (error) {
            console.error('❌ Tab güncelleme hatası:', error);
        }
    }
    
    async handleContextMenu(info, tab) {
        try {
            switch (info.menuItemId) {
                case 'analyze-page':
                    await this.analyzeCurrentPage(tab);
                    break;
                case 'extract-data':
                    await this.executeAutomation('Bu sayfadaki tüm önemli verileri çıkar ve analiz et', tab);
                    break;
            }
        } catch (error) {
            console.error('❌ Context menu hatası:', error);
        }
    }
    
    handleAlarm(alarm) {
        console.log('⏰ Alarm tetiklendi:', alarm.name);
        // Periyodik görevler burada yapılabilir
    }
}

// Background script başlat
const operaAIAgent = new OperaAIAgent();

console.log('🚀 Opera AI Agent Background Script başlatıldı');

