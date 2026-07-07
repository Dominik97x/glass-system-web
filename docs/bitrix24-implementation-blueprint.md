# Bitrix24 implementation blueprint

Status dokumentu: draft roboczy  
Projekt: Glass System / glass-system-web  
Cel: zaprojektowanie Bitrix24 jako centralnego systemu sprzedaży, realizacji i obsługi klienta.

---

# 1. Cel wdrożenia Bitrix24

Bitrix24 nie ma być tylko miejscem, do którego wpada formularz ze strony.

Docelowo Bitrix24 ma być centralnym systemem operacyjnym firmy:

```text
strona / kalkulator
↓
lead / deal
↓
sprzedaż
↓
pomiar
↓
oferta
↓
proforma / umowa
↓
realizacja
↓
montaż
↓
rozliczenie
↓
reklamacja / serwis
```

Strona i kalkulator mają działać niezależnie od Bitrix24, ale Bitrix24 ma przejąć dalszą obsługę zapytania po jego wysłaniu przez klienta.

---

# 2. Założenia strategiczne

## 2.1. Strona i CRM są rozdzielone

Aplikacja `glass-system-web` nie może być całkowicie zależna od Bitrix24.

Właściwy model:

```text
strona + kalkulator + pricing engine
działają samodzielnie

Bitrix24
jest odbiorcą danych, CRM-em i centrum pracy firmy
```

Dzięki temu strona może być gotowa przed zakupem finalnej licencji Bitrix24.

---

## 2.2. Excel jest źródłem prawdy cennika

Ustalony kierunek:

```text
Excel Online
↓
importer
↓
walidacja
↓
published pricing snapshot
↓
Pricing Engine
↓
kalkulator / Bitrix24 product rows
```

Bitrix24 nie jest masterem cennika.

Bitrix24 otrzymuje gotowe pozycje oferty, ceny, VAT i dane potrzebne do dokumentów.

---

## 2.3. Bitrix24 jest centrum sprzedaży i realizacji

Bitrix24 ma obsługiwać:

- kontakty,
- deale,
- pipeline sprzedaży,
- pipeline realizacji,
- reklamacje,
- produkty,
- dokumenty,
- proformy,
- umowy,
- zadania,
- kalendarze,
- odpowiedzialnych pracowników,
- automatyzacje,
- historię klienta.

---

# 3. Aktualny status projektu

## 3.1. Co działa w aplikacji

Aktualnie działa:

- kalkulator produktu,
- Pricing Engine,
- lokalny zapis zapytań,
- developerski panel leadów,
- snapshot cennika,
- walidacja snapshotu,
- VAT netto/brutto,
- przygotowanie product rows dla Bitrix24,
- developerski endpoint metadata Bitrix24,
- przełącznik źródła product rows.

Istnieją endpointy:

```text
POST /api/inquiries
GET  /api/inquiries
GET  /api/dev/pricing-snapshot/validate
GET  /api/dev/bitrix24/metadata
```

---

## 3.2. Aktualne tryby działania

Aplikacja obsługuje tryby repozytorium zapytań:

```env
CALCULATOR_INQUIRY_REPOSITORY=local
CALCULATOR_INQUIRY_REPOSITORY=bitrix24
CALCULATOR_INQUIRY_REPOSITORY=hybrid
```

Aplikacja obsługuje tryby źródła product rows dla Bitrix24:

```env
BITRIX24_PRODUCT_ROWS_SOURCE=quote_items
BITRIX24_PRODUCT_ROWS_SOURCE=pricing_snapshot
```

Docelowo preferowany tryb dla Bitrix24:

```env
BITRIX24_PRODUCT_ROWS_SOURCE=pricing_snapshot
```

---

# 4. Docelowy model przepływu zapytania

## 4.1. Źródło zapytania

Klient wchodzi na stronę i korzysta z kalkulatora.

Konfiguracja obejmuje między innymi:

- typ produktu,
- szerokość,
- długość,
- dach,
- ściany,
- rolety ZIP,
- markizę,
- LED / COB,
- akcesoria,
- wiadomość klienta,
- dane kontaktowe.

---

## 4.2. Po wysłaniu formularza

Po wysłaniu formularza aplikacja powinna:

```text
1. Przyjąć zapytanie.
2. Zbudować snapshot oferty.
3. Zapisać lead backupowo.
4. Wysłać lead do Bitrix24.
5. W Bitrix24 utworzyć deal.
6. Dodać product rows do deala.
7. Ustawić deal w odpowiednim pipeline i etapie.
8. Przekazać handlowcowi zadanie kontaktu.
```

---

## 4.3. Docelowy model danych

Ze strony do Bitrix24 powinny trafić:

- imię i nazwisko klienta,
- telefon,
- e-mail,
- wiadomość,
- źródło: kalkulator / strona,
- typ produktu,
- wymiary,
- konfiguracja,
- pozycje oferty,
- suma brutto,
- ceny netto,
- VAT,
- product rows,
- komentarz techniczny dla handlowca.

---

# 5. Decyzja: lead czy deal w Bitrix24

## 5.1. Rekomendowany model

Rekomendacja:

```text
Zapytanie ze strony tworzy deal w pipeline sprzedaży.
```

Nie tworzymy osobnego obiektu Lead jako głównego elementu procesu, chyba że później Bitrix24 lub proces sprzedaży wyraźnie tego wymaga.

Powód:

- zapytanie z kalkulatora ma już konkretną konfigurację,
- ma wartość oferty,
- ma produkty,
- może od razu przejść przez proces sprzedaży,
- dokumenty i product rows wygodniej obsługiwać na dealu.

---

## 5.2. Model roboczy

```text
Kalkulator
↓
Deal w pipeline sprzedaży
↓
Kontakt / kwalifikacja
↓
Pomiar
↓
Oferta
↓
Proforma / umowa
↓
Realizacja
```

---

# 6. Pipeline 1: Sprzedaż z pomiarem

Nazwa robocza:

```text
Etap sprzedaży z pomiarem
```

Cel pipeline’u: obsługa zapytań od pierwszego kontaktu do zaakceptowanej oferty / proformy / przekazania do realizacji.

---

## 6.1. Etapy sprzedaży

Proponowane etapy:

```text
Nowy lead
Brak kontaktu
Kontakt nawiązany
Oczekiwanie na zdjęcia
Zakwalifikowany lead
Pomiar
Oferta w przygotowaniu
Oferta wysłana
Proforma wysłana
Umowa wysłana
Wygrany - przekazać do realizacji
Odroczony: termin / budżet
Zła kwalifikacja
Przegrany
```

---

## 6.2. Opis etapów

### Nowy lead

Deal utworzony automatycznie ze strony lub ręcznie przez pracownika.

W tym etapie powinny znajdować się nowe zapytania, które jeszcze nie zostały obsłużone.

Wymagane działania:

- sprawdzić dane klienta,
- sprawdzić konfigurację,
- zadzwonić lub napisać do klienta,
- zweryfikować lokalizację i oczekiwania.

---

### Brak kontaktu

Klient nie odebrał telefonu lub nie odpisał.

Wymagane działania:

- ponowić kontakt,
- ustawić zadanie follow-up,
- po kilku próbach oznaczyć jako odroczony lub przegrany.

---

### Kontakt nawiązany

Handlowiec porozmawiał z klientem.

Wymagane działania:

- doprecyzować potrzeby,
- potwierdzić produkt,
- zapytać o zdjęcia / pomiary / lokalizację,
- ocenić, czy lead jest realny.

---

### Oczekiwanie na zdjęcia

Klient ma dosłać zdjęcia, wymiary lub dodatkowe informacje.

Wymagane działania:

- wysłać wiadomość z instrukcją,
- ustawić przypomnienie,
- po otrzymaniu materiałów przejść dalej.

---

### Zakwalifikowany lead

Lead ma sens sprzedażowo i technicznie.

Wymagane działania:

- zdecydować, czy potrzebny jest pomiar,
- przygotować wstępną ofertę,
- zaplanować kolejny krok.

---

### Pomiar

Potrzebny jest pomiar na miejscu.

Wymagane działania:

- ustalić termin pomiaru,
- przypisać osobę odpowiedzialną,
- dodać wydarzenie w kalendarzu,
- po pomiarze uzupełnić dane techniczne.

---

### Oferta w przygotowaniu

Oferta jest przygotowywana.

