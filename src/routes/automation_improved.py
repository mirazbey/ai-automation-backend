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

# Web driver yapılandırması
def create_driver():
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--window-size=1920,1080')
    chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
    
    driver = webdriver.Chrome(options=chrome_options)
    return driver

# İnsan benzeri davranış simülasyonu
def human_like_delay():
    time.sleep(random.uniform(1, 3))

def human_like_typing(element, text):
    for char in text:
        element.send_keys(char)
        time.sleep(random.uniform(0.05, 0.2))

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

@automation_bp.route('/analyze-task', methods=['POST'])
@cross_origin()
def analyze_task():
    """Kullanıcının doğal dil komutunu Gemini ile analiz eder"""
    try:
        logger.info("📋 Görev analizi başlatılıyor...")
        data = request.json
        user_command = data.get('command', '')
        
        if not user_command:
            return jsonify({'error': 'Command is required'}), 400
        
        logger.info(f"🎯 Kullanıcı komutu: {user_command}")
        
        model = configure_gemini()
        
        prompt = f"""
        Kullanıcının şu komutunu analiz et ve web otomasyonu için JSON formatında adımlar oluştur:
        "{user_command}"
        
        SADECE JSON formatında yanıt ver. Başka hiçbir metin ekleme.
        
        {{
            "task_type": "web_automation",
            "target_site": "site_url",
            "steps": [
                {{
                    "action": "navigate",
                    "url": "https://example.com"
                }},
                {{
                    "action": "click",
                    "selector": "button[id='search-btn']",
                    "description": "Arama butonuna tıkla"
                }},
                {{
                    "action": "type",
                    "selector": "input[name='search']",
                    "text": "aranacak metin",
                    "description": "Arama kutusuna metin yaz"
                }},
                {{
                    "action": "wait",
                    "duration": 2,
                    "description": "Sayfanın yüklenmesini bekle"
                }},
                {{
                    "action": "scrape",
                    "selector": ".result-item",
                    "description": "Sonuçları topla"
                }}
            ],
            "expected_result": "Beklenen sonuç açıklaması"
        }}
        
        Desteklenen aksiyonlar: navigate, click, type, wait, scrape, scroll
        """
        
        logger.info("🤖 Gemini API'ye istek gönderiliyor...")
        response = model.generate_content(prompt)
        logger.info("✅ Gemini'den yanıt alındı")
        
        try:
            # Gemini'den gelen yanıtı JSON olarak parse et
            json_text = extract_json_from_response(response.text)
            task_plan = json.loads(json_text)
            logger.info("✅ JSON başarıyla ayrıştırıldı")
            
            return jsonify({
                'success': True,
                'task_plan': task_plan,
                'original_command': user_command,
                'status': 'Görev planı oluşturuldu'
            })
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON ayrıştırma hatası: {str(e)}")
            return jsonify({
                'success': False,
                'error': 'Failed to parse Gemini response as JSON',
                'raw_response': response.text,
                'status': 'JSON ayrıştırma başarısız'
            }), 500
            
    except Exception as e:
        logger.error(f"❌ Genel hata: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'status': 'Görev analizi başarısız'
        }), 500

@automation_bp.route('/execute-automation', methods=['POST'])
@cross_origin()
def execute_automation():
    """Gemini'den gelen görev planını web otomasyonu ile çalıştırır"""
    try:
        logger.info("🚀 Otomasyon çalıştırılıyor...")
        data = request.json
        task_plan = data.get('task_plan', {})
        
        if not task_plan or 'steps' not in task_plan:
            return jsonify({'error': 'Valid task_plan is required'}), 400
        
        logger.info("🌐 Web driver başlatılıyor...")
        driver = create_driver()
        results = []
        
        try:
            step_count = len(task_plan['steps'])
            for i, step in enumerate(task_plan['steps'], 1):
                action = step.get('action')
                description = step.get('description', '')
                
                logger.info(f"📍 Adım {i}/{step_count}: {action} - {description}")
                
                if action == 'navigate':
                    url = step.get('url')
                    driver.get(url)
                    human_like_delay()
                    result_msg = f"✅ Sayfa açıldı: {url}"
                    results.append(result_msg)
                    logger.info(result_msg)
                
                elif action == 'click':
                    selector = step.get('selector')
                    element = WebDriverWait(driver, 10).until(
                        EC.element_to_be_clickable((By.CSS_SELECTOR, selector))
                    )
                    # İnsan benzeri hareket
                    ActionChains(driver).move_to_element(element).pause(random.uniform(0.5, 1.5)).click().perform()
                    human_like_delay()
                    result_msg = f"✅ Tıklandı: {description}"
                    results.append(result_msg)
                    logger.info(result_msg)
                
                elif action == 'type':
                    selector = step.get('selector')
                    text = step.get('text')
                    element = WebDriverWait(driver, 10).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                    )
                    element.clear()
                    human_like_typing(element, text)
                    human_like_delay()
                    result_msg = f"✅ Metin yazıldı: '{text}' - {description}"
                    results.append(result_msg)
                    logger.info(result_msg)
                
                elif action == 'wait':
                    duration = step.get('duration', 2)
                    time.sleep(duration)
                    result_msg = f"⏳ {duration} saniye beklendi"
                    results.append(result_msg)
                    logger.info(result_msg)
                
                elif action == 'scrape':
                    selector = step.get('selector')
                    elements = driver.find_elements(By.CSS_SELECTOR, selector)
                    scraped_data = []
                    for element in elements[:10]:  # İlk 10 sonucu al
                        scraped_data.append({
                            'text': element.text,
                            'href': element.get_attribute('href') if element.tag_name == 'a' else None
                        })
                    result_msg = f"📊 {len(scraped_data)} öğe toplandı"
                    results.append({
                        'message': result_msg,
                        'data': scraped_data
                    })
                    logger.info(result_msg)
                
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
            
            # Sayfanın son halinin ekran görüntüsünü al
            screenshot_path = f"/tmp/automation_result_{int(time.time())}.png"
            driver.save_screenshot(screenshot_path)
            logger.info("📸 Ekran görüntüsü alındı")
            
            return jsonify({
                'success': True,
                'results': results,
                'screenshot_path': screenshot_path,
                'page_title': driver.title,
                'current_url': driver.current_url,
                'status': 'Otomasyon tamamlandı'
            })
            
        finally:
            driver.quit()
            logger.info("🔚 Web driver kapatıldı")
            
    except Exception as e:
        logger.error(f"❌ Otomasyon hatası: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'status': 'Otomasyon başarısız'
        }), 500

