# Opera AI Agent Eklentisi Tasarım Belgesi

## 1. Giriş

Bu belge, mevcut "Fırsat Avcısı" Opera eklentisinin sorunlarını gidermek ve Nanobrowser benzeri gelişmiş bir AI Agent ve otomasyon aracı haline getirmek için tasarlanacak yeni mimariyi detaylandırmaktadır. Mevcut eklenti, "durum kontrol ediliyor..." mesajında takılı kalmakta ve arayüzdeki butonlar deaktif durumda bulunmaktadır. Bu sorunların kök nedenleri belirlenerek, Opera tarayıcısının yerel API'leri kullanılarak daha sağlam ve işlevsel bir çözüm sunulacaktır.

## 2. Mevcut Sorunların Kök Neden Analizi

### 2.1. "Durum kontrol ediliyor..." Mesajı ve Buton Deaktivasyonu

`popup.js` dosyasında bulunan `checkBackendHealth()` fonksiyonu, eklentinin backend servisiyle iletişim kurarak sağlık durumunu kontrol etmektedir. Bu fonksiyon, `chrome.runtime.sendMessage` kullanarak `background.js`'e bir `HEALTH_CHECK` mesajı göndermektedir. Eğer backend yanıt vermezse veya yanıt sağlıklı değilse, durum mesajı takılı kalır ve arayüzdeki butonlar aktif hale gelmez.

**Olası Kök Nedenler:**

*   **Backend Servisinin Çalışmaması veya Erişilememesi:** Backend servisi (Python Flask uygulaması) başlatılmamış olabilir veya `http://localhost:5000` adresinden erişilemiyor olabilir. `manifest.json` dosyasında `host_permissions` altında `http://127.0.0.1:5000/*` izni olmasına rağmen, backend'in gerçekten bu adreste dinlediğinden ve güvenlik duvarı gibi engellerin olmadığından emin olunmalıdır.
*   **CORS Sorunları:** Eklenti (frontend) ile backend arasındaki iletişimde Çapraz Kaynak Paylaşımı (CORS) sorunları yaşanıyor olabilir. `src/main.py` dosyasında `CORS(app, origins=


"*"` ile tüm originlere izin verilmiş olsa da, bazı durumlarda tarayıcı güvenlik politikaları veya yanlış yapılandırmalar CORS sorunlarına yol açabilir.
*   **`background.js` ile İletişim Sorunları:** `popup.js`'in `chrome.runtime.sendMessage` ile `background.js`'e mesaj göndermesinde veya `background.js`'in bu mesajı doğru şekilde işlemesinde bir sorun olabilir. `background.js`'in backend ile iletişimi sağlayan kısmı düzgün çalışmıyor olabilir.
*   **Selenium Bağımlılığı (Kaldırılmış Olsa Bile):** `pasted_content.txt`'de Selenium'un tamamen kaldırıldığı belirtilse de, eski kod kalıntıları veya mantıksal hatalar nedeniyle hala bir yerlerde Selenium'a bağımlılık olabilir veya backend'in sağlıklı çalışması için gerekli olan bazı Selenium bileşenleri eksik olabilir. Ancak, `requirements.txt`'de Selenium'un hala bir bağımlılık olarak listelenmesi, bu konuda bir çelişki olduğunu göstermektedir. Backend'in gerçekten Selenium'a ihtiyaç duyup duymadığı netleştirilmelidir.

## 3. Yeni Mimari ve Çözüm Önerileri

### 3.1. Backend-Frontend İletişimi ve CORS

Backend'in `http://localhost:5000` adresinde çalıştığı ve sağlık kontrolünün başarılı olduğu gözlemlenmiştir. Bu durumda, eklentinin frontend kısmının backend'e ulaşamamasının ana nedeni CORS veya `chrome.runtime.sendMessage` ile ilgili bir sorun olabilir. 

**Çözüm:**

*   **Backend URL Doğrulaması:** `opera-extension/settings.js` dosyasındaki `API_BASE_URL` değişkeninin `http://localhost:5000/api/automation` olarak ayarlandığından emin olunmalıdır. Bu URL, backend'in `src/main.py` dosyasında tanımlanan `/api/automation` prefix'i ile eşleşmelidir.
*   **CORS Kontrolü:** Flask uygulamasında `CORS(app, origins=


"*"` olarak ayarlanmış olsa da, tarayıcı tarafında bir sorun olup olmadığını kontrol etmek için tarayıcı konsolundaki ağ istekleri incelenmelidir. Gerekirse, `origins` parametresi spesifik olarak eklentinin URL'sini içerecek şekilde güncellenebilir (örn: `chrome-extension://<extension_id>`).

### 3.2. Opera API Kullanımı (`chrome.runtime.sendMessage` ve `chrome.sidePanel`)