Wymagane działania:

- sprawdzić konfigurację,
- zweryfikować produkty i ceny,
- dodać rabat, jeśli dotyczy,
- sprawdzić VAT,
- wygenerować dokument oferty.

---

### Oferta wysłana

Oferta została wysłana do klienta.

Wymagane działania:

- ustawić zadanie follow-up,
- czekać na decyzję klienta,
- aktualizować deal po odpowiedzi.

---

### Proforma wysłana

Klient zaakceptował ofertę i otrzymał proformę.

Wymagane działania:

- monitorować płatność,
- po płatności przekazać do realizacji,
- przygotować umowę, jeśli proces tego wymaga.

---

### Umowa wysłana

Umowa została wysłana do klienta.

Wymagane działania:

- czekać na podpis,
- ustawić przypomnienie,
- po podpisaniu przekazać do realizacji.

---

### Wygrany - przekazać do realizacji

Sprzedaż zakończona sukcesem.

Wymagane działania:

- utworzyć lub przenieść deal do pipeline realizacji,
- przekazać komplet informacji technicznych,
- sprawdzić płatność,
- przekazać dokumenty.

---

### Odroczony: termin / budżet

Klient jest zainteresowany, ale nie teraz.

Powody:

- brak budżetu,
- termin za kilka miesięcy,
- klient musi podjąć decyzję,
- inwestycja odłożona.

Wymagane działania:

- ustawić datę powrotu,
- nie zamykać jako przegrany zbyt wcześnie.

---

### Zła kwalifikacja

Zapytanie nie pasuje do oferty firmy.

Przykłady:

- zły typ produktu,
- zła lokalizacja,
- zbyt mały budżet,
- nierealne oczekiwania,
- brak możliwości technicznej.

---

### Przegrany

Deal przegrany.

Wymagane dane:

- powód przegranej,
- komentarz,
- ewentualna data powrotu.

---

# 7. Pipeline 2: Realizacja

Nazwa robocza:

```text
Etap realizacji
```

Cel pipeline’u: obsługa zamówienia po zaakceptowaniu oferty / opłaceniu proformy.

---

## 7.1. Etapy realizacji

Proponowane etapy:

```text
Nowa realizacja
Weryfikacja techniczna
Materiał na wycenie
Materiał zaakceptowany
Materiał zamówiony
Szkło na wymiar
Termin montażu do ustalenia
Ustalone: ekipa i termin
W trakcie montażu
Montaż skończony
Projekt opłacony
Zamknij realizację
Realizacja zawieszona
Problem / wymaga decyzji
```

---

## 7.2. Opis etapów

### Nowa realizacja

Deal trafił ze sprzedaży do realizacji.

Wymagane działania:

- sprawdzić komplet dokumentów,
- sprawdzić płatność,
- sprawdzić konfigurację,
- ustalić osobę odpowiedzialną za realizację.

---

### Weryfikacja techniczna

Zespół techniczny weryfikuje dane.

Wymagane działania:

- sprawdzić wymiary,
- sprawdzić zdjęcia,
- sprawdzić pomiar,
- potwierdzić zakres prac.

---

### Materiał na wycenie

Materiały są wysłane do wyceny lub sprawdzania kosztów.

Wymagane działania:

- wysłać zapytania do dostawców,
- sprawdzić dostępność,
- sprawdzić terminy.

---

### Materiał zaakceptowany

Koszt materiału został zaakceptowany.

Wymagane działania:

- zatwierdzić zamówienie,
- przygotować zakup,
- sprawdzić termin dostawy.

---

### Materiał zamówiony

Materiał został zamówiony.

Wymagane działania:

- monitorować dostawę,
- zapisać przewidywany termin,
- dodać dokumenty zakupu, jeśli dotyczy.

---

### Szkło na wymiar

Szkło lub elementy specjalne są w produkcji.

Wymagane działania:

- monitorować status produkcji,
- sprawdzić terminy,
- przygotować ekipę montażową.

---

### Termin montażu do ustalenia

Trzeba ustalić termin montażu z klientem.

Wymagane działania:

- skontaktować się z klientem,
- sprawdzić kalendarz ekip,
- ustalić termin.

---

### Ustalone: ekipa i termin

