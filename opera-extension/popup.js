// Geliştirilmiş Popup JavaScript - Opera AI Agent
class OperaAIPopup {
    constructor() {
        this.statusDiv = document.getElementById("status");
        this.statusText = document.getElementById("statusText");
        this.isBackendHealthy = false;
        
        this.initializeEventListeners();
        this.checkBackendHealth();
        this.loadRecentTasks();
    }
    
    initializeEventListeners() {
        // Ana işlem butonları
        document.getElementById("openSidebar")?.addEventListener("click", () => {
            this.openSidebar();
        });
        
        document.getElementById("currentPageAnalyze")?.addEventListener("click", () => {
            this.analyzeCurrentPage();
        });
        
        document.getElementById("quickSearch")?.addEventListener("click", () => {
            this.quickSearch();
        });
        
        document.getElementById("automate")?.addEventListener("click", () => {
            this.startAutomation();
        });
        
        // Hızlı görev butonları
        document.getElementById("quickTaskShopping")?.addEventListener("click", () => {
            this.executeQuickTask("Popüler e-ticaret sitelerinde en çok satan ürünleri ara ve karşılaştır");
        });
        
        document.getElementById("quickTaskNews")?.addEventListener("click", () => {
            this.executeQuickTask("Güncel teknoloji haberlerini topla ve özetle");
        });
        
        document.getElementById("quickTaskWeather")?.addEventListener("click", () => {
            this.executeQuickTask("İstanbul'un hava durumunu kontrol et");
        });
        
        // Footer butonları
        document.getElementById("settings")?.addEventListener("click", () => {
            this.openSettings();
        });
        
        document.getElementById("history")?.addEventListener("click", () => {
            this.showHistory();
        });
        
        document.getElementById("help")?.addEventListener("click", () => {
            this.showHelp();
        });
        
        document.getElementById("about")?.addEventListener("click", () => {
            this.showAbout();
        });
        
        // Yenile butonu
        document.getElementById("refreshStatus")?.addEventListener("click", () => {
            this.checkBackendHealth();
        });
    }
    
    async checkBackendHealth() {
        try {
            this.setStatus("🔍 Sistem durumu kontrol ediliyor...", "loading");
            
            const response = await chrome.runtime.sendMessage({
                type: "HEALTH_CHECK"
            });
            
            if (response && response.healthy) {
                this.isBackendHealthy = true;
                this.setStatus("✅ Sistem Hazır", "healthy");
                this.enableButtons();
            } else {
                this.isBackendHealthy = false;
                this.setStatus("❌ Backend Bağlantısı Yok", "error");
                this.disableButtons();
            }
        } catch (error) {
            this.isBackendHealthy = false;
            this.setStatus("❌ Bağlantı Hatası: " + error.message, "error");
            this.disableButtons();
        }
    }
    
    setStatus(message, type) {
        if (this.statusText) {
            this.statusText.textContent = message;
        }
        if (this.statusDiv) {
            this.statusDiv.className = `status ${type}`;
        }
    }
    
    enableButtons() {
        const buttons = document.querySelectorAll('button:not(#refreshStatus)');
        buttons.forEach(button => {
            button.disabled = false;
            button.classList.remove('disabled');
        });
    }
    
    disableButtons() {
        const buttons = document.querySelectorAll('button:not(#refreshStatus)');
        buttons.forEach(button => {
            button.disabled = true;
            button.classList.add('disabled');
        });
    }
    
