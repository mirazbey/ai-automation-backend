// Fırsat Avcısı - Geliştirilmiş Kalıcı Sidebar Content Script

let sidebarContainer = null;
let isInitialized = false;
let resultsHistory = [];
const MAX_RESULTS = 50;

// Local storage anahtarları
const STORAGE_KEYS = {
    RESULTS_HISTORY: 'firsat_avcisi_results_history',
    SIDEBAR_STATE: 'firsat_avcisi_sidebar_state'
};

// Sidebar'ı oluştur
function createSidebar() {
    if (sidebarContainer) return sidebarContainer;
    
    // Ana container - Kalıcı ve sağ kenarda sabit
    sidebarContainer = document.createElement('div');
    sidebarContainer.id = 'firsat-avcisi-sidebar';
    sidebarContainer.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        right: 0 !important;
        width: 380px !important;
        height: 100vh !important;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        color: white !important;
        font-family: 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', sans-serif !important;
        z-index: 2147483647 !important;
        box-shadow: -5px 0 20px rgba(0,0,0,0.3) !important;
        display: none !important;
        overflow: hidden !important;
        border-left: 2px solid rgba(255,255,255,0.2) !important;
        backdrop-filter: blur(10px) !important;
        transition: all 0.3s ease !important;
    `;
    
    // Header - Geliştirilmiş
    const header = document.createElement('div');
    header.style.cssText = `
        padding: 15px !important;
        background: rgba(0,0,0,0.2) !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        border-bottom: 1px solid rgba(255,255,255,0.1) !important;
        position: sticky !important;
        top: 0 !important;
        z-index: 10 !important;
    `;
    
    header.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <h3 style="margin: 0; font-size: 16px; font-weight: 600;">🎯 Fırsat Avcısı</h3>
            <span id="sidebar-version" style="font-size: 10px; opacity: 0.7; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 10px;">v2.0</span>
        </div>
        <div style="display: flex; gap: 5px;">
            <button id="sidebar-minimize" style="
                background: rgba(255, 193, 7, 0.3);
                border: none;
                color: white;
                width: 25px;
                height: 25px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
            " title="Küçült">−</button>
            <button id="sidebar-close" style="
                background: rgba(244, 67, 54, 0.3);
                border: none;
                color: white;
                width: 25px;
                height: 25px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
            " title="Kapat">×</button>
        </div>
    `;
    
    // Status - Geliştirilmiş
    const status = document.createElement('div');
    status.id = 'sidebar-status';
    status.style.cssText = `
        padding: 10px 15px !important;
        background: rgba(76, 175, 80, 0.2) !important;
        text-align: center !important;
        font-size: 12px !important;
        border-bottom: 1px solid rgba(255,255,255,0.1) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 8px !important;
    `;
    status.innerHTML = `
        <span id="status-icon">✅</span>
        <span id="status-text">Sistem Hazır</span>
        <span id="results-count" style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 10px; font-size: 10px;">0 sonuç</span>
    `;
    
    // Search area - Geliştirilmiş
    const searchArea = document.createElement('div');
    searchArea.style.cssText = `
        padding: 15px !important;
        border-bottom: 1px solid rgba(255,255,255,0.1) !important;
        background: rgba(255,255,255,0.05) !important;
    `;
    
    searchArea.innerHTML = `
        <div style="position: relative; margin-bottom: 10px;">
            <input type="text" id="sidebar-search" placeholder="Arama terimi veya komut girin..." style="
                width: 100% !important;
                background: rgba(255, 255, 255, 0.1) !important;
                border: 1px solid rgba(255, 255, 255, 0.2) !important;
                color: white !important;
                padding: 10px 40px 10px 12px !important;
                border-radius: 8px !important;
                font-size: 13px !important;
                font-family: inherit !important;
                box-sizing: border-box !important;
                transition: all 0.3s ease !important;
            ">
            <button id="sidebar-search-btn" style="
                position: absolute;
                right: 5px;
                top: 50%;
                transform: translateY(-50%);
                background: rgba(33, 150, 243, 0.3);
                border: none;
                color: white;
                width: 30px;
                height: 30px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
            ">🔍</button>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
            <button id="sidebar-quick-search" style="
                background: rgba(33, 150, 243, 0.3) !important;
                border: 1px solid rgba(33, 150, 243, 0.5) !important;
                color: white !important;
                padding: 8px !important;
                border-radius: 6px !important;
                cursor: pointer !important;
                font-size: 11px !important;
                transition: all 0.3s ease !important;
            ">🔍 Hızlı Arama</button>
            <button id="sidebar-analyze" style="
                background: rgba(76, 175, 80, 0.3) !important;
                border: 1px solid rgba(76, 175, 80, 0.5) !important;
                color: white !important;
                padding: 8px !important;
                border-radius: 6px !important;
                cursor: pointer !important;
                font-size: 11px !important;
                transition: all 0.3s ease !important;
            ">📊 Analiz Et</button>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <button id="sidebar-automate" style="
                background: rgba(156, 39, 176, 0.3) !important;
                border: 1px solid rgba(156, 39, 176, 0.5) !important;
                color: white !important;
                padding: 8px !important;
                border-radius: 6px !important;
                cursor: pointer !important;
                font-size: 11px !important;
                transition: all 0.3s ease !important;
            ">🤖 Otomasyon</button>
            <button id="sidebar-export" style="
                background: rgba(255, 152, 0, 0.3) !important;
                border: 1px solid rgba(255, 152, 0, 0.5) !important;
                color: white !important;
                padding: 8px !important;
                border-radius: 6px !important;
                cursor: pointer !important;
                font-size: 11px !important;
                transition: all 0.3s ease !important;
            ">📤 Dışa Aktar</button>
        </div>
    `;
    
    // Results area - Geliştirilmiş
    const resultsArea = document.createElement('div');
    resultsArea.id = 'sidebar-results';
    resultsArea.style.cssText = `
        flex: 1 !important;
        padding: 15px !important;
        overflow-y: auto !important;
        max-height: calc(100vh - 280px) !important;
        background: rgba(0,0,0,0.1) !important;
    `;
    
    resultsArea.innerHTML = `
        <div id="results-placeholder" style="text-align: center; opacity: 0.6; margin-top: 50px; padding: 20px;">
            <div style="font-size: 24px; margin-bottom: 10px;">📋</div>
            <div style="font-size: 14px; margin-bottom: 5px;">Sonuçlar burada görünecek</div>
            <div style="font-size: 11px; opacity: 0.7;">Bir arama yapın veya sayfayı analiz edin</div>
        </div>
    `;
    
    // Footer - Geliştirilmiş
    const footer = document.createElement('div');
    footer.style.cssText = `
        padding: 10px 15px !important;
        background: rgba(0,0,0,0.2) !important;
        border-top: 1px solid rgba(255,255,255,0.1) !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
    `;
    
    footer.innerHTML = `
        <div style="display: flex; gap: 5px;">
            <button id="sidebar-clear" style="
                background: rgba(244, 67, 54, 0.2) !important;
                border: 1px solid rgba(244, 67, 54, 0.3) !important;
                color: white !important;
                padding: 6px 10px !important;
                border-radius: 4px !important;
                cursor: pointer !important;
                font-size: 10px !important;
            ">🗑️ Temizle</button>
            <button id="sidebar-save" style="
                background: rgba(76, 175, 80, 0.2) !important;
                border: 1px solid rgba(76, 175, 80, 0.3) !important;
                color: white !important;
                padding: 6px 10px !important;
                border-radius: 4px !important;
                cursor: pointer !important;
                font-size: 10px !important;
            ">💾 Kaydet</button>
        </div>
        <div style="font-size: 10px; opacity: 0.7;">
            <span id="last-update">Son güncelleme: --</span>
        </div>
    `;
    
    // Assemble
    sidebarContainer.appendChild(header);
    sidebarContainer.appendChild(status);
    sidebarContainer.appendChild(searchArea);
    sidebarContainer.appendChild(resultsArea);
    sidebarContainer.appendChild(footer);
    
    // Event listeners
    setupEventListeners();
    
    // Sayfa body'sine ekle
    document.body.appendChild(sidebarContainer);
    
    // Geçmişi yükle
    loadResultsHistory();
    
    return sidebarContainer;
}

