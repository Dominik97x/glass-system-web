# Lead backup strategy

Status dokumentu: draft roboczy  
Projekt: EcoGardens / glass-system-web  
Decyzja: produkcyjny backup leadów będzie oparty o Postgres, docelowo Neon.

---

# 1. Cel

Celem tego elementu systemu jest zabezpieczenie zapytań z kalkulatora.

Lead nie może zginąć nawet wtedy, gdy:

```text
Bitrix24 nie działa
Resend / e-mail nie działa
CRM nie jest jeszcze skonfigurowany
wystąpi błąd integracji zewnętrznej
```

Dlatego aplikacja powinna mieć własny trwały backup leadów.

---

# 2. Wybrany kierunek

Wybrany kierunek:

```text
Neon Postgres
```

Na start:

```text
Neon Free
```

Docelowo dla działającej firmy:

```text
Neon paid plan
```

Aplikacja nie będzie pisana bezpośrednio pod specyficzne API Neon.

Aplikacja będzie używać standardowego Postgresa przez:

```env
DATABASE_URL=
```

Dzięki temu kod pozostaje neutralny i w razie potrzeby może działać również z innym dostawcą Postgresa.

---

# 3. Rola bazy danych

Postgres nie zastępuje Bitrix24.

Postgres jest backupem i technicznym rejestrem zapytań.

Docelowy układ:

```text
formularz kalkulatora
↓
zapis leadu w Postgres
↓
powiadomienie e-mail
↓
wysyłka do Bitrix24
```

Bitrix24 pozostaje CRM-em i centrum pracy firmy.

Postgres zabezpiecza sytuację, w której integracje zewnętrzne nie działają.

---

# 4. Dlaczego nie lokalny JSON na produkcji

Aktualnie lokalnie działa zapis do:

```text
app/data/inquiries/calculator-inquiries.json
```

To jest dobre developersko, ale nie jest dobrym rozwiązaniem produkcyjnym.

Powody:

```text
plik lokalny nie jest trwały na hostingu serverless
plik może zniknąć po redeployu
plik nie jest bezpiecznym storage dla danych klientów
trudno robić backupy
trudno filtrować i wyszukiwać leady
trudno kontrolować statusy integracji
```

Dlatego produkcyjnie potrzebujemy bazy danych.

---

# 5. Minimalny zakres danych

W bazie chcemy zapisać pełny lead z kalkulatora.

Minimalne dane:

```text
id
source
status
created_at
received_at
customer_name
customer_email
customer_phone
customer_message
quote_total_gross
quote_snapshot
bitrix24_sync_status
bitrix24_deal_id
bitrix24_error
notification_status
notification_error
created_in_database_at
updated_at
```

---

# 6. Dlaczego zapisujemy quote_snapshot jako JSONB

Oferta i konfiguracja mogą się zmieniać w czasie.

Nie chcemy tracić informacji o tym, co klient dokładnie wysłał w momencie zapytania.

Dlatego zapisujemy pełny snapshot oferty:

```text
quote_snapshot JSONB
```

W środku może być:

```text
configuration
items
totalGross
pricingVersion
productKind
```

To pozwala później odtworzyć zapytanie nawet wtedy, gdy cennik się zmieni.

---

# 7. Status leadu

Aktualne statusy aplikacji:

```text
new
contacted
quoted
won
lost
```

Te statusy zostają w tabeli.

Bitrix24 będzie miał własne etapy pipeline’u, ale backup leadów powinien mieć prosty lokalny status.

---

# 8. Status synchronizacji Bitrix24

Potrzebujemy wiedzieć, czy lead został wysłany do CRM.

Proponowane statusy:

```text
not_configured
pending
sent
failed
```

Znaczenie:

```text
not_configured - Bitrix24 nie jest aktywny
pending        - lead czeka na wysyłkę
sent           - lead został wysłany do Bitrix24
failed         - próba wysyłki do Bitrix24 zakończyła się błędem
```

---

# 9. Status powiadomienia e-mail

