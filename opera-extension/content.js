// Content Script - Opera AI Agent
// Bu script her web sayfasına enjekte edilir ve sayfa ile etkileşim sağlar

class OperaAIContentScript {
    constructor() {
        this.isInjected = false;
        this.highlightedElements = [];
        this.init();
    }
    
    init() {
        // Sayfa tamamen yüklendiğinde çalıştır
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.onPageReady());
        } else {
            this.onPageReady();
        }
        
        // Background script'ten mesajları dinle
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Async response için
        });
    }
    
    onPageReady() {
        this.isInjected = true;
        console.log('🎯 Opera AI Agent Content Script yüklendi:', window.location.href);
        
        // Sayfa bilgilerini background script'e gönder
        this.reportPageInfo();
        
        // Klavye kısayollarını dinle
        this.setupKeyboardShortcuts();
        
        // Sayfa değişikliklerini izle (SPA'lar için)
        this.observePageChanges();
    }
    
    handleMessage(message, sender, sendResponse) {
        try {
            switch (message.type) {
                case 'GET_PAGE_INFO':
                    sendResponse(this.getPageInfo());
                    break;
                    
                case 'EXTRACT_DATA':
                    const data = this.extractPageData(message.selectors);
                    sendResponse({ success: true, data: data });
                    break;
                    
                case 'HIGHLIGHT_ELEMENTS':
                    this.highlightElements(message.selectors);
                    sendResponse({ success: true });
                    break;
                    
                case 'REMOVE_HIGHLIGHTS':
                    this.removeHighlights();
                    sendResponse({ success: true });
                    break;
                    
                case 'CLICK_ELEMENT':
                    const clicked = this.clickElement(message.selector);
                    sendResponse({ success: clicked });
                    break;
                    
                case 'FILL_FORM':
                    const filled = this.fillForm(message.formData);
                    sendResponse({ success: filled });
                    break;
                    
                case 'SCROLL_TO':
                    this.scrollTo(message.position);
                    sendResponse({ success: true });
                    break;
                    
                case 'TAKE_SCREENSHOT':
                    // Bu işlem background script tarafından yapılır
                    sendResponse({ success: false, error: 'Screenshot content script\'te yapılamaz' });
                    break;
                    
                default:
                    sendResponse({ success: false, error: 'Bilinmeyen mesaj türü' });
            }
        } catch (error) {
            console.error('❌ Content script mesaj işleme hatası:', error);
            sendResponse({ success: false, error: error.message });
        }
    }
    
    getPageInfo() {
        return {
            url: window.location.href,
            title: document.title,
            domain: window.location.hostname,
            text: document.body.innerText.substring(0, 5000), // İlk 5000 karakter
            html: document.documentElement.outerHTML.substring(0, 10000), // İlk 10000 karakter
            links: this.extractLinks(),
            images: this.extractImages(),
            forms: this.extractForms(),
            buttons: this.extractButtons(),
            inputs: this.extractInputs(),
            metadata: this.extractMetadata(),
            timestamp: Date.now()
        };
    }
    
    extractLinks() {
        const links = Array.from(document.querySelectorAll('a[href]'));
        return links.slice(0, 50).map(link => ({
            text: link.textContent.trim().substring(0, 100),
            href: link.href,
            title: link.title || '',
            target: link.target || ''
        }));
    }
    
    extractImages() {
        const images = Array.from(document.querySelectorAll('img[src]'));
        return images.slice(0, 20).map(img => ({
            src: img.src,
            alt: img.alt || '',
            title: img.title || '',
            width: img.width || 0,
            height: img.height || 0
        }));
    }
    
    extractForms() {
        const forms = Array.from(document.querySelectorAll('form'));
        return forms.slice(0, 10).map((form, index) => ({
            id: form.id || `form_${index}`,
            action: form.action || '',
            method: form.method || 'GET',
            inputs: Array.from(form.querySelectorAll('input, select, textarea')).map(input => ({
                name: input.name || '',
                type: input.type || '',
                placeholder: input.placeholder || '',
                required: input.required || false
            }))
        }));
    }
    
    extractButtons() {
        const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]'));
        return buttons.slice(0, 30).map((button, index) => ({
            id: button.id || `button_${index}`,
            text: button.textContent?.trim() || button.value || '',
            type: button.type || '',
            className: button.className || ''
        }));
    }
    
    extractInputs() {
        const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
        return inputs.slice(0, 30).map((input, index) => ({
            id: input.id || `input_${index}`,
            name: input.name || '',
            type: input.type || '',
            placeholder: input.placeholder || '',
            value: input.value || '',
            required: input.required || false
        }));
    }
    
    extractMetadata() {
        const meta = {};
        
        // Meta tags
        document.querySelectorAll('meta').forEach(tag => {
            const name = tag.getAttribute('name') || tag.getAttribute('property');
            const content = tag.getAttribute('content');
            if (name && content) {
                meta[name] = content;
            }
        });
        
        // Title ve description
        meta.title = document.title;
        meta.description = document.querySelector('meta[name="description"]')?.content || '';
        
        return meta;
    }
    
    extractPageData(selectors = {}) {
        const data = {};
        
        // Varsayılan selectors
        const defaultSelectors = {
            prices: '[class*="price"], [class*="fiyat"], .price, .fiyat',
            titles: 'h1, h2, h3, [class*="title"], [class*="baslik"]',
            descriptions: '[class*="description"], [class*="aciklama"], p',
            products: '[class*="product"], [class*="urun"], .product-item',
            ...selectors
        };
        
        Object.keys(defaultSelectors).forEach(key => {
            const elements = document.querySelectorAll(defaultSelectors[key]);
            data[key] = Array.from(elements).slice(0, 20).map(el => ({
                text: el.textContent?.trim().substring(0, 200) || '',
                html: el.outerHTML.substring(0, 500),
                attributes: this.getElementAttributes(el)
            }));
        });
        
        return data;
    }
    
    getElementAttributes(element) {
        const attrs = {};
        Array.from(element.attributes).forEach(attr => {
            attrs[attr.name] = attr.value;
        });
        return attrs;
    }
    
    highlightElements(selectors) {
        this.removeHighlights(); // Önceki highlight'ları temizle
        
        if (typeof selectors === 'string') {
            selectors = [selectors];
        }
        
        selectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    element.style.outline = '3px solid #ff6b6b';
                    element.style.backgroundColor = 'rgba(255, 107, 107, 0.1)';
                    element.setAttribute('data-ai-highlighted', 'true');
                    this.highlightedElements.push(element);
                });
            } catch (error) {
                console.error('❌ Highlight hatası:', selector, error);
            }
        });
    }
    
    removeHighlights() {
        this.highlightedElements.forEach(element => {
            element.style.outline = '';
            element.style.backgroundColor = '';
            element.removeAttribute('data-ai-highlighted');
        });
        this.highlightedElements = [];
    }
    
    clickElement(selector) {
        try {
            const element = document.querySelector(selector);
            if (element) {
                // Scroll to element first
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Wait a bit then click
                setTimeout(() => {
                    element.click();
                }, 500);
                
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Element tıklama hatası:', error);
            return false;
        }
    }
    
    fillForm(formData) {
        try {
            let filled = 0;
            
            Object.keys(formData).forEach(key => {
                const value = formData[key];
                
                // Name, id veya placeholder ile input bul
                let input = document.querySelector(`input[name="${key}"]`) ||
                           document.querySelector(`#${key}`) ||
                           document.querySelector(`input[placeholder*="${key}"]`) ||
                           document.querySelector(`textarea[name="${key}"]`) ||
                           document.querySelector(`select[name="${key}"]`);
                
                if (input) {
                    if (input.type === 'checkbox' || input.type === 'radio') {
                        input.checked = Boolean(value);
                    } else {
                        input.value = value;
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    filled++;
                }
            });
            
            return filled > 0;
        } catch (error) {
            console.error('❌ Form doldurma hatası:', error);
            return false;
        }
    }
    
    scrollTo(position) {
        if (typeof position === 'number') {
            window.scrollTo({ top: position, behavior: 'smooth' });
        } else if (position === 'top') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (position === 'bottom') {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        } else if (typeof position === 'string') {
            // CSS selector olarak kullan
            const element = document.querySelector(position);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }
    
    reportPageInfo() {
        // Sayfa bilgilerini background script'e gönder
        chrome.runtime.sendMessage({
            type: 'PAGE_INFO_UPDATE',
            pageInfo: this.getPageInfo()
        }).catch(error => {
            // Background script henüz hazır değilse hata vermez
            console.log('Background script henüz hazır değil:', error.message);
        });
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Ctrl+Shift+A: Sayfa analizi
            if (event.ctrlKey && event.shiftKey && event.key === 'A') {
                event.preventDefault();
                chrome.runtime.sendMessage({ type: 'ANALYZE_CURRENT_PAGE' });
            }
            
            // Ctrl+Shift+S: Hızlı arama
            if (event.ctrlKey && event.shiftKey && event.key === 'S') {
                event.preventDefault();
                const searchTerm = prompt('🔍 Aranacak terimi girin:');
                if (searchTerm) {
                    chrome.runtime.sendMessage({ 
                        type: 'EXECUTE_AUTOMATION',
                        command: `Google'da "${searchTerm}" ara`
                    });
                }
            }
            
            // Ctrl+Shift+H: Geçmiş
            if (event.ctrlKey && event.shiftKey && event.key === 'H') {
                event.preventDefault();
                chrome.runtime.sendMessage({ type: 'SHOW_HISTORY' });
            }
        });
    }
    
    observePageChanges() {
        // SPA'larda sayfa değişikliklerini izle
        const observer = new MutationObserver((mutations) => {
            let significantChange = false;
            
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Yeni DOM elementleri eklendi
                    significantChange = true;
                }
            });
            
            if (significantChange) {
                // Debounce: 1 saniye bekle
                clearTimeout(this.reportTimeout);
                this.reportTimeout = setTimeout(() => {
                    this.reportPageInfo();
                }, 1000);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

// Content script'i başlat
const operaAIContentScript = new OperaAIContentScript();

console.log('🚀 Opera AI Agent Content Script başlatıldı');

