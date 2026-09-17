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

### Robot 4 — brak opisu usterek blokuje przejście

Typ:
`Zmień etap`

Ustawienia:
- Wykonanie: `Po odczekaniu`
- Czas: `Natychmiast`

Warunki połączone operatorem `I`:
- `Wynik odbioru = Odbiór z uwagami / usterkami`
- `Usterki / uwagi = pusty`

Nowy etap:
`Montaż skończony — nieopłacone`

### Robot 5 — brak terminu usunięcia usterek blokuje przejście

Typ:
`Zmień etap`

Ustawienia:
- Wykonanie: `Po odczekaniu`
- Czas: `Natychmiast`

Warunki połączone operatorem `I`:
- `Wynik odbioru = Odbiór z uwagami / usterkami`
- `Termin usunięcia usterek = pusty`

Nowy etap:
`Montaż skończony — nieopłacone`

## 4. Pole statusu usterek

### `Status usunięcia usterek`

Kod:
`UF_CRM_DEAL_MG_ACCEPTANCE_DEFECTS_STATUS`

Typ:
`enumeration`

Wartości:
- `Nie dotyczy`
- `Do usunięcia`
- `W trakcie`
- `Usunięte`

Pole jest wyświetlane w sekcji:
`06 — ODBIÓR / III RATA`

## 5. Automatyzacje — etap `Zamknięty projekt`

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

### Robot 4 — nierozwiązane usterki blokują zamknięcie

Typ:
`Zmień etap`

Ustawienia:
- Wykonanie: `Po odczekaniu`
- Czas: `Natychmiast`

Warunki połączone operatorem `I`:
- `Wynik odbioru = Odbiór z uwagami / usterkami`
- `Status usunięcia usterek != Usunięte`

Nowy etap:
`Projekt opłacony`

## 6. Potwierdzone scenariusze testowe

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

### Odbiór z usterkami — brak opisu
- `Wynik odbioru = Odbiór z uwagami / usterkami`,
- `Usterki / uwagi = puste`,
- termin może być ustawiony.

Wynik:
- deal wraca do `Montaż skończony — nieopłacone`.

### Odbiór z usterkami — brak terminu
- `Wynik odbioru = Odbiór z uwagami / usterkami`,
- opis usterek jest wypełniony,
- `Termin usunięcia usterek = pusty`.

Wynik:
- deal wraca do `Montaż skończony — nieopłacone`.

### Odbiór z usterkami — komplet danych
- opis usterek wypełniony,
- termin usunięcia usterek wypełniony.

Wynik:
- deal może pozostać na `Projekt opłacony`.

### Zamknięcie przy otwartych usterkach
- `Wynik odbioru = Odbiór z uwagami / usterkami`,
- `Status usunięcia usterek = Do usunięcia`.

Wynik:
- próba `Zamknięty projekt` kończy się powrotem do `Projekt opłacony`.

### Zamknięcie po usunięciu usterek
- `Wynik odbioru = Odbiór z uwagami / usterkami`,
- `Status usunięcia usterek = Usunięte`,
- pozostałe warunki zamknięcia spełnione.

Wynik:
- deal pozostaje na `Zamknięty projekt`.

## 7. Kolejne planowane prace

1. Uporządkowanie etapów materiałowych w `02 Realizacja`:
   - `Status materiału`,
   - zasady przejść między `Szkło na wymiar`, `Wysłać materiał na wycenę`, `Materiał na wycenie`, `Wycena materiału zaakceptowana`, `Zamówienie materiału`, `Materiał zamówiony`, `Materiał opłacony`,
   - decyzja, czy synchronizować `Status materiału` automatycznie z etapem.

2. Finalny przegląd dokumentów:
   - Umowa Firma,
   - Protokół Odbioru,
   - spójność numeracji, pól i warunków wygenerowania.

3. Przegląd całego procesu end-to-end na świeżym testowym dealu.

4. Porządek danych testowych i starych szablonów dopiero po pełnej akceptacji konfiguracji produkcyjnej.
