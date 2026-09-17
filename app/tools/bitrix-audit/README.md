# MoonGlass Bitrix24 — audyt pól (READ ONLY)

Skrypt tylko odczytuje dane. Nie tworzy, nie edytuje i nie usuwa pól ani dealów.

## Uruchomienie
1. `python -m venv .venv`
2. PowerShell: `.\.venv\Scripts\Activate.ps1`
3. `pip install -r requirements.txt`
4. Skopiuj `.env.example` jako `.env`
5. W `.env` wpisz swój incoming webhook Bitrix24
6. `python audit_bitrix.py`

Nie wysyłaj webhooka na czat i nie commituj `.env`.

Wyniki pojawią się w folderze `bitrix_audit/`.
Najważniejszy plik: `12_field_audit_summary.csv`.
