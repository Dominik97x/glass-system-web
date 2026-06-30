# Pricing Engine

## Cel

Pricing Engine odpowiada za obliczenie ceny konfiguracji wybranej przez klienta.

Nie wykorzystuje wzorów matematycznych.

Źródłem danych jest cennik EG.

---

# Źródło danych

GS Cennik.pdf

Docelowo:

JSON

lub

Baza danych

---

# Produkty

- Ogród zimowy
- Zadaszenie tarasu
- Carport

---

# Cena bazowa

Cena bazowa zależy od:

- produktu
- szerokości
- głębokości

Każda kombinacja posiada gotową cenę.

---

# Dopłaty

Pokrycie

- szkło
- poliwęglan

Rolety

LED

COB

Markiza

Przeszklenia

Fundament

Montaż

Akcesoria

---

# Marża

Do ceny producenta doliczana jest marża firmy.

Zakres:

20–30%

Marża powinna być konfigurowalna.

---

# Wynik

Pricing Engine zwraca:

- cenę producenta
- wartość marży
- cenę końcową
- listę wybranych elementów

---

# Architektura

Cennik

↓

Repository

↓

Pricing Engine

↓

Kalkulator

↓

Lead

↓

CRM