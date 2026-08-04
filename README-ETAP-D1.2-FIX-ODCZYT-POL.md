# MoonGlass — poprawka ETAP D1.2

## Co naprawia

Poprzednia wersja mogła prawidłowo utworzyć pola CRM przez `userfieldconfig.add`, ale po ponownym odczycie pokazywała `pola: 0`.
Przyczyną był zbyt mało odporny odczyt `userfieldconfig.list` i brak twardej kontroli po zapisie.

Poprawka:

- wysyła `select` w formacie wymaganym przez aktualne REST Bitrix24,
- odczytuje pola również przez `crm.deal.userfield.list`, `crm.contact.userfield.list` i `crm.company.userfield.list`,
- łączy i usuwa duplikaty wyników,
- nie ukrywa błędu odczytu podczas `apply`,
- po utworzeniu sprawdza, czy wszystkie 66 pól MoonGlass są rzeczywiście widoczne,
- zapisuje wartości domyślne list przez parametr `def`, zgodnie z aktualnym API,
- podnosi wersję blueprintu do `2026-08-04.3`.

Poprawka niczego nie usuwa. Jeżeli pola zostały już utworzone przez poprzednie `apply`, zostaną rozpoznane i wykorzystane.

## Instalacja

Rozpakuj ZIP do katalogu głównego projektu:

```text
C:\Projects\glass-system-web
```

Zgódź się na zastąpienie dwóch plików.

## Kolejność po instalacji

```powershell
cd C:\Projects\glass-system-web\app
npm run lint
npm run build
npm run bitrix:audit
npm run bitrix:plan
```

Oczekiwany audyt po prawidłowym utworzeniu pól:

```text
Lejki: 3, pola: 66, sekcje: 14, produkty: 0
```

Liczba sekcji może być inna tylko wtedy, gdy poprzednie `apply` zatrzymało się przed ich utworzeniem.

Jeżeli plan nadal pokazuje brakujące elementy, uruchom ponownie:

```powershell
npm run bitrix:apply -- --confirm=MOONGLASS
npm run bitrix:verify
```

Nie uruchamiaj importu produktów pilotażowych, dopóki `bitrix:verify` nie zakończy się komunikatem `Weryfikacja OK.`.
