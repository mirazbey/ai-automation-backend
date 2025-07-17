# Opera AI Agent Kurulum Kılavuzu

## 📋 Sistem Gereksinimleri

- **Opera Tarayıcısı:** Versiyon 60 veya üzeri
- **Python:** 3.8 veya üzeri
- **İşletim Sistemi:** Windows, macOS, Linux
- **RAM:** Minimum 4GB (8GB önerilir)
- **Disk Alanı:** 500MB boş alan

## 🚀 Hızlı Kurulum

### 1. Backend Kurulumu

```bash
# 1. Backend klasörüne gidin
cd /home/ubuntu/ai-automation-backend/ai-automation-backend

# 2. Python bağımlılıklarını yükleyin
pip install -r requirements.txt

# 3. Gemini API anahtarını ayarlayın
export GEMINI_API_KEY="your_gemini_api_key_here"

# 4. Backend'i başlatın
python src/main.py
```

### 2. Eklenti Kurulumu

1. **Opera'yı açın**
2. **Adres çubuğuna** `opera://extensions/` **yazın**
3. **"Geliştirici modu"nu etkinleştirin** (sağ üst köşede)
4. **"Paketlenmemiş uzantı yükle"** butonuna tıklayın
5. **`/home/ubuntu/opera_ai_agent_test`** klasörünü seçin
6. **"Klasörü Seç"** butonuna tıklayın

### 3. İlk Kullanım

1. **Eklenti simgesine tıklayın** (araç çubuğunda)
2. **"✅ Sistem Hazır"** mesajını görmelisiniz
3. **"📊 Sayfa Analizi"** butonunu test edin
4. **Sidebar'ı açın** ve örnek komutları deneyin

## 🔧 Detaylı Kurulum

### Backend Yapılandırması

#### Gemini API Anahtarı Alma

