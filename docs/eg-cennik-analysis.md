# Analiza dokumentu EG Cennik

## Cel dokumentu

Celem tego dokumentu jest pełne zrozumienie wszystkich tabel zawartych w dokumencie **EG Cennik** przed rozpoczęciem projektowania modelu domenowego, bazy danych oraz Pricing Engine.

Na tym etapie **nie opisujemy implementacji**, lecz analizujemy znaczenie biznesowe poszczególnych danych.

---

# Cele analizy

Analiza ma odpowiedzieć na następujące pytania:

- Do czego służy każda tabela?
- Kto wykorzystuje dane z tej tabeli?
- Czy tabela bierze udział w wyliczeniu ceny?
- Czy tabela jest potrzebna konfiguratorowi?
- Czy tabela służy produkcji?
- Czy tabela służy montażowi?
- Czy tabela służy wyłącznie analizie rentowności?

Po zakończeniu analizy każda tabela będzie miała przypisaną jednoznaczną rolę w naszym systemie.

---

# Podział logiczny dokumentu

Po przeanalizowaniu całego pliku EG Cennik można wyróżnić cztery niezależne warstwy danych.

```
EG Cennik

├── Warstwa A
│   Kalkulator sprzedaży
│
├── Warstwa B
│   Koszty i rentowność
│
├── Warstwa C
│   Produkcja (BOM)
│
└── Warstwa D
    Montaż i realizacja
```

Rozdzielenie tych warstw jest jedną z najważniejszych decyzji architektonicznych naszego projektu.

EG przechowuje wszystkie dane w jednym pliku.

My od początku chcemy oddzielić:

- logikę sprzedaży,
- logikę wyceny,
- produkcję,
- montaż.

Dzięki temu system będzie znacznie łatwiejszy do rozwijania.

---

# WARSTWA A — Kalkulator sprzedaży

## Opis

Jest to warstwa odpowiedzialna za konfigurator dostępny dla klienta.

To właśnie z tych danych korzysta Pricing Engine podczas wyliczania ceny.

Na podstawie naszych testów konfiguratora oraz analizy cennika wiemy, że kalkulator pobiera ceny właśnie z tej części dokumentu.

---

## Tabela A1 — Macierz cen

Kolumny:

- Konstrukcja / Rozmiar
- Zadaszenie
- Ściany przesuwne
- Pokrycie dachu
- Rolety ZIP
- Markiza
- Wyrównanie podłoża
- Oświetlenie LED
- Dodatki

Przykład:

```
300 × 306

Zadaszenie         8838
Ściany             15029
Roleta             3079
LED                999
...
```

---

### Przeznaczenie

Tabela zawiera ceny sprzedażowe widoczne dla klienta.

Nie zawiera informacji o:

- kosztach,
- marży,
- rentowności,
- zakupie materiałów.

Jest to główne źródło danych dla Pricing Engine.

---

### Status

✅ Wykorzystujemy od pierwszej wersji systemu.

---

### Docelowa reprezentacja

```
PriceMatrix
```

---

# WARSTWA B — Koszty i rentowność

## Opis

Warstwa przeznaczona dla właściciela firmy oraz działu handlowego.

Nie jest używana bezpośrednio przez konfigurator.

Zawiera informacje dotyczące:

- ceny zakupu,
- rabatów,
- narzutów,
- kosztów materiałów,
- kosztów montażu,
- zysku,
- rentowności.

---

### Zastosowanie

Ta warstwa odpowiada na pytanie:

> Ile firma zarobi na danej konfiguracji?

Nie odpowiada natomiast za wyliczenie ceny klienta.

---

### Status

❌ Nie wykorzystujemy w MVP.

Dodamy ją po zakończeniu konfiguratora.

---

### Docelowa reprezentacja

```
InternalCostMatrix
```

---

# WARSTWA C — Produkcja (BOM)

## Opis

BOM (Bill Of Materials) opisuje wszystkie elementy potrzebne do wykonania zamówienia.

W tej części znajdują się między innymi:

- profile,
- szyby,
- prowadnice,
- systemy przesuwne,
- ilość punktów LED,
- ilość bloków LED,
- długości taśm,
- uchwyty,
- szczotki,
- fundamenty,
- elementy markizy.

---

### Zastosowanie

Warstwa odpowiada na pytanie:

> Jakie materiały należy przygotować do realizacji zamówienia?

Nie jest wykorzystywana podczas konfiguracji przez klienta.

---

### Status

❌ Nie wykorzystujemy w MVP.

Dodamy ją po zakończeniu Pricing Engine.

---

### Docelowa reprezentacja

```
BOMComponents
```

---

# WARSTWA D — Montaż

## Opis

Warstwa zawiera informacje dotyczące realizacji zamówienia.

Znajdują się tutaj między innymi:

- wynagrodzenia ekip,
- dopłaty za niestandardowe montaże,
- wysokości montażu,
- odległości od miejsca postoju,
- skrócenia markizy.

---

### Zastosowanie

Warstwa wykorzystywana podczas planowania realizacji oraz rozliczania montażu.

Nie bierze udziału w wyliczeniu podstawowej ceny konfiguratora.

---

### Status

