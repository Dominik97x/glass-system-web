# Etap C — autoryzacja panelu administratora

Pakiet jest nakładką na projekt po Etapie B i poprawce połączeń PostgreSQL/Neon.
Rozpakuj go do katalogu głównego repozytorium `C:\Projects\glass-system-web` i potwierdź nadpisanie plików.

## Zakres

- ekran logowania `/admin/logowanie`,
- podpisana sesja administratora w ciasteczku `HttpOnly`,
- ochrona `/admin`, `/admin/leady` i `/admin/leady/[id]` przez `src/proxy.ts`,
- ponowna kontrola sesji bezpośrednio w stronach i akcji zmiany statusu,
- ochrona `GET /api/inquiries` odpowiedzią `401` bez sesji,
- publiczny `POST /api/inquiries` pozostaje dostępny dla formularza kalkulatora,
- wylogowanie i unieważnienie ciasteczka,
- podstawowy limit nieudanych logowań: 5 prób / 15 minut,
- kontrola pochodzenia żądań logowania i wylogowania,
- hasło przechowywane jako hash `scrypt`, a nie jawny tekst,
- automatyczny skrypt konfigurujący `.env.local`, bez naruszania ustawień bazy i Bitrix24.

## 1. Instalacja

Rozpakuj ZIP do:

```text
C:\Projects\glass-system-web
```

Następnie:

```powershell
cd C:\Projects\glass-system-web\app
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run lint
npm run build
```

Brak zmiennych administratora nie powinien blokować buildu. Do czasu konfiguracji ekran logowania pokaże informację o brakujących ustawieniach.

## 2. Utworzenie konta administratora

W katalogu `app` uruchom:

```powershell
npm run admin:setup
```

Skrypt:

1. zapyta o nazwę użytkownika,
2. poprosi dwukrotnie o hasło,
3. wygeneruje hash `scrypt` i losowy sekret sesji,
4. zapisze lub podmieni wyłącznie zmienne `ADMIN_*` w `.env.local`.

Hasło musi mieć od 12 do 256 znaków. Nie jest zapisywane w `.env.local`.

Po konfiguracji uruchom ponownie serwer:

```powershell
npm run dev
```

## 3. Testy ręczne

### Brak sesji

Otwórz:

```text
http://localhost:3000/admin/leady
```

Oczekiwane: przekierowanie do `/admin/logowanie`.

Otwórz:

```text
http://localhost:3000/api/inquiries
```

Oczekiwane: HTTP `401` i komunikat o wymaganym logowaniu.

### Poprawne logowanie

Zaloguj się danymi podanymi podczas `npm run admin:setup`.

Oczekiwane:

- lista leadów jest widoczna,
- można otworzyć szczegóły leada,
- można zmienić jego status,
- pasek panelu pokazuje nazwę zalogowanego administratora.

### Wylogowanie

Kliknij `Wyloguj się`.

Oczekiwane:

- powrót do strony logowania,
- ponowne wejście na `/admin/leady` wymaga logowania,
- `GET /api/inquiries` ponownie zwraca `401`.

### Formularz klienta

Formularz kalkulatora powinien nadal wysyłać zapytania bez logowania, ponieważ zabezpieczony jest tylko odczyt `GET /api/inquiries`, a publiczny zapis używa `POST /api/inquiries`.

## 4. Zmienne środowiskowe

Skrypt utworzy:

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=scrypt-v1$...
ADMIN_SESSION_SECRET=...
ADMIN_SESSION_TTL_HOURS=12
```

- `ADMIN_PASSWORD_HASH` jest hashem hasła z losową solą.
- `ADMIN_SESSION_SECRET` podpisuje sesje; jego zmiana wyloguje wszystkie aktywne sesje.
- `ADMIN_SESSION_TTL_HOURS` może mieć wartość od 1 do 168 godzin.
- `.env.local` nie może trafić do repozytorium.

## 5. Test nieudanych prób

Po pięciu błędnych próbach logowania adres klienta zostaje tymczasowo zablokowany. Limit jest przechowywany w pamięci procesu i stanowi pierwszą warstwę ochrony. Przy wdrożeniu wieloinstancyjnym można później przenieść go do Redis lub bazy danych.

## 6. Commit

Po pozytywnych testach:

```powershell
cd C:\Projects\glass-system-web
git status
git add app
git commit -m "feat: protect admin leads with authenticated session"
```

Sprawdź, że `app/.env.local` nie znajduje się w `git status`.