`popup.js` ve `sidebar.js` dosyaları, eklentinin farklı bölümleri arasında ve `background.js` ile iletişim kurmak için `chrome.runtime.sendMessage` kullanmaktadır. `background.js` ise bu mesajları dinleyerek backend ile etkileşimi sağlamaktadır. `sidebar.js` ayrıca `fetch` API'sini doğrudan backend ile iletişim kurmak için kullanmaktadır.

**Çözüm:**

*   **`background.js` Mesaj İşleme Doğrulaması:** `background.js` dosyasının `chrome.runtime.onMessage.addListener` ve `chrome.runtime.onConnect.addListener` kısımlarının, `popup.js` ve `sidebar.js`'ten gelen mesajları doğru şekilde işlediğinden emin olunmalıdır. Özellikle `HEALTH_CHECK` mesajının doğru yanıtlandığı ve `EXECUTE_AUTOMATION` mesajının backend'e iletildiği kontrol edilmelidir.
*   **`chrome.sidePanel` Kullanımı:** `popup.js` içindeki `openSidebar()` fonksiyonu, Opera'nın yan panelini açmak için `chrome.sidePanel.open()` kullanmaktadır. Bu API'nin Opera'da doğru şekilde çalıştığından ve `manifest.json` dosyasında `sidebar_action` tanımının doğru olduğundan emin olunmalıdır. Eğer yan panel açılmıyorsa, `chrome.tabs.create` ile yeni bir sekmede `sidebar.html`'in açılması bir yedek çözüm olarak kullanılmaktadır.

### 3.3. Multi-Agent Sistemi Entegrasyonu

Mevcut eklenti, `pasted_content.txt`'de belirtildiği gibi bir Multi-Agent sistemi (Planner, Navigator, Analyzer, Validator) kullanmaktadır. Bu ajanların Opera tarayıcısı ile etkileşimi, `background.js` üzerinden sağlanmaktadır. Nanobrowser projesi de benzer bir ajan tabanlı yapıya sahiptir ve `background/index.ts` dosyasında `Executor` sınıfı aracılığıyla ajanların yönetimi ve tarayıcı etkileşimi gerçekleştirilmektedir.

**Çözüm:**

*   **Ajanların Opera API'leri ile Etkileşimi:** Mevcut backend'deki ajanların (özellikle `automation.py` içindeki) tarayıcı etkileşimleri için Selenium yerine Opera'nın yerel API'lerini kullanacak şekilde güncellenmesi gerekmektedir. Bu, `chrome.tabs`, `chrome.scripting`, `chrome.webNavigation` gibi API'lerin kullanılması anlamına gelir. Nanobrowser'ın `browser/context.ts` ve `agent/executor.ts` dosyaları bu konuda iyi bir referans olabilir.
*   **Tarayıcı Otomasyonu:** Yeni sekme açma, sayfa analizi, veri çıkarma gibi otomasyon görevleri için Opera'nın `chrome.tabs.create`, `chrome.scripting.executeScript` (content script enjeksiyonu için) ve `chrome.webNavigation` API'leri kullanılmalıdır. Bu, Selenium bağımlılığını tamamen ortadan kaldıracaktır.

### 3.4. Hata Ayıklama ve Test Stratejisi

Mevcut eklentideki sorunların tespiti ve giderilmesi için kapsamlı bir hata ayıklama ve test stratejisi belirlenmelidir.

**Çözüm:**

*   **Tarayıcı Konsolu ve Geliştirici Araçları:** Opera'nın geliştirici araçları (F12) kullanılarak hem eklentinin popup/sidebar'ı hem de arka plan betiği (`background.js`) için konsol çıktıları, ağ istekleri ve hatalar izlenmelidir.
*   **Backend Logları:** Backend (Flask uygulaması) tarafından üretilen loglar, backend tarafındaki hataları ve işlem akışını anlamak için düzenli olarak kontrol edilmelidir.
*   **Birim Testleri:** Ajanların ve tarayıcı etkileşim mantığının ayrı ayrı test edilmesi için birim testleri yazılabilir. Bu, özellikle karmaşık otomasyon senaryolarında hataları erken yakalamaya yardımcı olacaktır.
*   **Entegrasyon Testleri:** Frontend, backend ve tarayıcı API'lerinin birlikte çalıştığını doğrulamak için entegrasyon testleri yapılmalıdır. Bu testler, eklentinin uçtan uca işlevselliğini doğrular.

## 4. Sonuç

Bu tasarım belgesinde özetlenen yaklaşımlar, mevcut Fırsat Avcısı eklentisinin sorunlarını çözmeyi ve onu Opera tarayıcısında tam işlevsel, Nanobrowser benzeri bir AI Agent ve otomasyon aracına dönüştürmeyi hedeflemektedir. Selenium bağımlılığının tamamen kaldırılması ve Opera'nın yerel API'lerinin etkin kullanımı, eklentinin performansını ve güvenilirliğini önemli ölçüde artıracaktır.