@automation_bp.route('/full-automation', methods=['POST'])
@cross_origin()
def full_automation():
    """Kullanıcı komutunu analiz edip otomasyonu çalıştırır (tek endpoint)"""
    try:
        logger.info("🎯 Tam otomasyon başlatılıyor...")
        data = request.json
        user_command = data.get('command', '')
        
        if not user_command:
            return jsonify({'error': 'Command is required'}), 400
        
        logger.info(f"📝 Kullanıcı komutu: {user_command}")
        
        # 1. Komutu analiz et
        logger.info("🤖 1. Adım: Komut analiz ediliyor...")
        model = configure_gemini()
        
        prompt = f"""
        Kullanıcının şu komutunu analiz et ve web otomasyonu için JSON formatında adımlar oluştur:
        "{user_command}"
        
        SADECE JSON formatında yanıt ver. Başka hiçbir metin ekleme.
        
        {{
            "task_type": "web_automation",
            "target_site": "site_url",
            "steps": [
                {{
                    "action": "navigate",
                    "url": "https://example.com"
                }},
                {{
                    "action": "click",
                    "selector": "button[id='search-btn']",
                    "description": "Arama butonuna tıkla"
                }},
                {{
                    "action": "type",
                    "selector": "input[name='search']",
                    "text": "aranacak metin",
                    "description": "Arama kutusuna metin yaz"
                }},
                {{
                    "action": "wait",
                    "duration": 2,
                    "description": "Sayfanın yüklenmesini bekle"
                }},
                {{
                    "action": "scrape",
                    "selector": ".result-item",
                    "description": "Sonuçları topla"
                }}
            ],
            "expected_result": "Beklenen sonuç açıklaması"
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
        
        # 2. Otomasyonu çalıştır
        logger.info("🚀 2. Adım: Otomasyon çalıştırılıyor...")
        driver = create_driver()
        results = []
        
        try:
            step_count = len(task_plan['steps'])
            for i, step in enumerate(task_plan['steps'], 1):
                action = step.get('action')
                description = step.get('description', '')
                
                logger.info(f"📍 Adım {i}/{step_count}: {action} - {description}")
                
                if action == 'navigate':
                    url = step.get('url')
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
                        scraped_data = []
                        for element in elements[:10]:
                            scraped_data.append({
                                'text': element.text,
                                'href': element.get_attribute('href') if element.tag_name == 'a' else None
                            })
                        result_msg = f"📊 {len(scraped_data)} öğe toplandı"
                        results.append({
                            'message': result_msg,
                            'data': scraped_data
                        })
                        logger.info(result_msg)
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
            
            screenshot_path = f"/tmp/automation_result_{int(time.time())}.png"
            driver.save_screenshot(screenshot_path)
            logger.info("📸 Ekran görüntüsü alındı")
            
            logger.info("🎉 Tam otomasyon tamamlandı!")
            
            return jsonify({
                'success': True,
                'original_command': user_command,
                'task_plan': task_plan,
                'automation_results': results,
                'screenshot_path': screenshot_path,
                'page_title': driver.title,
                'current_url': driver.current_url,
                'status': 'Otomasyon başarıyla tamamlandı'
            })
            
        finally:
            driver.quit()
            logger.info("🔚 Web driver kapatıldı")
            
    except Exception as e:
        logger.error(f"❌ Tam otomasyon hatası: {str(e)}")
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
        'service': 'AI Automation Backend',
        'gemini_configured': bool(os.getenv('GEMINI_API_KEY')),
        'message': 'Sistem hazır ve çalışıyor'
    })

