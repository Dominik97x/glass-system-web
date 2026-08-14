import os
import sys
import json
import argparse
from pathlib import Path
from datetime import datetime
from collections import OrderedDict

import requests
from dotenv import load_dotenv

load_dotenv()

WEBHOOK = (os.getenv("BITRIX_WEBHOOK") or "").strip().rstrip("/") + "/"
ENTITY_TYPE_ID = 2
DEAL_CATEGORY_ID = 0  # 01 Sprzedaż z pomiarem
BACKUP_DIR = Path("card_cleanup_backups")

if not WEBHOOK or "/rest/" not in WEBHOOK:
    raise SystemExit("Brak poprawnego BITRIX_WEBHOOK w .env")

session = requests.Session()
session.headers.update({
    "Accept": "application/json",
    "Content-Type": "application/json",
    "User-Agent": "MoonGlass-Card-Cleanup/1.0",
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

def dump(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(obj, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

def normalize(config):
    """Porównanie tylko struktury sekcji/pól i opcji."""
    result = []
    for section in config or []:
        result.append({
            "name": section.get("name"),
            "title": section.get("title"),
            "type": section.get("type"),
            "elements": [
                {
                    "name": e.get("name"),
                    "optionFlags": str(e.get("optionFlags", "0")),
                    "options": e.get("options"),
                }
                for e in (section.get("elements") or [])
            ],
        })
    return result

print("MoonGlass — porządkowanie karty CRM")
print("Lejek: 01 Sprzedaż z pomiarem")
print()

current = call(
    "crm.item.details.configuration.get",
    {
        "entityTypeId": ENTITY_TYPE_ID,
        "scope": "C",
        "extras": {"dealCategoryId": DEAL_CATEGORY_ID},
    },
)

if not current:
    raise SystemExit("Bitrix nie zwrócił wspólnej konfiguracji karty.")

field_result = call(
    "crm.item.fields",
    {
        "entityTypeId": ENTITY_TYPE_ID,
        "useOriginalUfNames": "Y",
    },
)
fields = field_result.get("fields", {})

current_elements = {}
for section in current:
    for element in section.get("elements", []) or []:
        current_elements[element["name"]] = element

def el(name):
    if name not in fields and name not in current_elements:
        raise RuntimeError(f"Pole nie istnieje w Bitrixie: {name}")
    if name in current_elements:
        return dict(current_elements[name])
    return {"name": name, "optionFlags": "0"}

layout = OrderedDict([
    ("main", {
        "title": "01 — Klient / deal",
        "fields": [
            "TITLE",
            "STAGE_ID",
            "CLIENT",
            "ASSIGNED_BY_ID",
            "OPPORTUNITY_WITH_CURRENCY",
            "CLOSEDATE",
            "UF_CRM_DEAL_MG_CLIENT_TYPE",
            "UF_CRM_DEAL_MG_MEASUREMENT_REQUIRED",
        ],
    }),
    ("mg_install_location", {
        "title": "02 — Miejsce montażu",
        "fields": [
            "UF_CRM_DEAL_MG_INSTALL_ADDRESS",
            "UF_CRM_DEAL_MG_POSTAL_CODE",
            "UF_CRM_DEAL_MG_CITY",
            "UF_CRM_DEAL_MG_ACCESS_NOTES",
        ],
    }),
    ("mg_offer", {
        "title": "03 — Oferta",
        "fields": [
            "UF_CRM_DEAL_MG_OFFER_NUMBER",
            "UF_CRM_DEAL_MG_OFFER_VALID_UNTIL",
            "UF_CRM_DEAL_MG_PLANNED_COMPLETION_DATE",
            "UF_CRM_DEAL_MG_PAYMENT_METHOD",
            "UF_CRM_DEAL_MG_DOCUMENT_VAT_PERCENT",
            "UF_CRM_DEAL_MG_CONSTRUCTION_COLOR",
            "UF_CRM_DEAL_MG_CUSTOM_QUOTE",
            "UF_CRM_DEAL_MG_SITE_PREPARATION",
            "UF_CRM_DEAL_MG_OFFER_NOTES",
            "UF_CRM_DEAL_MG_TECHNICAL_NOTES",
        ],
    }),
    ("mg_payments", {
        "title": "04 — Płatności 30 / 50 / 20",
        "fields": [
            "UF_CRM_DEAL_MG_ADVANCE_AMOUNT",
            "UF_CRM_DEAL_MG_ADVANCE_PERCENT",
            "UF_CRM_DEAL_MG_ADVANCE_DUE_DATE",
            "UF_CRM_DEAL_MG_PAYMENT_STAGE2_AMOUNT",
            "UF_CRM_DEAL_MG_PAYMENT_STAGE3_AMOUNT",
            "UF_CRM_DEAL_MG_PAID_AMOUNT",
            "UF_CRM_DEAL_MG_REMAINING_AMOUNT",
        ],
    }),
    ("mg_measurement", {
        "title": "05 — Pomiar / techniczne",
        "fields": [
            "UF_CRM_DEAL_MG_MEASUREMENT_AT",
            "UF_CRM_DEAL_MG_MEASUREMENT_OWNER",
            "UF_CRM_DEAL_MG_MEASUREMENT_PROTOCOL_NUMBER",
            "UF_CRM_DEAL_MG_MEASURED_WIDTH_CM",
            "UF_CRM_DEAL_MG_MEASURED_DEPTH_CM",
            "UF_CRM_DEAL_MG_MEASURED_HEIGHT_WALL_CM",
            "UF_CRM_DEAL_MG_MEASURED_HEIGHT_FRONT_CM",
            "UF_CRM_DEAL_MG_MEASUREMENT_GROUND_STATUS",
            "UF_CRM_DEAL_MG_MEASUREMENT_WALL_STATUS",
            "UF_CRM_DEAL_MG_MEASUREMENT_POWER_STATUS",
            "UF_CRM_DEAL_MG_MEASUREMENT_DRAINAGE",
            "UF_CRM_DEAL_MG_MEASUREMENT_ACCESS_STATUS",
            "UF_CRM_DEAL_MG_MEASUREMENT_PHOTOS_STATUS",
            "UF_CRM_DEAL_MG_MEASUREMENT_RESULT",
            "UF_CRM_DEAL_MG_MEASUREMENT_APPROVAL_STATUS",
            "UF_CRM_DEAL_MG_MEASUREMENT_NOTES",
            "UF_CRM_DEAL_MG_MEASUREMENT_CLIENT_NOTES",
        ],
    }),
    ("mg_contract", {
        "title": "06 — Umowa / dokumenty",
        "fields": [
            "UF_CRM_DEAL_MG_CONTRACT_NUMBER",
            "UF_CRM_DEAL_MG_CONTRACT_DATE",
            "UF_CRM_DEAL_MG_DOCUMENT_VERSION",
            "UF_CRM_DEAL_MG_CONTRACT_NOTES",
        ],
    }),
    ("mg_process", {
        "title": "07 — Proces / follow-up",
        "fields": [
            "UF_CRM_DEAL_MG_NEXT_CONTACT_AT",
            "UF_CRM_DEAL_MG_PHOTOS_STATUS",
            "UF_CRM_DEAL_MG_DEFERRED_UNTIL",
            "UF_CRM_DEAL_MG_DEFERRED_REASON",
            "UF_CRM_DEAL_MG_LOST_REASON",
        ],
    }),
    ("products", {
        "title": "Produkty",
        "fields": ["PRODUCT_ROW_SUMMARY"],
    }),
    ("additional", {
        "title": "Więcej — pola standardowe",
        "fields": [
            "TYPE_ID",
            "SOURCE_ID",
            "SOURCE_DESCRIPTION",
            "BEGINDATE",
            "OPENED",
            "OBSERVER",
            "COMMENTS",
            "UTM",
        ],
    }),
])

proposed = []
for name, spec in layout.items():
    proposed.append({
        "name": name,
        "title": spec["title"],
        "type": "section",
        "elements": [el(field) for field in spec["fields"]],
    })

before_names = {
    e["name"]
    for s in current
    for e in (s.get("elements") or [])
}
after_names = {
    e["name"]
    for s in proposed
    for e in (s.get("elements") or [])
}

print(f"Obecnie widoczne pola: {len(before_names)}")
print(f"Po zmianie widoczne pola: {len(after_names)}")
print(f"Schowane z karty: {len(before_names - after_names)}")
print(f"Nowo pokazane: {len(after_names - before_names)}")
print()
print("WAŻNE:")
print("- żadne pole CRM nie zostanie usunięte")
print("- żadne dane deala nie zostaną zmienione")
print("- zmieniany jest wyłącznie wspólny układ karty lejka 01 Sprzedaż z pomiarem")
print("- nie wymuszamy jeszcze wspólnego widoku na użytkownikach z ustawieniami osobistymi")
print()

parser = argparse.ArgumentParser()
parser.add_argument(
    "--apply",
    action="store_true",
    help="Zapisz proponowany układ do Bitrix24"
)
parser.add_argument(
    "--restore",
    metavar="BACKUP_JSON",
    help="Przywróć konfigurację z podanego pliku backupu"
)
args = parser.parse_args()

if args.restore:
    backup_path = Path(args.restore)
    if not backup_path.exists():
        raise SystemExit(f"Nie znaleziono backupu: {backup_path}")

    backup = json.loads(backup_path.read_text(encoding="utf-8"))

    print(f"Przywracanie backupu: {backup_path}")
    confirmation = input("Wpisz dokładnie RESTORE aby kontynuować: ").strip()
    if confirmation != "RESTORE":
        raise SystemExit("Anulowano.")

    call(
        "crm.item.details.configuration.set",
        {
            "entityTypeId": ENTITY_TYPE_ID,
            "scope": "C",
            "data": backup,
            "extras": {"dealCategoryId": DEAL_CATEGORY_ID},
        },
    )
    print("Backup przywrócony.")
    sys.exit(0)

if not args.apply:
    print("TRYB PODGLĄDU — nic nie zapisano.")
    print("Aby zastosować zmianę, uruchom:")
    print("python card_cleanup_apply.py --apply")
    sys.exit(0)

timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
backup_path = BACKUP_DIR / f"01_sprzedaz_z_pomiarem_before_{timestamp}.json"
dump(backup_path, current)

print(f"Backup zapisany lokalnie: {backup_path}")
print()
print("To jest ostatni moment przed zapisem wspólnej konfiguracji.")
confirmation = input("Wpisz dokładnie APPLY aby kontynuować: ").strip()

if confirmation != "APPLY":
    raise SystemExit("Anulowano. Nie wykonano zmian.")

print("Zapisuję nową konfigurację...")

call(
    "crm.item.details.configuration.set",
    {
        "entityTypeId": ENTITY_TYPE_ID,
        "scope": "C",
        "data": proposed,
        "extras": {"dealCategoryId": DEAL_CATEGORY_ID},
    },
)

after = call(
    "crm.item.details.configuration.get",
    {
        "entityTypeId": ENTITY_TYPE_ID,
        "scope": "C",
        "extras": {"dealCategoryId": DEAL_CATEGORY_ID},
    },
)

after_path = BACKUP_DIR / f"01_sprzedaz_z_pomiarem_after_{timestamp}.json"
dump(after_path, after)

if normalize(after) == normalize(proposed):
    print()
    print("OK — Bitrix zwrócił dokładnie oczekiwany układ.")
    print(f"Backup przed zmianą: {backup_path}")
    print(f"Snapshot po zmianie: {after_path}")
else:
    print()
    print("UWAGA — Bitrix zapisał konfigurację, ale odpowiedź różni się od planu.")
    print("NIE wykonuj kolejnych zmian.")
    print(f"Backup do przywrócenia: {backup_path}")
    print(f"Snapshot po zmianie: {after_path}")
    print()
    print("Przywrócenie:")
    print(f'python card_cleanup_apply.py --restore "{backup_path}"')
