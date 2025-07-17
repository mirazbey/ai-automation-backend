// Fırsat Avcısı - Geliştirilmiş Popup Script
// API Base URL
const API_BASE = 'http://localhost:5000/api/automation';

// DOM elementleri
const statusDiv = document.getElementById('status');
const statusText = document.getElementById('statusText');
const openSidebarBtn = document.getElementById('openSidebar');
const currentPageAnalyzeBtn = document.getElementById('currentPageAnalyze');
const quickSearchBtn = document.getElementById('quickSearch');
const automateBtn = document.getElementById('automate');

// Durum güncelleme fonksiyonu
function updateStatus(message, type = 'info') {
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

// Sidebar'ı aç/kapat
function toggleSidebar() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            action: 'toggleSidebar'
        }, function(response) {
            if (chrome.runtime.lastError) {
                // Content script yüklü değilse yükle
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    files: ['content-script-sidebar.js']
                }, function() {
                    // Yüklendikten sonra tekrar dene
                    setTimeout(() => {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            action: 'showSidebar'
                        });
                    }, 500);
                });
            }
        });
    });
    
    // Popup'ı kapat
    window.close();
}

// API çağrısı yapma
async function makeRequest(endpoint, data = null) {
    try {
        const options = {
            method: data ? 'POST' : 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        const result = await response.json();
        
        return result;
    } catch (error) {
        return {
            success: false,
            error: 'Bağlantı hatası: ' + error.message
        };
    }
}

// Sayfa analizi
async function analyzePage() {
    updateStatus('Sayfa analiz ediliyor...', 'loading');
    
    // Önce sidebar'ı aç
    toggleSidebar();
    
    // Aktif tab'ın URL'sini al
    chrome.tabs.query({active: true, currentWindow: true}, async function(tabs) {
        const currentUrl = tabs[0].url;
        const pageTitle = tabs[0].title;
        
        // Sidebar'a mesaj gönder
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
        
        const command = `Bu sayfadaki "${currentUrl}" tüm önemli bilgileri topla ve analiz et`;
        const result = await makeRequest('/full-automation', { command });
        
        // Sonuçları sidebar'a gönder
        setTimeout(() => {
            if (result.success) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'addResult',
                    message: '✅ Analiz tamamlandı!',
                    type: 'success'
                });
                
                if (result.automation_results) {
                    result.automation_results.forEach(resultItem => {
                        if (typeof resultItem === 'string') {
                            chrome.tabs.sendMessage(tabs[0].id, {
                                action: 'addResult',
                                message: resultItem,
                                type: 'info'
                            });
                        }
                    });
                }
            } else {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'addResult',
                    message: `❌ Hata: ${result.error}`,
                    type: 'error'
                });
            }
        }, 2000);
    });
}

// Hızlı arama
async function quickSearch() {
    const searchTerm = prompt('Arama terimi girin:\n\nÖrnek: "poco x3 pro uygun fiyat"');
    
    if (!searchTerm || searchTerm.trim() === '') {
        return;
    }
    
    updateStatus('Arama yapılıyor...', 'loading');
    
    // Önce sidebar'ı aç
    toggleSidebar();
    
    chrome.tabs.query({active: true, currentWindow: true}, async function(tabs) {
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
        
        const command = `Google'da "${searchTerm}" ara, ilk 3 siteye gir, ürün bilgilerini ve fiyatları analiz et, detaylı rapor hazırla`;
        const result = await makeRequest('/full-automation', { command });
        
        // Sonuçları sidebar'a gönder
        setTimeout(() => {
            if (result.success) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'addResult',
                    message: '✅ Arama ve analiz tamamlandı!',
                    type: 'success'
                });
                
                if (result.automation_results) {
                    result.automation_results.forEach(resultItem => {
                        if (typeof resultItem === 'string') {
                            chrome.tabs.sendMessage(tabs[0].id, {
                                action: 'addResult',
                                message: resultItem,
                                type: 'info'
                            });
                        } else if (resultItem.message) {
                            chrome.tabs.sendMessage(tabs[0].id, {
                                action: 'addResult',
                                message: resultItem.message,
                                type: 'info'
                            });
                            
                            // Veri varsa linkler olarak göster
                            if (resultItem.data && resultItem.data.length > 0) {
                                resultItem.data.forEach(item => {
                                    if (item.href) {
                                        chrome.tabs.sendMessage(tabs[0].id, {
                                            action: 'addResult',
                                            message: `🔗 <a href="${item.href}" target="_blank" style="color: #87CEEB;">${item.text}</a>`,
                                            type: 'info'
                                        });
                                    } else {
                                        chrome.tabs.sendMessage(tabs[0].id, {
                                            action: 'addResult',
                                            message: `📄 ${item.text}`,
                                            type: 'info'
                                        });
                                    }
                                });
                            }
                        }
                    });
                }
                
                if (result.browser_visible) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'addResult',
                        message: '🌐 Tarayıcı penceresi açık bırakıldı - sonuçları görebilirsiniz',
                        type: 'success'
                    });
                }
                
            } else {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'addResult',
                    message: `❌ Hata: ${result.error}`,
                    type: 'error'
                });
            }
        }, 3000);
    });
}

