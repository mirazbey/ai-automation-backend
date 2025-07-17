# Opera AI Agent Test Senaryoları

## 1. Eklenti Yükleme Testi

### Adımlar:
1. Opera'yı açın
2. `opera://extensions/` adresine gidin
3. "Geliştirici modu"nu etkinleştirin
4. "Paketlenmemiş uzantı yükle" butonuna tıklayın
5. `/home/ubuntu/opera_ai_agent_test` klasörünü seçin

### Beklenen Sonuç:
- Eklenti başarıyla yüklenir
- Araç çubuğunda eklenti simgesi görünür
- Hata mesajı görünmez

## 2. Popup Arayüzü Testi

### Adımlar:
1. Eklenti simgesine tıklayın
2. Popup penceresinin açılmasını bekleyin
3. Durum mesajını kontrol edin

### Beklenen Sonuç:
- Popup penceresi açılır
- "✅ Sistem Hazır" mesajı görünür
- Tüm butonlar aktif hale gelir
- Arayüz düzgün görünür

### Olası Sorunlar:
- "❌ Backend Bağlantısı Yok" mesajı: Backend servisi çalışmıyor
- "🔍 Sistem durumu kontrol ediliyor..." takılı kalır: CORS veya bağlantı sorunu

## 3. Backend İletişim Testi

### Adımlar:
1. Popup'ta "Yenile" butonuna tıklayın
2. Tarayıcı konsolunu açın (F12)
3. Console sekmesinde hata mesajlarını kontrol edin

### Beklenen Sonuç:
- Backend sağlık kontrolü başarılı
- Console'da "✅ Backend sağlıklı" mesajı
- Hata mesajı yok

## 4. Sayfa Analizi Testi

### Adımlar:
1. Herhangi bir web sayfasına gidin (örn: google.com)
2. Eklenti popup'ını açın
3. "📊 Sayfa Analizi" butonuna tıklayın

### Beklenen Sonuç:
- "📊 Sayfa analiz ediliyor..." mesajı görünür
- Analiz tamamlandığında "✅ Sayfa analizi tamamlandı" mesajı
- Bildirim gösterilir

## 5. Hızlı Arama Testi

### Adımlar:
1. Popup'ta "🔍 Hızlı Arama" butonuna tıklayın
2. Arama terimini girin (örn: "Python tutorial")
3. Onaylayın

### Beklenen Sonuç:
- "🤖 Görev başlatılıyor..." mesajı
- Yeni sekme açılır
- Arama gerçekleştirilir

## 6. Sidebar Testi

### Adımlar:
1. Popup'ta "📋 Sidebar Aç" butonuna tıklayın
2. Sidebar'ın açılmasını bekleyin

### Beklenen Sonuç:
- Sidebar açılır veya yeni sekmede sidebar.html açılır
- Hoş geldin mesajı görünür
- Örnek komutlar listelenir

## 7. Otomasyon Testi

### Adımlar:
1. Sidebar'da örnek komutlardan birini seçin
2. Veya manuel komut girin: "Google'da Python ara"
3. Gönder butonuna tıklayın

### Beklenen Sonuç:
- Komut backend'e gönderilir
- "🤖 AI komutu analiz ediyor..." mesajı
- Sonuç mesajı görünür

## 8. Ayarlar Testi

### Adımlar:
1. Popup'ta "⚙️ Ayarlar" butonuna tıklayın
2. Ayarlar sayfasının açılmasını bekleyin
3. Bir ayarı değiştirin ve kaydedin

### Beklenen Sonuç:
- Ayarlar sayfası açılır
- Mevcut ayarlar yüklenir
- Değişiklikler kaydedilir

## 9. Content Script Testi

### Adımlar:
1. Herhangi bir web sayfasında Ctrl+Shift+A tuşlarına basın
2. Tarayıcı konsolunu kontrol edin

### Beklenen Sonuç:
- Content script yüklenir
- Klavye kısayolu çalışır
- Console'da "🎯 Opera AI Agent Content Script yüklendi" mesajı

## 10. Hata Durumu Testleri

### Test 1: Backend Kapalı
1. Backend servisini durdurun
2. Eklenti popup'ını açın
3. Herhangi bir işlem yapmaya çalışın

**Beklenen:** Hata mesajları düzgün gösterilir

### Test 2: Geçersiz URL
1. Ayarlarda API URL'sini geçersiz bir değere değiştirin
2. İşlem yapmaya çalışın

**Beklenen:** Bağlantı hatası mesajı

### Test 3: Ağ Kesintisi
1. İnternet bağlantısını kesin
2. İşlem yapmaya çalışın

**Beklenen:** Timeout hatası mesajı

## Performans Testleri

### Test 1: Bellek Kullanımı
1. Eklentiyi yükleyin
2. Task Manager'da bellek kullanımını kontrol edin
3. Birkaç işlem yapın
4. Bellek sızıntısı olup olmadığını kontrol edin

### Test 2: Yanıt Süresi
1. Basit bir komut gönderin
2. Yanıt süresini ölçün
3. Karmaşık bir komut gönderin
4. Yanıt süresini karşılaştırın

## Güvenlik Testleri

### Test 1: XSS Koruması
1. Zararlı script içeren komut gönderin
2. Eklentinin güvenli davranıp davranmadığını kontrol edin

### Test 2: CORS Koruması
1. Farklı origin'den istek göndermeye çalışın
2. CORS politikalarının çalıştığını kontrol edin

## Kullanıcı Deneyimi Testleri

### Test 1: Responsive Tasarım
1. Farklı ekran boyutlarında test edin
2. Popup ve sidebar'ın düzgün görünüp görünmediğini kontrol edin

### Test 2: Erişilebilirlik
1. Klavye navigasyonunu test edin
2. Screen reader uyumluluğunu kontrol edin

### Test 3: Tema Desteği
1. Ayarlarda temayı değiştirin
2. Arayüzün uygun şekilde güncellenip güncellenmediğini kontrol edin