    openSidebar() {
        try {
            // Opera'da sidebar açma
            if (chrome.sidePanel && chrome.sidePanel.open) {
                chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT })
                    .then(() => {
                        console.log('✅ Sidebar açıldı');
                        window.close();
                    })
                    .catch((error) => {
                        console.log('⚠️ Sidebar açılamadı, yeni sekme açılıyor:', error);
                        // Fallback: Yeni sekme aç
                        chrome.tabs.create({ url: chrome.runtime.getURL("sidebar.html") });
                        window.close();
                    });
            } else {
                // Opera sidebar_action kullan
                chrome.tabs.create({ url: chrome.runtime.getURL("sidebar.html") });
                window.close();
            }
        } catch (error) {
            console.error('❌ Sidebar açma hatası:', error);
            this.setStatus("❌ Sidebar açılamadı", "error");
        }
    }
    
    async analyzeCurrentPage() {
        if (!this.isBackendHealthy) {
            this.setStatus("❌ Backend bağlantısı yok", "error");
            return;
        }
        
        try {
            this.setStatus("📊 Sayfa analiz ediliyor...", "loading");
            
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            const response = await chrome.runtime.sendMessage({
                type: "ANALYZE_CURRENT_PAGE",
                tabId: tab.id
            });
            
            if (response && response.success) {
                this.setStatus("✅ Sayfa analizi tamamlandı", "healthy");
                this.showAnalysisResult(response.analysis);
            } else {
                this.setStatus(`❌ Analiz başarısız: ${response?.error || "Bilinmeyen hata"}`, "error");
            }
        } catch (error) {
            this.setStatus(`❌ Hata: ${error.message}`, "error");
        }
    }
    
    quickSearch() {
        const searchTerm = prompt("🔍 Aranacak terimi girin:\\n\\nÖrnekler:\\n• iPhone 15 fiyatları\\n• İstanbul hava durumu\\n• Python öğrenme kaynakları");
        
        if (searchTerm && searchTerm.trim()) {
            this.executeQuickTask(`Google'da "${searchTerm.trim()}" ara ve sonuçları analiz et`);
        }
    }
    
    startAutomation() {
        const command = prompt(`🤖 Hangi görevi yapmamı istiyorsunuz?\\n\\n📝 Örnekler:\\n• "Sahibinden.com'da İstanbul'da kiralık daire ara"\\n• "Hepsiburada'da iPhone 15 ara ve fiyatları karşılaştır"\\n• "Google'da Python tutorial ara ve en iyi kaynakları bul"\\n• "Teknoloji haberlerini topla ve özetle"\\n\\n💡 İpucu: Komutunuzu mümkün olduğunca detaylı yazın.`);
        
        if (command && command.trim()) {
            this.executeQuickTask(command.trim());
        }
    }
    
    async executeQuickTask(command) {
        if (!this.isBackendHealthy) {
            this.setStatus("❌ Backend bağlantısı yok", "error");
            return;
        }
        
        try {
            this.setStatus("🤖 Görev başlatılıyor...", "loading");
            
            const response = await chrome.runtime.sendMessage({
                type: "EXECUTE_AUTOMATION",
                command: command
            });
            
            if (response && response.success) {
                this.setStatus("✅ Görev tamamlandı", "healthy");
                this.addToRecentTasks(command, true);
                
                // Başarı bildirimi göster
                setTimeout(() => {
                    this.setStatus("✅ Sistem Hazır", "healthy");
                }, 3000);
            } else {
                this.setStatus(`❌ Görev başarısız: ${response?.error || "Bilinmeyen hata"}`, "error");
                this.addToRecentTasks(command, false);
            }
        } catch (error) {
            this.setStatus(`❌ Hata: ${error.message}`, "error");
            this.addToRecentTasks(command, false);
        }
    }
    
    async loadRecentTasks() {
        try {
            const history = await chrome.runtime.sendMessage({
                type: "GET_TASK_HISTORY"
            });
            
            if (history && Array.isArray(history)) {
                this.displayRecentTasks(history.slice(-3)); // Son 3 görev
            }
        } catch (error) {
            console.error('❌ Görev geçmişi yükleme hatası:', error);
        }
    }
    
    displayRecentTasks(tasks) {
        const recentTasksDiv = document.getElementById("recentTasks");
        if (!recentTasksDiv || tasks.length === 0) return;
        
        recentTasksDiv.innerHTML = '<h4>Son Görevler:</h4>';
        
        tasks.reverse().forEach((task, index) => {
            const taskDiv = document.createElement('div');
            taskDiv.className = `recent-task ${task.status}`;
            taskDiv.innerHTML = `
                <div class="task-command">${task.command.substring(0, 50)}${task.command.length > 50 ? '...' : ''}</div>
                <div class="task-status">${this.getStatusIcon(task.status)} ${this.getStatusText(task.status)}</div>
            `;
            
            taskDiv.addEventListener('click', () => {
                if (confirm(`Bu görevi tekrar çalıştırmak istiyor musunuz?\\n\\n"${task.command}"`)) {
                    this.executeQuickTask(task.command);
                }
            });
            
            recentTasksDiv.appendChild(taskDiv);
        });
    }
    
    getStatusIcon(status) {
        switch (status) {
            case 'completed': return '✅';
            case 'failed': return '❌';
            case 'error': return '⚠️';
            case 'running': return '🔄';
            default: return '❓';
        }
    }
    
    getStatusText(status) {
        switch (status) {
            case 'completed': return 'Tamamlandı';
            case 'failed': return 'Başarısız';
            case 'error': return 'Hata';
            case 'running': return 'Çalışıyor';
            default: return 'Bilinmiyor';
        }
    }
    
    async addToRecentTasks(command, success) {
        // Bu fonksiyon background script tarafından otomatik olarak yapılıyor
        // Burada sadece UI'ı güncelleyebiliriz
        setTimeout(() => {
            this.loadRecentTasks();
        }, 1000);
    }
    
    showAnalysisResult(analysis) {
        if (analysis && analysis.summary) {
            alert(`📊 Sayfa Analizi Sonucu:\\n\\n${analysis.summary}\\n\\n💡 Detaylar için sidebar'ı açın.`);
        }
    }
    
    openSettings() {
        chrome.tabs.create({ 
            url: chrome.runtime.getURL("settings.html") 
        });
        window.close();
    }
    
    async showHistory() {
        try {
            const history = await chrome.runtime.sendMessage({
                type: "GET_TASK_HISTORY"
            });
            
            if (!history || history.length === 0) {
                alert('📝 Henüz görev geçmişi bulunmuyor.');
                return;
            }
            
            let historyText = '📋 Son Görevler:\\n\\n';
            history.slice(-10).reverse().forEach((task, index) => {
                const date = new Date(task.startTime).toLocaleString('tr-TR');
                const duration = task.endTime ? Math.round((task.endTime - task.startTime) / 1000) : 0;
                historyText += `${index + 1}. ${date}\\n`;
                historyText += `📝 Görev: ${task.command}\\n`;
                historyText += `${this.getStatusIcon(task.status)} Durum: ${this.getStatusText(task.status)}`;
                if (duration > 0) {
                    historyText += ` (${duration}s)`;
                }
                historyText += '\\n\\n';
            });
            
            alert(historyText);
        } catch (error) {
            console.error('❌ Geçmiş gösterme hatası:', error);
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

💡 Kullanım İpuçları:
• Komutlarınızı açık ve net yazın
• Site adını belirtin (örn: "Google'da ara")
• Spesifik kriterler verin (konum, fiyat aralığı vb.)
• Detaylı komutlar daha iyi sonuç verir

🚀 Hızlı Başlangıç:
• "Bu Sayfayı Analiz Et" - Mevcut sayfayı analiz eder
• "Hızlı Arama" - Google'da arama yapar
• "Otomasyon Başlat" - Özel görev tanımlar

⚠️ Sınırlamalar:
• Kişisel bilgi gerektiren işlemler yapılamaz
• Ödeme işlemleri desteklenmez
• Bazı siteler bot koruması kullanabilir

🔧 Sorun Giderme:
• Backend servisinin çalıştığından emin olun
• Gemini API anahtarının doğru olduğunu kontrol edin
• Tarayıcı konsolunu kontrol edin
• "Yenile" butonuna basarak durumu kontrol edin

⌨️ Klavye Kısayolları:
• Ctrl+Shift+A: Hızlı işlemler menüsü
• Ctrl+Shift+S: Sayfa analizi
• Ctrl+Shift+H: Geçmiş görüntüle
        `;
        
        alert(helpText);
    }
    
    showAbout() {
        const aboutText = `
🎯 Opera AI Agent v2.0.0

Gelişmiş AI destekli web otomasyonu eklentisi.

✨ Yeni Özellikler:
• Gelişmiş hata yönetimi
• Görev geçmişi takibi
• Otomatik sayfa analizi
• Context menu entegrasyonu
• Bildirim sistemi

🔧 Teknolojiler:
• Gemini AI (Google)
• Opera Extension API
• Flask Backend
• Multi-Agent Sistemi

🎨 Tasarım:
• Modern ve kullanıcı dostu arayüz
• Responsive tasarım
• Koyu/açık tema desteği
• Erişilebilirlik odaklı

📧 Destek:
Bu eklenti açık kaynak kodlu bir projedir.
Sorunlar ve öneriler için geliştirici ile iletişime geçin.

© 2024 Opera AI Agent
Manus AI tarafından geliştirilmiştir.
        `;
        
        alert(aboutText);
    }
}

// Popup yüklendiğinde başlat
document.addEventListener("DOMContentLoaded", () => {
    new OperaAIPopup();
});

// CSS stilleri dinamik olarak ekle
const style = document.createElement('style');
style.textContent = `
    .status {
        padding: 8px 12px;
        border-radius: 6px;
        margin: 10px 0;
        font-weight: 500;
        text-align: center;
    }
    
    .status.healthy {
        background-color: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    }
    
    .status.loading {
        background-color: #fff3cd;
        color: #856404;
        border: 1px solid #ffeaa7;
    }
    
    .status.error {
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    }
    
    button.disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .recent-task {
        padding: 8px;
        margin: 4px 0;
        border-radius: 4px;
        cursor: pointer;
        border-left: 3px solid #ccc;
    }
    
    .recent-task.completed {
        border-left-color: #28a745;
        background-color: #f8fff9;
    }
    
    .recent-task.failed {
        border-left-color: #dc3545;
        background-color: #fff8f8;
    }
    
    .recent-task:hover {
        background-color: #f0f0f0;
    }
    
    .task-command {
        font-weight: 500;
        margin-bottom: 2px;
    }
    
    .task-status {
        font-size: 0.8em;
        color: #666;
    }
`;
document.head.appendChild(style);

