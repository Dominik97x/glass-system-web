# Specyfikacja konfiguracji Bitrix24 dla MoonGlass

**Wersja:** 1.0  
**Data:** 2026-08-04  
**Podstawa:** aktualny projekt strony MoonGlass, arkusz/JSON cenowy oraz analiza zrzutów CRM i katalogu produktów EG.

## 1. Decyzja architektoniczna

MoonGlass używa **prostego CRM opartego na Kontaktach/Firmach i Dealach**.

- osoba prywatna → Kontakt + Deal,
- klient firmowy → Firma + Kontakt reprezentujący + Deal,
- jeden klient może mieć wiele Deali,
- Deal jest centralną kartą konkretnej wyceny/projektu,
- ceny w Bitrix24 są kopią zatwierdzonej wyceny serwerowej; źródłem prawdy pozostaje cennik/JSON MoonGlass,
- pozycje produktowe w Dealu są snapshotem ceny z chwili wysłania zapytania/oferty.

Nie używamy osobnego obiektu Lead. Nazwa „Nowe zapytanie” jest etapem Deala.

## 2. Strategia planów

### Etap bezpłatny — konfigurujemy teraz

Na planie Free tworzymy wyłącznie elementy zgodne z jednym lejkiem:

1. jeden lejek `01 Sprzedaż z pomiarem`,
2. wszystkie etapy tego lejka,
3. pola Kontaktów, Firm i Deali,
4. sekcje katalogu produktów,
5. kilka ręcznych produktów testowych,
6. źródła, typy klienta i przyczyny przegranej,
7. widoki listy i Kanban.

Nie konfigurujemy teraz:

- osobnych lejków Realizacji i Reklamacji,
- reguł automatyzacji,
- webhooków i REST API,
- procesów inteligentnych Płatności/Montaże/Pomiary,
- workflowów.

### Po przejściu na plan komercyjny

- **Basic:** API + do 5 lejków; wystarczy do integracji strony i ręcznej pracy na trzech lejkach.
- **Standard:** praktyczne minimum do systemu podobnego do EG — API, wiele lejków i automatyzacja sprzedaży.
- **Professional:** wymagany, jeśli od razu chcemy odtworzyć zaawansowane zakładki/rekordy Płatności, Montaże, Pomiary i workflowy za pomocą procesów inteligentnych.

## 3. Nazewnictwo

### Nazwa Deala

Format automatyczny:

`MG-{krótkie ID} | {klient} | {produkt} {głębokość}×{szerokość} cm`

Przykład:

`MG-50D75AC0 | Dziunek | Ogród zimowy 300×306 cm`

### Wymiary

W całym systemie obowiązuje kolejność:

`głębokość × szerokość`

Przykład konfiguracji technicznej `width=306`, `length=300` jest wyświetlany jako `300×306 cm`.

### Alias integracyjny pól

W specyfikacji używamy aliasów `MG_*`. Bitrix24 po utworzeniu pola przydzieli identyfikator `UF_CRM_...`. Powstanie później tabela:

`alias MG_* → faktyczny identyfikator UF_CRM_*`.

## 4. Lejek 01 — Sprzedaż z pomiarem

### Etapy aktywne

| Nr | Etap | Cel |
|---:|---|---|
| 1 | Nowe zapytanie | Zapytanie ze strony, telefonu, reklamy lub polecenia |
| 2 | Brak kontaktu | Pierwsza próba kontaktu nieudana |
| 3 | Kontakt nawiązany | Rozmowa z klientem rozpoczęta |
| 4 | Oczekiwanie na zdjęcia | Klient ma dosłać zdjęcia/materiały |
| 5 | Zakwalifikowany | Potwierdzona potrzeba, produkt i wstępny budżet |
| 6 | Brak kontaktu po kwalifikacji | Klient przestał odpowiadać po kwalifikacji |
| 7 | Pomiar do umówienia | Pomiar jest wymagany, brak terminu |
| 8 | Pomiar umówiony | Ustalony termin i osoba wykonująca pomiar |
| 9 | Pomiar wykonany | Dane techniczne są kompletne |
| 10 | Przygotowanie oferty | Trwa finalna kalkulacja/dokument |
| 11 | Oferta wysłana | Oferta przekazana klientowi |
| 12 | Proforma / umowa wysłana | Oczekiwanie na płatność lub podpis |
| 13 | Odroczony — termin | Klient wróci w określonym terminie |
| 14 | Odroczony — budżet | Klient odkłada decyzję finansową |

