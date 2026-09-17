import os
import json
from pathlib import Path
from collections import OrderedDict

import requests
from dotenv import load_dotenv

load_dotenv()

WEBHOOK = (os.getenv("BITRIX_WEBHOOK") or "").strip().rstrip("/") + "/"
OUT = Path("card_cleanup_dry_run")
ENTITY_TYPE_ID = 2
DEAL_CATEGORY_ID = 0  # 01 Sprzedaż z pomiarem

if not WEBHOOK or "/rest/" not in WEBHOOK:
    raise SystemExit("Brak poprawnego BITRIX_WEBHOOK w .env")

OUT.mkdir(exist_ok=True)

session = requests.Session()
session.headers.update({
    "Accept": "application/json",
    "Content-Type": "application/json",
    "User-Agent": "MoonGlass-Card-Cleanup-DryRun/1.0",
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

def save_json(name, obj):
    (OUT / name).write_text(
        json.dumps(obj, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

print("1/5 Pobieram aktualną wspólną kartę lejka 01 Sprzedaż z pomiarem...")

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

save_json("01_card_before.json", current)

print("2/5 Pobieram definicje pól...")

fields = call(
    "crm.item.fields",
    {
        "entityTypeId": ENTITY_TYPE_ID,
        "useOriginalUfNames": "Y",
    },
).get("fields", {})

save_json("02_fields_snapshot.json", fields)

# Zachowujemy istniejące opcje pól, np. CLIENT/defaultCountry i przycisk płatności.
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

# ============================================================
# PROPOZYCJA DOCELOWEJ KARTY
# Nic poniżej NIE jest wysyłane do Bitrixa.
# ============================================================

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
    ("recurring", {
        "title": "Cykliczny deal",
        "fields": ["RECURRING"],
    }),
])

proposed = []
for section_name, spec in layout.items():
    proposed.append({
        "name": section_name,
        "title": spec["title"],
        "type": "section",
        "elements": [el(x) for x in spec["fields"]],
    })

save_json("03_card_proposed.json", proposed)

print("3/5 Liczę różnice...")

before_locations = {}
for section in current:
    for element in section.get("elements", []) or []:
        before_locations[element["name"]] = section.get("title", section.get("name"))

after_locations = {}
for section in proposed:
    for element in section.get("elements", []) or []:
        after_locations[element["name"]] = section["title"]

before_fields = set(before_locations)
after_fields = set(after_locations)

hidden_from_sales_card = sorted(before_fields - after_fields)
newly_shown = sorted(after_fields - before_fields)
moved = sorted(
    f for f in before_fields & after_fields
    if before_locations[f] != after_locations[f]
)

def label(api):
    meta = fields.get(api, {})
    return meta.get("title") or api

diff = {
    "pipeline": "01 Sprzedaż z pomiarem",
    "dealCategoryId": DEAL_CATEGORY_ID,
    "before_sections": len(current),
    "after_sections": len(proposed),
    "before_visible_fields": len(before_fields),
    "after_visible_fields": len(after_fields),
    "hidden_from_sales_card_count": len(hidden_from_sales_card),
    "newly_shown_count": len(newly_shown),
    "moved_count": len(moved),
    "hidden_from_sales_card": [
        {"api": f, "label": label(f), "from": before_locations[f]}
        for f in hidden_from_sales_card
    ],
    "newly_shown": [
        {"api": f, "label": label(f), "to": after_locations[f]}
        for f in newly_shown
    ],
    "moved": [
        {
            "api": f,
            "label": label(f),
            "from": before_locations[f],
            "to": after_locations[f],
        }
        for f in moved
    ],
}

save_json("04_diff.json", diff)

print("4/5 Tworzę czytelny raport...")

lines = []
lines.append("# MoonGlass — DRY-RUN porządkowania karty CRM")
lines.append("")
lines.append("**NIE WYKONANO ŻADNYCH ZMIAN W BITRIX24.**")
lines.append("")
lines.append("Lejek: **01 Sprzedaż z pomiarem**")
lines.append("")
lines.append(f"- widocznych pól obecnie: **{len(before_fields)}**")
lines.append(f"- widocznych pól w propozycji: **{len(after_fields)}**")
lines.append(f"- pól schowanych z karty sprzedażowej: **{len(hidden_from_sales_card)}**")
lines.append(f"- pól dodanych do widoku: **{len(newly_shown)}**")
lines.append(f"- pól przeniesionych między sekcjami: **{len(moved)}**")
lines.append("")
lines.append("## Proponowane sekcje")
for section in proposed:
    lines.append(f"### {section['title']}")
    for element in section["elements"]:
        lines.append(f"- {label(element['name'])}  `{element['name']}`")
    lines.append("")

lines.append("## Pola, które znikną z normalnej karty sprzedażowej")
lines.append("Pola nadal istnieją w CRM — ten plan ich nie usuwa.")
lines.append("")
for row in diff["hidden_from_sales_card"]:
    lines.append(f"- {row['label']}  `{row['api']}`")

lines.append("")
lines.append("## Pola, które pojawią się na karcie")
for row in diff["newly_shown"]:
    lines.append(f"- {row['label']}  `{row['api']}` → {row['to']}")

(OUT / "05_DRY_RUN_REPORT.md").write_text("\n".join(lines), encoding="utf-8")

print("5/5 GOTOWE")
print()
print("UWAGA: skrypt nie wywołuje crm.item.details.configuration.set")
print(f"Wyniki: {OUT.resolve()}")
print(f"Obecnie widoczne pola: {len(before_fields)}")
print(f"Proponowane widoczne pola: {len(after_fields)}")
print(f"Do schowania z karty sprzedażowej: {len(hidden_from_sales_card)}")
print(f"Nowo pokazane: {len(newly_shown)}")
print(f"Przeniesione: {len(moved)}")
