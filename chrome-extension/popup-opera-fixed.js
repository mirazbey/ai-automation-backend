// Fırsat Avcısı - Opera Uyumlu Popup Script v4.0
// Selenium kaldırıldı, sadece Opera Extension API kullanılıyor

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎭 Opera uyumlu popup yüklendi');
    
    // DOM elementleri
    const commandInput = document.getElementById('commandInput');
    const executeBtn = document.getElementById('executeBtn');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const statusDiv = document.getElementById('status');
    const resultsDiv = document.getElementById('results');
    const historyDiv = document.getElementById('history');
    
    // Backend URL
    const BACKEND_URL = 'http://localhost:5000/api/automation';
    
    // Sayfa bilgilerini al
    let currentPageInfo = {
        url: '',
        title: '',
        content: ''
    };
    
    // Aktif sekme bilgilerini al
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0]) {
            currentPageInfo.url = tabs[0].url;
            currentPageInfo.title = tabs[0].title;
            
            // Sayfa içeriğini al
            chrome.tabs.executeScript(tabs[0].id, {
                code: `
                    // Sayfa içeriğini topla
                    const pageText = document.body.innerText || document.body.textContent || '';
                    const pageHTML = document.documentElement.outerHTML;
                    
                    ({
                        text: pageText.substring(0, 5000),
                        html: pageHTML.substring(0, 10000),
                        title: document.title,
                        url: window.location.href
                    });
                `
            }, function(result) {
                if (result && result[0]) {
                    currentPageInfo.content = result[0].text;
                    console.log('📄 Sayfa içeriği alındı:', currentPageInfo);
                }
            });
        }
    });
    
    // Geçmişi yükle
    loadHistory();
    
    // Event listeners
    executeBtn.addEventListener('click', executeCommand);
    analyzeBtn.addEventListener('click', analyzePage);
    
    commandInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            executeCommand();
        }
    });
    
    // Komut çalıştırma
    async function executeCommand() {
        const command = commandInput.value.trim();
        if (!command) {
            showStatus('❌ Lütfen bir komut girin', 'error');
            return;
        }
        
        console.log('🎯 Komut çalıştırılıyor:', command);
        showStatus('🤖 Opera Agent sistemi başlatılıyor...', 'info');
        
        try {
            // Backend'e komut gönder (Opera uyumlu)
            const response = await fetch(`${BACKEND_URL}/full-automation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    command: command,
                    current_url: currentPageInfo.url,
                    page_content: currentPageInfo.content
                })
            });
            
            const result = await response.json();
            console.log('📊 Backend yanıtı:', result);
            
            if (result.success) {
                showStatus('✅ Opera Agent sistemi tamamlandı!', 'success');
                displayResults(result);
                
                // Opera komutlarını çalıştır
                if (result.opera_commands && result.opera_commands.length > 0) {
                    await executeOperaCommands(result.opera_commands);
                }
                
                // Geçmişe ekle
                addToHistory(command, result);
            } else {
                showStatus(`❌ Hata: ${result.error}`, 'error');
                console.error('Backend hatası:', result.error);
            }
            
        } catch (error) {
            console.error('❌ Fetch hatası:', error);
            showStatus(`❌ Bağlantı hatası: ${error.message}`, 'error');
        }
    }
    
    // Sayfa analizi
    async function analyzePage() {
        if (!currentPageInfo.url) {
            showStatus('❌ Aktif sayfa bulunamadı', 'error');
            return;
        }
        
        console.log('📊 Sayfa analizi başlatılıyor:', currentPageInfo.url);
        showStatus('📊 Sayfa analizi yapılıyor...', 'info');
        
        try {
            const response = await fetch(`${BACKEND_URL}/analyze-page`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: currentPageInfo.url,
                    content: currentPageInfo.content,
                    command: 'Bu sayfayı detaylı analiz et'
                })
            });
            
            const result = await response.json();
            console.log('📊 Analiz sonucu:', result);
            
            if (result.success) {
                showStatus('✅ Sayfa analizi tamamlandı!', 'success');
                displayAnalysisResults(result);
                
                // Geçmişe ekle
                addToHistory('Sayfa Analizi', result);
            } else {
                showStatus(`❌ Analiz hatası: ${result.error}`, 'error');
            }
            
        } catch (error) {
            console.error('❌ Analiz hatası:', error);
            showStatus(`❌ Analiz hatası: ${error.message}`, 'error');
        }
    }
    
    // Opera komutlarını çalıştır
    async function executeOperaCommands(commands) {
        console.log('🎭 Opera komutları çalıştırılıyor:', commands);
        
        for (const command of commands) {
            try {
                if (command.type === 'tab_action') {
                    await executeTabAction(command.data);
                } else if (command.type === 'page_interaction') {
                    await executePageInteraction(command.data);
                } else if (command.type === 'page_analysis') {
                    console.log('📊 Sayfa analizi komutu (zaten yapıldı)');
                }
                
                // Komutlar arası gecikme
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error('❌ Opera komut hatası:', error);
            }
        }
    }
    
    // Tab işlemleri
    async function executeTabAction(actionData) {
        console.log('📍 Tab işlemi:', actionData);
        
        if (actionData.action === 'create_tab') {
            // Yeni sekme oluştur
            chrome.tabs.create({
                url: actionData.url,
                active: actionData.active || false
            }, function(tab) {
                console.log('✅ Yeni sekme oluşturuldu:', tab.id);
                showStatus(`✅ Yeni sekme açıldı: ${actionData.url}`, 'success');
            });
            
        } else if (actionData.action === 'navigate') {
            // Mevcut sekmede navigasyon
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs[0]) {
                    chrome.tabs.update(tabs[0].id, {url: actionData.url}, function() {
                        console.log('✅ Navigasyon tamamlandı:', actionData.url);
                        showStatus(`✅ Sayfa yüklendi: ${actionData.url}`, 'success');
                    });
                }
            });
        }
    }
    
    // Sayfa etkileşimleri
    async function executePageInteraction(actionData) {
        console.log('🔄 Sayfa etkileşimi:', actionData);
        
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) {
                chrome.tabs.executeScript(tabs[0].id, {
                    code: `
                        // Sayfa etkileşimi kodu
                        console.log('🔄 Sayfa etkileşimi çalıştırılıyor:', ${JSON.stringify(actionData)});
                        
                        if ('${actionData.action}' === 'extract_data') {
                            const elements = document.querySelectorAll('${actionData.selector || 'body'}');
                            const data = Array.from(elements).map(el => ({
                                text: el.textContent.trim(),
                                html: el.innerHTML,
                                tag: el.tagName
                            }));
                            console.log('📊 Veri çıkarıldı:', data);
                        }
                        
                        'Sayfa etkileşimi tamamlandı';
                    `
                }, function(result) {
                    console.log('✅ Sayfa etkileşimi sonucu:', result);
                    showStatus('✅ Sayfa etkileşimi tamamlandı', 'success');
                });
            }
        });
    }
    
    // Sonuçları göster
    function displayResults(result) {
        let html = '<div class="result-container">';
        
        // Agent sistemi bilgisi
        if (result.agent_system) {
            html += '<div class="agent-info">🤖 Multi-Agent Sistemi Aktif</div>';
        }
        
        // Plan bilgisi
        if (result.plan) {
            html += '<div class="plan-info">';
            html += `<h4>📋 Plan: ${result.plan.command_type}</h4>`;
            if (result.plan.opera_actions) {
                html += '<ul>';
                result.plan.opera_actions.forEach(action => {
                    html += `<li>🎭 ${action.action}: ${action.description}</li>`;
                });
                html += '</ul>';
            }
            html += '</div>';
        }
        
        // Analiz sonuçları
        if (result.analysis) {
            html += '<div class="analysis-info">';
            html += '<h4>📊 Analiz Sonuçları</h4>';
            html += `<p><strong>Ana Konu:</strong> ${result.analysis.main_topic || 'Bilinmiyor'}</p>`;
            html += `<p><strong>Özet:</strong> ${result.analysis.summary || 'Analiz tamamlandı'}</p>`;
            html += '</div>';
        }
        
        // Validation bilgisi
        if (result.validation) {
            html += '<div class="validation-info">';
            html += `<h4>✅ Doğrulama (Skor: ${result.validation.success_score}/100)</h4>`;
            html += `<p>${result.validation.summary}</p>`;
            html += '</div>';
        }
        
        html += '</div>';
        resultsDiv.innerHTML = html;
    }
    
    // Analiz sonuçlarını göster
    function displayAnalysisResults(result) {
        let html = '<div class="analysis-container">';
        
        if (result.analysis_result) {
            const analysis = result.analysis_result;
            
            html += '<h4>📊 Sayfa Analizi Sonuçları</h4>';
            html += `<p><strong>Sayfa Başlığı:</strong> ${analysis.page_title || 'Bilinmiyor'}</p>`;
            html += `<p><strong>Ana Konu:</strong> ${analysis.main_topic || 'Bilinmiyor'}</p>`;
            
            if (analysis.key_information && analysis.key_information.length > 0) {
                html += '<h5>🔑 Önemli Bilgiler:</h5><ul>';
                analysis.key_information.forEach(info => {
                    html += `<li>${info}</li>`;
                });
                html += '</ul>';
            }
            
            if (analysis.products_services && analysis.products_services.length > 0) {
                html += '<h5>🛍️ Ürün/Hizmetler:</h5><ul>';
                analysis.products_services.forEach(item => {
                    html += `<li>${item}</li>`;
                });
                html += '</ul>';
            }
            
            if (analysis.important_links && analysis.important_links.length > 0) {
                html += '<h5>🔗 Önemli Linkler:</h5><ul>';
                analysis.important_links.forEach(link => {
                    html += `<li><a href="${link.url}" target="_blank">${link.text}</a></li>`;
                });
                html += '</ul>';
            }
            
            html += `<p><strong>Özet:</strong> ${analysis.summary || 'Analiz tamamlandı'}</p>`;
        }
        
        html += '</div>';
        resultsDiv.innerHTML = html;
    }
    
    // Durum göster
    function showStatus(message, type = 'info') {
        const colors = {
            'success': '#4CAF50',
            'error': '#f44336',
            'warning': '#ff9800',
            'info': '#2196F3'
        };
        
        statusDiv.style.color = colors[type] || colors.info;
        statusDiv.textContent = message;
        
        console.log(`📢 Status (${type}):`, message);
    }
    
    // Geçmişe ekle
    function addToHistory(command, result) {
        try {
            let history = JSON.parse(localStorage.getItem('opera_automation_history') || '[]');
            
            const historyItem = {
                timestamp: new Date().toLocaleString('tr-TR'),
                command: command,
                success: result.success,
                summary: result.analysis?.summary || result.validation?.summary || 'Tamamlandı',
                url: currentPageInfo.url
            };
            
            history.unshift(historyItem);
            
            // Son 50 kayıt tut
            if (history.length > 50) {
                history = history.slice(0, 50);
            }
            
            localStorage.setItem('opera_automation_history', JSON.stringify(history));
            loadHistory();
            
        } catch (error) {
            console.error('❌ Geçmiş kaydetme hatası:', error);
        }
    }
    
    // Geçmişi yükle
    function loadHistory() {
        try {
            const history = JSON.parse(localStorage.getItem('opera_automation_history') || '[]');
            
            let html = '<h4>📋 Son İşlemler</h4>';
            
            if (history.length === 0) {
                html += '<p>Henüz işlem geçmişi yok.</p>';
            } else {
                html += '<div class="history-list">';
                history.slice(0, 10).forEach(item => {
                    const statusIcon = item.success ? '✅' : '❌';
                    html += `
                        <div class="history-item">
                            <div class="history-header">
                                ${statusIcon} <strong>${item.command}</strong>
                                <span class="timestamp">${item.timestamp}</span>
                            </div>
                            <div class="history-summary">${item.summary}</div>
                        </div>
                    `;
                });
                html += '</div>';
            }
            
            historyDiv.innerHTML = html;
            
        } catch (error) {
            console.error('❌ Geçmiş yükleme hatası:', error);
            historyDiv.innerHTML = '<p>Geçmiş yüklenemedi.</p>';
        }
    }
    
    // Backend sağlık kontrolü
    async function checkBackendHealth() {
        try {
            const response = await fetch(`${BACKEND_URL}/health`);
            const result = await response.json();
            
            if (result.status === 'healthy') {
                console.log('💚 Backend sağlıklı:', result);
                showStatus(`💚 Backend v${result.version} hazır (Opera uyumlu)`, 'success');
            } else {
                showStatus('⚠️ Backend sorunlu', 'warning');
            }
            
        } catch (error) {
            console.error('❌ Backend bağlantı hatası:', error);
            showStatus('❌ Backend bağlantısı yok', 'error');
        }
    }
    
    // Sayfa yüklendiğinde backend kontrolü
    checkBackendHealth();
    
    console.log('🎭 Opera uyumlu popup hazır - Selenium kullanılmıyor!');
});

