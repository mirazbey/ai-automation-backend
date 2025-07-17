// Sidebar JavaScript
const API_BASE_URL = 'http://localhost:5000/api/automation';

class AutomationSidebar {
    constructor() {
        this.chatContainer = document.getElementById('chatContainer');
        this.commandInput = document.getElementById('commandInput');
        this.sendButton = document.getElementById('sendButton');
        this.statusDiv = document.getElementById('status');
        
        this.initializeEventListeners();
        this.loadChatHistory();
    }
    
    initializeEventListeners() {
        // Gönder butonu
        this.sendButton.addEventListener('click', () => this.sendCommand());
        
        // Enter tuşu
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
        
        // Ayarlar butonları
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
        document.getElementById('historyBtn').addEventListener('click', () => this.showHistory());
        document.getElementById('helpBtn').addEventListener('click', () => this.showHelp());
    }
    
    async sendCommand() {
        const command = this.commandInput.value.trim();
        if (!command) return;
        
        // Kullanıcı mesajını ekle
        this.addMessage(command, 'user');
        this.commandInput.value = '';
        
        // Yükleme durumunu göster
        this.setStatus('AI komutu analiz ediyor...', 'loading');
        this.sendButton.disabled = true;
        
        try {
            // Backend'e istek gönder
            const response = await fetch(`${API_BASE_URL}/full-automation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ command })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Başarılı sonucu göster
                this.addMessage(this.formatSuccessResponse(data), 'ai');
                this.setStatus('Görev başarıyla tamamlandı!', 'success');
                
                // Geçmişe kaydet
                this.saveChatHistory(command, data);
                
                // Sonuçları background script'e gönder
                chrome.runtime.sendMessage({
                    type: 'AUTOMATION_RESULT',
                    data: data
                });
                
            } else {
                // Hata durumu
                this.addMessage(`❌ Hata: ${data.error}`, 'ai');
                this.setStatus('Görev tamamlanamadı', 'error');
            }
            
        } catch (error) {
            console.error('Automation error:', error);
            this.addMessage(`❌ Bağlantı hatası: ${error.message}`, 'ai');
            this.setStatus('Bağlantı hatası', 'error');
        } finally {
            this.sendButton.disabled = false;
            setTimeout(() => this.hideStatus(), 3000);
        }
    }
    
    formatSuccessResponse(data) {
        let response = `✅ **Görev Tamamlandı!**\n\n`;
        
        if (data.task_plan) {
            response += `🎯 **Analiz Edilen Görev:** ${data.task_plan.task_type}\n`;
            response += `🌐 **Hedef Site:** ${data.task_plan.target_site || 'Belirlendi'}\n\n`;
        }
        
        if (data.automation_results && data.automation_results.length > 0) {
            response += `📋 **Gerçekleştirilen İşlemler:**\n`;
            data.automation_results.forEach((result, index) => {
                response += `${index + 1}. ${result}\n`;
            });
            response += `\n`;
        }
        
        if (data.page_title) {
            response += `📄 **Son Sayfa:** ${data.page_title}\n`;
        }
        
        if (data.current_url) {
            response += `🔗 **URL:** ${data.current_url}\n`;
        }
        
        response += `\n💡 **İpucu:** Sonuçları daha detaylı görmek için geçmiş bölümünü kontrol edebilirsiniz.`;
        
        return response;
    }
    
    addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        // Markdown benzeri formatlamayı basit HTML'e çevir
        const formattedContent = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');
        
        messageDiv.innerHTML = formattedContent;
        
        this.chatContainer.appendChild(messageDiv);
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }
    
    setStatus(message, type) {
        this.statusDiv.textContent = message;
        this.statusDiv.className = `status ${type}`;
        this.statusDiv.style.display = 'block';
    }
    
    hideStatus() {
        this.statusDiv.style.display = 'none';
    }
    
    async loadChatHistory() {
        try {
            const result = await chrome.storage.local.get(['chatHistory']);
            const history = result.chatHistory || [];
            
            // Son 5 konuşmayı göster
            history.slice(-5).forEach(item => {
                this.addMessage(item.command, 'user');
                this.addMessage(item.summary || 'Görev tamamlandı', 'ai');
            });
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
                summary: `✅ ${result.task_plan?.task_type || 'Görev'} tamamlandı`
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
    
    openSettings() {
        // Ayarlar modalı açılabilir
        alert('Ayarlar özelliği yakında eklenecek!');
    }
    
    async showHistory() {
        try {
            const result = await chrome.storage.local.get(['chatHistory']);
            const history = result.chatHistory || [];
            
            if (history.length === 0) {
                alert('Henüz geçmiş bulunmuyor.');
                return;
            }
            
            let historyText = 'Son Komutlar:\n\n';
            history.slice(-10).reverse().forEach((item, index) => {
                const date = new Date(item.timestamp).toLocaleString('tr-TR');
                historyText += `${index + 1}. ${date}\n`;
                historyText += `Komut: ${item.command}\n`;
                historyText += `Sonuç: ${item.summary}\n\n`;
            });
            
            alert(historyText);
        } catch (error) {
            console.error('History show error:', error);
            alert('Geçmiş yüklenirken hata oluştu.');
        }
    }
    
    showHelp() {
        const helpText = `
🎯 Fırsat Avcısı Yardım

Bu AI asistan size web üzerinde çeşitli görevlerde yardımcı olabilir:

📝 Desteklenen Komut Türleri:
• Arama işlemleri (Google, Bing vb.)
• E-ticaret siteleri (Hepsiburada, Trendyol vb.)
• İlan siteleri (Sahibinden.com vb.)
• Sosyal medya (temel işlemler)

💡 İpuçları:
• Komutlarınızı açık ve net yazın
• Site adını belirtin (örn: "Google'da ara")
• Spesifik kriterler verin (konum, fiyat aralığı vb.)

⚠️ Sınırlamalar:
• Kişisel bilgi gerektiren işlemler yapılamaz
• Ödeme işlemleri desteklenmez
• Bazı siteler bot koruması kullanabilir

🔧 Sorun mu yaşıyorsunuz?
• Backend servisinin çalıştığından emin olun
• Gemini API anahtarının doğru olduğunu kontrol edin
• Tarayıcı konsolunu kontrol edin
        `;
        
        alert(helpText);
    }
}

// Sidebar yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
    new AutomationSidebar();
});

