// Geliştirilmiş Sidebar JavaScript - Opera AI Agent
const API_BASE_URL = 'http://127.0.0.1:5000/api/automation';

class OperaAISidebar {
    constructor() {
        this.chatContainer = document.getElementById('chatContainer');
        this.commandInput = document.getElementById('commandInput');
        this.sendButton = document.getElementById('sendButton');
        this.statusDiv = document.getElementById('status');
        this.statusText = document.getElementById('statusText');
        
        this.isProcessing = false;
        this.messageHistory = [];
        
        this.initializeEventListeners();
        this.loadChatHistory();
        this.setupAutoResize();
    }
    
    initializeEventListeners() {
        // Gönder butonu
        this.sendButton.addEventListener('click', () => this.sendCommand());
        
        // Enter tuşu (Shift+Enter ile yeni satır)
        this.commandInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendCommand();
            }
        });
        
        // Örnek komutlar
        document.querySelectorAll('.example-item').forEach(item => {
            item.addEventListener('click', () => {
                const command = item.getAttribute('data-command');
                this.commandInput.value = command;
                this.sendCommand();
            });
        });
        
        // Footer butonları
        document.getElementById('settingsBtn')?.addEventListener('click', () => this.openSettings());
        document.getElementById('historyBtn')?.addEventListener('click', () => this.showHistory());
        document.getElementById('helpBtn')?.addEventListener('click', () => this.showHelp());
        
        // Input focus
        this.commandInput.addEventListener('focus', () => {
            this.hideExamples();
        });
    }
    
    setupAutoResize() {
        this.commandInput.addEventListener('input', () => {
            this.commandInput.style.height = 'auto';
            this.commandInput.style.height = Math.min(this.commandInput.scrollHeight, 120) + 'px';
        });
    }
    
    hideExamples() {
        const examples = document.querySelector('.examples');
        if (examples && this.messageHistory.length === 0) {
            examples.style.display = 'none';
        }
    }
    
    async sendCommand() {
        const command = this.commandInput.value.trim();
        if (!command || this.isProcessing) return;
        
        // Kullanıcı mesajını ekle
        this.addMessage(command, 'user');
        this.commandInput.value = '';
        this.commandInput.style.height = 'auto';
        
        // İşlem durumunu ayarla
        this.isProcessing = true;
        this.sendButton.disabled = true;
        this.setStatus('🤖 AI komutu analiz ediyor...', 'loading');
        
        try {
            // Backend'e istek gönder
            const response = await fetch(`${API_BASE_URL}/full-automation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ command })
            });
            
            if (!response.ok) {
                throw new Error(`Backend hatası: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Başarılı sonucu göster
                const formattedResponse = this.formatSuccessResponse(data);
                this.addMessage(formattedResponse, 'ai');
                this.setStatus('✅ Görev başarıyla tamamlandı!', 'success');
                
                // Geçmişe kaydet
                this.saveChatHistory(command, data);
                
                // Background script'e bildir
                chrome.runtime.sendMessage({
                    type: 'AUTOMATION_RESULT',
                    data: data
                }).catch(error => {
                    console.log('Background script bildirimi gönderilemedi:', error);
                });
                
            } else {
                // Hata durumu
                this.addMessage(`❌ **Hata:** ${data.error || 'Bilinmeyen hata oluştu'}`, 'ai');
                this.setStatus('❌ Görev tamamlanamadı', 'error');
            }
            
        } catch (error) {
            console.error('Automation error:', error);
            this.addMessage(`❌ **Bağlantı Hatası:** ${error.message}\\n\\nLütfen backend servisinin çalıştığından emin olun.`, 'ai');
            this.setStatus('❌ Bağlantı hatası', 'error');
        } finally {
            this.isProcessing = false;
            this.sendButton.disabled = false;
            setTimeout(() => this.hideStatus(), 5000);
        }
    }
    
    formatSuccessResponse(data) {
        let response = `✅ **Görev Tamamlandı!**\\n\\n`;
        
        if (data.task_plan) {
            response += `🎯 **Analiz Edilen Görev:** ${data.task_plan.task_type || 'Web Otomasyonu'}\\n`;
            if (data.task_plan.target_site) {
                response += `🌐 **Hedef Site:** ${data.task_plan.target_site}\\n`;
            }
            response += `\\n`;
        }
        
        if (data.automation_results && data.automation_results.length > 0) {
            response += `📋 **Gerçekleştirilen İşlemler:**\\n`;
            data.automation_results.forEach((result, index) => {
                response += `${index + 1}. ${result}\\n`;
            });
            response += `\\n`;
        }
        
        if (data.page_title) {
            response += `📄 **Son Sayfa:** ${data.page_title}\\n`;
        }
        
        if (data.current_url) {
            response += `🔗 **URL:** [${data.current_url}](${data.current_url})\\n`;
        }
        
        if (data.extracted_data) {
            response += `\\n📊 **Çıkarılan Veriler:**\\n`;
            if (typeof data.extracted_data === 'string') {
                response += data.extracted_data.substring(0, 500);
                if (data.extracted_data.length > 500) {
                    response += '...';
                }
            } else {
                response += JSON.stringify(data.extracted_data, null, 2).substring(0, 500);
            }
            response += `\\n`;
        }
        
        response += `\\n💡 **İpucu:** Daha fazla detay için geçmiş bölümünü kontrol edebilirsiniz.`;
        
        return response;
    }
    
    addMessage(content, type) {
        // Hoş geldin mesajını gizle
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }
        
        // Örnekleri gizle
        this.hideExamples();
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        // Markdown benzeri formatlamayı basit HTML'e çevir
        const formattedContent = content
            .replace(/\\n/g, '<br>')
            .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')
            .replace(/\\*(.*?)\\*/g, '<em>$1</em>')
            .replace(/\\[([^\\]]+)\\]\\(([^\\)]+)\\)/g, '<a href="$2" target="_blank">$1</a>');
        
        messageDiv.innerHTML = formattedContent;
        
        this.chatContainer.appendChild(messageDiv);
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
        
        // Mesaj geçmişine ekle
        this.messageHistory.push({ content, type, timestamp: Date.now() });
    }
    
    setStatus(message, type) {
        this.statusText.textContent = message;
        this.statusDiv.className = `status ${type} show`;
    }
    
    hideStatus() {
        this.statusDiv.classList.remove('show');
    }
    
    async loadChatHistory() {
        try {
            const result = await chrome.storage.local.get(['chatHistory']);
            const history = result.chatHistory || [];
            
            // Son 10 konuşmayı göster
            const recentHistory = history.slice(-10);
            
            if (recentHistory.length > 0) {
                // Hoş geldin mesajını gizle
                const welcomeMessage = document.querySelector('.welcome-message');
                if (welcomeMessage) {
                    welcomeMessage.style.display = 'none';
                }
                
                recentHistory.forEach(item => {
                    this.addMessage(item.command, 'user');
                    this.addMessage(item.summary || '✅ Görev tamamlandı', 'ai');
                });
            }
        } catch (error) {
            console.error('Chat history load error:', error);
        }
    }
    
    async saveChatHistory(command, result) {
        try {
            const historyItem = {
                timestamp: Date.now(),
                command: command,
                result: result,
                summary: this.createSummary(result)
            };
            
            const storage = await chrome.storage.local.get(['chatHistory']);
            const history = storage.chatHistory || [];
            history.push(historyItem);
            
            // Son 50 öğeyi tut
            if (history.length > 50) {
                history.splice(0, history.length - 50);
            }
            
            await chrome.storage.local.set({ chatHistory: history });
        } catch (error) {
            console.error('Chat history save error:', error);
        }
    }
    
    createSummary(result) {
        if (result.success) {
            let summary = '✅ ';
            if (result.task_plan?.task_type) {
                summary += result.task_plan.task_type + ' tamamlandı';
            } else {
                summary += 'Görev başarıyla tamamlandı';
            }
            
            if (result.page_title) {
                summary += ` - ${result.page_title}`;
            }
            
            return summary;
        } else {
            return `❌ Görev başarısız: ${result.error || 'Bilinmeyen hata'}`;
        }
    }
    
    openSettings() {
        chrome.tabs.create({ 
            url: chrome.runtime.getURL("settings.html") 
        });
    }
    
    async showHistory() {
        try {
            const result = await chrome.storage.local.get(['chatHistory']);
            const history = result.chatHistory || [];
            
            if (history.length === 0) {
                alert('📝 Henüz geçmiş bulunmuyor.');
                return;
            }
            
            let historyText = '📋 Son Komutlar:\\n\\n';
            history.slice(-15).reverse().forEach((item, index) => {
                const date = new Date(item.timestamp).toLocaleString('tr-TR');
                historyText += `${index + 1}. ${date}\\n`;
                historyText += `📝 Komut: ${item.command}\\n`;
                historyText += `📊 Sonuç: ${item.summary}\\n\\n`;
            });
            
            // Yeni pencerede göster
            const newWindow = window.open('', '_blank', 'width=600,height=400');
            newWindow.document.write(`
                <html>
                <head>
                    <title>Görev Geçmişi</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
                        .history-item { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                        .date { color: #666; font-size: 12px; }
                        .command { font-weight: bold; margin: 5px 0; }
                        .result { color: #333; }
                    </style>
                </head>
                <body>
                    <h2>🎯 Opera AI Agent - Görev Geçmişi</h2>
                    <pre style="white-space: pre-wrap;">${historyText}</pre>
                </body>
                </html>
            `);
        } catch (error) {
            console.error('History show error:', error);
            alert('❌ Geçmiş yüklenirken hata oluştu.');
        }
    }
    
    showHelp() {
        const helpText = `
🎯 Opera AI Agent Yardım

Bu AI asistan size web üzerinde çeşitli görevlerde yardımcı olabilir:

📝 Desteklenen Görev Türleri:
• Arama işlemleri (Google, Bing vb.)
• E-ticaret siteleri (Hepsiburada, Trendyol vb.)
• İlan siteleri (Sahibinden.com vb.)
• Haber ve bilgi toplama
• Sayfa analizi ve veri çıkarma
• Sosyal medya (temel işlemler)

💡 Kullanım İpuçları:
• Komutlarınızı açık ve net yazın
• Site adını belirtin (örn: "Google'da ara")
• Spesifik kriterler verin (konum, fiyat aralığı vb.)
• Detaylı komutlar daha iyi sonuç verir

🚀 Örnek Komutlar:
• "Sahibinden.com'da İstanbul'da kiralık daire ara"
• "Hepsiburada'da iPhone 15 ara ve fiyatları karşılaştır"
• "Google'da Python öğrenme kaynaklarını ara"
• "Bu sayfadaki tüm önemli bilgileri analiz et"

⚠️ Sınırlamalar:
• Kişisel bilgi gerektiren işlemler yapılamaz
• Ödeme işlemleri desteklenmez
• Bazı siteler bot koruması kullanabilir

🔧 Sorun Giderme:
• Backend servisinin çalıştığından emin olun
• Gemini API anahtarının doğru olduğunu kontrol edin
• Tarayıcı konsolunu kontrol edin

⌨️ Klavye Kısayolları:
• Enter: Komutu gönder
• Shift+Enter: Yeni satır
        `;
        
        alert(helpText);
    }
}

// Sidebar yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
    new OperaAISidebar();
});

console.log('🚀 Opera AI Agent Sidebar başlatıldı');

