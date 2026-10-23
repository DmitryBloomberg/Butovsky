import requests
import json
import uuid
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

BASE_URL_RAW = 'https://144.31.166.120/zjAWGfBTUY1RBwFvsT'
API_TOKEN_RAW = 'idM6Xxb23bImJ6ZStVAVdJZ6fw9JSvonhPNlujJvp3COp8sD'

BASE_URL = ''.join(c for c in BASE_URL_RAW if ord(c) < 128).strip()
API_TOKEN = ''.join(c for c in API_TOKEN_RAW if ord(c) < 128).strip()

if not API_TOKEN or API_TOKEN == 'ВАШ_ТОКЕН_ЗДЕСЬ':
    print("❌ ВЫ НЕ ВСТАВИЛИ ТОКЕН!")
    exit()

headers = {
    "Authorization": f"Bearer {API_TOKEN}",
    "Accept": "application/json",
    "Content-Type": "application/json"
}

def get_inbounds():
    url = f"{BASE_URL.rstrip('/')}/panel/api/inbounds/list"
    resp = requests.get(url, headers=headers, verify=False, timeout=10)
    if resp.status_code != 200:
        print(f"❌ Не удалось получить inbound'ы: HTTP {resp.status_code}")
        return None
    return resp.json().get('obj', [])

def add_client_to_all_inbounds(inbound_ids, uuid_str, email):
    """Создание клиента сразу во ВСЕХ инбаундах одним запросом"""
    url = f"{BASE_URL.rstrip('/')}/panel/api/clients/add"
    payload = {
        "client": {
            "id": uuid_str,
            "email": email,
            "flow": "",
            "limitIp": 0,
            "totalGB": 0,
            "expiryTime": 0,
            "enable": True,
            "tgId": 0,
            "subId": "",
            "comment": "",
            "limitHwid": 0
        },
        "inboundIds": inbound_ids  # <-- список ВСЕХ ID инбаундов
    }
    resp = requests.post(url, headers=headers, json=payload, verify=False, timeout=10)
    print(f"   → HTTP {resp.status_code}, ответ: {resp.text[:300]}")
    if resp.status_code == 200 and resp.text.strip():
        try:
            return resp.json()
        except json.JSONDecodeError:
            pass
    return None

def main():
    print("1. Получение списка Inbound'ов...")
    inbounds = get_inbounds()

    if not inbounds:
        print("❌ Нет доступных Inbound'ов или ошибка авторизации.")
        return

    # Собираем все ID инбаундов
    all_inbound_ids = [inb['id'] for inb in inbounds]
    print(f"✅ Найдено {len(inbounds)} инбаундов: {all_inbound_ids}\n")

    new_uuid = str(uuid.uuid4())
    new_email = f"user_{new_uuid[:8]}"

    print(f"2. Создание клиента {new_email}...")
    print(f"   UUID: {new_uuid}")
    print(f"   Инбаунды: {all_inbound_ids}\n")

    result = add_client_to_all_inbounds(all_inbound_ids, new_uuid, new_email)

    if result and result.get('success'):
        print(f"\n🎉 Клиент успешно создан во всех {len(all_inbound_ids)} инбаундах!")
        print(f"Email: {new_email}")
        print(f"UUID: {new_uuid}")
    else:
        print("\n❌ Не удалось создать клиента.")
        if result:
            print(f"   Причина: {result.get('msg')}")

if __name__ == "__main__":
    main()