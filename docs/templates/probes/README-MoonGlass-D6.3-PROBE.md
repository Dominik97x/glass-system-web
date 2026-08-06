# MoonGlass D6.3 — PROBE kodów pól

Cel: ustalenie rzeczywistych kodów symbolicznych 17 pól dokumentowych w portalu Bitrix24.

## 1. Wgraj szablon

1. Otwórz dowolny Deal w lejku `01 Sprzedaż z pomiarem`.
2. Wybierz `Dokument` → `Dodaj nowy szablon`.
3. Wgraj plik `MoonGlass-D6.3-PROBE-kody-pol.docx`.
4. Ustaw dokładną nazwę: `MoonGlass D6.3 - PROBE kodow pol`.
5. Powiąż szablon z Dealami / lejkiem `01 Sprzedaż z pomiarem`.
6. Szablon jest diagnostyczny — nie generuj go ani nie wysyłaj klientom.

## 2. Uruchom odczyt

Skopiuj `MoonGlass-D6.3-odczytaj-PROBE.ps1` do dowolnego katalogu, a następnie w PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Desktop\MoonGlass-D6.3-odczytaj-PROBE.ps1"
```

Jeśli plik znajduje się gdzie indziej, użyj jego rzeczywistej ścieżki.

## 3. Prześlij wynik

Na pulpicie powstanie:

`MoonGlass-D6.3-probe-result.json`

Plik zawiera tylko metadane kodów i ścieżki pól. Skrypt nie zapisuje wartości klientów ani adresu webhooka.

Po analizie szablon PROBE będzie można usunąć z Bitrix24.
