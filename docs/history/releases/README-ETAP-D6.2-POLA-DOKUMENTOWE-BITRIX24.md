# ETAP D6.2 — pola dokumentowe Bitrix24

## Cel

Nakładka dodaje do istniejącego provisionera 17 pól potrzebnych do generowania dokumentów MoonGlass:

- 14 pól Deala,
- 3 pola Firmy.

Po wdrożeniu liczba pól zarządzanych przez główny blueprint wzrośnie z 66 do 83.

## Instalacja

Rozpakuj płaską nakładkę bezpośrednio do:

```text
C:\Projects\glass-system-web
```

Potwierdź zastąpienie plików.

Nie trzeba ponownie wykonywać migracji Neon, importu produktów ani konfiguracji lejków.

## 1. Kontrola projektu

```powershell
cd C:\Projects\glass-system-web\app

npm run lint
npm run build
```

Pełne `npm run bitrix:verify` uruchamiamy dopiero po zastosowaniu D6.2, ponieważ wcześniej główny blueprint celowo widzi 17 brakujących pól.

## 2. Audyt D6.2

```powershell
npm run bitrix:documents:fields:audit
```

Na portalu bez nowych pól oczekiwany wynik:

```text
Pola: 0/17, brakujące: 17, konflikty: 0
```

## 3. Plan zmian

```powershell
npm run bitrix:documents:fields:plan
```

Oczekiwane:

```text
Zmiany: 17, ostrzeżenia: 0
```

Plan niczego nie zmienia w Bitrix24.

## 4. Zastosowanie

```powershell
npm run bitrix:documents:fields:apply -- --confirm=MOONGLASS-DOCUMENT-FIELDS
```

Skrypt:

1. wykonuje świeży audyt,
2. zatrzymuje się przy konflikcie typu,
3. tworzy wyłącznie brakujące pola D6.2,
4. weryfikuje komplet 17 pól,
5. odświeża pełne mapowanie `UF_CRM_*`,
6. uruchamia końcową kontrolę całego blueprintu.

Oczekiwany wynik:

```text
Pola dokumentowe D6.2 zostały zastosowane.
Utworzono: 17, gotowe łącznie: 17/17
```

## 5. Weryfikacja

```powershell
npm run bitrix:documents:fields:verify
```

Oczekiwane:

```text
Weryfikacja D6.2 OK.
Pola: 17/17, brakujące: 0, konflikty: 0
```

Dodatkowo można ponownie wykonać:

```powershell
npm run bitrix:verify
```

Oczekiwane:

```text
Weryfikacja OK.
Pozostałe działania: 0
```

Audyt bazowy powinien następnie pokazać 83 pola.

## Bezpieczeństwo

- Nakładka nie zawiera webhooka ani innych sekretów.
- Nie usuwa istniejących pól.
- Nie zmienia typu istniejącego pola.
- Ponowne uruchomienie nie tworzy duplikatów.
- Raporty i mapowanie pozostają lokalnie w `app/.bitrix24`.

## Następny etap

Po D6.2 przygotowujemy D6.3: własne szablony DOCX MoonGlass — najpierw oferta dla osoby prywatnej i firmy, potem umowa, załącznik techniczny i proforma.
