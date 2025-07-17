// Popup JavaScript
class AutomationPopup {
    constructor() {
        this.statusDiv = document.getElementById("status");
        this.statusText = document.getElementById("statusText");
        
        this.initializeEventListeners();
        this.checkBackendHealth();
        // Her 5 saniyede bir sağlık kontrolü yap
        setInterval(() => this.checkBackendHealth(), 5000);
    }
    
    initializeEventListeners() {
        // Hızlı işlem butonları
        document.getElementById("openSidebar").addEventListener("click", () => {
            this.openSidebar();
        });
        
        document.getElementById("currentPageAnalyze").addEventListener("click", () => {
            this.analyzeCurrentPage();
        });
        
        document.getElementById("quickSearch").addEventListener("click", () => {
            this.quickSearch();
        });
        
        document.getElementById("automate").addEventListener("click", () => {
            this.startAutomation();
        });
        
        // Footer butonları
        document.getElementById("settings").addEventListener("click", () => {
            this.openSettings();
        });
        
        document.getElementById("help").addEventListener("click", () => {
            this.showHelp();
        });
        
        document.getElementById("about").addEventListener("click", () => {
            this.showAbout();
        });
    }
    
    async checkBackendHealth() {
        try {
            const response = await chrome.runtime.sendMessage({
                type: "HEALTH_CHECK"
            });
            
            if (response && response.healthy) {
                this.setStatus("✅ Sistem Hazır", "healthy");
            } else {
                this.setStatus("❌ Backend Bağlantısı Yok", "error");
            }
        } catch (error) {
            this.setStatus("❌ Bağlantı Hatası", "error");
        }
    }
    
    setStatus(message, type) {
        this.statusText.textContent = message;
        this.statusDiv.className = `status ${type}`;
    }
    
    openSidebar() {
        // Opera'da sidebar açma
        chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT })
            .catch(() => {
                // Fallback: Yeni sekme aç
                chrome.tabs.create({ url: chrome.runtime.getURL("sidebar.html") });
            });
        window.close();
    }
    
    async analyzeCurrentPage() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            const command = `Bu sayfadaki "${tab.url}" tüm önemli bilgileri topla ve analiz et`;
            
            const response = await chrome.runtime.sendMessage({
                type: "EXECUTE_AUTOMATION",
                command: command
            });
            
            if (response.success) {
                this.setStatus("✅ Sayfa Analizi Tamamlandı", "healthy");
            } else {
                this.setStatus(`❌ Analiz Başarısız: ${response.error || "Bilinmeyen hata"}`, "error");
            }
        } catch (error) {
            this.setStatus(`❌ Hata Oluştu: ${error.message}`, "error");
        }
        
        setTimeout(() => window.close(), 2000);
    }
    
    quickSearch() {
        const searchTerm = prompt("Aranacak terimi girin:");
        if (searchTerm) {
            const command = `Google'da "${searchTerm}" ara`;
            
            chrome.runtime.sendMessage({
                type: "EXECUTE_AUTOMATION",
                command: command
            });
            
            this.setStatus("🔍 Arama Başlatıldı", "healthy");
            setTimeout(() => window.close(), 1500);
        }
    }
    
    startAutomation() {
        const command = prompt("Hangi görevi yapmamı istiyorsunuz?\n\nÖrnekler:\n- \"Sahibinden.com\"da İstanbul\"da kiralık daire ara\"\n- \"Hepsiburada\"da iPhone 15 ara\"\n- \"Google\"da Python tutorial ara\"");
        
        if (command) {
            chrome.runtime.sendMessage({
                type: "EXECUTE_AUTOMATION",
                command: command
            });
            
            this.setStatus("🤖 Otomasyon Başlatıldı", "healthy");
            setTimeout(() => window.close(), 1500);
        }
    }
    
    openSettings() {
        chrome.tabs.create({ 
            url: chrome.runtime.getURL("settings.html") 
        });
        window.close();
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

⌨️ Klavye Kısayolları:
• Ctrl+Shift+A: Hızlı işlemler menüsü
• Ctrl+Shift+S: Sayfa analizi
        `;
        
        alert(helpText);
    }
    
    showAbout() {
        const aboutText = `
🎯 Fırsat Avcısı v1.0.0

Gemini AI ile desteklenen web otomasyonu eklentisi.

✨ Özellikler:
• Doğal dil komutları
• Akıllı web otomasyonu
• İnsan benzeri davranış
• CAPTCHA aşma yetenekleri
• Site-spesifik uzmanlar

🔧 Teknolojiler:
• Gemini AI
• Selenium WebDriver
• Flask Backend
• Opera Extension API

📧 Destek:
Bu eklenti açık kaynak kodlu bir projedir.
Sorunlar için geliştirici ile iletişime geçin.

© 2024 Fırsat Avcısı
        `;
        
        alert(aboutText);
    }
}

// Popup yüklendiğinde başlat
document.addEventListener("DOMContentLoaded", () => {
    new AutomationPopup();
});

