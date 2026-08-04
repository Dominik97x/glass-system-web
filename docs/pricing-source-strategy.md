# Strategia źródła cennika

## Cel dokumentu

Ten dokument opisuje docelowy sposób przechowywania, edycji, synchronizacji i wykorzystywania cennika w systemie EcoGardens.

Dokument powstał po analizie:

- istniejącego pliku EG Cennik,
- działania obecnego kalkulatora,
- rozmów o historycznym utrzymywaniu cennika,
- screenów z Bitrix24,
- aktualnej architektury aplikacji `glass-system-web`.

Celem dokumentu jest podjęcie jednej spójnej decyzji:

> Gdzie znajduje się źródło prawdy dla cen i jak te ceny trafiają do strony oraz Bitrix24?

---

# Decyzja główna

Docelowym źródłem prawdy dla cennika jest:

```text
Excel Online
```

Excel jest masterem dla:

- cen sprzedażowych,
- opcji produktu,
- reguł cenowych,
- mapowania pozycji kalkulatora na produkty Bitrix24,
- stawek VAT,
- danych potrzebnych do wygenerowania poprawnych pozycji oferty.

---

# Czym NIE jest źródło prawdy

## Kod aplikacji

Kod aplikacji nie jest docelowym źródłem cennika.

Obecne pliki:

```text
src/data/pricing/eg/*.ts
```

są rozwiązaniem MVP/developerskim, używanym do szybkiego uruchomienia Pricing Engine.

Docelowo ceny nie powinny być aktualizowane przez zmianę kodu i deploy aplikacji.

---

## Bitrix24

Bitrix24 nie jest docelowym źródłem prawdy dla cennika strony.

Bitrix24 pełni rolę:

- CRM,
- systemu sprzedażowego,
- systemu realizacji,
- miejsca generowania dokumentów,
- miejsca obsługi dealów,
- miejsca obsługi produktów na ofercie,
- miejsca prowadzenia kalendarza i montażu.

Bitrix24 otrzymuje gotową wycenę oraz pozycje oferty z aplikacji.

---

## Lokalny panel `/admin/leady`

Lokalny panel `/admin/leady` nie jest CRM-em.

Jest to narzędzie developerskie pomocne do testowania przepływu zapytań z kalkulatora.

Docelowym CRM-em jest Bitrix24.

---

# Docelowy przepływ danych

```text
Excel Online
↓
Importer cennika
↓
Walidator cennika
↓
Published Pricing Snapshot
↓
Pricing Engine
↓
Quote
↓
Bitrix24 Deal
↓
Bitrix24 Product Rows
↓
Dokumenty Bitrix24
↓
Proces realizacji w Bitrix24
```

---

# Rola Excela

Excel jest miejscem, w którym uprawniona osoba może edytować:

- ceny konstrukcji,
- ceny pokryć dachowych,
- ceny ścian,
- ceny rolet ZIP,
- ceny markiz,
- ceny LED,
- ceny dodatków,
- ceny montażu,
- reguły VAT,
- mapowanie do produktów Bitrix24.

Excel powinien być zrozumiały dla osoby biznesowej, ale jednocześnie musi mieć techniczne zakładki, które aplikacja może bezpiecznie importować.

---

# Dlaczego Excel

Excel jest dobrym źródłem cennika w tym projekcie, ponieważ:

1. Firma już historycznie korzystała z arkuszy/cenników.
2. Cennik ma postać macierzy cenowych.
3. Ceny często wymagają ręcznej edycji przez osobę nietechniczną.
4. Cennik zawiera wiele warstw: sprzedaż, koszty, produkcja, montaż.
5. Zmiana ceny nie powinna wymagać pracy programisty.
6. Excel jest łatwiejszy do akceptacji biznesowej niż edycja JSON/TypeScript/bazy danych.
7. Można go później zintegrować z aplikacją przez importer.

---

# Dlaczego aplikacja nie powinna czytać Excela przy każdym kliknięciu

Nie stosujemy modelu:

```text
Klient zmienia opcję w kalkulatorze
↓
Strona odpytuje Excel
↓
Excel zwraca cenę
```

Taki model byłby:

- wolny,
- podatny na awarie,
- zależny od dostępności Excela/API,
- trudny do cache'owania,
- niebezpieczny przy błędach w arkuszu.

Zamiast tego stosujemy model synchronizacji:

```text
Ktoś edytuje Excel
↓
System importuje cennik
↓
System waliduje dane
↓
Jeśli dane są poprawne, publikuje snapshot
↓
Strona korzysta z ostatniego poprawnego snapshotu
```

---

# Published Pricing Snapshot

`Published Pricing Snapshot` to techniczna, zatwierdzona wersja cennika używana przez aplikację.

