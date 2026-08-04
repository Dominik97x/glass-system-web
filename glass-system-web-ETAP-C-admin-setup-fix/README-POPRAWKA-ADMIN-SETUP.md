# Poprawka Etapu C - admin:setup

Poprawka zastępuje tylko plik:

`app/scripts/setup-admin-auth.ps1`

Przyczyną błędu było kodowanie UTF-8 bez BOM odczytywane przez Windows PowerShell 5.1 jako kodowanie systemowe. Nowa wersja skryptu używa wyłącznie znaków ASCII i końców linii CRLF.

## Instalacja

Rozpakuj archiwum do katalogu głównego repozytorium:

`C:\Projects\glass-system-web`

Potwierdź nadpisanie pliku, a następnie uruchom:

```powershell
cd C:\Projects\glass-system-web\app
npm run admin:setup
```

Po zapisaniu konfiguracji uruchom ponownie serwer:

```powershell
npm run dev
```
