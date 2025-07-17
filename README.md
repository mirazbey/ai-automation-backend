# AI Automation Backend

Gemini AI ile desteklenen web otomasyonu servisi. Bu servis, doğal dil komutlarını analiz ederek web tarayıcısı üzerinde otomatik işlemler gerçekleştirir.

## Özellikler

- **Doğal Dil İşleme**: Gemini AI kullanarak kullanıcı komutlarını analiz eder
- **Web Otomasyonu**: Selenium ile tarayıcı otomasyonu
- **İnsan Benzeri Davranış**: Rastgele gecikmeler ve doğal hareket simülasyonu
- **CAPTCHA Desteği**: İnsan benzeri davranışlarla CAPTCHA'ları aşma yeteneği
- **Cross-Origin Desteği**: Tarayıcı eklentileri için CORS desteği

## Kurulum

1. Gerekli paketleri yükleyin:
```bash
pip install -r requirements.txt
```

2. Chrome WebDriver'ı yükleyin (otomatik olarak yönetilir)

3. Çevre değişkenlerini ayarlayın:
```bash
cp .env.example .env
# .env dosyasını düzenleyerek GEMINI_API_KEY'i ekleyin
```

4. Uygulamayı başlatın:
```bash
python src/main.py
```

## API Endpoints

### 1. Sağlık Kontrolü
```
GET /api/automation/health
```

### 2. Görev Analizi
```
POST /api/automation/analyze-task
Content-Type: application/json

{
    "command": "Google'da Python öğrenme kaynaklarını ara"
}
```

### 3. Otomasyon Çalıştırma
```
POST /api/automation/execute-automation
Content-Type: application/json

{
    "task_plan": {
        "steps": [...]
    }
}
```

### 4. Tam Otomasyon (Önerilen)
```
POST /api/automation/full-automation
Content-Type: application/json

{
    "command": "Sahibinden.com'da İstanbul'da satılık daire ara"
}
```

## Kullanım Örnekleri

### Basit Arama
```json
{
    "command": "Google'da 'Python tutorial' ara"
}
```

### E-ticaret Arama
```json
{
    "command": "Hepsiburada'da iPhone 15 ara ve fiyatları karşılaştır"
}
```

### Sahibinden.com Arama
```json
{
    "command": "Sahibinden.com'da İstanbul Kadıköy'de 2+1 kiralık daire ara"
}
```

## Desteklenen Aksiyonlar

- **navigate**: Belirtilen URL'ye git
- **click**: Belirtilen elementi tıkla
- **type**: Belirtilen alana metin yaz
- **wait**: Belirtilen süre bekle
- **scrape**: Belirtilen elementlerden veri topla
- **scroll**: Sayfayı yukarı/aşağı kaydır

## İnsan Benzeri Davranış

Sistem aşağıdaki özelliklerle insan benzeri davranış sergiler:

- Rastgele gecikmeler (1-3 saniye)
- Doğal yazma hızı (karakter başına 0.05-0.2 saniye)
- Mouse hareketleri ile element tıklama
- Gerçekçi User-Agent kullanımı

## Güvenlik

- API anahtarları çevre değişkenlerinde saklanır
- CORS politikaları yapılandırılabilir
- Rate limiting uygulanabilir (gelecek sürümlerde)

## Opera Eklentisi Entegrasyonu

Bu backend, Opera eklentileri tarafından çağrılabilir. Eklentinizde şu şekilde kullanabilirsiniz:

```javascript
// Opera eklentisinde
fetch('http://localhost:5000/api/automation/full-automation', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        command: userInput
    })
})
.then(response => response.json())
.then(data => {
    console.log('Automation result:', data);
});
```

## Sınırlamalar

- Headless Chrome kullanır (görsel arayüz yok)
- Bazı siteler bot tespiti yapabilir
- JavaScript yoğun siteler için ek bekleme süreleri gerekebilir
- CAPTCHA'lar için manuel müdahale gerekebilir

## Geliştirme

Yeni özellikler eklemek için `src/routes/automation.py` dosyasını düzenleyin.

## Lisans

MIT License