// Event listener'ları ayarla
function setupEventListeners() {
    // Close button
    document.getElementById('sidebar-close').addEventListener('click', () => {
        hideSidebar();
    });
    
    // Minimize button
    document.getElementById('sidebar-minimize').addEventListener('click', () => {
        minimizeSidebar();
    });
    
    // Search input ve button
    const searchInput = document.getElementById('sidebar-search');
    const searchBtn = document.getElementById('sidebar-search-btn');
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performQuickSearch();
        }
    });
    
    searchInput.addEventListener('focus', () => {
        searchInput.style.borderColor = 'rgba(255, 255, 255, 0.4)';
        searchInput.style.background = 'rgba(255, 255, 255, 0.15)';
    });
    
    searchInput.addEventListener('blur', () => {
        searchInput.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        searchInput.style.background = 'rgba(255, 255, 255, 0.1)';
    });
    
    searchBtn.addEventListener('click', performQuickSearch);
    
    // Action buttons
    document.getElementById('sidebar-quick-search').addEventListener('click', performQuickSearch);
    document.getElementById('sidebar-analyze').addEventListener('click', analyzePage);
    document.getElementById('sidebar-automate').addEventListener('click', startCustomAutomation);
    document.getElementById('sidebar-export').addEventListener('click', exportResults);
    
    // Footer buttons
    document.getElementById('sidebar-clear').addEventListener('click', clearResults);
    document.getElementById('sidebar-save').addEventListener('click', saveResults);
    
    // Hover effects
    addHoverEffects();
    
    // Prevent sidebar from closing when clicked
    sidebarContainer.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    // Prevent page scroll when scrolling in sidebar
    sidebarContainer.addEventListener('wheel', (e) => {
        e.stopPropagation();
    });
}