### Etap zakończony sukcesem

| Etap | Znaczenie |
|---|---|
| Wygrany — przekazany do realizacji | Oferta zaakceptowana; po planie płatnym Deal przechodzi do lejka Realizacja |

### Etapy zakończone niepowodzeniem

| Etap | Znaczenie |
|---|---|
| Przegrany — zła kwalifikacja | Brak dopasowania technicznego/produktowego |
| Przegrany — brak decyzji | Klient nie podjął decyzji po follow-upach |
| Przegrany — konkurencja/cena | Klient wybrał inną ofertę lub cena była barierą |
| Przegrany — duplikat/test | Rekord techniczny, spam lub duplikat |

## 5. Lejek 02 — Realizacja (po planie płatnym)

| Nr | Etap |
|---:|---|
| 1 | W realizacji |
| 2 | Szkło na wymiar |
| 3 | Wysłać materiał na wycenę |
| 4 | Materiał na wycenie |
| 5 | Wycena materiału zaakceptowana |
| 6 | Zamówienie materiału |
| 7 | Materiał zamówiony |
| 8 | Ustalona ekipa i termin montażu |
| 9 | Materiał opłacony |
| 10 | Realizacja zawieszona |
| 11 | Montaż rozpoczęty |
| 12 | Montaż skończony — nieopłacone |
| 13 | Montaż skończony — gotówka |
| 14 | Projekt opłacony |
| 15 | Zamknięty projekt |

## 6. Lejek 03 — Reklamacje (po planie płatnym)

| Nr | Etap |
|---:|---|
| 1 | Reklamacja zgłoszona |
| 2 | Analiza zgłoszenia |
| 3 | Reklamacja uznana |
| 4 | Wymagane zamówienie towaru |
| 5 | Towar zamówiony |
| 6 | Ustalony termin naprawy |
| 7 | Naprawa w toku |
| 8 | Reklamacja odrzucona |
| 9 | Analiza przyczyn niepowodzenia |
| 10 | Reklamacja zamknięta |

## 7. Pola Kontaktu

| Alias | Nazwa pola | Typ | Uwagi |
|---|---|---|---|
| standard | Imię | standard | wymagane |
| standard | Nazwisko | standard | wymagane, jeśli znane |
| standard | Telefon | standard wielokrotny | główny klucz wyszukiwania duplikatu |
| standard | E-mail | standard wielokrotny | drugi klucz duplikatu |
| MG_PREFERRED_CHANNEL | Preferowany kanał kontaktu | lista | telefon, e-mail, SMS, WhatsApp |
| MG_CUSTOMER_TYPE | Typ klienta | lista | osoba prywatna, firma |
| MG_RODO_SOURCE | Źródło danych / zgody | lista | kalkulator strony, telefon, e-mail, reklama, polecenie |
| MG_RODO_DATE | Data pozyskania danych | data i czas | ustawiana przez integrację |
| MG_MARKETING_CONSENT | Zgoda marketingowa | tak/nie | tylko jeśli strona ją faktycznie zbiera |
| MG_EXTERNAL_CONTACT_KEY | Klucz kontaktu MoonGlass | tekst | opcjonalny identyfikator lokalny |

Adres montażu nie jest przechowywany na Kontakcie — należy do konkretnego Deala.

## 8. Pola Firmy