Snapshot nie jest nowym źródłem prawdy.

Jest technicznym odzwierciedleniem ostatniej poprawnej wersji Excela.

Snapshot może być przechowywany jako:

```text
JSON
```

albo później jako tabela w bazie danych.

Dzięki temu:

- strona działa szybko,
- kalkulator nie zależy od ciągłego połączenia z Excelem,
- błędna edycja arkusza nie psuje publicznej strony,
- można wrócić do poprzedniej wersji cennika,
- można logować historię importów.

---

# Warstwy danych w cenniku

Na podstawie analizy EG Cennik przyjmujemy cztery warstwy danych.

```text
EG Cennik

├── Warstwa A
│   Kalkulator sprzedaży
│
├── Warstwa B
│   Koszty i rentowność
│
├── Warstwa C
│   Produkcja / BOM
│
└── Warstwa D
    Montaż i realizacja
```

---

## Warstwa A — kalkulator sprzedaży

To warstwa używana przez publiczny kalkulator strony.

Zawiera ceny:

- konstrukcji,
- ścian,
- dachu,
- rolet,
- markizy,
- LED,
- dodatków.

Ta warstwa jest podstawą MVP.

---

## Warstwa B — koszty i rentowność

Ta warstwa służy do analizy:

- ceny zakupu,
- kosztów,
- marży,
- rentowności,
- rabatów,
- narzutów.

Nie powinna być bezpośrednio pokazywana klientowi.

Nie jest wymagana w pierwszej wersji publicznego kalkulatora.

---

## Warstwa C — produkcja / BOM

Ta warstwa opisuje elementy potrzebne do wykonania zamówienia:

- profile,
- szkło,
- prowadnice,
- uchwyty,
- szczotki,
- bloczki,
- LED,
- długości materiałów,
- ilości elementów.

Nie jest wymagana w MVP kalkulatora.

Będzie potrzebna później do produkcji, kompletacji i zamówień materiałowych.

---

## Warstwa D — montaż i realizacja

Ta warstwa opisuje:

- wynagrodzenie ekip,
- montaż konstrukcji,
- montaż ogrodu,
- montaż rolet,
- montaż LED,
- dopłaty za trudne warunki,
- odległości,
- wysokości montażu,
- niestandardowe warunki realizacji.

Nie jest wymagana w MVP publicznego kalkulatora.

Będzie potrzebna później w procesie realizacji.

---

# Rola Bitrix24

Bitrix24 jest docelowym CRM-em i systemem operacyjnym.

Na podstawie screenów z obecnego Bitrix24 wiemy, że system obsługuje:

- pipeline sprzedaży,
- pipeline realizacji,
- katalog produktów,
- pozycje produktowe na dealach,
- proformy,
- wyceny,
- specyfikacje,
- umowy,
- załączniki techniczne,
- kalendarz firmowy,
- montaż,
- historię działań.

Dlatego nie budujemy tych funkcji od zera w aplikacji.

---

# Pipeline Bitrix24

Nowe zapytanie z kalkulatora powinno docelowo trafiać do pipeline'u sprzedażowego.

Na podstawie screenów najlepszy kandydat to:

```text
Etap sprzedaży z pomiarem
```

Domyślny etap startowy:

```text
Nowy lead
```

Techniczne wartości `categoryId` i `stageId` muszą zostać pobrane z konkretnego portalu Bitrix24 przez API lub panel administracyjny.

Nie zgadujemy tych wartości.

---

# Product Rows w Bitrix24

Screeny pokazują, że dokumenty Bitrix24 są generowane na podstawie produktów przypisanych do deala.

Dlatego docelowo aplikacja powinna tworzyć w Bitrix24:

```text
Deal
+
Product Rows
```

Nie wystarczy sam komentarz z konfiguracją.

Product rows powinny odpowiadać pozycjom z `Quote`.

Przykładowe pozycje:

- konstrukcja,
- ściany,
- pokrycie dachu,
- roleta ZIP,
- markiza,
- LED,
- uchwyty,
- szczotki,
- montaż.

---

# Mapowanie produktów Bitrix24

Docelowo Excel powinien zawierać mapowanie między pozycjami kalkulatora a katalogiem produktów Bitrix24.

Przykładowa zakładka:

```text
app_bitrix_product_mapping
```

Przykładowe kolumny:

```text
quote_item_category
quote_item_key
product_kind
width
length
option_code
bitrix_product_id
bitrix_product_name
vat_rate
tax_included
```

Dzięki temu Excel pozostaje źródłem prawdy nie tylko dla ceny, ale też dla tego, jak pozycja ma zostać wysłana do Bitrix24.

---

# VAT