// Hover efektleri ekle
function addHoverEffects() {
    const buttons = sidebarContainer.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-1px)';
            button.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = 'none';
        });
    });
}

// Sidebar'ı göster
function showSidebar() {
    if (!sidebarContainer) {
        createSidebar();
    }
    
    sidebarContainer.style.display = 'flex';
    sidebarContainer.style.flexDirection = 'column';
    
    // Sayfa içeriğini kaydır - Geliştirilmiş
    document.body.style.marginRight = '380px';
    document.body.style.transition = 'margin-right 0.3s ease';
    
    // Viewport meta tag'ini kontrol et
    let viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
        viewport.setAttribute('data-original-content', viewport.content);
        viewport.content = 'width=device-width, initial-scale=1.0, user-scalable=yes';
    }
    
    // Sidebar state'i kaydet
    saveSidebarState(true);
    
    updateStatus('Sidebar açık', 'success');
}

// Sidebar'ı gizle
function hideSidebar() {
    if (sidebarContainer) {
        sidebarContainer.style.display = 'none';
    }
    
    // Sayfa içeriğini eski haline getir
    document.body.style.marginRight = '0';
    
    // Viewport'u eski haline getir
    let viewport = document.querySelector('meta[name="viewport"]');
    if (viewport && viewport.getAttribute('data-original-content')) {
        viewport.content = viewport.getAttribute('data-original-content');
    }
    
    // Sidebar state'i kaydet
    saveSidebarState(false);
}

// Sidebar'ı küçült
function minimizeSidebar() {
    if (sidebarContainer) {
        const isMinimized = sidebarContainer.style.width === '60px';
        
        if (isMinimized) {
            // Büyüt
            sidebarContainer.style.width = '380px';
            document.body.style.marginRight = '380px';
            sidebarContainer.querySelectorAll('div:not(#sidebar-close):not(#sidebar-minimize)').forEach(el => {
                el.style.display = '';
            });
        } else {
            // Küçült
            sidebarContainer.style.width = '60px';
            document.body.style.marginRight = '60px';
            sidebarContainer.querySelectorAll('div:not(:first-child)').forEach(el => {
                el.style.display = 'none';
            });
        }
    }
}

// Sidebar'ı toggle et
function toggleSidebar() {
    if (!sidebarContainer || sidebarContainer.style.display === 'none') {
        showSidebar();
    } else {
        hideSidebar();
    }
}