| Alias | Nazwa pola | Typ |
|---|---|---|
| standard | Nazwa firmy | standard |
| standard/custom | NIP | tekst |
| MG_REGON | REGON | tekst |
| standard | Telefon | standard |
| standard | E-mail | standard |
| standard | Adres firmy | standard |
| MG_COMPANY_NOTES | Uwagi handlowe | tekst wielowierszowy |

Firma jest połączona z osobą kontaktową i jednym lub wieloma Dealami.

## 9. Pola Deala

### 9.1. Integracja i identyfikatory

| Alias | Nazwa | Typ | Źródło |
|---|---|---|---|
| MG_WEB_INQUIRY_ID | ID zapytania ze strony | tekst | `inq_...` z PostgreSQL |
| MG_LOCAL_LEAD_ID | ID rekordu MoonGlass | tekst | backend |
| MG_QUOTE_VERSION | Wersja cennika/wyceny | tekst | generator JSON |
| MG_SOURCE_URL | Adres źródłowy | URL/tekst | strona wysłania formularza |
| MG_SYNC_STATUS | Status synchronizacji | lista | oczekuje, zsynchronizowano, błąd, do ponowienia |
| MG_SYNCED_AT | Ostatnia synchronizacja | data i czas | backend |
| MG_SYNC_ERROR | Błąd synchronizacji | tekst wielowierszowy | backend |

### 9.2. Klient i miejsce montażu

| Alias | Nazwa | Typ |
|---|---|---|
| MG_CLIENT_TYPE | Typ klienta | lista: osoba prywatna, firma |
| MG_INSTALL_ADDRESS | Adres montażu | adres/tekst wielowierszowy |
| MG_POSTAL_CODE | Kod pocztowy | tekst |
| MG_CITY | Miejscowość | tekst |
| MG_COUNTY | Powiat | tekst |
| MG_VOIVODESHIP | Województwo | lista |
| MG_ACCESS_NOTES | Informacje o dojeździe/miejscu | tekst wielowierszowy |
| MG_SECOND_CONTACT_ROLE | Rola drugiej osoby | lista: współmałżonek, pełnomocnik, osoba techniczna |

Drugą osobę dodajemy jako kolejny Kontakt powiązany z Dealem; nie zapisujemy jej danych w jednym polu tekstowym.

### 9.3. Konfiguracja produktu

| Alias | Nazwa | Typ / wartości |
|---|---|---|
| MG_PRODUCT_TYPE | Typ produktu | ogród zimowy, zadaszenie tarasu, carport, inne |
| MG_DEPTH_CM | Głębokość [cm] | liczba |
| MG_WIDTH_CM | Szerokość [cm] | liczba |
| MG_ROOF_TYPE | Pokrycie dachu | poliwęglan bezbarwny, mleczny, szary, dymiony, szkło bezbarwne, szkło przyciemniane |
| MG_WALL_TYPE | Ściany | brak, szkło bezbarwne, szkło przyciemniane |
| MG_ZIP_FRONT | ZIP przód | tak/nie |
| MG_ZIP_LEFT | ZIP lewy | tak/nie |
| MG_ZIP_RIGHT | ZIP prawy | tak/nie |
| MG_AWNING | Markiza | tak/nie |
| MG_LED_POINT | LED punktowe | tak/nie |
| MG_LED_CCT | LED CCT | tak/nie |
| MG_FOUNDATION | Fundament/profil | tak/nie |
| MG_BRUSHES | Szczotki | tak/nie |
| MG_HANDLES | Uchwyty | tak/nie |
| MG_CUSTOM_QUOTE | Wycena indywidualna | tak/nie |
| MG_CONFIGURATION_TEXT | Pełne podsumowanie konfiguracji | tekst wielowierszowy |

### 9.4. Cena i oferta

