# Etap D1.1 — poprawka kolejności etapów Bitrix24

## Przyczyna

Bitrix24 wymaga kolejności grup etapów:

1. etapy aktywne,
2. etap wygrany,
3. etapy przegrane.

Nowy lejek ma już systemowy etap wygrany i przegrany. Provisioner próbował dodać dalsze etapy aktywne z numerami sortowania znajdującymi się za systemowym etapem wygranym, dlatego API zwracało błąd HTTP 400.

## Co poprawiono

- Provisioner tymczasowo przesuwa etapy końcowe na koniec listy przed tworzeniem etapów aktywnych.
- Najpierw przesuwa etapy przegrane, potem wygrany, zachowując wymaganą kolejność Bitrix24.
- Po utworzeniu etapów aktywnych ustawia docelowe pozycje etapu wygranego i etapów przegranych.
- Nowo utworzone lejki są poprawnie traktowane jako puste i mogą adaptować systemowe etapy.
- Ponowne uruchomienie jest bezpieczne po częściowo wykonanym wcześniejszym `apply`.
- Wersja blueprintu: `2026-08-04.2`.

## Instalacja

Rozpakuj ZIP bezpośrednio do katalogu:

`C:\Projects\glass-system-web`

Zgódź się na zastąpienie dwóch plików.

## Kolejność poleceń

```powershell
cd C:\Projects\glass-system-web\app
npm run lint
npm run build
npm run bitrix:audit
npm run bitrix:plan
npm run bitrix:apply -- --confirm=MOONGLASS
```

Dopiero po udanym `apply`:

```powershell
npm run bitrix:products:pilot -- --confirm=MOONGLASS
npm run bitrix:verify
```

Nie usuwaj ręcznie częściowo zmienionych etapów. Provisioner odczyta aktualny stan i dokończy konfigurację.