Termin oraz ekipa są ustalone.

Wymagane działania:

- dodać wydarzenie w kalendarzu,
- przypisać ekipę,
- potwierdzić klientowi termin,
- przygotować checklistę montażową.

---

### W trakcie montażu

Montaż trwa.

Wymagane działania:

- monitorować status,
- zebrać zdjęcia z realizacji,
- odnotować problemy.

---

### Montaż skończony

Montaż zakończony.

Wymagane działania:

- zebrać potwierdzenie,
- wykonać zdjęcia końcowe,
- sprawdzić rozliczenie,
- przekazać do zamknięcia.

---

### Projekt opłacony

Projekt został opłacony w całości.

Wymagane działania:

- sprawdzić dokumenty,
- zamknąć kwestie finansowe,
- przygotować finalizację.

---

### Zamknij realizację

Realizacja gotowa do zamknięcia.

Wymagane działania:

- sprawdzić komplet danych,
- oznaczyć realizację jako zakończoną,
- ewentualnie poprosić klienta o opinię.

---

### Realizacja zawieszona

Realizacja jest zatrzymana.

Powody:

- brak materiału,
- brak płatności,
- problem techniczny,
- decyzja klienta,
- pogoda,
- brak dostępności ekipy.

---

### Problem / wymaga decyzji

Realizacja wymaga interwencji.

Przykłady:

- błędny wymiar,
- uszkodzony materiał,
- zmiana zakresu,
- opóźnienie dostawcy,
- klient zmienił decyzję.

---

# 8. Pipeline 3: Reklamacje / serwis

Nazwa robocza:

```text
Etap reklamacji
```

Cel pipeline’u: obsługa zgłoszeń po montażu.

---

## 8.1. Etapy reklamacji

Proponowane etapy:

```text
Nowe zgłoszenie
Weryfikacja zgłoszenia
Oczekiwanie na zdjęcia
Wymaga wizyty serwisowej
Termin serwisu ustalony
W trakcie serwisu
Serwis zakończony
Odrzucone
Zamknięte
```

---

## 8.2. Dane wymagane przy reklamacji

- klient,
- numer realizacji / deal powiązany,
- opis problemu,
- zdjęcia,
- data montażu,
- typ produktu,
- osoba odpowiedzialna,
- status zgłoszenia,
- decyzja reklamacyjna.

---

# 9. Kontakty i firmy

## 9.1. Kontakt

Kontakt reprezentuje osobę prywatną lub osobę kontaktową po stronie klienta.

Minimalne pola:

- imię i nazwisko,
- telefon,
- e-mail,
- miasto / lokalizacja,
- źródło pozyskania,
- zgoda marketingowa, jeśli dotyczy.

---

## 9.2. Firma

Firma może być używana, jeśli klientem jest podmiot gospodarczy.

Minimalne pola:

- nazwa firmy,
- NIP,
- adres,
- osoba kontaktowa,
- telefon,
- e-mail.

---

# 10. Produkty w katalogu Bitrix24

## 10.1. Cel katalogu produktów

Katalog produktów Bitrix24 ma służyć do:

- dodawania product rows do deala,
- generowania dokumentów,
- ofert,
- proform,
- umów,
- specyfikacji.

Masterem cennika pozostaje Excel / snapshot.

Bitrix24 otrzymuje produkty i ceny jako wynik kalkulacji.

---

## 10.2. Proponowane sekcje katalogu

Sekcje:

```text
ZADASZENIE TARASU
OGRÓD ZIMOWY
KONSTRUKCJA
POKRYCIE DACHU
SYSTEMY PRZESUWNE
SZYBY BOCZNE
ROLETY ZIP
MARKIZA
OŚWIETLENIE
AKCESORIA
FUNDAMENT
MONTAŻ
TRANSPORT
SERWIS
```

---

## 10.3. Produkty MVP

Produkty potrzebne do pierwszego testu:

```text
Ogród zimowy 300x306 cm
Zadaszenie tarasu 300x306 cm
System przesuwny ze szkłem 300x306 cm
Roleta ZIP przednia 300x306 cm
Roleta ZIP lewa 300x306 cm
Roleta ZIP prawa 300x306 cm
Markiza dachowa 300x306 cm
Oświetlenie LED punktowe 300x306 cm
Oświetlenie COB 300x306 cm
Zestaw uchwytów na szkło ścienne 300x306 cm
Zestaw szczotek przeciwkurzowych 300x306 cm
Przygotowanie fundamentu pod system przesuwny 300x306 cm
```