// Sonuç ekleme - Geliştirilmiş
function addResult(message, type = 'info', data = null) {
    const resultsArea = document.getElementById('sidebar-results');
    if (!resultsArea) return;
    
    // Placeholder'ı kaldır
    const placeholder = document.getElementById('results-placeholder');
    if (placeholder) {
        placeholder.remove();
    }
    
    const timestamp = new Date();
    const resultItem = document.createElement('div');
    resultItem.className = 'result-item';
    resultItem.style.cssText = `
        margin-bottom: 12px !important;
        padding: 10px !important;
        background: rgba(255, 255, 255, 0.05) !important;
        border-radius: 8px !important;
        border-left: 4px solid ${getTypeColor(type)} !important;
        font-size: 12px !important;
        line-height: 1.4 !important;
        transition: all 0.3s ease !important;
        cursor: pointer !important;
    `;
    
    const timeString = timestamp.toLocaleTimeString('tr-TR');
    const dateString = timestamp.toLocaleDateString('tr-TR');
    
    resultItem.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <div style="font-size: 10px; opacity: 0.7; display: flex; align-items: center; gap: 5px;">
                <span>${getTypeIcon(type)}</span>
                <span>${timeString}</span>
                <span style="opacity: 0.5;">•</span>
                <span>${dateString}</span>
            </div>
            <button class="result-delete" style="
                background: rgba(244, 67, 54, 0.2);
                border: none;
                color: white;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 10px;
                opacity: 0.7;
            ">×</button>
        </div>
        <div class="result-content">${message}</div>
        ${data ? `<div class="result-data" style="margin-top: 5px; font-size: 11px; opacity: 0.8;">${JSON.stringify(data, null, 2)}</div>` : ''}
    `;
    
    // Hover efekti
    resultItem.addEventListener('mouseenter', () => {
        resultItem.style.background = 'rgba(255, 255, 255, 0.1)';
        resultItem.style.transform = 'translateX(2px)';
    });
    
    resultItem.addEventListener('mouseleave', () => {
        resultItem.style.background = 'rgba(255, 255, 255, 0.05)';
        resultItem.style.transform = 'translateX(0)';
    });
    
    // Silme butonu
    const deleteBtn = resultItem.querySelector('.result-delete');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        resultItem.remove();
        updateResultsCount();
        saveResultsHistory();
    });
    
    resultsArea.appendChild(resultItem);
    resultsArea.scrollTop = resultsArea.scrollHeight;
    
    // Geçmişe ekle
    resultsHistory.push({
        timestamp: timestamp.toISOString(),
        message,
        type,
        data
    });
    
    // Maksimum 50 sonuç tut
    if (resultsHistory.length > MAX_RESULTS) {
        resultsHistory.shift();
        if (resultsArea.children.length > MAX_RESULTS) {
            resultsArea.removeChild(resultsArea.firstChild);
        }
    }
    
    updateResultsCount();
    updateLastUpdate();
    saveResultsHistory();
}

// Tip rengini al
function getTypeColor(type) {
    switch (type) {
        case 'error': return 'rgba(244, 67, 54, 0.8)';
        case 'success': return 'rgba(76, 175, 80, 0.8)';
        case 'warning': return 'rgba(255, 193, 7, 0.8)';
        case 'info':
        default: return 'rgba(33, 150, 243, 0.8)';
    }
}

// Tip ikonunu al
function getTypeIcon(type) {
    switch (type) {
        case 'error': return '❌';
        case 'success': return '✅';
        case 'warning': return '⚠️';
        case 'info':
        default: return 'ℹ️';
    }
}

// Sonuç sayısını güncelle
function updateResultsCount() {
    const countElement = document.getElementById('results-count');
    if (countElement) {
        const count = resultsHistory.length;
        countElement.textContent = `${count} sonuç`;
    }
}

// Son güncelleme zamanını güncelle
function updateLastUpdate() {
    const lastUpdateElement = document.getElementById('last-update');
    if (lastUpdateElement) {
        const now = new Date();
        lastUpdateElement.textContent = `Son güncelleme: ${now.toLocaleTimeString('tr-TR')}`;
    }
}

// Status güncelleme - Geliştirilmiş
function updateStatus(message, type = 'info') {
    const statusText = document.getElementById('status-text');
    const statusIcon = document.getElementById('status-icon');
    const statusDiv = document.getElementById('sidebar-status');
    
    if (!statusText || !statusIcon || !statusDiv) return;
    
    statusText.textContent = message;
    statusIcon.textContent = getTypeIcon(type);
    
    statusDiv.style.background = type === 'error' ? 'rgba(244, 67, 54, 0.2)' :
                                 type === 'success' ? 'rgba(76, 175, 80, 0.2)' :
                                 type === 'loading' ? 'rgba(255, 193, 7, 0.2)' :
                                 'rgba(33, 150, 243, 0.2)';
}

// Sonuçları temizle
function clearResults() {
    const resultsArea = document.getElementById('sidebar-results');
    if (!resultsArea) return;
    
    if (confirm('Tüm sonuçları temizlemek istediğinizden emin misiniz?')) {
        resultsArea.innerHTML = `
            <div id="results-placeholder" style="text-align: center; opacity: 0.6; margin-top: 50px; padding: 20px;">
                <div style="font-size: 24px; margin-bottom: 10px;">📋</div>
                <div style="font-size: 14px; margin-bottom: 5px;">Sonuçlar burada görünecek</div>
                <div style="font-size: 11px; opacity: 0.7;">Bir arama yapın veya sayfayı analiz edin</div>
            </div>
        `;
        
        resultsHistory = [];
        updateResultsCount();
        saveResultsHistory();
        addResult('🗑️ Tüm sonuçlar temizlendi', 'info');
    }
}

// Sonuçları kaydet
function saveResults() {
    if (resultsHistory.length === 0) {
        addResult('💾 Kaydedilecek sonuç bulunamadı', 'warning');
        return;
    }
    
    const dataStr = JSON.stringify(resultsHistory, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `firsat_avcisi_sonuclar_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    addResult('💾 Sonuçlar başarıyla kaydedildi', 'success');
}

