# ETAP D2.1 — poprawka wyszukiwania testowego Deala

## Przyczyna błędu

Bitrix24 zwrócił:

```text
crm.item.list: INVALID_ARG_VALUE — Invalid filter: field '=XML_ID' is not allowed in filter
```

Pole `xmlId` może być zapisane i odczytane w Dealu, ale portal nie pozwala użyć go jako filtra w `crm.item.list`.

## Zmiana

Test D2 wyszukuje teraz istniejący Deal przez metodę `crm.deal.list` i stabilne pole niestandardowe:

```text
MG_WEB_INQUIRY_ID = D2-TEST-300X306-V1
```

Dzięki temu:

- pierwsze uruchomienie tworzy testowy Deal,
- drugie uruchomienie odnajduje i aktualizuje ten sam Deal,
- kontakt utworzony przed poprzednim błędem zostanie ponownie wykorzystany,
- nie trzeba usuwać istniejącego testowego kontaktu ani produktów.

## Instalacja

Rozpakuj nakładkę do katalogu głównego projektu:

```text
C:\Projects\glass-system-web
```

Zatwierdź zastąpienie plików.

Następnie wykonaj:

```powershell
cd C:\Projects\glass-system-web\app
npm run lint
npm run build
npm run bitrix:verify
npm run bitrix:test-flow -- --confirm=MOONGLASS
```

Nie uruchamiaj ponownie provisionera bazowego ani nie usuwaj danych ręcznie.