---

## 10.4. Product ID

Na etapie MVP mapping może działać po nazwach produktów.

Docelowo trzeba uzupełnić:

```text
bitrixProductId
```

w snapshot mappingu.

Źródło:

```text
Bitrix24 catalog product list
```

---

# 11. VAT i ceny

## 11.1. Aktualne założenie

Snapshot cennika przechowuje ceny brutto.

Do Bitrix24 product rows wysyłamy:

```text
price = cena netto
taxRate = 8
taxIncluded = "N"
```

Przykład:

```json
{
  "productName": "Ogród zimowy 300x306 cm",
  "price": 7762.04,
  "quantity": 1,
  "taxRate": 8,
  "taxIncluded": "N"
}
```

---

## 11.2. Do potwierdzenia

Trzeba sprawdzić w realnym Bitrix24:

- czy dokumenty poprawnie liczą VAT,
- czy product rows przyjmują `taxIncluded = "N"`,
- czy cena netto + VAT = cena brutto z kalkulatora,
- czy VAT 8% jest właściwy dla wszystkich kategorii,
- czy niektóre pozycje wymagają 23%,
- jak Bitrix24 pokazuje cenę w ofercie, proformie i umowie.

---

# 12. Dokumenty Bitrix24

## 12.1. Dokumenty docelowe

Docelowo Bitrix24 powinien generować:

```text
Wycena
Oferta
Specyfikacja
Proforma
Umowa
Załącznik techniczny
Potwierdzenie realizacji
```

---

## 12.2. Dane potrzebne do dokumentów

Dokumenty powinny korzystać z:

- danych klienta,
- danych dealu,
- konfiguracji produktu,
- product rows,
- cen netto,
- VAT,
- cen brutto,
- terminu realizacji,
- danych firmy,
- warunków płatności,
- notatek technicznych.

---

## 12.3. Do potwierdzenia

Trzeba sprawdzić:

- które dokumenty są dostępne w wybranym planie Bitrix24,
- czy dokumenty mogą używać product rows,
- jak wygląda szablon oferty,
- jak wygląda szablon proformy,
- czy umowa może być generowana automatycznie,
- czy potrzebne są pola własne do dokumentów.

---

# 13. Pola własne deala

## 13.1. Pola sugerowane

Do rozważenia jako pola własne w dealu:

```text
Typ produktu
Szerokość
Długość
Rodzaj dachu
Rodzaj ścian
ZIP przód
ZIP lewy
ZIP prawy
Markiza
LED
COB
Uchwyty
Szczotki
Profil wyrównujący
Suma brutto z kalkulatora
Wersja cennika
Źródło zapytania
ID zapytania ze strony
Uwagi klienta
Uwagi handlowca
Czy wymagany pomiar
Termin pomiaru
Termin montażu
Ekipa montażowa
Status płatności
```

---

## 13.2. Pola techniczne

Pola techniczne przydatne dla integracji:

```text
calculator_inquiry_id
pricing_version
configuration_json
quote_total_gross
quote_total_net
quote_total_tax
source_url
utm_source
utm_medium
utm_campaign
```

---

## 13.3. Decyzja robocza

Na MVP nie musimy od razu mapować wszystkiego do pól własnych.

Minimalnie deal powinien mieć:

- tytuł,
- wartość,
- kontakt,
- komentarz z konfiguracją,
- product rows.

Pola własne można dodawać etapami.

---

# 14. Automatyzacje

## 14.1. Automatyzacje sprzedaży

Do rozważenia:

```text
Po utworzeniu nowego deala:
- przypisz odpowiedzialnego handlowca
- utwórz zadanie: skontaktuj się z klientem
- ustaw deadline kontaktu
- wyślij powiadomienie do handlowca
```

Po przejściu do etapu `Oczekiwanie na zdjęcia`:

```text
- utwórz zadanie follow-up
- wyślij klientowi instrukcję dosłania zdjęć
```

Po przejściu do etapu `Pomiar`:

```text
- utwórz zadanie pomiaru
- dodaj wydarzenie w kalendarzu
- przypisz osobę odpowiedzialną
```

Po przejściu do etapu `Oferta wysłana`:

```text
- utwórz zadanie follow-up po 2-3 dniach
```

Po przejściu do etapu `Proforma wysłana`:

```text
- utwórz zadanie sprawdzenia płatności
```

---

## 14.2. Automatyzacje realizacji

Po przekazaniu do realizacji:

```text
- utwórz deal w pipeline realizacji albo przenieś istniejący
- przypisz osobę odpowiedzialną za realizację
- utwórz checklistę techniczną
```

Po ustaleniu terminu montażu:

```text
- dodaj wydarzenie do kalendarza
- powiadom ekipę
- powiadom klienta
```

Po zakończeniu montażu:

```text
- utwórz zadanie rozliczenia
- poproś klienta o opinię
- zamknij realizację
```

---

# 15. Role użytkowników

## 15.1. Role docelowe

Potencjalne role w firmie:

```text
Właściciel / administrator
Handlowiec
Osoba od pomiarów
Koordynator realizacji
Ekipa montażowa
Księgowość / finanse
Serwis / reklamacje
```

---

## 15.2. Uprawnienia

Do ustalenia:

- kto widzi wszystkie deale,
- kto może edytować ceny,
- kto może generować dokumenty,
- kto może zamykać deal,
- kto może zmieniać etap realizacji,
- kto widzi dane finansowe,
- kto ma dostęp do raportów.

---

# 16. Kalendarze

## 16.1. Kalendarz pomiarów

Powinien obejmować:

- datę pomiaru,
- klienta,
- adres,
- osobę wykonującą pomiar,
- link do deala,
- notatki techniczne.

---

## 16.2. Kalendarz montaży

Powinien obejmować:

- datę montażu,
- klienta,
- adres,
- ekipę,
- zakres prac,
- materiały,
- link do realizacji,
- status.

---

# 17. Co przychodzi ze strony

## 17.1. Dane klienta

```text
name
email
phone
message
```

---

## 17.2. Dane oferty

```text
productKind
width
length
walls
roof
hasFrontZip
hasLeftZip
hasRightZip
hasAwning
hasLed
hasCob
hasHandles
hasBrushes
hasLevelingProfile
quoteItems
totalGross
```

---

## 17.3. Dane techniczne integracji

```text
source = calculator
createdAt
inquiryId
pricingVersion
configuration
```

---

# 18. Co zostaje w aplikacji

Aplikacja odpowiada za:

- kalkulator,
- UX klienta,
- pricing engine,
- snapshot cennika,
- walidację cennika,
- przygotowanie product rows,
- backup leadów,
- wysłanie zapytania do Bitrix24,
- fallback, jeśli Bitrix24 nie działa.

---

# 19. Co zostaje w Bitrix24

Bitrix24 odpowiada za:

- obsługę sprzedaży,
- kontakt z klientem,
- historię klienta,
- pipeline,
- zadania,
- dokumenty,
- product rows,
- realizację,
- reklamacje,
- raporty,
- pracę zespołu.

---

# 20. Co zostaje w Excelu

Excel odpowiada za:

- cennik,
- ceny bazowe,
- dodatki,
- VAT rules,
- mapping produktów,
- wersjonowanie cennika,
- dane wejściowe do snapshotu.

Excel nie obsługuje procesu sprzedaży.

---

# 21. Plan pracy z testowym Bitrix24

## 21.1. Etap testowy

Założyć darmowy / testowy portal Bitrix24.

Cel:

- poznać panel,
- sprawdzić CRM,
- stworzyć testowe pipeline’y,
- stworzyć testowe produkty,
- sprawdzić dokumenty,
- zweryfikować, jak Bitrix24 liczy VAT,
- sprawdzić, czy API/webhooki są dostępne w planie.

---

## 21.2. Czego nie robić w testowym portalu

Nie używać testowego portalu do prawdziwych danych klientów.

Nie traktować go jako finalnego systemu, jeśli nie jest założony na docelowe dane firmy.

Nie opierać produkcji na portalu, którego właścicielem nie jest firma.

---

# 22. Plan pracy z finalnym Bitrix24

