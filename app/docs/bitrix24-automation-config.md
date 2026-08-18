# MoonGlass — Bitrix24: konfiguracja operacyjna

Stan po testach 2026-08-18.

## 1. Tunel Sprzedaż → Realizacja

Źródło:
- Lejek: `01 Sprzedaż z pomiarem`
- Etap: `Wygrany — przekazany do realizacji`

Akcja:
- `Przenieś deala`
- Wykonanie: `Po odczekaniu`
- Czas: `Natychmiast`
- Warunek: brak
- Lejek docelowy: `02 Realizacja`
- Etap docelowy: `W realizacji`

Założenie:
- przenoszony jest ten sam deal, bez tworzenia kopii,
- zachowane zostają klient, produkty, kwota, VAT, pola umowy, adres i harmonogram płatności.

Test potwierdzony:
- 4 produkty,
- kwota brutto: 40 068,00 PLN,
- VAT: 8%,
- I rata 30%: 12 020,40 PLN,
- II rata 50%: 20 034,00 PLN,
- III rata 20%: 8 013,60 PLN.

## 2. Pola płatności

### `Pozostało po I racie (70%)`
To pole NIE jest bieżącym saldem klienta.

Znaczenie:
- kwota pozostająca po I racie 30%,
- dla 40 068,00 PLN wynosi 28 047,60 PLN.

### `Wpłacona kwota`
Faktyczna łączna kwota wpłat klienta.

### `Saldo do zapłaty`
Kod:
`UF_CRM_DEAL_MG_OUTSTANDING_BALANCE`

Typ:
- number / double,
- precyzja 2.

Znaczenie:
`Kwota deala - Wpłacona kwota`

## 3. Automatyzacje — etap `Projekt opłacony`

### Robot 1 — przelicz saldo

Typ:
`Modyfikuj pozycję`

Ustawienia:
- Wykonanie: `Równolegle`
- Czas: `Natychmiast`
- Warunek: brak

Pole:
`Saldo do zapłaty`

Formuła:
`={{Kwota}}-floatval({{Wpłacona kwota}})`

UWAGA:
Nie używać modyfikatora `> printable`.
Sformatowana wartość z separatorem tysięcy powodowała błędny wynik.

### Robot 2 — blokada niedopłaty

Typ:
`Zmień etap`

Ustawienia:
- Wykonanie: `Po odczekaniu`
- Czas: `Natychmiast`

Warunek:
`Saldo do zapłaty > 0`

Nowy etap:
`Montaż skończony — nieopłacone`

### Robot 3 — oznaczenie jako opłacony

Typ:
`Modyfikuj pozycję`

Ustawienia:
- Wykonanie: `Po odczekaniu`
- Czas: `Natychmiast`

Warunki połączone operatorem `I`:
- `Saldo do zapłaty <= 0`
- `Status protokołu odbioru = Podpisany`

Akcja:
`Projekt opłacony = Tak`

## 4. Automatyzacje — etap `Zamknięty projekt`

### Robot 1 — ponownie przelicz saldo

Typ:
`Modyfikuj pozycję`

Ustawienia:
- Czas: `Natychmiast`
- Warunek: brak

Pole:
`Saldo do zapłaty`

Formuła:
`={{Kwota}}-floatval({{Wpłacona kwota}})`

### Robot 2 — niedopłata blokuje zamknięcie

Typ:
`Zmień etap`

Ustawienia:
- Wykonanie: `Po odczekaniu`
- Czas: `Natychmiast`

Warunek:
`Saldo do zapłaty > 0`

Nowy etap:
`Montaż skończony — nieopłacone`

### Robot 3 — brak spełnienia warunków odbioru blokuje zamknięcie

Typ:
`Zmień etap`

Ustawienia:
- Wykonanie: `Po odczekaniu`
- Czas: `Natychmiast`

Warunki połączone operatorem `LUB`:
- `Projekt opłacony != Tak`
- `Status protokołu odbioru != Podpisany`

Nowy etap:
`Projekt opłacony`

## 5. Potwierdzone scenariusze testowe

### Niedopłata
- wartość deala: 40 068,00 PLN,
- wpłacona kwota: 40 067,00 PLN,
- saldo: 1,00 PLN.

Wynik:
- `Projekt opłacony` nie utrzymuje się,
- deal wraca do `Montaż skończony — nieopłacone`.

### Pełna płatność + niepodpisany protokół
- wpłacona kwota: 40 068,00 PLN,
- saldo: 0,
- status protokołu: `Roboczy`.

Wynik:
- próba `Zamknięty projekt` kończy się powrotem do `Projekt opłacony`.

### Pełna płatność + podpisany protokół
- wpłacona kwota: 40 068,00 PLN,
- saldo: 0,
- `Projekt opłacony = Tak`,
- status protokołu: `Podpisany`.

Wynik:
- deal pozostaje na `Zamknięty projekt`.

## 6. Kolejne planowane prace

1. Walidacja odbioru z usterkami:
   - jeżeli `Wynik odbioru = Odbiór z uwagami / usterkami`,
   - wymagane biznesowo:
     - `Usterki / uwagi`,
     - `Termin usunięcia usterek`.

2. Uporządkowanie etapów materiałowych w `02 Realizacja`:
   - `Status materiału`,
   - możliwa automatyczna synchronizacja pola z etapem.

3. Finalny przegląd dokumentów:
   - Umowa Firma,
   - Protokół Odbioru,
   - spójność numeracji i pól.

4. Porządek danych testowych i starych szablonów dopiero po pełnej akceptacji konfiguracji produkcyjnej.