// Sonuçları dışa aktar
function exportResults() {
    if (resultsHistory.length === 0) {
        addResult('📤 Dışa aktarılacak sonuç bulunamadı', 'warning');
        return;
    }
    
    let exportText = '# Fırsat Avcısı Sonuçları\n\n';
    exportText += `Dışa aktarma tarihi: ${new Date().toLocaleString('tr-TR')}\n`;
    exportText += `Toplam sonuç sayısı: ${resultsHistory.length}\n\n`;
    
    resultsHistory.forEach((result, index) => {
        const date = new Date(result.timestamp);
        exportText += `## ${index + 1}. Sonuç\n`;
        exportText += `**Tarih:** ${date.toLocaleString('tr-TR')}\n`;
        exportText += `**Tip:** ${result.type}\n`;
        exportText += `**Mesaj:** ${result.message}\n`;
        if (result.data) {
            exportText += `**Veri:** \`\`\`json\n${JSON.stringify(result.data, null, 2)}\n\`\`\`\n`;
        }
        exportText += '\n---\n\n';
    });
    
    const dataBlob = new Blob([exportText], {type: 'text/markdown'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `firsat_avcisi_rapor_${new Date().toISOString().split('T')[0]}.md`;
    link.click();
    
    URL.revokeObjectURL(url);
    addResult('📤 Rapor başarıyla dışa aktarıldı', 'success');
}

// Geçmişi kaydet
function saveResultsHistory() {
    try {
        localStorage.setItem(STORAGE_KEYS.RESULTS_HISTORY, JSON.stringify(resultsHistory));
    } catch (error) {
        console.error('Geçmiş kaydedilemedi:', error);
    }
}

// Geçmişi yükle
function loadResultsHistory() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.RESULTS_HISTORY);
        if (saved) {
            resultsHistory = JSON.parse(saved);
            
            // Geçmişi sidebar'a yükle
            const resultsArea = document.getElementById('sidebar-results');
            if (resultsArea && resultsHistory.length > 0) {
                const placeholder = document.getElementById('results-placeholder');
                if (placeholder) {
                    placeholder.remove();
                }
                
                resultsHistory.forEach(result => {
                    addResultFromHistory(result);
                });
                
                updateResultsCount();
                updateLastUpdate();
            }
        }
    } catch (error) {
        console.error('Geçmiş yüklenemedi:', error);
    }
}