Potrzebujemy wiedzieć, czy powiadomienie zostało wysłane.

Proponowane statusy:

```text
disabled
pending
sent
failed
```

Znaczenie:

```text
disabled - powiadomienia są wyłączone
pending  - powiadomienie czeka na wysyłkę
sent     - powiadomienie zostało wysłane
failed   - wysyłka powiadomienia zakończyła się błędem
```

Na aktualnym etapie powiadomienie działa przez console i jest przygotowane pod Resend.

---

# 10. Tabela MVP

Tabela MVP:

```text
calculator_inquiries
```

Ta tabela ma być głównym trwałym backupem zapytań z kalkulatora.

Nie tworzymy jeszcze osobnych tabel dla klientów, pozycji oferty ani historii statusów.

Na MVP zapisujemy cały lead jako jeden rekord.

To jest prostsze i bezpieczne na start.

---

# 11. Docelowa ewolucja

W przyszłości można dodać:

```text
calculator_inquiry_events
calculator_inquiry_sync_attempts
calculator_inquiry_notifications
customers
```

Ale nie robimy tego od razu.

Najpierw potrzebujemy stabilnego backupu leadów.

---

# 12. Tryby repozytorium

Aktualne tryby:

```env
CALCULATOR_INQUIRY_REPOSITORY=local
CALCULATOR_INQUIRY_REPOSITORY=bitrix24
CALCULATOR_INQUIRY_REPOSITORY=hybrid
```

Docelowo dodamy:

```env
CALCULATOR_INQUIRY_REPOSITORY=database
```

oraz prawdopodobnie:

```env
CALCULATOR_INQUIRY_REPOSITORY=database_and_bitrix24
```

albo rozszerzymy obecny tryb `hybrid`, żeby primary repository mogło być bazą danych.

---

# 13. Rekomendowany model produkcyjny

Docelowy produkcyjny model:

```env
CALCULATOR_INQUIRY_REPOSITORY=hybrid
```

gdzie:

```text
primary repository = Postgres
secondary repository = Bitrix24
notification service = Resend
```

Czyli:

```text
1. lead zapisuje się w Postgres
2. aplikacja próbuje wysłać lead do Bitrix24
3. aplikacja wysyła powiadomienie e-mail
4. jeśli Bitrix24 albo e-mail padnie, lead zostaje w Postgres
```

---

# 14. Zmienne środowiskowe

Docelowe zmienne dla bazy:

```env
DATABASE_URL=
```

Dla Neon najlepiej użyć connection stringa z connection poolingiem, jeśli aplikacja działa na hostingu serverless.

---

# 15. Bezpieczeństwo danych

Baza będzie zawierać dane osobowe:

```text
imię i nazwisko
telefon
e-mail
wiadomość klienta
konfigurację oferty
```

Dlatego:

```text
DATABASE_URL nie może być commitowany
.env.local nie może być commitowany
dostęp do bazy powinien być ograniczony
produkcyjne dane nie powinny trafiać do testowego repo
backupy muszą być kontrolowane
```

---

# 16. Plan wdrożenia

## Etap 1

```text
dokument strategii
SQL schema
```

## Etap 2

```text
DatabaseCalculatorInquiryRepository
Database client
tryb repository=database
```

## Etap 3

```text
lokalny test z Neon Free
zapis leada do Postgres
lista leadów z Postgres w /admin/leady
szczegóły leada z Postgres
zmiana statusu w Postgres
```

## Etap 4

```text
hybrid: Postgres + Bitrix24
status sync Bitrix24
status notification
```

## Etap 5

```text
produkcja
monitoring
backupy
płatny plan Neon
```

---

# 17. Aktualna decyzja

Decyzja robocza:

```text
Używamy Neon Postgres jako kierunku dla produkcyjnego backupu leadów.
Zaczynamy od Neon Free.
Docelowo można przejść na płatny plan Neon bez dużych zmian w kodzie.
Kod aplikacji używa standardowego DATABASE_URL.
```