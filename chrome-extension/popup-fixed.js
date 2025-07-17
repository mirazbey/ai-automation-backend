// Fırsat Avcısı - Düzeltilmiş Popup Script
// API Base URL
const API_BASE = 'http://localhost:5000/api/automation';

// DOM elementleri
let statusDiv, statusText, openSidebarBtn, currentPageAnalyzeBtn, quickSearchBtn, automateBtn;

// DOM yüklendiğinde elementleri al
document.addEventListener('DOMContentLoaded', function() {
    statusDiv = document.getElementById('status');
    statusText = document.getElementById('statusText');
    openSidebarBtn = document.getElementById('openSidebar');
    currentPageAnalyzeBtn = document.getElementById('currentPageAnalyze');
    quickSearchBtn = document.getElementById('quickSearch');
    automateBtn = document.getElementById('automate');
    
    // Event listener'ları ekle
    setupEventListeners();
    
    // Sağlık kontrolü yap
    checkHealth();
    
    // Her 30 saniyede bir sağlık kontrolü
    setInterval(checkHealth, 30000);
    
    console.log('🎯 Fırsat Avcısı popup yüklendi!');
});

// Event listener'ları ayarla
function setupEventListeners() {
    if (openSidebarBtn) {
        openSidebarBtn.addEventListener('click', toggleSidebar);
    }
    
    if (currentPageAnalyzeBtn) {
        currentPageAnalyzeBtn.addEventListener('click', analyzePage);
    }
    
    if (quickSearchBtn) {
        quickSearchBtn.addEventListener('click', quickSearch);
    }
    
    if (automateBtn) {
        automateBtn.addEventListener('click', startCustomAutomation);
    }
    
    // Kontrol paneli butonları
    const controlPanel = document.getElementById('controlPanel');
    const openPanelBtn = document.getElementById('openSidebar');
    const closePanelBtn = document.getElementById('closePanel');
    const clearResultsBtn = document.getElementById('clearResults');
    const searchInput = document.getElementById('searchInput');
    
    if (openPanelBtn) {
        openPanelBtn.addEventListener('click', function() {
            if (controlPanel) {
                controlPanel.classList.add('active');
            }
            toggleSidebar();
        });
    }
    
    if (closePanelBtn) {
        closePanelBtn.addEventListener('click', function() {
            if (controlPanel) {
                controlPanel.classList.remove('active');
            }
        });
    }
    
    if (clearResultsBtn) {
        clearResultsBtn.addEventListener('click', function() {
            const resultsArea = document.getElementById('resultsArea');
            if (resultsArea) {
                resultsArea.innerHTML = '<div style="text-align: center; opacity: 0.6; margin-top: 30px;">Sonuçlar burada görünecek...</div>';
            }
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performPopupSearch();
            }
        });
    }
    
    // Ayarlar, yardım ve hakkında butonları
    const settingsBtn = document.getElementById('settings');
    const helpBtn = document.getElementById('help');
    const aboutBtn = document.getElementById('about');
    
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function() {
            addToPopupResults('⚙️ Ayarlar özelliği yakında eklenecek', 'info');
        });
    }
    
    if (helpBtn) {
        helpBtn.addEventListener('click', function() {
            addToPopupResults('❓ Yardım: Bu eklenti AI destekli web otomasyonu sağlar', 'info');
            addToPopupResults('🔍 "Bu Sayfayı Analiz Et" - Aktif sayfayı analiz eder', 'info');
            addToPopupResults('🔎 "Hızlı Arama" - Google\'da arama yapar ve siteleri analiz eder', 'info');
            addToPopupResults('🤖 "Otomasyon Başlat" - Özel komutlar çalıştırır', 'info');
        });
    }
    
    if (aboutBtn) {
        aboutBtn.addEventListener('click', function() {
            addToPopupResults('ℹ️ Fırsat Avcısı v2.0 - Görünür Mod', 'info');
            addToPopupResults('🤖 AI destekli web otomasyon eklentisi', 'info');
            addToPopupResults('🔧 Gemini AI ile güçlendirilmiştir', 'info');
            addToPopupResults('🌐 Artık görünür modda çalışır!', 'info');
        });
    }
}

// Durum güncelleme fonksiyonu
function updateStatus(message, type = 'info') {
    if (!statusText || !statusDiv) return;
    
    statusText.textContent = message;
    statusDiv.className = 'status';
    
    if (type === 'error') {
        statusDiv.classList.add('error');
    } else if (type === 'success') {
        statusDiv.classList.add('healthy');
    } else if (type === 'loading') {
        statusDiv.classList.add('loading');
    }
}