// Özel otomasyon
async function startCustomAutomation() {
    const command = prompt('Hangi otomasyonu çalıştırmak istiyorsunuz?\n\nÖrnekler:\n- "Sahibinden.com\'da araç ara"\n- "YouTube\'da video ara"\n- "Haber sitelerini kontrol et"');
    
    if (!command || command.trim() === '') {
        return;
    }
    
    updateStatus('Otomasyon çalıştırılıyor...', 'loading');
    
    // Önce sidebar'ı aç
    toggleSidebar();
    
    chrome.tabs.query({active: true, currentWindow: true}, async function(tabs) {
        // Sidebar'a mesaj gönder
        setTimeout(() => {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'addResult',
                message: `🤖 Özel otomasyon başlatılıyor: "${command}"`,
                type: 'info'
            });
        }, 1000);
        
        const result = await makeRequest('/full-automation', { command });
        
        // Sonuçları sidebar'a gönder
        setTimeout(() => {
            if (result.success) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'addResult',
                    message: '✅ Otomasyon tamamlandı!',
                    type: 'success'
                });
                
                if (result.automation_results) {
                    result.automation_results.forEach(resultItem => {
                        if (typeof resultItem === 'string') {
                            chrome.tabs.sendMessage(tabs[0].id, {
                                action: 'addResult',
                                message: resultItem,
                                type: 'info'
                            });
                        }
                    });
                }
            } else {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'addResult',
                    message: `❌ Hata: ${result.error}`,
                    type: 'error'
                });
            }
        }, 2000);
    });
}

// Sağlık kontrolü
async function checkHealth() {
    try {
        const result = await makeRequest('/health');
        if (result.status === 'healthy') {
            updateStatus('Sistem Hazır', 'success');
        } else {
            updateStatus('Sistem Hatası', 'error');
        }
    } catch (error) {
        updateStatus('Bağlantı Hatası', 'error');
    }
}

// Event listener'lar
openSidebarBtn.addEventListener('click', toggleSidebar);
currentPageAnalyzeBtn.addEventListener('click', analyzePage);
quickSearchBtn.addEventListener('click', quickSearch);
automateBtn.addEventListener('click', startCustomAutomation);

// Ayarlar, yardım ve hakkında butonları
document.getElementById('settings').addEventListener('click', function() {
    toggleSidebar();
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        setTimeout(() => {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'addResult',
                message: '⚙️ Ayarlar özelliği yakında eklenecek',
                type: 'info'
            });
        }, 1000);
    });
});

document.getElementById('help').addEventListener('click', function() {
    toggleSidebar();
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        setTimeout(() => {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'addResult',
                message: '❓ Yardım: Bu eklenti AI destekli web otomasyonu sağlar',
                type: 'info'
            });
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'addResult',
                message: '🔍 "Bu Sayfayı Analiz Et" - Aktif sayfayı analiz eder',
                type: 'info'
            });
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'addResult',
                message: '🔎 "Hızlı Arama" - Google\'da arama yapar ve siteleri analiz eder',
                type: 'info'
            });
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'addResult',
                message: '🤖 "Otomasyon Başlat" - Özel komutlar çalıştırır',
                type: 'info'
            });
        }, 1000);
    });
});

document.getElementById('about').addEventListener('click', function() {
    toggleSidebar();
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        setTimeout(() => {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'addResult',
                message: 'ℹ️ Fırsat Avcısı v2.0 - Görünür Mod',
                type: 'info'
            });
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'addResult',
                message: '🤖 AI destekli web otomasyon eklentisi',
                type: 'info'
            });
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'addResult',
                message: '🔧 Gemini AI ile güçlendirilmiştir',
                type: 'info'
            });
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'addResult',
                message: '🌐 Artık görünür modda çalışır!',
                type: 'info'
            });
        }, 1000);
    });
});

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    // Sağlık kontrolü yap
    checkHealth();
    
    // Her 30 saniyede bir sağlık kontrolü
    setInterval(checkHealth, 30000);
});

// Global test fonksiyonları (geliştirme için)
window.testAutomation = function(command) {
    startCustomAutomation();
};

window.testPageAnalysis = function() {
    analyzePage();
};

console.log('🎯 Fırsat Avcısı eklentisi v2.0 yüklendi - Görünür mod aktif!');

