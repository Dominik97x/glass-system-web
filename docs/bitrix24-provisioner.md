# MoonGlass Bitrix24 Provisioner

## Cel

Provisioner konfiguruje portal Bitrix24 na podstawie wersjonowanego blueprintu MoonGlass. Działa w trybie bezpiecznym i idempotentnym: najpierw odczytuje portal, następnie tworzy plan, a dopiero po jawnym potwierdzeniu dodaje lub aktualizuje elementy.

Nie usuwa istniejących lejków, etapów, pól, sekcji ani produktów.

## Wymagania

1. Aktywny trial Professional albo plan komercyjny z REST API.
2. Incoming webhook utworzony przez administratora portalu.
3. Uprawnienia webhooka do CRM, katalogu produktów i konfiguracji pól użytkownika (`userfieldconfig`).
4. Adres webhooka zapisany tylko lokalnie w `app/.env.local`:

```env
BITRIX24_WEBHOOK_URL=https://moonglass.bitrix24.pl/rest/ID_UZYTKOWNIKA/SEKRET/
```

Webhook jest hasłem technicznym. Nie należy go wklejać do rozmowy, dokumentacji, repozytorium ani kodu przeglądarkowego.

## Polecenia

Uruchamiane z katalogu `app`:

```powershell
npm run bitrix:audit
npm run bitrix:plan
npm run bitrix:apply -- --confirm=MOONGLASS
npm run bitrix:products:pilot -- --confirm=MOONGLASS
npm run bitrix:verify
```

### `bitrix:audit`

Odczytuje:

- dostępność metod REST,
- lejki i etapy,
- liczbę Deali w lejkach,
- źródła,
- pola Kontaktów, Firm i Deali,
- katalog, sekcje i produkty.

### `bitrix:plan`

Generuje plan bez modyfikacji portalu. Raporty powstają w `app/.bitrix24/`.

Symbole w `plan.md`:

- `+` utworzenie,
- `~` aktualizacja,
- `=` wykorzystanie istniejącego elementu,
- `!` ostrzeżenie wymagające kontroli.

### `bitrix:apply`

Tworzy lub aktualizuje:

- trzy lejki Deali,
- etapy Sprzedaży, Realizacji i Reklamacji,
- źródła klientów,
- pola niestandardowe Kontaktów, Firm i Deali,
- strukturę sekcji katalogu.

Dla domyślnego, pustego lejka skrypt może bezpiecznie zaadaptować systemowe etapy Bitrix24. Gdy lejek zawiera Deale, skrypt nie zmienia przypadkowych etapów — dodaje brakujące.

### `bitrix:products:pilot`

Importuje reprezentatywny zestaw produktów z aktualnego pliku:

```text
src/data/pricing/glass-system/published-pricing.generated.json
```

Domyślny wymiar pilotażowy to `300x306` w kolejności `głębokość x szerokość`. Ustawienie:

```env
BITRIX24_PILOT_DIMENSIONS=300x306,350x406
```

Produkty otrzymują stabilny SKU/XML_ID `MG-*`, sekcję oraz cenę bazową PLN.

### `bitrix:verify`

Ponownie odczytuje portal, porównuje go z blueprintem i zapisuje aktualne mapowanie techniczne:

```text
app/.bitrix24/mapping.generated.json
```

Mapowanie zawiera rzeczywiste:

- `categoryId`,
- `stageId`,
- `SOURCE_ID`,
- nazwy pól `UF_CRM_*`,
- identyfikatory sekcji i produktów.

## Bezpieczeństwo

- Provisioner nigdy nie zapisuje pełnego webhooka w raportach.
- `apply` i import produktów wymagają jawnego `--confirm=MOONGLASS`.
- Operacje są niedestrukcyjne; skrypt niczego nie usuwa.
- Błędy typów istniejących pól są raportowane, a nie automatycznie naprawiane.
- Pełny katalog należy uruchomić dopiero po udanym pilotażu i sprawdzeniu limitów planu.

## Zakres etapu D1

Ten pakiet przygotowuje strukturę portalu. Nie tworzy jeszcze:

- integracji formularza `Neon → Contact → Deal`,
- retry synchronizacji i zapisu ID Bitrix24 w bazie,
- procesów inteligentnych Płatności, Pomiarów i Montaży,
- robotów automatyzacji.

Te elementy powstaną po odczytaniu rzeczywistych identyfikatorów portalu wygenerowanych przez `verify`.