// Popup'a sonuç ekleme
function addToPopupResults(message, type = 'info') {
    const resultsArea = document.getElementById('resultsArea');
    if (!resultsArea) return;
    
    // İlk sonuç ise placeholder'ı temizle
    if (resultsArea.innerHTML.includes('Sonuçlar burada görünecek')) {
        resultsArea.innerHTML = '';
    }
    
    const resultItem = document.createElement('div');
    resultItem.className = `result-item ${type}`;
    
    const timestamp = new Date().toLocaleTimeString('tr-TR');
    resultItem.innerHTML = `
        <div style="font-size: 10px; opacity: 0.7; margin-bottom: 3px;">${timestamp}</div>
        <div>${message}</div>
    `;
    
    resultsArea.appendChild(resultItem);
    resultsArea.scrollTop = resultsArea.scrollHeight;
    
    // Maksimum 50 sonuç tut
    if (resultsArea.children.length > 50) {
        resultsArea.removeChild(resultsArea.firstChild);
    }
}

// Popup'ta arama yapma
function performPopupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.trim();
    if (!searchTerm) {
        addToPopupResults('❌ Arama terimi boş olamaz', 'error');
        return;
    }
    
    addToPopupResults(`🔍 Popup'ta arama: "${searchTerm}"`, 'info');
    
    // Sidebar'ı da aç ve oraya da gönder
    toggleSidebar();
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0]) {
            setTimeout(() => {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'performSearch',
                    searchTerm: searchTerm
                });
            }, 1000);
        }
    });
    
    searchInput.value = '';
}

// Sidebar'ı aç/kapat - Geliştirilmiş versiyon
function toggleSidebar() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0]) {
            // Content script'in yüklendiğinden emin ol
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                files: ["content-script-sidebar.js"]
            }, () => {
                if (chrome.runtime.lastError) {
                    console.error("Content script yüklenirken hata oluştu:", chrome.runtime.lastError.message);
                    updateStatus('Content script yüklenemedi', 'error');
                    return;
                }
                
                // Sidebar'ı toggle et
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "toggleSidebar"
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error("Sidebar toggle hatası:", chrome.runtime.lastError.message);
                        updateStatus('Sidebar açılamadı', 'error');
                    } else {
                        updateStatus('Sidebar açıldı', 'success');
                        addToPopupResults('📋 Kontrol paneli açıldı', 'success');
                    }
                });
            });
        }
    });
}

// API çağrısı yapma - Geliştirilmiş hata yönetimi
async function makeRequest(endpoint, data = null) {
    try {
        updateStatus('API çağrısı yapılıyor...', 'loading');
        
        const options = {
            method: data ? 'POST' : 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 30000 // 30 saniye timeout
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        updateStatus('API çağrısı başarılı', 'success');
        
        return result;
    } catch (error) {
        updateStatus('API hatası', 'error');
        console.error('API Error:', error);
        return {
            success: false,
            error: 'Bağlantı hatası: ' + error.message
        };
    }
}

// Sayfa analizi - Geliştirilmiş versiyon
async function analyzePage() {
    updateStatus('Sayfa analiz ediliyor...', 'loading');
    addToPopupResults('🔍 Sayfa analizi başlatılıyor...', 'info');
    
    // Önce sidebar'ı aç
    toggleSidebar();
    
    // Aktif tab'ın URL'sini al
    chrome.tabs.query({active: true, currentWindow: true}, async function(tabs) {
        if (!tabs[0]) {
            updateStatus('Aktif tab bulunamadı', 'error');
            return;
        }
        
        const currentUrl = tabs[0].url;
        const pageTitle = tabs[0].title;
        
        addToPopupResults(`📄 Sayfa: ${pageTitle}`, 'info');
        addToPopupResults(`🔗 URL: ${currentUrl}`, 'info');
        
        // Sidebar'a da bilgi gönder
        setTimeout(() => {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'addResult',
                message: `🔍 Sayfa analizi başlatılıyor: ${pageTitle}`,
                type: 'info'
            });
            
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'addResult',
                message: `🔗 URL: ${currentUrl}`,
                type: 'info'
            });
        }, 1000);
        
        try {
            const command = `Bu sayfadaki "${currentUrl}" tüm önemli bilgileri topla ve analiz et`;
            const result = await makeRequest('/full-automation', { command });
            
            // Sonuçları işle
            processAnalysisResults(result, tabs[0].id);
            
        } catch (error) {
            updateStatus('Analiz hatası', 'error');
            addToPopupResults(`❌ Analiz hatası: ${error.message}`, 'error');
        }
    });
}