| Alias | Nazwa | Typ |
|---|---|---|
| standard | Kwota Deala | pieniądze PLN; suma pozycji produktowych |
| MG_SERVER_TOTAL_GROSS | Zweryfikowana kwota brutto | pieniądze PLN |
| MG_VAT_RATE | Stawka VAT | lista: 8%, 23%, indywidualna |
| MG_DISCOUNT_PERCENT | Rabat [%] | liczba |
| MG_OFFER_DATE | Data przygotowania oferty | data |
| MG_OFFER_VALID_UNTIL | Oferta ważna do | data |
| MG_ADVANCE_AMOUNT | Zaliczka/proforma | pieniądze |
| MG_PAID_AMOUNT | Wpłacona kwota | pieniądze |
| MG_REMAINING_AMOUNT | Pozostało do zapłaty | pieniądze |

Kwota Deala i pozycje produktowe powinny być zgodne z `MG_SERVER_TOTAL_GROSS`. Backend wykrywa rozbieżności.

### 9.5. Sprzedaż i pomiar

| Alias | Nazwa | Typ |
|---|---|---|
| MG_CONTACT_ATTEMPTS | Liczba prób kontaktu | liczba |
| MG_NEXT_CONTACT_AT | Termin następnego kontaktu | data i czas |
| MG_PHOTOS_STATUS | Status zdjęć | nie wymagane, oczekujemy, otrzymane |
| MG_QUALIFIED_BY | Zakwalifikowany przez | użytkownik |
| MG_MEASUREMENT_REQUIRED | Czy wymagany pomiar | tak/nie |
| MG_MEASUREMENT_AT | Termin pomiaru | data i czas |
| MG_MEASUREMENT_OWNER | Osoba wykonująca pomiar | użytkownik |
| MG_MEASUREMENT_NOTES | Notatki z pomiaru | tekst wielowierszowy |
| MG_DEFERRED_UNTIL | Powrót do klienta | data |
| MG_DEFERRED_REASON | Powód odroczenia | lista/tekst |
| MG_LOST_REASON | Przyczyna przegranej | lista |

### 9.6. Realizacja

| Alias | Nazwa | Typ |
|---|---|---|
| MG_MATERIAL_STATUS | Status materiału | lista |
| MG_INSTALLATION_TEAM | Ekipa montażowa | użytkownik/lista |
| MG_INSTALLATION_FROM | Montaż od | data |
| MG_INSTALLATION_TO | Montaż do | data |
| MG_NEXT_VISIT_AT | Najbliższa wizyta | data i czas |
| MG_DEFECTS | Usterki / uwagi | tekst wielowierszowy |
| MG_PROJECT_PAID | Projekt opłacony | tak/nie |

## 10. Wymagane dane według etapu

Na planie Free jest to lista kontrolna operacyjna. Po uruchomieniu płatnych funkcji konfigurujemy wymagane pola i automatyzacje.

| Etap | Minimalne dane |
|---|---|
| Nowe zapytanie | Kontakt, telefon lub e-mail, źródło, ID zapytania, konfiguracja, kwota |
| Brak kontaktu | liczba prób, termin kolejnej próby |
| Kontakt nawiązany | notatka z rozmowy, potrzeba klienta |
| Oczekiwanie na zdjęcia | termin przypomnienia, status zdjęć |
| Zakwalifikowany | produkt, wymiary lub status wyceny indywidualnej, adres/region |
| Pomiar umówiony | data, osoba odpowiedzialna, adres montażu |
| Pomiar wykonany | notatka techniczna, zdjęcia/dokumenty |
| Oferta wysłana | data oferty, kwota, ważność |
| Proforma/umowa | kwota zaliczki, termin płatności |
| Odroczony | data powrotu i powód |
| Wygrany | zaakceptowana kwota, sposób dalszej obsługi |
| Przegrany | przyczyna przegranej |

## 11. Katalog produktów

### 11.1. Sekcje

1. `01 Konstrukcje`
   - Ogrody zimowe
   - Zadaszenia tarasowe
2. `02 Pokrycia dachu`
   - Poliwęglan
   - Szkło dachowe
