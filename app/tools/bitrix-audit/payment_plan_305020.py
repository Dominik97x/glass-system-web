import os
import json
import argparse
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from datetime import datetime

import requests
from dotenv import load_dotenv

load_dotenv()

WEBHOOK = (os.getenv("BITRIX_WEBHOOK") or "").strip().rstrip("/") + "/"
DEFAULT_DEAL_ID = int(os.getenv("BITRIX_TEST_DEAL_ID", "25"))
ENTITY_TYPE_ID = 2
OUT = Path("payment_plan_305020_results")

FIELDS = {
    "advance_percent": "UF_CRM_DEAL_MG_ADVANCE_PERCENT",
    "stage1": "UF_CRM_DEAL_MG_ADVANCE_AMOUNT",
    "stage2": "UF_CRM_DEAL_MG_PAYMENT_STAGE2_AMOUNT",
    "stage3": "UF_CRM_DEAL_MG_PAYMENT_STAGE3_AMOUNT",
}

if not WEBHOOK or "/rest/" not in WEBHOOK:
    raise SystemExit("Brak poprawnego BITRIX_WEBHOOK w .env")

session = requests.Session()
session.headers.update({
    "Accept": "application/json",
    "Content-Type": "application/json",
    "User-Agent": "MoonGlass-PaymentPlan-305020/1.0",
})

def call(method, params=None):
    r = session.post(f"{WEBHOOK}{method}.json", json=params or {}, timeout=60)
    r.raise_for_status()
    data = r.json()
    if data.get("error"):
        raise RuntimeError(
            f"{method}: {data.get('error')} — {data.get('error_description')}"
        )
    return data.get("result")

def money(amount: Decimal) -> Decimal:
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

def money_value(amount: Decimal, currency: str) -> str:
    # Bitrix custom field type "money": VALUE|CURRENCY
    return f"{money(amount)}|{currency}"

def save_json(path: Path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(obj, ensure_ascii=False, indent=2, default=str),
        encoding="utf-8",
    )

parser = argparse.ArgumentParser()
parser.add_argument("--deal-id", type=int, default=DEFAULT_DEAL_ID)
parser.add_argument("--apply", action="store_true")
args = parser.parse_args()

deal_id = args.deal_id

print("MoonGlass — plan płatności 30 / 50 / 20")
print(f"Deal ID: {deal_id}")
print()

result = call(
    "crm.item.get",
    {
        "entityTypeId": ENTITY_TYPE_ID,
        "id": deal_id,
        "useOriginalUfNames": "Y",
    },
)
item = result["item"]

field_result = call(
    "crm.item.fields",
    {
        "entityTypeId": ENTITY_TYPE_ID,
        "useOriginalUfNames": "Y",
    },
)
definitions = field_result.get("fields", {})

gross = Decimal(str(item.get("opportunity") or "0"))
currency = item.get("currencyId") or "PLN"

if gross <= 0:
    raise SystemExit("Kwota deala jest pusta albo <= 0.")

stage1 = money(gross * Decimal("0.30"))
stage2 = money(gross * Decimal("0.50"))
stage3 = money(gross * Decimal("0.20"))
control = stage1 + stage2 + stage3

print(f"Kwota brutto deala: {money(gross)} {currency}")
print(f"I rata  30%:        {stage1} {currency}")
print(f"II rata 50%:        {stage2} {currency}")
print(f"III rata 20%:       {stage3} {currency}")
print(f"Kontrola sumy:       {control} {currency}")
print()

if control != money(gross):
    raise SystemExit(
        f"BŁĄD KONTROLNY: suma rat {control} != kwota deala {money(gross)}"
    )

# Verify that the expected custom fields exist and inspect their types.
for label, api in FIELDS.items():
    if api not in definitions:
        raise SystemExit(f"Brak pola w CRM: {api}")

print("Typy pól:")
for label, api in FIELDS.items():
    meta = definitions[api]
    print(f"- {api}: {meta.get('type')}")
print()

updates = {
    FIELDS["advance_percent"]: 30,
    FIELDS["stage1"]: money_value(stage1, currency),
    FIELDS["stage2"]: money_value(stage2, currency),
    FIELDS["stage3"]: money_value(stage3, currency),
}

preview = {
    "dealId": deal_id,
    "title": item.get("title"),
    "gross": str(money(gross)),
    "currency": currency,
    "stage1_30": str(stage1),
    "stage2_50": str(stage2),
    "stage3_20": str(stage3),
    "updates": updates,
}

OUT.mkdir(exist_ok=True)
save_json(OUT / "01_preview.json", preview)

if not args.apply:
    print("TRYB DRY-RUN — nic nie zapisano do Bitrix24.")
    print("Podgląd zapisano w:")
    print((OUT / "01_preview.json").resolve())
    print()
    print("Jeżeli liczby są poprawne, następne uruchomienie:")
    print(f"python payment_plan_305020.py --deal-id {deal_id} --apply")
    raise SystemExit(0)

timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
before_path = OUT / f"02_before_deal_{deal_id}_{timestamp}.json"
save_json(before_path, {
    "dealId": deal_id,
    "values": {api: item.get(api) for api in FIELDS.values()},
})

print("UWAGA: za chwilę zostaną zmienione WYŁĄCZNIE 4 pola płatności.")
print("Nie zmieniam etapu, produktów, cen ani pozostałych danych deala.")
confirm = input("Wpisz dokładnie APPLY aby zapisać: ").strip()
if confirm != "APPLY":
    raise SystemExit("Anulowano. Nic nie zapisano.")

call(
    "crm.item.update",
    {
        "entityTypeId": ENTITY_TYPE_ID,
        "id": deal_id,
        "fields": updates,
        "useOriginalUfNames": "Y",
    },
)

after_result = call(
    "crm.item.get",
    {
        "entityTypeId": ENTITY_TYPE_ID,
        "id": deal_id,
        "useOriginalUfNames": "Y",
    },
)
after = after_result["item"]

after_path = OUT / f"03_after_deal_{deal_id}_{timestamp}.json"
save_json(after_path, {
    "dealId": deal_id,
    "values": {api: after.get(api) for api in FIELDS.values()},
})

print()
print("Zapis wykonany.")
print(f"Backup przed: {before_path}")
print(f"Snapshot po: {after_path}")
print()
print("Wartości zwrócone przez Bitrix:")
for label, api in FIELDS.items():
    print(f"- {api}: {after.get(api)}")
