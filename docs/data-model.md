# Model danych

## Product

Opisuje produkt oferowany przez firmę.

Przykłady:

- Ogród zimowy
- Zadaszenie tarasu
- Carport

---

## Variant

Konkretna konfiguracja produktu.

Przykład:

Ogród zimowy

300 x 400

---

## Dimension

Opisuje wymiary.

- szerokość

- głębokość

---

## RoofType

Rodzaj pokrycia.

Przykłady:

- szkło bezbarwne

- szkło mleczne

- szkło przyciemniane

- poliwęglan bezbarwny

- poliwęglan mleczny

- poliwęglan dymiony

---

## Accessory

Element opcjonalny.

Przykłady:

- LED

- COB

- Markiza

- Rolety

- Fundament

- Montaż

---

## PriceItem

Pojedyncza pozycja cennika.

Przechowuje:

- produkt

- wymiary

- cenę

---

## Quote

Kompletna wycena.

Zawiera:

- produkt

- konfigurację

- dodatki

- cenę producenta

- marżę

- cenę końcową

---

## Lead

Zapytanie klienta.

Przechowuje:

- dane kontaktowe

- konfigurację

- wycenę

- zdjęcia

Status:

Nowy

↓

Kontakt

↓

Oferta

↓

Realizacja

↓

Zakończony