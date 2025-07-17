# Opera AI Agent Sorun Giderme Kılavuzu

## Yaygın Sorunlar ve Çözümleri

### 1. "❌ Backend Bağlantısı Yok" Hatası

**Neden:** Backend servisi çalışmıyor veya erişilemiyor.

**Çözüm:**
```bash
# Backend'i başlatın
cd /home/ubuntu/ai-automation-backend/ai-automation-backend
python src/main.py
```

**Kontrol:**
```bash
curl http://localhost:5000/api/automation/health
```

### 2. "🔍 Sistem durumu kontrol ediliyor..." Takılı Kalması

**Olası Nedenler:**
- CORS sorunu
- Background script hatası
- API endpoint'i yanlış

**Çözüm:**
1. Tarayıcı konsolunu açın (F12)
2. Console sekmesinde hata mesajlarını kontrol edin
3. Network sekmesinde istekleri kontrol edin

**Debug Adımları:**
```javascript
// Console'da test edin
chrome.runtime.sendMessage({type: "HEALTH_CHECK"}, response => {
    console.log("Health check response:", response);
});
```

### 3. Eklenti Yüklenmiyor

**Olası Nedenler:**
- manifest.json hatası
- Dosya izinleri
- Opera sürümü uyumsuzluğu

**Çözüm:**
1. manifest.json dosyasını kontrol edin
2. Dosya izinlerini kontrol edin:
```bash
chmod -R 755 /home/ubuntu/opera_ai_agent_test
```

### 4. Popup Açılmıyor

**Çözüm:**
1. Eklentiyi yeniden yükleyin
2. Opera'yı yeniden başlatın
3. popup.html dosyasını doğrudan açın:
```
chrome-extension://[extension-id]/popup.html
```

### 5. Sidebar Açılmıyor

**Çözüm:**
1. Opera'nın sidebar desteğini kontrol edin
2. Fallback olarak yeni sekmede açılmasını bekleyin
3. Manuel olarak açın:
```
chrome-extension://[extension-id]/sidebar.html
```

### 6. Content Script Çalışmıyor

**Kontrol:**
```javascript
// Console'da kontrol edin
console.log("Content script loaded:", window.operaAIContentScript);
```

**Çözüm:**
1. Sayfayı yenileyin
2. Eklentiyi yeniden yükleyin
3. İzinleri kontrol edin

### 7. Backend API Hataları

**Gemini API Hatası:**
```bash
export GEMINI_API_KEY="your_api_key_here"
```

**CORS Hatası:**
- Backend'de CORS ayarlarını kontrol edin
- `CORS(app, origins="*")` olduğundan emin olun

### 8. Performans Sorunları

**Bellek Sızıntısı:**
1. Task Manager'da bellek kullanımını kontrol edin
2. Eklentiyi devre dışı bırakıp tekrar etkinleştirin

**Yavaş Yanıt:**
1. Backend loglarını kontrol edin
2. Ağ bağlantısını kontrol edin
3. Timeout ayarlarını artırın

## Debug Araçları

### 1. Tarayıcı Konsolu

**Background Script Debug:**
1. `opera://extensions/` adresine gidin
2. Eklentinin "Inspect views: background page" linkine tıklayın

**Popup Debug:**
1. Popup'ı açın
2. Popup üzerinde sağ tık → "Inspect"

**Content Script Debug:**
1. Web sayfasında F12'ye basın
2. Console sekmesinde content script loglarını görün

### 2. Network İzleme

1. F12 → Network sekmesi
2. Backend isteklerini izleyin
3. CORS hatalarını kontrol edin

### 3. Storage İnceleme

```javascript
// Console'da storage'ı kontrol edin
chrome.storage.local.get(null, (data) => {
    console.log("Storage data:", data);
});
```

### 4. Backend Logları

```bash
# Backend loglarını izleyin
tail -f /var/log/ai-automation.log
```

## Hata Kodları

### Backend Hata Kodları

- **500**: Internal Server Error - Backend hatası
- **404**: Not Found - Endpoint bulunamadı
- **400**: Bad Request - Geçersiz istek
- **403**: Forbidden - İzin hatası

### Extension Hata Kodları

- **CORS Error**: Cross-origin request blocked
- **Network Error**: Ağ bağlantısı sorunu
- **Timeout Error**: İstek zaman aşımı
- **Permission Error**: İzin hatası

## Performans Optimizasyonu

### 1. Backend Optimizasyonu

```python
# Selenium yerine requests kullanın
import requests
response = requests.get(url, timeout=30)
```

### 2. Frontend Optimizasyonu

```javascript
// Debounce kullanın
const debouncedFunction = debounce(originalFunction, 300);
```

### 3. Bellek Yönetimi

```javascript
// Event listener'ları temizleyin
window.removeEventListener('beforeunload', handler);
```

## Güvenlik Kontrolleri

### 1. XSS Koruması

```javascript
// HTML içeriğini sanitize edin
const sanitizedContent = DOMPurify.sanitize(userInput);
```

### 2. CORS Güvenliği

```python
# Sadece güvenli origin'lere izin verin
CORS(app, origins=["chrome-extension://*"])
```

### 3. Input Validation

```javascript
// Kullanıcı girdilerini doğrulayın
if (!/^[a-zA-Z0-9\s]+$/.test(userInput)) {
    throw new Error("Geçersiz karakter");
}
```

## Yedekleme ve Geri Yükleme

### Settings Yedekleme

```javascript
// Ayarları dışa aktar
chrome.storage.local.get(null, (data) => {
    const backup = JSON.stringify(data);
    // Dosyaya kaydet
});
```

### History Yedekleme

```javascript
// Geçmişi dışa aktar
chrome.storage.local.get(['chatHistory'], (data) => {
    const backup = JSON.stringify(data.chatHistory);
    // Dosyaya kaydet
});
```

## İletişim ve Destek

### Log Toplama

1. Tarayıcı konsol logları
2. Backend logları
3. Network istekleri
4. Error stack trace'leri

### Bug Raporu Formatı

```
**Sorun:** [Kısa açıklama]
**Adımlar:** [Sorunu yeniden oluşturma adımları]
**Beklenen:** [Beklenen davranış]
**Gerçekleşen:** [Gerçek davranış]
**Tarayıcı:** Opera [versiyon]
**OS:** [İşletim sistemi]
**Loglar:** [Konsol logları]
```