// Hızlı arama - Geliştirilmiş versiyon
async function quickSearch() {
    const searchTerm = prompt('Arama terimi girin:\n\nÖrnek: "poco x3 pro uygun fiyat"');
    
    if (!searchTerm || searchTerm.trim() === '') {
        addToPopupResults('❌ Arama iptal edildi', 'error');
        return;
    }
    
    updateStatus('Arama yapılıyor...', 'loading');
    addToPopupResults(`🔍 Hızlı arama: "${searchTerm}"`, 'info');
    
    // Önce sidebar'ı aç
    toggleSidebar();
    
    chrome.tabs.query({active: true, currentWindow: true}, async function(tabs) {
        if (!tabs[0]) {
            updateStatus('Aktif tab bulunamadı', 'error');
            return;
        }
        
        // Sidebar'a mesaj gönder
        setTimeout(() => {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'addResult',
                message: `🔍 Arama başlatılıyor: "${searchTerm}"`,
                type: 'info'
            });
            
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'addResult',
                message: '🌐 Yeni sekme açılıyor ve arama yapılıyor...',
                type: 'info'
            });
        }, 1000);
        
        try {
            const command = `Google'da "${searchTerm}" ara, ilk 3 siteye gir, ürün bilgilerini ve fiyatları analiz et, detaylı rapor hazırla`;
            const result = await makeRequest('/full-automation', { command });
            
            // Sonuçları işle
            processSearchResults(result, tabs[0].id);
            
        } catch (error) {
            updateStatus('Arama hatası', 'error');
            addToPopupResults(`❌ Arama hatası: ${error.message}`, 'error');
        }
    });
}

// Özel otomasyon - Geliştirilmiş versiyon
async function startCustomAutomation() {
    const command = prompt('Hangi otomasyonu çalıştırmak istiyorsunuz?\n\nÖrnekler:\n- "Sahibinden.com\'da araç ara"\n- "YouTube\'da video ara"\n- "Haber sitelerini kontrol et"');
    
    if (!command || command.trim() === '') {
        addToPopupResults('❌ Otomasyon iptal edildi', 'error');
        return;
    }
    
    updateStatus('Otomasyon çalıştırılıyor...', 'loading');
    addToPopupResults(`🤖 Özel otomasyon: "${command}"`, 'info');
    
    // Önce sidebar'ı aç
    toggleSidebar();
    
    chrome.tabs.query({active: true, currentWindow: true}, async function(tabs) {
        if (!tabs[0]) {
            updateStatus('Aktif tab bulunamadı', 'error');
            return;
        }
        
        // Sidebar'a mesaj gönder
        setTimeout(() => {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'addResult',
                message: `🤖 Özel otomasyon başlatılıyor: "${command}"`,
                type: 'info'
            });
        }, 1000);
        
        try {
            const result = await makeRequest('/full-automation', { command });
            
            // Sonuçları işle
            processAutomationResults(result, tabs[0].id);
            
        } catch (error) {
            updateStatus('Otomasyon hatası', 'error');
            addToPopupResults(`❌ Otomasyon hatası: ${error.message}`, 'error');
        }
    });
}

// Analiz sonuçlarını işle
function processAnalysisResults(result, tabId) {
    if (result.success) {
        updateStatus('Analiz tamamlandı', 'success');
        addToPopupResults('✅ Sayfa analizi tamamlandı!', 'success');
        
        // Sidebar'a da gönder
        setTimeout(() => {
            chrome.tabs.sendMessage(tabId, {
                action: 'addResult',
                message: '✅ Analiz tamamlandı!',
                type: 'success'
            });
            
            if (result.automation_results) {
                result.automation_results.forEach(resultItem => {
                    const message = typeof resultItem === 'string' ? resultItem : resultItem.message || 'Sonuç';
                    
                    addToPopupResults(message, 'info');
                    chrome.tabs.sendMessage(tabId, {
                        action: 'addResult',
                        message: message,
                        type: 'info'
                    });
                });
            }
        }, 2000);
        
    } else {
        updateStatus('Analiz başarısız', 'error');
        addToPopupResults(`❌ Hata: ${result.error}`, 'error');
        
        setTimeout(() => {
            chrome.tabs.sendMessage(tabId, {
                action: 'addResult',
                message: `❌ Hata: ${result.error}`,
                type: 'error'
            });
        }, 1000);
    }
}