1. [Google AI Studio](https://makersuite.google.com/app/apikey) adresine gidin
2. Google hesabınızla giriş yapın
3. "Create API Key" butonuna tıklayın
4. API anahtarını kopyalayın

#### Environment Variables

**Linux/macOS:**
```bash
echo 'export GEMINI_API_KEY="your_api_key_here"' >> ~/.bashrc
source ~/.bashrc
```

**Windows:**
```cmd
setx GEMINI_API_KEY "your_api_key_here"
```

#### Backend Test

```bash
# Sağlık kontrolü
curl http://localhost:5000/api/automation/health

# Beklenen yanıt:
{
  "browser_mode": "visible",
  "gemini_configured": true,
  "message": "Sistem hazır - Görünür mod aktif",
  "service": "AI Automation Backend - Visible Mode",
  "status": "healthy"
}
```

### Eklenti Yapılandırması

#### İzinler Kontrolü

Eklenti şu izinlere ihtiyaç duyar:
- ✅ **activeTab** - Aktif sekme erişimi
- ✅ **storage** - Ayarları kaydetme
- ✅ **scripting** - Sayfa etkileşimi
- ✅ **tabs** - Sekme yönetimi
- ✅ **webNavigation** - Sayfa navigasyonu
- ✅ **background** - Arka plan işlemleri
- ✅ **alarms** - Zamanlanmış görevler
- ✅ **notifications** - Bildirimler
- ✅ **contextMenus** - Sağ tık menüsü
- ✅ **unlimitedStorage** - Sınırsız depolama

#### Host Permissions

- ✅ `http://127.0.0.1:5000/*` - Backend erişimi
- ✅ `http://localhost:5000/*` - Backend erişimi (alternatif)
- ✅ `https://*/*` - HTTPS siteleri
- ✅ `http://*/*` - HTTP siteleri

## 🎯 Özellik Testleri

### 1. Popup Testi

**Adımlar:**
1. Eklenti simgesine tıklayın
2. Popup penceresinin açılmasını bekleyin

**Başarı Kriterleri:**
- ✅ Popup açılır
- ✅ "✅ Sistem Hazır" mesajı görünür
- ✅ Tüm butonlar aktif
- ✅ Arayüz düzgün görünür

### 2. Sidebar Testi

**Adımlar:**
1. "📋 Sidebar Aç" butonuna tıklayın
2. Sidebar'ın açılmasını bekleyin

**Başarı Kriterleri:**
- ✅ Sidebar açılır veya yeni sekmede açılır
- ✅ Hoş geldin mesajı görünür
- ✅ Örnek komutlar listelenir

### 3. Sayfa Analizi Testi

**Adımlar:**
1. Herhangi bir web sayfasına gidin
2. "📊 Sayfa Analizi" butonuna tıklayın

**Başarı Kriterleri:**
- ✅ "📊 Sayfa analiz ediliyor..." mesajı
- ✅ Analiz tamamlandığında bildirim
- ✅ Sonuç mesajı görünür

### 4. Otomasyon Testi

**Adımlar:**
1. Sidebar'da "Google'da Python ara" komutunu seçin
2. Gönder butonuna tıklayın

**Başarı Kriterleri:**
- ✅ Komut backend'e gönderilir
- ✅ "🤖 AI komutu analiz ediyor..." mesajı
- ✅ Sonuç mesajı görünür

## 🔍 Sorun Giderme

### Yaygın Sorunlar

#### "❌ Backend Bağlantısı Yok"

**Çözüm:**
```bash
# Backend'in çalışıp çalışmadığını kontrol edin
curl http://localhost:5000/api/automation/health

# Çalışmıyorsa başlatın
cd /home/ubuntu/ai-automation-backend/ai-automation-backend
python src/main.py
```

#### "Eklenti Yüklenmiyor"

**Çözüm:**
1. Dosya izinlerini kontrol edin:
```bash
chmod -R 755 /home/ubuntu/opera_ai_agent_test
```

2. manifest.json dosyasını kontrol edin
3. Opera'yı yeniden başlatın

#### "Popup Açılmıyor"

**Çözüm:**
1. Eklentiyi yeniden yükleyin
2. Opera'yı yeniden başlatın
3. Geliştirici araçlarında hataları kontrol edin

### Debug Araçları

#### Tarayıcı Konsolu

1. **Background Script:** `opera://extensions/` → "Inspect views: background page"
2. **Popup:** Popup üzerinde sağ tık → "Inspect"
3. **Content Script:** Web sayfasında F12 → Console

#### Network İzleme

1. F12 → Network sekmesi
2. Backend isteklerini izleyin
3. CORS hatalarını kontrol edin

## 📊 Performans Optimizasyonu

### Backend Optimizasyonu

```python
# Selenium yerine requests kullanın (daha hızlı)
import requests
response = requests.get(url, timeout=30)
```

### Frontend Optimizasyonu

```javascript
// Debounce kullanın (gereksiz istekleri önler)
const debouncedFunction = debounce(originalFunction, 300);
```

### Bellek Yönetimi

- Task Manager'da bellek kullanımını izleyin
- Gereksiz event listener'ları temizleyin
- Storage'ı düzenli olarak temizleyin

## 🔒 Güvenlik

### API Anahtarı Güvenliği

- API anahtarını asla kod içinde saklamayın
- Environment variable kullanın
- Düzenli olarak yenileyin

### CORS Güvenliği

```python
# Sadece güvenli origin'lere izin verin
CORS(app, origins=["chrome-extension://*"])
```

### Input Validation

```javascript
// Kullanıcı girdilerini doğrulayın
if (!/^[a-zA-Z0-9\s]+$/.test(userInput)) {
    throw new Error("Geçersiz karakter");
}
```

## 📱 Mobil Uyumluluk

Opera Mobile'da test etmek için:
1. Responsive tasarımı kontrol edin
2. Touch event'leri test edin
3. Performansı mobil cihazlarda test edin

## 🌐 Çoklu Dil Desteği

Şu anda Türkçe desteklenmektedir. Başka diller eklemek için:

1. `_locales` klasörü oluşturun
2. Her dil için alt klasör ekleyin
3. `messages.json` dosyalarını çevirin

## 📈 Güncelleme

Eklentiyi güncellemek için:

1. Yeni dosyaları indirin
2. Eski dosyaların üzerine kopyalayın
3. Opera'da eklentiyi yeniden yükleyin
4. Ayarları kontrol edin

## 🆘 Destek

Sorun yaşıyorsanız:

1. **Troubleshooting Guide** dosyasını kontrol edin
2. **Test Scenarios** dosyasını kullanarak test edin
3. Konsol loglarını toplayın
4. Bug raporu oluşturun

## 📄 Lisans

Bu proje açık kaynak kodludur. Detaylar için LICENSE dosyasını kontrol edin.

