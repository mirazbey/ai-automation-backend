// Fırsat Avcısı - Content Script

// Sayfa yüklendiğinde çalışır
console.log('🎯 Fırsat Avcısı content script yüklendi:', window.location.href);

// Background script'ten gelen mesajları dinle
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    if (request.action === 'pageLoaded') {
        console.log('📄 Sayfa yüklendi:', request.url);
        sendResponse({ success: true });
    }
    
    if (request.action === 'analyzePage') {
        // Sayfa analizi yap
        const pageInfo = {
            url: window.location.href,
            title: document.title,
            content: document.body.innerText.substring(0, 1000), // İlk 1000 karakter
            links: Array.from(document.links).slice(0, 10).map(link => ({
                text: link.textContent.trim(),
                href: link.href
            })),
            images: Array.from(document.images).slice(0, 5).map(img => ({
                src: img.src,
                alt: img.alt
            })),
            forms: Array.from(document.forms).length,
            timestamp: new Date().toISOString()
        };
        
        sendResponse({ success: true, pageInfo });
    }
    
    if (request.action === 'analyzeElement') {
        // Belirli bir elementi analiz et
        const element = document.elementFromPoint(request.elementInfo.x, request.elementInfo.y);
        if (element) {
            const elementInfo = {
                tagName: element.tagName,
                className: element.className,
                id: element.id,
                text: element.textContent.trim().substring(0, 200),
                attributes: Array.from(element.attributes).map(attr => ({
                    name: attr.name,
                    value: attr.value
                }))
            };
            sendResponse({ success: true, elementInfo });
        } else {
            sendResponse({ success: false, error: 'Element bulunamadı' });
        }
    }
    
    if (request.action === 'highlightElement') {
        // Elementi vurgula
        const selector = request.selector;
        const element = document.querySelector(selector);
        if (element) {
            element.style.outline = '3px solid #ff0000';
            element.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
            
            setTimeout(() => {
                element.style.outline = '';
                element.style.backgroundColor = '';
            }, 3000);
            
            sendResponse({ success: true });
        } else {
            sendResponse({ success: false, error: 'Element bulunamadı' });
        }
    }
    
    if (request.action === 'getPageData') {
        // Sayfa verilerini topla
        const data = {
            url: window.location.href,
            title: document.title,
            meta: {
                description: document.querySelector('meta[name="description"]')?.content || '',
                keywords: document.querySelector('meta[name="keywords"]')?.content || '',
                author: document.querySelector('meta[name="author"]')?.content || ''
            },
            headings: {
                h1: Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim()),
                h2: Array.from(document.querySelectorAll('h2')).map(h => h.textContent.trim()),
                h3: Array.from(document.querySelectorAll('h3')).map(h => h.textContent.trim())
            },
            links: Array.from(document.links).map(link => ({
                text: link.textContent.trim(),
                href: link.href,
                target: link.target
            })),
            images: Array.from(document.images).map(img => ({
                src: img.src,
                alt: img.alt,
                width: img.width,
                height: img.height
            })),
            forms: Array.from(document.forms).map(form => ({
                action: form.action,
                method: form.method,
                inputs: Array.from(form.elements).map(input => ({
                    type: input.type,
                    name: input.name,
                    placeholder: input.placeholder
                }))
            })),
            tables: Array.from(document.tables).map(table => ({
                rows: table.rows.length,
                columns: table.rows[0]?.cells.length || 0
            })),
            scripts: Array.from(document.scripts).length,
            stylesheets: Array.from(document.styleSheets).length
        };
        
        sendResponse({ success: true, data });
    }
    
    return true; // Asenkron yanıt için
});

// Sayfa değişikliklerini izle
const observer = new MutationObserver((mutations) => {
    // DOM değişikliklerini izle (gelecekte kullanılabilir)
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false
});

// Sayfa kapatılırken
window.addEventListener('beforeunload', () => {
    observer.disconnect();
});

// Klavye kısayolları
document.addEventListener('keydown', (event) => {
    // Ctrl+Shift+A: Sayfa analizi
    if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        chrome.runtime.sendMessage({ action: 'openPopup' });
    }
    
    // Ctrl+Shift+Q: Hızlı otomasyon
    if (event.ctrlKey && event.shiftKey && event.key === 'Q') {
        event.preventDefault();
        chrome.runtime.sendMessage({ action: 'quickAutomation' });
    }
});

// Sağ tık menüsü için element bilgisi
let lastClickedElement = null;

document.addEventListener('contextmenu', (event) => {
    lastClickedElement = event.target;
});

// Scroll pozisyonunu takip et
let scrollPosition = 0;
window.addEventListener('scroll', () => {
    scrollPosition = window.pageYOffset;
});

// Sayfa bilgilerini otomatik topla
function collectPageInfo() {
    return {
        url: window.location.href,
        title: document.title,
        scrollPosition: scrollPosition,
        viewportSize: {
            width: window.innerWidth,
            height: window.innerHeight
        },
        documentSize: {
            width: document.documentElement.scrollWidth,
            height: document.documentElement.scrollHeight
        },
        loadTime: performance.now(),
        userAgent: navigator.userAgent,
        language: navigator.language,
        timestamp: new Date().toISOString()
    };
}

// Sayfa yüklendiğinde bilgileri topla
window.addEventListener('load', () => {
    const pageInfo = collectPageInfo();
    console.log('📊 Sayfa bilgileri toplandı:', pageInfo);
});

// Global fonksiyonlar (test için)
window.firsat_avcisi = {
    getPageInfo: collectPageInfo,
    highlightElement: (selector) => {
        const element = document.querySelector(selector);
        if (element) {
            element.style.outline = '3px solid #00ff00';
            element.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
            setTimeout(() => {
                element.style.outline = '';
                element.style.backgroundColor = '';
            }, 3000);
            return true;
        }
        return false;
    },
    version: '1.0.0'
};

console.log('🎯 Fırsat Avcısı content script hazır!');