Strona pokazuje klientowi ceny brutto.

Bitrix24 na screenach pokazuje dokumenty w układzie:

```text
Cena netto
VAT %
Cena brutto
```

Dlatego integracja z Bitrix24 musi świadomie obsłużyć VAT.

Nie wolno bezrefleksyjnie wysyłać ceny brutto jako ceny netto produktu, bo mogłoby to spowodować podwójne naliczenie VAT.

Docelowo aplikacja musi wiedzieć dla każdej pozycji:

- czy cena w Excelu jest brutto czy netto,
- jaka jest stawka VAT,
- czy podatek jest wliczony w cenę,
- jaką wartość wysłać do Bitrix24.

Na ten moment zakładamy:

```text
Strona: brutto
Bitrix24 product rows: netto + VAT
```

Ta decyzja musi zostać potwierdzona testem na realnym lub testowym portalu Bitrix24.

---

# Dokumenty Bitrix24

Bitrix24 generuje dokumenty takie jak:

- wycena,
- specyfikacja,
- faktura proforma,
- umowa,
- załącznik techniczny.

Dlatego poprawne utworzenie product rows jest ważne dla całego procesu.

Aplikacja powinna dostarczyć do Bitrix24 dane w taki sposób, aby handlowiec mógł wygenerować dokument bez ręcznego przepisywania pozycji.

---

# MVP

W MVP utrzymujemy obecny kierunek:

```text
Pricing Engine działa lokalnie
Ceny są jeszcze w kodzie/plikach danych
Leady zapisują się lokalnie
Bitrix24 ma przygotowany szkielet integracji
```

MVP nie obejmuje jeszcze:

- pełnego importera Excela,
- pełnej integracji z Microsoft Graph,
- pełnego mapowania wszystkich produktów Bitrix24,
- produkcji/BOM,
- montażu,
- automatycznego generowania dokumentów.

---

# Etap docelowy

Etap docelowy:

```text
Excel Online
↓
Synchronizacja cennika
↓
Walidacja danych
↓
Publikacja snapshotu
↓
Kalkulator na stronie
↓
Zapytanie klienta
↓
Deal w Bitrix24
↓
Product rows
↓
Dokumenty
↓
Realizacja
```

---

# Otwarte pytania

## Cennik

1. Które tabele z EG Cennik są faktycznie źródłem cen sprzedażowych?
2. Czy różowa macierz była źródłem dla starego kalkulatora?
3. Czy wszystkie ceny w macierzy są brutto?
4. Czy ogród zimowy jest liczony jako zadaszenie + ściany?
5. Czy dodatki sumują się liniowo?
6. Czy LED punktowe i LED taśma mogą być wybrane razem?

## Excel

1. Czy docelowy plik będzie w Excel Online?
2. Czy plik będzie w OneDrive for Business / SharePoint?
3. Kto będzie miał uprawnienia do edycji?
4. Czy zmiany mają być publikowane ręcznie, czy automatycznie?
5. Kto zatwierdza nową wersję cennika?

## Bitrix24

1. Jaki jest `categoryId` pipeline'u sprzedażowego?
2. Jaki jest `stageId` etapu startowego?
3. Jakie są ID produktów w katalogu?
4. Jakie są ID pól własnych?
5. Jaki użytkownik ma być przypisany jako opiekun?
6. Jak dokładnie Bitrix24 ma liczyć VAT?
7. Czy dokumenty wymagają produktów z katalogu, czy wystarczy nazwa i cena?

---

# Decyzje na teraz

1. Excel jest docelowym źródłem prawdy dla cennika.
2. Bitrix24 nie jest źródłem prawdy dla cennika.
3. Kod aplikacji nie jest źródłem prawdy dla cennika.
4. Strona korzysta z opublikowanego snapshotu cennika.
5. Bitrix24 otrzymuje gotową wycenę i pozycje produktowe.
6. Lokalny panel `/admin/leady` zostaje tylko jako panel developerski.
7. Nie rozwijamy własnego CRM.
8. Nie wdrażamy jeszcze BOM i montażu do MVP.
9. Najpierw porządkujemy strukturę Excela.
10. Integrację Bitrix24 dopinamy po pobraniu realnych ID z portalu.

---

# Następne kroki

1. Przygotować strukturę pliku Excel.
2. Przygotować dokument `pricing-workbook-structure.md`.
3. Przygotować dokument `bitrix24-portal-mapping.md`.
4. Zaktualizować `bitrix24-integration.md`.
5. Po odpowiedzi znajomego doprecyzować klasyfikację tabel.
6. Po dostępie do Bitrix24 pobrać metadata przez API.
7. Dopiero potem rozwijać mapper produktów i VAT.