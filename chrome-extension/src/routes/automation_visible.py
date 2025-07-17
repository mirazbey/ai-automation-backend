from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
import google.generativeai as genai
import json
import os
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.action_chains import ActionChains
import time
import random
import re
import logging

# Logging yapılandırması
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

automation_bp = Blueprint('automation', __name__)

# Gemini API yapılandırması
def configure_gemini():
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is required")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-2.0-flash")

# Web driver yapılandırması (GÖRÜNÜR MOD)
def create_driver():
    chrome_options = Options()
    # HEADLESS MODUNU KAPATTIK - Artık görünür çalışacak
    # chrome_options.add_argument('--headless')  # Bu satırı kaldırdık
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--window-size=1920,1080')
    chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
    
    # Yeni sekme açma ayarları
    chrome_options.add_argument('--new-window')
    chrome_options.add_experimental_option('useAutomationExtension', False)
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    
    driver = webdriver.Chrome(options=chrome_options)
    return driver

# İnsan benzeri davranış simülasyonu
def human_like_delay():
    time.sleep(random.uniform(2, 4))  # Biraz daha uzun bekleme

def human_like_typing(element, text):
    for char in text:
        element.send_keys(char)
        time.sleep(random.uniform(0.1, 0.3))

def extract_json_from_response(response_text):
    """Gemini yanıtından JSON'u çıkarır"""
    response_text = response_text.strip()
    
    # Markdown kod bloğu varsa temizle
    if response_text.startswith('```json') and response_text.endswith('```'):
        response_text = response_text[len('```json'):-len('```')].strip()
    elif response_text.startswith('```') and response_text.endswith('```'):
        response_text = response_text[len('```'):-len('```')].strip()
    
    # JSON'u regex ile bul
    json_pattern = r'\{.*\}'
    match = re.search(json_pattern, response_text, re.DOTALL)
    if match:
        return match.group(0)
    
    return response_text

