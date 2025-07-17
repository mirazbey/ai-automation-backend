// Fırsat Avcısı - Background Script

// Extension yüklendiğinde
chrome.runtime.onInstalled.addListener((details) => {
    console.log('🎯 Fırsat Avcısı eklentisi yüklendi!');
    
    if (details.reason === 'install') {
        // İlk kurulumda hoş geldin mesajı
        chrome.tabs.create({
            url: 'chrome://extensions/'
        });
    }
});

// Tab güncellendiğinde
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        // Sayfa yüklendiğinde content script'e bilgi gönder
        chrome.tabs.sendMessage(tabId, {
            action: 'pageLoaded',
            url: tab.url,
            title: tab.title
        }).catch(() => {
            // Hata durumunda sessizce devam et
        });
    }
});

// Popup'tan gelen mesajları dinle
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getCurrentTab') {
        // Aktif tab bilgisini döndür
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
                sendResponse({
                    url: tabs[0].url,
                    title: tabs[0].title,
                    id: tabs[0].id
                });
            }
        });
        return true; // Asenkron yanıt için
    }
    
    if (request.action === 'executeScript') {
        // Content script çalıştır
        chrome.scripting.executeScript({
            target: { tabId: request.tabId },
            function: request.function,
            args: request.args || []
        }).then((results) => {
            sendResponse({ success: true, results });
        }).catch((error) => {
            sendResponse({ success: false, error: error.message });
        });
        return true;
    }
    
    if (request.action === 'checkHealth') {
        // Backend sağlık kontrolü
        fetch('http://localhost:5000/api/automation/health')
            .then(response => response.json())
            .then(data => {
                sendResponse({ success: true, data });
            })
            .catch(error => {
                sendResponse({ success: false, error: error.message });
            });
        return true;
    }
});

// Alarm'lar için (gelecekte kullanılabilir)
chrome.alarms.onAlarm.addListener((alarm) => {
    console.log('Alarm tetiklendi:', alarm.name);
});

// Context menu oluştur (sağ tık menüsü)
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'analyzeElement',
        title: '🎯 Bu Elementi Analiz Et',
        contexts: ['all']
    });
    
    chrome.contextMenus.create({
        id: 'quickAutomation',
        title: '🤖 Hızlı Otomasyon',
        contexts: ['page']
    });
});

// Context menu tıklandığında
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'analyzeElement') {
        // Element analizi başlat
        chrome.tabs.sendMessage(tab.id, {
            action: 'analyzeElement',
            elementInfo: info
        });
    }
    
    if (info.menuItemId === 'quickAutomation') {
        // Hızlı otomasyon başlat
        chrome.action.openPopup();
    }
});

// Keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
    if (command === 'open-popup') {
        chrome.action.openPopup();
    }
    
    if (command === 'analyze-page') {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'analyzePage'
            });
        });
    }
});

// Storage değişikliklerini dinle
chrome.storage.onChanged.addListener((changes, namespace) => {
    console.log('Storage değişikliği:', changes, namespace);
});

// Error handling
chrome.runtime.onSuspend.addListener(() => {
    console.log('🎯 Fırsat Avcısı eklentisi askıya alınıyor...');
});

console.log('🎯 Fırsat Avcısı background script yüklendi!');

