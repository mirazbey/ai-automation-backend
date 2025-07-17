// Content Script - Web sayfalarına enjekte edilir
class AutomationContentScript {
    constructor() {
        this.isInitialized = false;
        this.automationOverlay = null;
        this.init();
    }
    
    init() {
        if (this.isInitialized) return;
        
        // Sayfa yüklendikten sonra başlat
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
        
        this.isInitialized = true;
    }
    
    setup() {
        this.createAutomationOverlay();
        this.setupMessageListener();
        this.detectPageType();
        this.addKeyboardShortcuts();
    }
    
    createAutomationOverlay() {
        // Floating action button oluştur
        const fab = document.createElement('div');
        fab.id = 'firsat-avcisi-fab';
        fab.innerHTML = '🎯';
        fab.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            cursor: pointer;
            z-index: 10000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
            opacity: 0.8;
        `;
        
        fab.addEventListener('mouseenter', () => {
            fab.style.transform = 'scale(1.1)';
            fab.style.opacity = '1';
        });
        
        fab.addEventListener('mouseleave', () => {
            fab.style.transform = 'scale(1)';
            fab.style.opacity = '0.8';
        });
        
        fab.addEventListener('click', () => this.toggleQuickActions());
        
        document.body.appendChild(fab);
        
        // Quick actions menüsü
        this.createQuickActionsMenu();
    }
    
    createQuickActionsMenu() {
        const menu = document.createElement('div');
        menu.id = 'firsat-avcisi-quick-menu';
        menu.style.cssText = `
            position: fixed;
            bottom: 90px;
            right: 20px;
            background: white;
            border-radius: 15px;
            padding: 15px;
            box-shadow: 0 8px 30px rgba(0,0,0,0.2);
            z-index: 10001;
            display: none;
            min-width: 250px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;
        
        const currentDomain = window.location.hostname;
        let quickActions = this.getQuickActionsForSite(currentDomain);
        
        menu.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 10px; color: #333;">
                🎯 Hızlı İşlemler
            </div>
            ${quickActions.map(action => `
                <div class="quick-action" data-action="${action.command}" style="
                    padding: 8px 12px;
                    margin: 5px 0;
                    background: #f5f5f5;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: background 0.3s;
                    font-size: 14px;
                ">
                    ${action.icon} ${action.label}
                </div>
            `).join('')}
            <div style="border-top: 1px solid #eee; margin: 10px 0; padding-top: 10px;">
                <input type="text" id="custom-command" placeholder="Özel komut yazın..." style="
                    width: 100%;
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    font-size: 14px;
                    margin-bottom: 8px;
                ">
                <button id="execute-custom" style="
                    width: 100%;
                    padding: 8px;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                ">Çalıştır</button>
            </div>
        `;
        
        // Event listeners
        menu.querySelectorAll('.quick-action').forEach(action => {
            action.addEventListener('mouseenter', (e) => {
                e.target.style.background = '#e0e0e0';
            });
            action.addEventListener('mouseleave', (e) => {
                e.target.style.background = '#f5f5f5';
            });
            action.addEventListener('click', (e) => {
                const command = e.target.getAttribute('data-action');
                this.executeCommand(command);
                this.hideQuickActions();
            });
        });
        
        menu.querySelector('#execute-custom').addEventListener('click', () => {
            const command = menu.querySelector('#custom-command').value.trim();
            if (command) {
                this.executeCommand(command);
                this.hideQuickActions();
            }
        });
        
        menu.querySelector('#custom-command').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                menu.querySelector('#execute-custom').click();
            }
        });
        
        document.body.appendChild(menu);
        this.quickActionsMenu = menu;
    }
    
    getQuickActionsForSite(domain) {
        const commonActions = [
            { icon: '🔍', label: 'Bu sayfada ara', command: `Bu sayfada "${window.location.href}" arama yap` },
            { icon: '📋', label: 'Sayfa bilgilerini topla', command: `Bu sayfadaki "${window.location.href}" tüm önemli bilgileri topla` }
        ];
        
        if (domain.includes('google.com')) {
            return [
                { icon: '🔍', label: 'Python tutorial ara', command: 'Google\'da Python tutorial ara' },
                { icon: '📚', label: 'JavaScript öğrenme kaynakları', command: 'Google\'da JavaScript öğrenme kaynakları ara' },
                { icon: '💼', label: 'İş ilanları ara', command: 'Google\'da yazılım geliştirici iş ilanları ara' },
                ...commonActions
            ];
        } else if (domain.includes('sahibinden.com')) {
            return [
                { icon: '🏠', label: 'Kiralık daire ara', command: 'Sahibinden.com\'da İstanbul\'da kiralık daire ara' },
                { icon: '🚗', label: 'Araba ara', command: 'Sahibinden.com\'da 2020 model üstü araba ara' },
                { icon: '📱', label: 'Telefon ara', command: 'Sahibinden.com\'da iPhone ara' },
                ...commonActions
            ];
        } else if (domain.includes('hepsiburada.com')) {
            return [
                { icon: '📱', label: 'Telefon ara', command: 'Hepsiburada\'da iPhone 15 ara' },
                { icon: '💻', label: 'Laptop ara', command: 'Hepsiburada\'da laptop ara ve fiyatları karşılaştır' },
                { icon: '🎮', label: 'Oyun ara', command: 'Hepsiburada\'da PlayStation oyunları ara' },
                ...commonActions
            ];
        } else if (domain.includes('trendyol.com')) {
            return [
                { icon: '👕', label: 'Giyim ara', command: 'Trendyol\'da erkek gömlek ara' },
                { icon: '👟', label: 'Ayakkabı ara', command: 'Trendyol\'da spor ayakkabı ara' },
                { icon: '🏠', label: 'Ev dekorasyonu', command: 'Trendyol\'da ev dekorasyon ürünleri ara' },
                ...commonActions
            ];
        }
        
        return commonActions;
    }
    
    toggleQuickActions() {
        if (this.quickActionsMenu.style.display === 'none') {
            this.showQuickActions();
        } else {
            this.hideQuickActions();
        }
    }
    
    showQuickActions() {
        this.quickActionsMenu.style.display = 'block';
        this.quickActionsMenu.style.animation = 'fadeInUp 0.3s ease';
        
        // Dışarı tıklandığında kapat
        setTimeout(() => {
            document.addEventListener('click', this.handleOutsideClick.bind(this));
        }, 100);
    }
    
    hideQuickActions() {
        this.quickActionsMenu.style.display = 'none';
        document.removeEventListener('click', this.handleOutsideClick.bind(this));
    }
    
    handleOutsideClick(e) {
        if (!this.quickActionsMenu.contains(e.target) && 
            !document.getElementById('firsat-avcisi-fab').contains(e.target)) {
            this.hideQuickActions();
        }
    }
    
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.type) {
                case 'HIGHLIGHT_ELEMENTS':
                    this.highlightElements(message.selector);
                    break;
                case 'CLICK_ELEMENT':
                    this.clickElement(message.selector);
                    break;
                case 'TYPE_TEXT':
                    this.typeText(message.selector, message.text);
                    break;
                case 'SCRAPE_DATA':
                    const data = this.scrapeData(message.selector);
                    sendResponse(data);
                    break;
                case 'GET_PAGE_INFO':
                    const pageInfo = this.getPageInfo();
                    sendResponse(pageInfo);
                    break;
            }
        });
    }
    
    detectPageType() {
        const domain = window.location.hostname;
        const pageType = this.identifyPageType(domain);
        
        // Background script'e sayfa tipini bildir
        chrome.runtime.sendMessage({
            type: 'PAGE_DETECTED',
            domain: domain,
            pageType: pageType,
            url: window.location.href,
            title: document.title
        });
    }
    
    identifyPageType(domain) {
        if (domain.includes('google.com')) return 'search_engine';
        if (domain.includes('sahibinden.com')) return 'classified_ads';
        if (domain.includes('hepsiburada.com') || domain.includes('trendyol.com')) return 'ecommerce';
        if (domain.includes('youtube.com')) return 'video_platform';
        if (domain.includes('linkedin.com')) return 'social_professional';
        if (domain.includes('facebook.com') || domain.includes('twitter.com')) return 'social_media';
        return 'general';
    }
    
    addKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl + Shift + A: Hızlı işlemler menüsünü aç
            if (e.ctrlKey && e.shiftKey && e.key === 'A') {
                e.preventDefault();
                this.toggleQuickActions();
            }
            
            // Ctrl + Shift + S: Sayfa bilgilerini topla
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                this.executeCommand('Bu sayfadaki tüm önemli bilgileri topla ve özetle');
            }
        });
    }
    
    async executeCommand(command) {
        try {
            // Loading indicator göster
            this.showLoadingIndicator();
            
            // Background script'e komutu gönder
            const response = await chrome.runtime.sendMessage({
                type: 'EXECUTE_AUTOMATION',
                command: command
            });
            
            if (response.success) {
                this.showSuccessNotification('Görev başarıyla tamamlandı!');
            } else {
                this.showErrorNotification(`Hata: ${response.error}`);
            }
        } catch (error) {
            console.error('Command execution error:', error);
            this.showErrorNotification('Komut çalıştırılırken hata oluştu');
        } finally {
            this.hideLoadingIndicator();
        }
    }
    
    showLoadingIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'firsat-avcisi-loading';
        indicator.innerHTML = '🎯 İşleniyor...';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            z-index: 10002;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 14px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            animation: pulse 1.5s infinite;
        `;
        
        document.body.appendChild(indicator);
    }
    
