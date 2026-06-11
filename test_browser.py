from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
import time

options = Options()
options.add_argument("--headless")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")

driver = webdriver.Chrome(options=options)
driver.get("file:///home/tushar/MyData/MyPortfolio/index.html")
time.sleep(1)

logs = driver.get_log("browser")
print("CONSOLE LOGS BEFORE CLICK:", logs)

try:
    card = driver.find_element(By.XPATH, "//div[contains(@class, 'cert-card') and contains(@onclick, 'aws_certificate.jpg')]")
    card.click()
    time.sleep(1)
    logs = driver.get_log("browser")
    print("CONSOLE LOGS AFTER CLICK:", logs)
    
    modal = driver.find_element(By.ID, "certModal")
    print("MODAL DISPLAY:", modal.value_of_css_property("display"))
    
    img = driver.find_element(By.ID, "certImg")
    print("IMG SRC:", img.get_attribute("src"))
    
except Exception as e:
    print("ERROR:", e)

driver.quit()
