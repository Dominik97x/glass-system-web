# ETAP D5 — automatyzacje lejków Bitrix24

## Cel

D5 przygotowuje dokładny blueprint i checklistę natywnych automatyzacji dla trzech lejków MoonGlass:

- `01 Sprzedaż z pomiarem`,
- `02 Realizacja`,
- `03 Reklamacje`.

Pakiet nie modyfikuje istniejących Deali, produktów ani bazy Neon.

## Ważne ograniczenie API

Portal MoonGlass jest obecnie połączony przez **incoming webhook**. Taki webhook dobrze obsługuje dane CRM, katalog i synchronizację formularza, ale nie może instalować standardowych robotów CRM w kolumnach lejka.

Oficjalne metody `bizproc.robot.add` oraz import szablonów procesów wymagają kontekstu zainstalowanej aplikacji OAuth. Incoming webhook zwróci dla nich błąd `Application context required`. Ponadto `bizproc.robot.add` rejestruje własny typ robota aplikacji — nie tworzy za użytkownika gotowych standardowych robotów „Utwórz zadanie”, „Zaplanuj aktywność” itp. w konkretnych etapach.

Dlatego D5 automatyzuje wszystko, co jest bezpiecznie możliwe:

1. audyt portalu i możliwości autoryzacji,
2. dopasowanie rzeczywistych lejków, etapów i pól MoonGlass,
3. wygenerowanie precyzyjnego planu JSON/Markdown,
4. wygenerowanie checklisty wdrożeniowej,
5. tworzenie kontrolowanych Deali testowych dla wybranego etapu.

Same roboty dodajemy w panelu Bitrix24: `CRM → Deale → Automatyzacja`.

## Profile

### `starter`

Profil rekomendowany teraz dla małego zespołu MoonGlass. Zawiera automatyzacje P0:

- pierwszy kontakt i obsługa nowego zapytania,
- ponowienie kontaktu,
- kwalifikację,
- zdjęcia,
- pomiary,
- przygotowanie i follow-up oferty,
- odroczenia,
- przeniesienie wygranego Deala do realizacji,
- podstawową obsługę realizacji i reklamacji.

### `full`

Profil docelowy. Obejmuje profil starter oraz dodatkowe przypomnienia, powiadomienia i kontrole P1.

## Instalacja

Rozpakuj płaską nakładkę bezpośrednio do:

```text
C:\Projects\glass-system-web
```

Następnie:

```powershell
cd C:\Projects\glass-system-web\app
npm run lint
npm run build
npm run bitrix:verify
```

## Audyt D5

```powershell
npm run bitrix:automations:audit
```

Oczekiwany komunikat:

```text
Audyt automatyzacji D5 zakończony.
Konfiguracja bazowa: OK
Automatyczny zapis natywnych robotów przez incoming webhook: NIE
```

Raporty:

```text
app\.bitrix24\automation-audit.json
app\.bitrix24\automation-audit.md
```

## Plan starter

```powershell
npm run bitrix:automations:plan -- --profile=starter
```

Powstaną:

```text
app\.bitrix24\automation-plan.json
app\.bitrix24\automation-plan.md
app\.bitrix24\automation-checklist.md
```

Plan używa rzeczywistych nazw i ID etapów odczytanych z portalu.

## Plan pełny

Po skonfigurowaniu i przetestowaniu startera:

```powershell
npm run bitrix:automations:plan -- --profile=full
```

## Najważniejsza decyzja — przejście do realizacji

Na etapie `Wygrany — przekazany do realizacji` konfigurujemy tunel jako:

```text
PRZENIEŚ → 02 Realizacja → W realizacji
```

Nie używamy opcji `Kopiuj`. Kopia zawierałaby to samo pole `ID zapytania ze strony` w dwóch Dealach, co mogłoby spowodować konflikt przy ponownej synchronizacji z Neon.

## Test automatyzacji

Po ręcznym dodaniu robotów dla danego etapu można utworzyć kontrolowany Deal testowy.

Przykład dla etapu `Nowe zapytanie`:

```powershell
npm run bitrix:automations:test -- `
  --pipeline=sales `
  --stage=MG_NEW `
  --confirm=MOONGLASS-AUTOMATION-TEST
```

Przykład dla `Pomiar do umówienia`:

```powershell
npm run bitrix:automations:test -- `
  --pipeline=sales `
  --stage=MG_MEASPLAN `
  --confirm=MOONGLASS-AUTOMATION-TEST
```

Przykład dla początku realizacji:

```powershell
npm run bitrix:automations:test -- `
  --pipeline=realization `
  --stage=MG_REAL `
  --confirm=MOONGLASS-AUTOMATION-TEST
```

Skrypt utworzy prawdziwy Deal oznaczony `[TEST D5]`, poda bezpośredni link oraz listę oczekiwanych robotów natychmiastowych. Po sprawdzeniu Deal należy ręcznie ustawić jako `Przegrany — duplikat/test` albo usunąć.

## Czego nie robić

Nie uruchamiaj automatyzacji e-mail/SMS do klientów przed:

- podłączeniem firmowej skrzynki,
- zatwierdzeniem treści wiadomości,
- wykonaniem testu na adresach kontrolnych.

Nie przypisuj robotów do sztywnego użytkownika `biuro@moonglass.pl`, jeśli później mają dochodzić pracownicy. W pierwszej wersji wybieraj zmienną **Osoba odpowiedzialna za Deal**.

## Źródła techniczne

- Bitrix24 REST: `bizproc.robot.add` — wymaga kontekstu aplikacji.
- Bitrix24 REST: `bizproc.workflow.template.add` — importuje wcześniej przygotowany plik `.bpt` i wiąże go z aplikacją.
- Bitrix24 Helpdesk: automatyzacje CRM konfiguruje się w interfejsie Automatyzacja dla wybranego etapu.
- Bitrix24 Helpdesk: tunel sprzedażowy może przenieść lub skopiować Deal do innego lejka.