// Geçmişten sonuç ekleme
function addResultFromHistory(result) {
    const resultsArea = document.getElementById('sidebar-results');
    if (!resultsArea) return;
    
    const resultItem = document.createElement('div');
    resultItem.className = 'result-item';
    resultItem.style.cssText = `
        margin-bottom: 12px !important;
        padding: 10px !important;
        background: rgba(255, 255, 255, 0.05) !important;
        border-radius: 8px !important;
        border-left: 4px solid ${getTypeColor(result.type)} !important;
        font-size: 12px !important;
        line-height: 1.4 !important;
        transition: all 0.3s ease !important;
        cursor: pointer !important;
    `;
    
    const timestamp = new Date(result.timestamp);
    const timeString = timestamp.toLocaleTimeString('tr-TR');
    const dateString = timestamp.toLocaleDateString('tr-TR');
    
    resultItem.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <div style="font-size: 10px; opacity: 0.7; display: flex; align-items: center; gap: 5px;">
                <span>${getTypeIcon(result.type)}</span>
                <span>${timeString}</span>
                <span style="opacity: 0.5;">•</span>
                <span>${dateString}</span>
            </div>
        </div>
        <div class="result-content">${result.message}</div>
        ${result.data ? `<div class="result-data" style="margin-top: 5px; font-size: 11px; opacity: 0.8;">${JSON.stringify(result.data, null, 2)}</div>` : ''}
    `;
    
    resultsArea.appendChild(resultItem);
}

// Sidebar state'i kaydet
function saveSidebarState(isOpen) {
    try {
        localStorage.setItem(STORAGE_KEYS.SIDEBAR_STATE, JSON.stringify({
            isOpen,
            timestamp: new Date().toISOString()
        }));
    } catch (error) {
        console.error('Sidebar state kaydedilemedi:', error);
    }
}

// API çağrısı - Geliştirilmiş
async function makeAPIRequest(endpoint, data = null) {
    try {
        updateStatus('API çağrısı yapılıyor...', 'loading');
        
        const options = {
            method: data ? 'POST' : 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(`http://localhost:5000/api/automation${endpoint}`, options);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        updateStatus('API çağrısı başarılı', 'success');
        
        return result;
    } catch (error) {
        updateStatus('API hatası', 'error');
        addResult(`❌ API Hatası: ${error.message}`, 'error');
        return {
            success: false,
            error: error.message
        };
    }
}

// Hızlı arama - Geliştirilmiş
async function performQuickSearch() {
    const searchInput = document.getElementById('sidebar-search');
    const searchTerm = searchInput.value.trim();
    
    if (!searchTerm) {
        updateStatus('Lütfen arama terimi girin!', 'error');
        addResult('❌ Arama terimi boş olamaz', 'error');
        return;
    }
    
    updateStatus('Arama yapılıyor...', 'loading');
    addResult(`🔍 Arama başlatılıyor: "${searchTerm}"`, 'info');
    
    const command = `Google'da "${searchTerm}" ara, ilk 3 siteye gir, ürün bilgilerini ve fiyatları analiz et, detaylı rapor hazırla`;
    const result = await makeAPIRequest('/full-automation', { command });
    
    processResults(result);
    searchInput.value = '';
}

// Sayfa analizi - Geliştirilmiş
async function analyzePage() {
    updateStatus('Sayfa analiz ediliyor...', 'loading');
    addResult(`🔍 Sayfa analizi başlatılıyor: ${document.title}`, 'info');
    addResult(`🔗 URL: ${window.location.href}`, 'info');
    
    const command = `Bu sayfadaki "${window.location.href}" tüm önemli bilgileri topla ve analiz et`;
    const result = await makeAPIRequest('/full-automation', { command });
    
    processResults(result);
}

// Özel otomasyon başlat
async function startCustomAutomation() {
    const command = prompt('Hangi otomasyonu çalıştırmak istiyorsunuz?\n\nÖrnekler:\n- "Sahibinden.com\'da araç ara"\n- "YouTube\'da video ara"\n- "Haber sitelerini kontrol et"');
    
    if (!command || command.trim() === '') {
        addResult('❌ Otomasyon iptal edildi', 'error');
        return;
    }
    
    updateStatus('Otomasyon çalıştırılıyor...', 'loading');
    addResult(`🤖 Özel otomasyon başlatılıyor: "${command}"`, 'info');
    
    const result = await makeAPIRequest('/full-automation', { command });
    processResults(result);
}