// Arama sonuçlarını işle
function processSearchResults(result, tabId) {
    if (result.success) {
        updateStatus('Arama tamamlandı', 'success');
        addToPopupResults('✅ Arama ve analiz tamamlandı!', 'success');
        
        // Sidebar'a da gönder
        setTimeout(() => {
            chrome.tabs.sendMessage(tabId, {
                action: 'addResult',
                message: '✅ Arama ve analiz tamamlandı!',
                type: 'success'
            });
            
            if (result.automation_results) {
                result.automation_results.forEach(resultItem => {
                    if (typeof resultItem === 'string') {
                        addToPopupResults(resultItem, 'info');
                        chrome.tabs.sendMessage(tabId, {
                            action: 'addResult',
                            message: resultItem,
                            type: 'info'
                        });
                    } else if (resultItem.message) {
                        addToPopupResults(resultItem.message, 'info');
                        chrome.tabs.sendMessage(tabId, {
                            action: 'addResult',
                            message: resultItem.message,
                            type: 'info'
                        });
                        
                        // Veri varsa linkler olarak göster
                        if (resultItem.data && resultItem.data.length > 0) {
                            resultItem.data.forEach(item => {
                                if (item.href) {
                                    const linkMessage = `🔗 <a href="${item.href}" target="_blank" style="color: #87CEEB;">${item.text}</a>`;
                                    addToPopupResults(linkMessage, 'info');
                                    chrome.tabs.sendMessage(tabId, {
                                        action: 'addResult',
                                        message: linkMessage,
                                        type: 'info'
                                    });
                                } else {
                                    const textMessage = `📄 ${item.text}`;
                                    addToPopupResults(textMessage, 'info');
                                    chrome.tabs.sendMessage(tabId, {
                                        action: 'addResult',
                                        message: textMessage,
                                        type: 'info'
                                    });
                                }
                            });
                        }
                    }
                });
            }
            
            if (result.browser_visible) {
                const visibleMessage = '🌐 Tarayıcı penceresi açık bırakıldı - sonuçları görebilirsiniz';
                addToPopupResults(visibleMessage, 'success');
                chrome.tabs.sendMessage(tabId, {
                    action: 'addResult',
                    message: visibleMessage,
                    type: 'success'
                });
            }
        }, 3000);
        
    } else {
        updateStatus('Arama başarısız', 'error');
        addToPopupResults(`❌ Hata: ${result.error}`, 'error');
        
        setTimeout(() => {
            chrome.tabs.sendMessage(tabId, {
                action: 'addResult',
                message: `❌ Hata: ${result.error}`,
                type: 'error'
            });
        }, 1000);
    }
}

// Otomasyon sonuçlarını işle
function processAutomationResults(result, tabId) {
    if (result.success) {
        updateStatus('Otomasyon tamamlandı', 'success');
        addToPopupResults('✅ Otomasyon tamamlandı!', 'success');
        
        // Sidebar'a da gönder
        setTimeout(() => {
            chrome.tabs.sendMessage(tabId, {
                action: 'addResult',
                message: '✅ Otomasyon tamamlandı!',
                type: 'success'
            });
            
            if (result.automation_results) {
                result.automation_results.forEach(resultItem => {
                    const message = typeof resultItem === 'string' ? resultItem : resultItem.message || 'Sonuç';
                    
                    addToPopupResults(message, 'info');
                    chrome.tabs.sendMessage(tabId, {
                        action: 'addResult',
                        message: message,
                        type: 'info'
                    });
                });
            }
        }, 2000);
        
    } else {
        updateStatus('Otomasyon başarısız', 'error');
        addToPopupResults(`❌ Hata: ${result.error}`, 'error');
        
        setTimeout(() => {
            chrome.tabs.sendMessage(tabId, {
                action: 'addResult',
                message: `❌ Hata: ${result.error}`,
                type: 'error'
            });
        }, 1000);
    }
}

// Sağlık kontrolü - Geliştirilmiş versiyon
async function checkHealth() {
    try {
        const result = await makeRequest('/health');
        if (result && result.status === 'healthy') {
            updateStatus('Sistem Hazır', 'success');
        } else {
            updateStatus('Sistem Hatası', 'error');
        }
    } catch (error) {
        updateStatus('Bağlantı Hatası', 'error');
        console.error('Health check error:', error);
    }
}

// Global test fonksiyonları (geliştirme için)
window.testAutomation = function(command) {
    if (command) {
        // Test için direkt komut çalıştır
        makeRequest('/full-automation', { command }).then(result => {
            console.log('Test result:', result);
        });
    } else {
        startCustomAutomation();
    }
};

window.testPageAnalysis = function() {
    analyzePage();
};

window.testSidebar = function() {
    toggleSidebar();
};

console.log('🎯 Fırsat Avcısı eklentisi v2.0 yüklendi - Düzeltilmiş versiyon!');