    hideLoadingIndicator() {
        const indicator = document.getElementById('firsat-avcisi-loading');
        if (indicator) {
            indicator.remove();
        }
    }
    
    showSuccessNotification(message) {
        this.showNotification(message, '#4CAF50');
    }
    
    showErrorNotification(message) {
        this.showNotification(message, '#f44336');
    }
    
    showNotification(message, color) {
        const notification = document.createElement('div');
        notification.innerHTML = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${color};
            color: white;
            padding: 15px 25px;
            border-radius: 25px;
            z-index: 10002;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 14px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            max-width: 300px;
        `;
        
        document.body.appendChild(notification);
        
        // 3 saniye sonra kaldır
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    highlightElements(selector) {
        // Önceki highlight'ları temizle
        document.querySelectorAll('.firsat-avcisi-highlight').forEach(el => {
            el.classList.remove('firsat-avcisi-highlight');
        });
        
        // Yeni elementleri highlight et
        document.querySelectorAll(selector).forEach(el => {
            el.classList.add('firsat-avcisi-highlight');
            el.style.outline = '3px solid #4CAF50';
            el.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
        });
    }
    
    clickElement(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.click();
            return true;
        }
        return false;
    }
    
    typeText(selector, text) {
        const element = document.querySelector(selector);
        if (element) {
            element.focus();
            element.value = text;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
        }
        return false;
    }
    
    scrapeData(selector) {
        const elements = document.querySelectorAll(selector);
        const data = [];
        
        elements.forEach(el => {
            data.push({
                text: el.textContent.trim(),
                html: el.innerHTML,
                href: el.href || null,
                src: el.src || null,
                className: el.className,
                id: el.id
            });
        });
        
        return data;
    }
    
    getPageInfo() {
        return {
            title: document.title,
            url: window.location.href,
            domain: window.location.hostname,
            description: document.querySelector('meta[name="description"]')?.content || '',
            keywords: document.querySelector('meta[name="keywords"]')?.content || '',
            images: Array.from(document.querySelectorAll('img')).slice(0, 10).map(img => ({
                src: img.src,
                alt: img.alt
            })),
            links: Array.from(document.querySelectorAll('a')).slice(0, 20).map(link => ({
                href: link.href,
                text: link.textContent.trim()
            }))
        };
    }
}

// CSS animasyonları ekle
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

// Content script'i başlat
new AutomationContentScript();