// Sonuçları işle - Geliştirilmiş
function processResults(data) {
    if (data.success) {
        updateStatus('İşlem tamamlandı!', 'success');
        
        if (data.original_command) {
            addResult(`🎯 <strong>Komut:</strong> ${data.original_command}`, 'info');
        }
        
        if (data.automation_results && data.automation_results.length > 0) {
            addResult('📋 <strong>Gerçekleştirilen Adımlar:</strong>', 'success');
            
            data.automation_results.forEach((result, index) => {
                if (typeof result === 'string') {
                    addResult(`${index + 1}. ${result}`, 'info');
                } else if (result.message) {
                    addResult(`${index + 1}. ${result.message}`, 'info');
                    
                    if (result.data && result.data.length > 0) {
                        result.data.forEach(item => {
                            if (item.href) {
                                addResult(`   🔗 <a href="${item.href}" target="_blank" style="color: #87CEEB; text-decoration: underline;">${item.text}</a>`, 'info');
                            } else {
                                addResult(`   📄 ${item.text}`, 'info');
                            }
                        });
                    }
                }
            });
        }
        
        if (data.page_title || data.current_url) {
            addResult('🌐 <strong>Sayfa Bilgileri:</strong>', 'info');
            if (data.page_title) {
                addResult(`   📄 Başlık: ${data.page_title}`, 'info');
            }
            if (data.current_url) {
                addResult(`   🔗 URL: <a href="${data.current_url}" target="_blank" style="color: #87CEEB; text-decoration: underline;">${data.current_url}</a>`, 'info');
            }
        }
        
        if (data.browser_visible) {
            addResult('🌐 Tarayıcı penceresi açık bırakıldı - sonuçları görebilirsiniz', 'success');
        }
        
    } else {
        updateStatus('İşlem başarısız!', 'error');
        addResult(`❌ <strong>Hata:</strong> ${data.error || 'Bilinmeyen hata'}`, 'error');
    }
}

// Mesaj dinleyicisi - Geliştirilmiş
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
        if (request.action === 'toggleSidebar') {
            toggleSidebar();
            sendResponse({ success: true });
        }
        
        if (request.action === 'showSidebar') {
            showSidebar();
            sendResponse({ success: true });
        }
        
        if (request.action === 'addResult') {
            addResult(request.message, request.type, request.data);
            sendResponse({ success: true });
        }
        
        if (request.action === 'updateStatus') {
            updateStatus(request.message, request.type);
            sendResponse({ success: true });
        }
        
        if (request.action === 'performSearch') {
            const searchInput = document.getElementById('sidebar-search');
            if (searchInput) {
                searchInput.value = request.searchTerm;
                performQuickSearch();
            }
            sendResponse({ success: true });
        }
        
        if (request.action === 'clearResults') {
            clearResults();
            sendResponse({ success: true });
        }
        
    } catch (error) {
        console.error('Message handler error:', error);
        sendResponse({ success: false, error: error.message });
    }
    
    return true;
});

// Sayfa yüklendiğinde
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🎯 Fırsat Avcısı geliştirilmiş sidebar hazır!');
        
        // Önceki sidebar state'ini kontrol et
        try {
            const savedState = localStorage.getItem(STORAGE_KEYS.SIDEBAR_STATE);
            if (savedState) {
                const state = JSON.parse(savedState);
                // Eğer önceden açıksa ve 1 saatten az zaman geçmişse tekrar aç
                const timeDiff = new Date() - new Date(state.timestamp);
                if (state.isOpen && timeDiff < 3600000) { // 1 saat
                    setTimeout(() => showSidebar(), 1000);
                }
            }
        } catch (error) {
            console.error('Sidebar state yüklenemedi:', error);
        }
    });
} else {
    console.log('🎯 Fırsat Avcısı geliştirilmiş sidebar hazır!');
}

// Global fonksiyonlar
window.firsat_avcisi_sidebar = {
    show: showSidebar,
    hide: hideSidebar,
    toggle: toggleSidebar,
    addResult: addResult,
    updateStatus: updateStatus,
    clearResults: clearResults,
    exportResults: exportResults,
    saveResults: saveResults
};

// Sayfa kapatılırken geçmişi kaydet
window.addEventListener('beforeunload', () => {
    saveResultsHistory();
    saveSidebarState(sidebarContainer && sidebarContainer.style.display !== 'none');
});