3. `03 Ściany i systemy przesuwne`
4. `04 Rolety ZIP`
5. `05 Markizy`
6. `06 Oświetlenie`
7. `07 Fundamenty i profile`
8. `08 Akcesoria`
9. `09 Montaż i usługi`
10. `99 Wyceny indywidualne`

### 11.2. Kod produktu

Kod jest stabilny i niezależny od nazwy wyświetlanej:

`MG-{GRUPA}-{WARIANT}-D{głębokość}-W{szerokość}`

Przykłady:

- `MG-WG-BASE-D300-W306`
- `MG-ROOF-GLASS-CLEAR-D300-W306`
- `MG-ROOF-GLASS-TINTED-D300-W306`
- `MG-WALL-CLEAR-D300-W306`
- `MG-ZIP-FRONT-D300-W306`
- `MG-ZIP-LEFT-D300-W306`
- `MG-ZIP-RIGHT-D300-W306`
- `MG-AWNING-D300-W306`
- `MG-LED-POINT-D300-W306`
- `MG-LED-CCT-D300-W306`
- `MG-FOUNDATION-D300-W306`
- `MG-BRUSHES-D300-W306`
- `MG-HANDLES-D300-W306`

### 11.3. Nazwa produktu

Przykłady:

- `Ogród zimowy 300×306 cm`
- `Szkło dachowe przyciemniane 300×306 cm`
- `Ściany przesuwne bezbarwne 300×306 cm`
- `Roleta ZIP PRZÓD 300×306 cm`
- `Oświetlenie LED punktowe 300×306 cm`

### 11.4. Reguły cen

- waluta: PLN,
- podstawowa stawka w CRM: netto lub brutto musi być wybrana jednolicie dla całego katalogu,
- na dziś zachowujemy snapshot brutto zgodny z kalkulatorem,
- VAT 8% jest założeniem roboczym i musi być zatwierdzony księgowo dla konkretnej sprzedaży/usługi,
- strona/JSON jest źródłem cen,
- katalog Bitrix24 jest synchronizowaną kopią,
- nie edytujemy ręcznie pojedynczych cen bez równoległej aktualizacji cennika MoonGlass,
- szkło dachowe dla głębokości 550/600 pozostaje wariantem indywidualnym, nie publikowanym automatycznie,
- LED RGB nie jest publikowany na stronie; może występować wyłącznie w ręcznej wycenie CRM.

### 11.5. Import

Na Free tworzymy tylko kilka pozycji testowych. Pełny katalog będzie generowany z JSON-a i wgrywany po aktywowaniu triala/płatnego API. Nie przepisujemy ręcznie setek wariantów z EG.

## 12. Pozycje produktowe Deala

Integracja dodaje osobne wiersze, np.:

1. konstrukcja bazowa,
2. dopłata/zmiana pokrycia dachu,
3. ściany przesuwne,
4. ZIP lewy,
5. ZIP prawy,
6. ZIP przód,
7. markiza,
8. LED punktowe lub LED CCT,
9. fundament/profil,
10. szczotki,
11. uchwyty,
12. montaż — po dodaniu cen montażowych.

Każdy wiersz zawiera:

- kod produktu,
- nazwę,
- ilość 1,
- cenę,
- rabat,
- VAT,
- kwotę końcową.

## 13. Procesy inteligentne — etap Professional

### Płatność

Pola: Deal, rodzaj płatności, dokument, kwota netto/brutto, VAT, termin, data zapłaty, metoda, status, numer dokumentu.

### Pomiar / wyjazd

Pola: Deal, typ wizyty, adres, termin od/do, pracownik/ekipa, status, notatki, załączniki, wynik wizyty.

### Montaż

Pola: Deal, ekipa, planowany termin, rzeczywisty termin, status, zakres prac, usterki, zdjęcia, protokół, rozliczenie.

Te rekordy mogą później pojawiać się jako powiązane zakładki w karcie Deala, podobnie jak w EG.

## 14. Automatyzacje — etap Standard/Professional