Finalny portal powinien należeć do firmy / właściciela firmy.

Do wykonania przed startem:

```text
1. Założyć finalny portal.
2. Wybrać plan z dostępem do REST API / webhooków.
3. Skonfigurować pipeline sprzedaży.
4. Skonfigurować pipeline realizacji.
5. Skonfigurować reklamacje.
6. Dodać produkty.
7. Dodać pola własne.
8. Skonfigurować dokumenty.
9. Skonfigurować użytkowników i role.
10. Wygenerować webhook.
11. Uruchomić /api/dev/bitrix24/metadata.
12. Uzupełnić .env.local / env produkcyjny.
13. Przetestować utworzenie deala.
14. Przetestować product rows.
15. Przetestować dokumenty.
16. Przetestować cały proces od zapytania do realizacji.
```

---

# 23. Endpoint metadata

W aplikacji istnieje developerski endpoint:

```text
GET /api/dev/bitrix24/metadata
```

Służy do pobrania:

- kategorii / pipeline’ów,
- etapów,
- pól deala,
- sugerowanych wartości env.

Wymagane zmienne:

```env
BITRIX24_ENABLED=true
BITRIX24_WEBHOOK_URL=https://portal.bitrix24.pl/rest/USER_ID/WEBHOOK_CODE
BITRIX24_DEAL_ENTITY_TYPE_ID=2
```

Oczekiwany wynik:

```text
success: true
metadata.categories
metadata.stageGroups
metadata.fields
metadata.suggestedEnv
```

---

# 24. Konfiguracja env docelowa

Docelowe zmienne dla Bitrix24:

```env
BITRIX24_ENABLED=true
BITRIX24_WEBHOOK_URL=
BITRIX24_DEAL_ENTITY_TYPE_ID=2
BITRIX24_DEAL_OWNER_TYPE=D
BITRIX24_DEFAULT_CATEGORY_ID=
BITRIX24_DEFAULT_STAGE_ID=
BITRIX24_ASSIGNED_BY_ID=
BITRIX24_SOURCE_ID=WEB
BITRIX24_PRODUCT_ROWS_SOURCE=pricing_snapshot
```

Tryb lokalny bez Bitrix24:

```env
CALCULATOR_INQUIRY_REPOSITORY=local
BITRIX24_ENABLED=false
BITRIX24_PRODUCT_ROWS_SOURCE=quote_items
```

Tryb testowy z Bitrix24 i lokalnym backupem:

```env
CALCULATOR_INQUIRY_REPOSITORY=hybrid
BITRIX24_ENABLED=true
BITRIX24_PRODUCT_ROWS_SOURCE=pricing_snapshot
```

Tryb produkcyjny docelowy:

```env
CALCULATOR_INQUIRY_REPOSITORY=hybrid
BITRIX24_ENABLED=true
BITRIX24_PRODUCT_ROWS_SOURCE=pricing_snapshot
```

Uwaga: produkcyjnie rekomendowany jest dodatkowy trwały backup leadów poza lokalnym JSON-em.

---

# 25. Ryzyka

## 25.1. Ryzyka techniczne

```text
Brak dostępu do REST API w wybranym planie Bitrix24
Nieznane wymagane pola deala
Inny format product rows niż zakładany
Problem z VAT netto/brutto
Brak productId w mappingu
Błędy dokumentów
Awaria Bitrix24 w momencie wysłania formularza
```

---

## 25.2. Ryzyka biznesowe

```text
Nieustalony proces sprzedaży
Nieustalony proces realizacji
Brak osoby odpowiedzialnej za CRM
Zbyt dużo etapów na start
Zbyt skomplikowane automatyzacje
Brak dyscypliny w pracy z CRM
Brak finalnej decyzji o Bitrix24
```

---

## 25.3. Największe ryzyko

Największym ryzykiem nie jest samo API.

Największym ryzykiem jest źle zaprojektowany proces firmy w CRM.

Jeśli pipeline’y, etapy, dokumenty, odpowiedzialności i zadania nie będą dobrze ustawione, to sama integracja ze stroną nie rozwiąże problemów operacyjnych.

---

# 26. Decyzje otwarte

Do ustalenia:

