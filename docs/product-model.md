# Model produktu

## Cel dokumentu

Celem tego dokumentu jest opisanie modelu produktu sprzedawanego przez firmę.

Dokument definiuje:

- czym jest produkt,
- z czego składa się produkt,
- jakie elementy są konfigurowalne,
- jakie elementy wpływają na cenę,
- jakie elementy wpływają na wizualizację,
- jakie elementy będą wykorzystywane przez Pricing Engine.

Dokument nie opisuje implementacji.

Opisuje wyłącznie model biznesowy.

---

# Główna idea

Najważniejszym założeniem projektu jest oddzielenie:

- produktu,
- konfiguracji produktu,
- procesu sprzedaży.

Produktem nie jest gotowy ogród zimowy.

Produktem nie jest gotowe zadaszenie.

Produktem jest możliwość skonfigurowania konstrukcji zgodnie z wymaganiami klienta.

---

# Produkt bazowy

Produktem bazowym jest:

**Konstrukcja aluminiowa.**

Każda konfiguracja rozpoczyna się od wyboru konstrukcji.

Konstrukcja definiowana jest przez:

- szerokość,
- długość.

Domyślna konfiguracja po wejściu do kalkulatora:

- szerokość: 306 cm,
- długość: 300 cm.

---

# Konfiguracja produktu

Na bazie konstrukcji użytkownik tworzy konfigurację.

Do konstrukcji może zostać dodane:

- pokrycie dachu,
- ściany przesuwne,
- rolety ZIP,
- markiza,
- oświetlenie LED,
- dodatkowe akcesoria.

Każda z tych decyzji tworzy jedną konfigurację produktu.

---

# Typ produktu

Typ końcowy produktu wynika z konfiguracji.

Przykład:

Konstrukcja

+

Brak ścian

=

Zadaszenie tarasu

---

Konstrukcja

+

Ściany przesuwne

=

Ogród zimowy

---

Oznacza to, że zadaszenie tarasu oraz ogród zimowy nie są niezależnymi produktami.

Są dwoma wariantami tej samej konstrukcji.

---

# Elementy produktu

Model produktu składa się z następujących elementów.

## Konstrukcja

Podstawowy element produktu.

Bez konstrukcji nie istnieje konfiguracja.

---

## Pokrycie dachu

Może być wykonane z:

- poliwęglanu,
- szkła.

Pokrycie wpływa na:

- cenę,
- wygląd.

---

## Ściany przesuwne

Opcjonalny element konfiguracji.

Wpływa na:

- cenę,
- wygląd,
- dostępność kolejnych opcji.

---

## Rolety ZIP

Dodatkowy komponent.

Dostępność zależy od konfiguracji ścian.

---

## Markiza

Opcjonalny komponent.

Wpływa na:

- cenę,
- wizualizację.

---

## Oświetlenie LED

Opcjonalny komponent.

Wpływa na:

- cenę,
- przyszły BOM.

---

## Akcesoria

Do akcesoriów zaliczamy między innymi:

- uchwyty,
- szczotki,
- inne elementy dodatkowe.

---

# Czym NIE jest produkt

Produkt nie jest:

- ofertą,
- wyceną,
- leadem,
- zamówieniem,
- dokumentem PDF.

Są to kolejne etapy procesu sprzedaży wykorzystujące konfigurację produktu.

---

# Relacje biznesowe

Produkt

↓

Konfiguracja

↓

Wycena

↓

Lead

↓

CRM

↓

Oferta

↓

Zamówienie

↓

Produkcja

↓

Montaż

---

# Najważniejsze reguły

## Reguła 1

Każda konfiguracja zawsze rozpoczyna się od konstrukcji.

---

## Reguła 2

Cena jest wyliczana na podstawie konfiguracji.

Nie istnieje cena produktu bez konfiguracji.

---

## Reguła 3

Niektóre elementy odblokowują kolejne opcje.

Przykład:

Ściany przesuwne

↓

Rolety boczne.

---

## Reguła 4

Jedna konfiguracja może zostać później zmodyfikowana przez konsultanta.

Konfiguracja wysłana przez klienta nie jest ostateczną konfiguracją zamówienia.

---

# Przyszłe rozszerzenia

Model produktu powinien umożliwiać dodanie kolejnych rodzin produktów.

Przykładowo:

- carporty,
- pergole,
- nowe systemy zadaszeń.

Dodanie nowego produktu nie powinno wymagać przebudowy istniejącego modelu.

Nowy produkt powinien wykorzystywać te same mechanizmy konfiguracji, wyceny oraz ofertowania.

---

# Wnioski

Sercem systemu nie jest produkt.

Sercem systemu jest konfiguracja produktu.

To konfiguracja jest wykorzystywana przez:

- Pricing Engine,
- CRM,
- generator ofert,
- moduł produkcji,
- moduł montażu.

Cała architektura systemu będzie budowana wokół konfiguracji produktu.