1. Nowe zapytanie → powiadomienie i zadanie kontaktu.
2. Brak kontaktu → kolejna próba po ustalonym czasie.
3. Oczekiwanie na zdjęcia → przypomnienie klientowi i handlowcowi.
4. Zakwalifikowany → zadanie ustalenia pomiaru.
5. Pomiar umówiony → wydarzenie w kalendarzu i przypomnienie.
6. Pomiar wykonany → zadanie przygotowania oferty.
7. Oferta wysłana → follow-up po 2 i 5 dniach.
8. Proforma wysłana → kontrola wpłaty.
9. Wygrany → przejście/przeniesienie do Realizacji.
10. Montaż zakończony → kontrola płatności i dokumentów.
11. Błąd synchronizacji → zadanie administratora/ponowienie API.

## 15. Integracja strony z Bitrix24

Sekwencja serwerowa:

1. formularz trafia do backendu MoonGlass,
2. backend przelicza wycenę z JSON-a,
3. zapisuje lead w PostgreSQL,
4. wyszukuje Kontakt po znormalizowanym telefonie i e-mailu,
5. tworzy lub aktualizuje Kontakt,
6. tworzy Deal w lejku Sprzedaż, etap Nowe zapytanie,
7. ustawia pola `MG_*`,
8. ustawia pozycje produktowe,
9. zapisuje komentarz z wiadomością klienta,
10. zapisuje ID Kontaktu i Deala w PostgreSQL,
11. oznacza synchronizację jako zakończoną,
12. w razie błędu ponawia operację bez tworzenia duplikatu.

Kluczem idempotencji jest `MG_WEB_INQUIRY_ID`.

## 16. Plan wdrożenia

### Teraz — Free

- [ ] ustawić PLN,
- [ ] potwierdzić prosty tryb CRM,
- [ ] nazwać jedyny lejek `01 Sprzedaż z pomiarem`,
- [ ] utworzyć etapy sprzedaży,
- [ ] utworzyć pola Kontaktów/Firm/Deali,
- [ ] utworzyć sekcje katalogu,
- [ ] utworzyć 3–5 produktów testowych,
- [ ] ręcznie utworzyć testowy Kontakt + Deal + produkty,
- [ ] zapisać techniczne ID pól `UF_CRM_*`.

### Przed trialem

- [ ] przygotować kod integracji,
- [ ] przygotować generator katalogu z JSON,
- [ ] przygotować mapowanie pól,
- [ ] przygotować testy idempotencji i duplikatów,
- [ ] zdecydować Standard czy Professional.

### Trial Professional — 15 dni

- [ ] aktywować dopiero, gdy kod jest gotowy,
- [ ] utworzyć lejki Realizacja i Reklamacje,
- [ ] utworzyć webhook/aplikację lokalną,
- [ ] przesłać katalog,
- [ ] przetestować Contact + Deal + product rows,
- [ ] przetestować automatyzacje,
- [ ] prototypowo utworzyć Płatności/Montaże/Pomiary,
- [ ] przeprowadzić kontrolę zgodności planu przed końcem triala.

### Zakup

- Standard, jeśli Płatności/Montaże pozostają na początku polami i zadaniami.
- Professional, jeśli mają być od razu osobnymi procesami z zakładkami i workflowami podobnymi do EG.

## 17. Zasady bezpieczeństwa i utrzymania

- webhook/API tylko w zmiennych środowiskowych backendu,
- żadnych sekretów w przeglądarce ani repozytorium,
- dostęp administratora z 2FA,
- każdy pracownik otrzymuje własne konto,
- nie udostępniamy wspólnego hasła do `biuro@moonglass.pl`,
- zapytanie zawsze najpierw zapisujemy w PostgreSQL, a dopiero potem synchronizujemy z CRM,
- błąd Bitrix24 nie może powodować utraty zapytania,
- ceny w CRM są audytowalnym snapshotem, nie głównym cennikiem,
- na planie Free należy logować się regularnie, aby portal nie został usunięty jako nieaktywny.