```text
Czy finalnie używamy Bitrix24?
Jaki plan Bitrix24 będzie wybrany?
Kiedy powstanie finalny portal?
Kto będzie właścicielem portalu?
Czy używamy Leadów Bitrix24, czy tylko Dealów?
Czy pipeline realizacji będzie osobnym dealem czy kolejnym etapem tego samego deala?
Czy reklamacje będą osobnym pipeline’em?
Jakie dokumenty są konieczne na MVP?
Jaki VAT dla poszczególnych kategorii?
Czy montaż i transport są osobnymi pozycjami?
Czy rabaty są liczone w kalkulatorze czy w CRM?
Czy płatności będą obsługiwane w Bitrix24?
Czy firma będzie używać telefonii Bitrix24?
Czy firma będzie używać kalendarzy ekip montażowych?
```

---

# 27. MVP Bitrix24

Minimalne wdrożenie Bitrix24 na start:

```text
1. Pipeline sprzedaży z pomiarem.
2. Etap startowy: Nowy lead.
3. Kontakty.
4. Deale.
5. Product rows.
6. Podstawowy katalog produktów.
7. Oferta / wycena.
8. Proforma.
9. Zadanie kontaktu z klientem.
10. Podstawowy pipeline realizacji.
```

To wystarczy, żeby firma mogła zacząć pracę.

---

# 28. Wersja rozszerzona

Późniejsze rozszerzenia:

```text
automatyzacje etapów
kalendarz pomiarów
kalendarz montaży
workflow akceptacji ofert
e-podpis
płatności online
raporty sprzedaży
raporty źródeł leadów
magazyn / dostawcy
pełna obsługa reklamacji
integracja z pocztą
integracja z telefonią
integracja z dokumentami księgowymi
```

---

# 29. Plan najbliższych prac

## Aplikacja

```text
1. Dokończyć dokumentację CRM blueprint.
2. Dodać produkcyjny backup leadów.
3. Dodać fallback e-mailowy.
4. Przygotować importer Excela do snapshotu.
5. Rozbudować landing / treści strony.
6. Przygotować deployment.
7. Przygotować staging.
```

---

## Bitrix24

```text
1. Założyć testowy portal.
2. Przeklikać CRM.
3. Utworzyć testowe pipeline’y.
4. Utworzyć testowe produkty.
5. Sprawdzić dokumenty.
6. Sprawdzić VAT.
7. Sprawdzić dostępność webhooków.
8. Udokumentować realne wartości i screeny.
```

---

## Przed startem firmy

```text
1. Założyć finalny portal Bitrix24.
2. Skonfigurować pipeline’y.
3. Skonfigurować produkty.
4. Skonfigurować dokumenty.
5. Skonfigurować użytkowników.
6. Wygenerować webhook.
7. Uruchomić metadata inspector.
8. Uzupełnić env.
9. Przetestować deala.
10. Przetestować dokumenty.
11. Przetestować cały proces.
```

---

# 30. Aktualna rekomendacja

Na obecnym etapie najlepsza strategia:

```text
Nie kupować jeszcze płatnego Bitrix24 tylko po to, żeby pisać kod.
```

Zamiast tego:

```text
1. Założyć darmowy/testowy Bitrix24.
2. Używać go do projektowania procesu.
3. Dalej rozwijać aplikację niezależnie.
4. Przygotować produkcyjny fallback leadów.
5. Przed startem firmy założyć finalny Bitrix24.
6. Wtedy zrobić realną integrację, webhooki i testy.
```

---

# 31. Podsumowanie

Projekt idzie w kierunku:

```text
strona sprzedażowa
+ kalkulator
+ Excel jako źródło cennika
+ Pricing Engine
+ backup leadów
+ Bitrix24 jako CRM i centrum operacyjne firmy
```

To jest bezpieczny i profesjonalny kierunek.

Aplikacja może być gotowa przed formalnym startem firmy.

Bitrix24 trzeba zacząć projektować wcześniej, ale finalną płatną konfigurację najlepiej zrobić wtedy, gdy właściciel firmy będzie gotowy organizacyjnie i finansowo.

Najbliższy priorytet:

```text
zaprojektować proces CRM
i przygotować aplikację tak, żeby żaden lead nie ginął nawet bez Bitrix24
```


