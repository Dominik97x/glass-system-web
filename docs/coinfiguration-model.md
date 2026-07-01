# Model konfiguracji produktu

## Cel dokumentu

Ten dokument opisuje, czym jest konfiguracja produktu w systemie.

Konfiguracja produktu jest podstawą dla:

- kalkulatora,
- wyceny,
- wizualizacji,
- formularza leadowego,
- przyszłej integracji z CRM,
- przyszłej oferty PDF.

---

## Definicja

Konfiguracja produktu to kompletny zestaw wyborów użytkownika, który jednoznacznie określa:

- produkt bazowy,
- wariant,
- wybrane opcje,
- cenę,
- wizualizację,
- dane potrzebne do przygotowania oferty.

Konfiguracja wysłana ze strony jest jednak tylko **wstępną konfiguracją klienta**.

Po kontakcie telefonicznym konsultant może ją zmienić, doprecyzować lub przygotować nową ofertę w CRM.

---

## Produkt bazowy

Produktem bazowym jest:

- konstrukcja aluminiowa.

Konstrukcja jest określona przez:

- szerokość,
- długość.

Domyślna konfiguracja po wejściu do kalkulatora:

- długość: 300 cm,
- szerokość: 306 cm,
- ściany: brak,
- pokrycie dachu: poliwęglan przezroczysty,
- cena: 8383 zł.

---

## Typ końcowy produktu

Typ końcowy produktu wynika z konfiguracji.

### Zadaszenie tarasu

Konstrukcja bez ścian.

### Ogród zimowy

Konstrukcja ze ścianami przesuwnymi.

Wniosek:

Zadaszenie tarasu i ogród zimowy nie są traktowane jako dwa całkowicie osobne produkty.

Są dwoma wariantami tej samej konstrukcji bazowej.

---

## Wymiary

Dostępne szerokości:

- 306 cm
- 406 cm
- 506 cm
- 606 cm
- 706 cm
- 806 cm
- 906 cm
- 1006 cm
- 1106 cm
- 1206 cm

Dostępne długości:

- 300 cm
- 350 cm
- 400 cm
- 450 cm
- 500 cm

Wymiary są wybierane z listy.

Użytkownik nie wpisuje własnych wartości.

---

## Ściany szklane przesuwne

Dostępne opcje:

- brak,
- szyby przezroczyste,
- szyby mleczne,
- szyby przyciemniane.

Wybór ścian wpływa na:

- cenę,
- wizualizację,
- dostępność kolejnych opcji.

---

## Pokrycie dachu

Dostępne opcje:

- poliwęglan przezroczysty,
- poliwęglan mleczny,
- poliwęglan szary,
- poliwęglan dymiony,
- szkło laminowane hartowane przezroczyste,
- szkło laminowane hartowane mleczne.

Wybór pokrycia wpływa na:

- cenę,
- wizualizację.

---

## Opcje dodatkowe

Opcje dodatkowe mogą obejmować:

- roletę ZIP przednią,
- roletę ZIP lewą,
- roletę ZIP prawą,
- markizę dachową,
- LED,
- COB,
- uchwyty,
- szczotki,
- wyrównanie podłoża,
- montaż.

---

## Reguły dostępności

### Rolety boczne

Rolety boczne są dostępne tylko wtedy, gdy użytkownik wybrał ściany przesuwne.

Jeżeli:

- ściany = brak,

to dostępna jest tylko:

- roleta ZIP przednia.

Jeżeli:

- ściany = szyby przezroczyste,
- ściany = szyby mleczne,
- ściany = szyby przyciemniane,

to dostępne są:

- roleta ZIP lewa,
- roleta ZIP prawa,
- roleta ZIP przednia.

---

## Zachowanie konfiguratora

Cena aktualizuje się w czasie rzeczywistym po zmianie opcji.

Konfiguracja przechodzi pomiędzy krokami kalkulatora.

Każdy kolejny krok dodaje nowe elementy do istniejącej konfiguracji.

Zmiana rozmiaru wpływa na cenę, ale nie zmienia wizualnie rozmiaru modelu 3D.

Wizualizacja działa raczej jako zestaw warstw niż dokładny model techniczny.

---

## Co wpływa na cenę

Na cenę wpływają:

- długość,
- szerokość,
- ściany przesuwne,
- pokrycie dachu,
- rolety,
- markiza,
- LED,
- COB,
- uchwyty,
- szczotki,
- wyrównanie podłoża,
- montaż.

---

## Co wpływa na wizualizację

Na wizualizację wpływają:

- ściany,
- typ pokrycia dachu,
- rolety,
- markiza,
- LED.

Rozmiar zmienia cenę, ale obecnie nie wpływa znacząco na wizualizację.

---

## Co trafia do CRM

Do CRM docelowo powinna trafić:

- konfiguracja klienta,
- dane kontaktowe,
- wycena orientacyjna,
- wiadomość klienta,
- zdjęcia,
- źródło leada.

Ważne:

Konfiguracja wysłana ze strony jest tylko punktem startowym rozmowy handlowej.

Konsultant może później zmienić konfigurację w CRM.

---

## Otwarte pytania

1. Czy montaż jest zawsze wliczony w cenę widoczną na stronie?
2. Czy transport jest osobną pozycją?
3. Czy istnieją inne reguły dostępności poza roletami bocznymi?
4. Czy rabaty pojawiają się tylko w CRM, czy również na stronie?
5. Czy klient ma zawsze widzieć cenę końcową, czy tylko orientacyjną?
6. Jak dokładnie będzie wyglądała konfiguracja carportów?