❌ Nie wykorzystujemy w MVP.

---

# Szczegółowa analiza tabel

## Tabela 1 — Macierz cen

### Przeznaczenie

Podstawowa tabela sprzedażowa.

Źródło danych dla konfiguratora.

### Status

✅ Wykorzystujemy.

---

## Tabela 2 — Rentowność

### Przeznaczenie

Analiza kosztów i zysku.

### Status

Późniejszy etap projektu.

---

## Tabela 3 — Dopłaty montażowe

### Przeznaczenie

Dodatkowe opłaty za niestandardowe warunki realizacji.

### Status

Później.

---

## Tabela 4 — Wynagrodzenie ekip

### Przeznaczenie

Koszty montażu.

### Status

Później.

---

## Tabela 5 — LED / COB

### Przeznaczenie

Lista materiałów oraz ilości komponentów.

### Status

Później.

---

## Tabela 6 — Systemy przesuwne

### Przeznaczenie

Konfiguracja ścian przesuwnych.

### Status

Później.

---

## Tabela 7 — Ogród zimowy

### Przeznaczenie

Cenniki oraz dodatki dla ogrodów zimowych.

### Status

Po zakończeniu modułu zadaszeń.

---

# Dotychczas odkryte reguły biznesowe

Na podstawie analizy konfiguratora EcoGardens udało się potwierdzić następujące zależności.

## Reguła 1

Cena początkowa jest pobierana z macierzy cen.

Dla konfiguracji:

- szerokość 306 cm,
- długość 300 cm,
- brak ścian,
- poliwęglan przezroczysty,

otrzymujemy:

```
8838
+
0
=
8838
```

co odpowiada wartości widocznej w konfiguratorze.

---

## Reguła 2

Zmiana pokrycia dachu powoduje zmianę ceny zgodnie z kolumną "Pokrycie dachu".

Przykład:

Poliwęglan przezroczysty

↓

Poliwęglan mleczny

Cena rośnie dokładnie o wartość z tabeli.

---

## Reguła 3

Ściany przesuwne są dopłatą do konstrukcji.

Cena końcowa:

```
Konstrukcja

+

Cena ścian

=

Cena konfiguracji
```

Nie istnieje osobna cena konstrukcji z zamkniętymi ścianami.

---

## Reguła 4

Po wybraniu dowolnych ścian przesuwnych pojawia się drugi krok konfiguratora.

Dostępne stają się:

- roleta ZIP lewa,
- roleta ZIP prawa,
- roleta ZIP przednia,
- markiza.

Jeżeli ściany nie są wybrane — boczne rolety nie są dostępne.

---

## Reguła 5

Rozmiar konstrukcji nie wpływa na model 3D.

Zmienia się jedynie cena.

---

## Reguła 6

Cena przechodzi pomiędzy krokami konfiguratora.

Każdy kolejny etap dodaje nowe pozycje do wcześniej wyliczonej ceny.

---

# Najważniejsze obserwacje

## 1

EG Cennik opisuje nie jeden system, lecz kilka niezależnych systemów jednocześnie.

---

## 2

Konfigurator wykorzystuje jedynie niewielką część całego dokumentu.

---

## 3

Najważniejszą tabelą jest Macierz Cen.

To ona stanowi podstawę działania Pricing Engine.

---

## 4

Pozostałe tabele służą głównie:

- produkcji,
- magazynowi,
- montażowi,
- analizie kosztów,
- raportowaniu.

---

# Decyzje architektoniczne

Na podstawie obecnej wiedzy przyjmujemy następujący przepływ danych.

```
EG Cennik

        │

        ▼

Price Matrix

        │

        ▼

Pricing Engine

        │

        ▼

Quote

        │

        ▼

CRM

        │

        ▼

Order

        │

        ▼

BOM

        │

        ▼

Installation
```

---

# Otwarte pytania

Na dzień utworzenia dokumentu pozostają następujące kwestie do wyjaśnienia.

## 1

Czy wszystkie ceny widoczne w konfiguratorze pochodzą wyłącznie z Macierzy Cen?

---

## 2

Czy istnieją dodatkowe reguły biznesowe niewidoczne w cenniku?

---

## 3

Czy wszystkie dodatki są cenami stałymi, czy część zależy od rozmiaru konstrukcji?

---

## 4

Jak dokładnie wyliczana jest cena ogrodu zimowego?

---

## 5

Czy ceny montażu są doliczane automatycznie, czy wybierane przez handlowca?

---

## 6

Jakie dane z warstwy BOM będą potrzebne podczas generowania zamówienia produkcyjnego?

---

# Wnioski

Po analizie całego dokumentu można stwierdzić, że projektowany system nie będzie jedynie kalkulatorem cenowym.

Będzie to kompletna platforma typu **CPQ (Configure – Price – Quote)**, rozszerzona o moduły CRM, produkcji oraz montażu.

Dlatego od początku rozdzielamy:

- model produktu,
- logikę wyceny,
- proces sprzedaży,
- proces produkcji,
- proces realizacji.

Takie podejście pozwoli stworzyć system łatwy do rozbudowy o kolejne produkty (np. carporty, pergole, ogrody zimowe) bez konieczności przebudowy istniejącej architektury.