@automation_bp.route('/full-automation', methods=['POST'])
@cross_origin()
def full_automation():
    """Kullanıcı komutunu analiz edip otomasyonu GÖRÜNÜR modda çalıştırır"""
    try:
        logger.info("🎯 Görünür otomasyon başlatılıyor...")
        data = request.json
        user_command = data.get('command', '')
        
        if not user_command:
            return jsonify({'error': 'Command is required'}), 400
        
        logger.info(f"📝 Kullanıcı komutu: {user_command}")
        
        # 1. Komutu analiz et
        logger.info("🤖 1. Adım: Komut analiz ediliyor...")
        model = configure_gemini()
        
        # Gelişmiş prompt - Daha detaylı analiz ve site gezintisi için
        prompt = f"""
        Kullanıcının şu komutunu analiz et ve web otomasyonu için JSON formatında adımlar oluştur:
        "{user_command}"
        
        ÖNEMLİ: Eğer arama komutu ise, Google'da arama yap, sonra ilk 3-5 siteye gir, her sitede:
        - Ürün/hizmet bilgilerini topla
        - Fiyat bilgilerini bul
        - İletişim bilgilerini topla
        - Önemli linkleri kaydet
        
        SADECE JSON formatında yanıt ver. Başka hiçbir metin ekleme.
        
        {{
            "task_type": "web_automation",
            "target_site": "google.com",
            "steps": [
                {{
                    "action": "navigate",
                    "url": "https://www.google.com"
                }},
                {{
                    "action": "type",
                    "selector": "input[name='q']",
                    "text": "{user_command}",
                    "description": "Google arama kutusuna metni yaz"
                }},
                {{
                    "action": "click",
                    "selector": "input[type='submit'], button[type='submit']",
                    "description": "Arama butonuna tıkla"
                }},
                {{
                    "action": "wait",
                    "duration": 3,
                    "description": "Sonuçların yüklenmesini bekle"
                }},
                {{
                    "action": "scrape",
                    "selector": "h3",
                    "description": "Arama sonuçlarını topla"
                }},
                {{
                    "action": "click",
                    "selector": "h3:first-of-type",
                    "description": "İlk sonuca tıkla"
                }},
                {{
                    "action": "wait",
                    "duration": 5,
                    "description": "Sayfanın yüklenmesini bekle"
                }},
                {{
                    "action": "scrape",
                    "selector": "body",
                    "description": "Sayfa içeriğini analiz et"
                }},
                {{
                    "action": "navigate",
                    "url": "javascript:window.history.back()"
                }},
                {{
                    "action": "wait",
                    "duration": 2,
                    "description": "Geri dönmeyi bekle"
                }},
                {{
                    "action": "click",
                    "selector": "h3:nth-of-type(2)",
                    "description": "İkinci sonuca tıkla"
                }},
                {{
                    "action": "wait",
                    "duration": 5,
                    "description": "Sayfanın yüklenmesini bekle"
                }},
                {{
                    "action": "scrape",
                    "selector": "body",
                    "description": "İkinci sayfa içeriğini analiz et"
                }}
            ],
            "expected_result": "Arama sonuçları ve site analizleri"
        }}
        
        Desteklenen aksiyonlar: navigate, click, type, wait, scrape, scroll
        """
        
        response = model.generate_content(prompt)
        logger.info("✅ Gemini'den yanıt alındı")
        
        try:
            json_text = extract_json_from_response(response.text)
            task_plan = json.loads(json_text)
            logger.info("✅ Görev planı oluşturuldu")
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON ayrıştırma hatası: {str(e)}")
            return jsonify({
                "success": False,
                "error": "Failed to parse Gemini response as JSON",
                "raw_response": response.text,
                "status": "JSON ayrıştırma başarısız"
            }), 500
        
        # 2. Otomasyonu GÖRÜNÜR modda çalıştır
        logger.info("🚀 2. Adım: Görünür otomasyon çalıştırılıyor...")
        driver = create_driver()
        results = []
        scraped_data = []
        
        try:
            step_count = len(task_plan['steps'])
            for i, step in enumerate(task_plan['steps'], 1):
                action = step.get('action')
                description = step.get('description', '')
                
                logger.info(f"📍 Adım {i}/{step_count}: {action} - {description}")
                
                if action == 'navigate':
                    url = step.get('url')
                    if url.startswith('javascript:'):
                        driver.execute_script(url.replace('javascript:', ''))
                    else:
                        driver.get(url)
                    human_like_delay()
                    result_msg = f"✅ Sayfa açıldı: {url}"
                    results.append(result_msg)
                    logger.info(result_msg)
                
                elif action == 'click':
                    selector = step.get('selector')
                    try:
                        element = WebDriverWait(driver, 10).until(
                            EC.element_to_be_clickable((By.CSS_SELECTOR, selector))
                        )
                        # Sayfayı scroll et
                        driver.execute_script("arguments[0].scrollIntoView(true);", element)
                        time.sleep(1)
                        
                        ActionChains(driver).move_to_element(element).pause(random.uniform(0.5, 1.5)).click().perform()
                        human_like_delay()
                        result_msg = f"✅ Tıklandı: {description}"
                        results.append(result_msg)
                        logger.info(result_msg)
                    except Exception as e:
                        result_msg = f"⚠️ Tıklama başarısız: {description} - {str(e)}"
                        results.append(result_msg)
                        logger.warning(result_msg)
                
                elif action == 'type':
                    selector = step.get('selector')
                    text = step.get('text')
                    try:
                        element = WebDriverWait(driver, 10).until(
                            EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                        )
                        element.clear()
                        human_like_typing(element, text)
                        human_like_delay()
                        result_msg = f"✅ Metin yazıldı: '{text}' - {description}"
                        results.append(result_msg)
                        logger.info(result_msg)
                    except Exception as e:
                        result_msg = f"⚠️ Metin yazma başarısız: {description} - {str(e)}"
                        results.append(result_msg)
                        logger.warning(result_msg)
                
                elif action == 'wait':
                    duration = step.get('duration', 2)
                    time.sleep(duration)
                    result_msg = f"⏳ {duration} saniye beklendi"
                    results.append(result_msg)
                    logger.info(result_msg)
                
                elif action == 'scrape':
                    selector = step.get('selector')
                    try:
                        elements = driver.find_elements(By.CSS_SELECTOR, selector)
                        page_data = []
                        
                        for element in elements[:10]:  # İlk 10 elementi al
                            text = element.text.strip()
                            href = element.get_attribute('href')
                            
                            if text:  # Boş olmayan metinleri al
                                page_data.append({
                                    'text': text[:200],  # İlk 200 karakter
                                    'href': href,
                                    'tag': element.tag_name
                                })
                        
                        scraped_data.extend(page_data)
                        result_msg = f"📊 {len(page_data)} öğe toplandı - {description}"
                        results.append({
                            'message': result_msg,
                            'data': page_data
                        })
                        logger.info(result_msg)
                        
                        # Sayfa başlığını da kaydet
                        page_title = driver.title
                        current_url = driver.current_url
                        results.append(f"📄 Sayfa: {page_title}")
                        results.append(f"🔗 URL: {current_url}")
                        
                    except Exception as e:
                        result_msg = f"⚠️ Veri toplama başarısız: {description} - {str(e)}"
                        results.append(result_msg)
                        logger.warning(result_msg)
                
                elif action == 'scroll':
                    direction = step.get('direction', 'down')
                    if direction == 'down':
                        driver.execute_script("window.scrollBy(0, 500);")
                    else:
                        driver.execute_script("window.scrollBy(0, -500);")
                    human_like_delay()
                    result_msg = f"📜 Sayfa kaydırıldı: {direction}"
                    results.append(result_msg)
                    logger.info(result_msg)
            
            # Ekran görüntüsü al
            screenshot_path = f"/tmp/automation_result_{int(time.time())}.png"
            driver.save_screenshot(screenshot_path)
            logger.info("📸 Ekran görüntüsü alındı")
            
            # Tarayıcıyı açık bırak (kullanıcı görebilsin)
            logger.info("🌐 Tarayıcı açık bırakıldı - kullanıcı sonuçları görebilir")
            
            # 5 saniye bekle ki kullanıcı görebilsin
            time.sleep(5)
            
            logger.info("🎉 Görünür otomasyon tamamlandı!")
            
            return jsonify({
                'success': True,
                'original_command': user_command,
                'task_plan': task_plan,
                'automation_results': results,
                'scraped_data': scraped_data,
                'screenshot_path': screenshot_path,
                'page_title': driver.title,
                'current_url': driver.current_url,
                'status': 'Otomasyon başarıyla tamamlandı - Tarayıcı açık bırakıldı',
                'browser_visible': True
            })
            
        except Exception as e:
            logger.error(f"❌ Otomasyon hatası: {str(e)}")
            return jsonify({
                'success': False,
                'error': str(e),
                'status': 'Otomasyon başarısız'
            }), 500
        finally:
            # Tarayıcıyı KAPATMA - Kullanıcı manuel kapatacak
            # driver.quit()  # Bu satırı kaldırdık
            logger.info("🔚 Otomasyon tamamlandı - Tarayıcı açık bırakıldı")
            
    except Exception as e:
        logger.error(f"❌ Genel hata: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'status': 'Otomasyon başarısız'
        }), 500

@automation_bp.route('/health', methods=['GET'])
@cross_origin()
def health_check():
    """Servisin sağlık durumunu kontrol eder"""
    logger.info("💚 Sağlık kontrolü yapılıyor...")
    return jsonify({
        'status': 'healthy',
        'service': 'AI Automation Backend - Visible Mode',
        'gemini_configured': bool(os.getenv('GEMINI_API_KEY')),
        'message': 'Sistem hazır - Görünür mod aktif',
        'browser_mode': 'visible'
    })

