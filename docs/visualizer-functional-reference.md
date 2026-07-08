# Glass System — referencja funkcjonalna wizualizatora i konfiguratora

Dokument zbiera ustalenia z analizy kalkulatora EG, screenów konfiguracji oraz rozmów dotyczących przyszłej wizualizacji Glass System.

Celem dokumentu nie jest kopiowanie wyglądu EG, tylko zapisanie logiki funkcjonalnej:
- co powinno być widoczne w wizualizacji,
- które opcje zmieniają obraz,
- które opcje są raczej ofertowe/cenowe,
- które ceny potwierdzają naszą macierz,
- które miejsca wymagają dalszej weryfikacji.

---

## 1. Główne założenie wizualizacji

Najbardziej prawdopodobne jest to, że wizualizacja EG nie jest prawdziwym 3D renderowanym w przeglądarce, tylko zestawem gotowych renderów/warstw dla konkretnych stanów konfiguracji.

Wnioski:
- kamera jest stała,
- scena jest stała,
- zmieniają się warianty konstrukcji, ścian, dachu, ZIP-ów i dodatków,
- cienie, odbicia i perspektywa wyglądają jak przygotowane wcześniej rendery,
- mechanizm jest dobry funkcjonalnie, ale nasza scena musi być własna i mniej podobna do EG.

Dla Glass System rekomendowany kierunek:
- własna scena renderowana/AI,
- własny budynek i inny kadr,
- zestaw wariantów obrazów zależnych od konfiguracji,
- płynne przejścia między wariantami,
- duża, centralna wizualizacja jako główny element sprzedażowy konfiguratora.

---

## 2. Ściany przesuwne

W EG ściany są głównym wariantem wizualnym.

Zaobserwowane stany:
- brak ścian — zadaszenie tarasu,
- szyby przezroczyste — ogród zimowy / zabudowa szklana,
- szyby mleczne — mocno rozmyty, jasny wariant,
- szyby przyciemniane/barwione — ciemniejszy, bardziej refleksyjny wariant.

Wniosek dla Glass System:
- ściany powinny zmieniać cały główny obraz wizualizacji,
- dla ścian warto mieć osobne warianty pełnego renderu,
- CSS/SVG może być tylko fallbackiem, ale docelowo lepsze będą realistyczne obrazy.

---

## 3. Dach

Na podstawie screenów EG i naszej macierzy cen wygląda, że cena bazowa zawiera poliwęglan przezroczysty.

Dla wymiaru 300 x 306 cm:

| Opcja dachu | Cena całkowita EG | Dopłata względem bazy | Wniosek |
| --- | ---: | ---: | --- |
| Poliwęglan przezroczysty | 8 383 zł | 0 zł | baza |
| Poliwęglan mleczny | 8 779 zł | 396 zł | dopłata |
| Poliwęglan szary/dymiony | 8 779 zł | 396 zł | dopłata |
| Szkło laminowane hartowane przezroczyste | 11 383 zł | 3 000 zł | dopłata |
| Szkło laminowane hartowane mleczne | 11 848 zł | 3 465 zł | dopłata |

Wniosek:
- dach musi mieć wpływ na cenę,
- dach powinien mieć wpływ na wygląd wizualizacji,
- warianty dachu mogą być pokazane przez zmianę przezroczystości/koloru pokrycia.

---

## 4. ZIP-y / rolety boczne

W EG ZIP-y są wyraźnie widoczne jako duże ciemne osłony na konkretnych płaszczyznach.

Zaobserwowane stany:
- ZIP lewa,
- ZIP prawa,
- ZIP przednia,
- ZIP lewa + prawa,
- ZIP lewa + prawa + przednia,
- ZIP komplet + markiza.

Wnioski:
- ZIP-y powinny być mocno widoczne w wizualizacji,
- ZIP-y mogą być włączane niezależnie,
- kolor ZIP-ów powinien docelowo zależeć od koloru konstrukcji,
- przy brązowej konstrukcji znajomy sugerował kremowe rolety,
- przy białej konstrukcji jasnoszare/białe rolety,
- przy antracycie/graficie ciemne rolety.

Potwierdzone ceny dla 300 x 306 cm, szyby przezroczyste:

| Konfiguracja | Obliczenie | Cena EG | Status |
| --- | ---: | ---: | --- |
| Ogród zimowy, szyby przezroczyste | 8 383 + 15 029 | 23 412 zł | zgodne |
| + ZIP lewa | 23 412 + 3 079 | 26 491 zł | zgodne |
| + ZIP lewa + prawa | 23 412 + 3 079 + 3 079 | 29 570 zł | zgodne |
| + ZIP lewa + prawa + przednia | 23 412 + 3 079 + 3 079 + 3 079 | 32 649 zł | zgodne |
| + ZIP komplet + markiza | 32 649 + 5 532 | 38 181 zł | zgodne |

---

## 5. Markiza

W EG markiza jest osobną opcją i wpływa na cenę oraz wygląd.

Dla 300 x 306 cm:
- markiza: 5 532 zł.

Wniosek:
- markiza powinna być widoczna na wizualizacji,
- może być osobnym wariantem obrazu lub warstwą,
- jeśli warianty obrazów będą pełnymi renderami, markiza powinna mieć osobny wariant.

---

## 6. Oświetlenie LED

W EG zauważono, że:
- LED punktowe i taśma LED CCT / COB wzajemnie się wykluczają,
- można wybrać jedno albo drugie,
- nie można mieć obu jednocześnie.

Wniosek dla Glass System:
- obecne pola `hasLed` i `hasCob` należy zachować tymczasowo,
- ale w UI trzeba wymusić wzajemne wykluczanie:
  - włączenie LED punktowego wyłącza taśmę LED,
  - włączenie taśmy LED wyłącza LED punktowe.

Docelowo model domenowy powinien być uproszczony do jednego pola:

```ts
lighting: "none" | "spot" | "strip";
7. Uchwyty, szczotki i profil wyrównujący

Te elementy wymagają dodatkowej weryfikacji.

Obserwacje:

uchwyty są widoczne jako małe elementy na szybach,
szczotki są prawdopodobnie trudno widoczne na głównej wizualizacji,
profil wyrównujący / spadek podłoża raczej nie zmienia głównego obrazu,
część dodatków może być lepiej pokazywana jako badge/callout niż osobny render.

Ryzyko:

możliwa niejasność w mapowaniu cen uchwytów i szczotek,
ze screenów wynika, że trzeba dodatkowo porównać pojedyncze konfiguracje.

Do sprawdzenia:

LED punktowe osobno,
taśma LED/COB osobno,
uchwyty osobno,
szczotki osobno,
profil wyrównujący / spadek osobno,
kombinacje tych dodatków.
8. Kolory konstrukcji i rolet

Sugestia znajomego:

można zmieniać kolory konstrukcji na biały i brąz,
przy brązie rolety powinny być raczej kremowe,
przy białym kolorze konstrukcji rolety jasnoszare/białe,
kolor indywidualny może być wyceniany indywidualnie,
za indywidualny kolor może być dopłata około 8 tys. zł++,
obecny budynek/render był zbyt podobny do EG.

Wniosek:

kolor konstrukcji warto uwzględnić przed Bitrixem jako opcję wizualno-ofertową,
nie należy jeszcze automatycznie doliczać dopłat bez potwierdzonego cennika,
kolor indywidualny powinien mieć status: „wycena indywidualna”.

Proponowany model:

frameColor: "anthracite" | "white" | "brown" | "custom";

Proponowana logika rolet:

Kolor konstrukcji	Domyślny kolor rolet
Antracyt/grafit	ciemny
Biały	jasnoszary / biały
Brąz	kremowy / beżowy
Kolor indywidualny	dobór indywidualny
9. Layout konfiguratora

Docelowo konfigurator powinien mieć układ:

lewa strona: zwarte opcje konfiguracji,
środek: duża realistyczna wizualizacja,
prawa strona: cena, podsumowanie, CTA i formularz.

Wizualizacja powinna być największym elementem ekranu, ponieważ to ona sprzedaje produkt.

Opcje powinny być dostępne bez nadmiernego przewijania:

wymiary,
dach,
ściany,
kolor konstrukcji,
ZIP-y,
markiza,
LED,
dodatki.

Długie opisy powinny zostać ograniczone albo przeniesione do krótkich podpowiedzi.

10. Potwierdzone ceny kontrolne

Dla wymiaru 300 x 306 cm:

Test	Konfiguracja	Cena EG	Status
T1	Zadaszenie, brak ścian, poliwęglan przezroczysty	8 383 zł	zgodne
T2	Zadaszenie, brak ścian, poliwęglan mleczny	8 779 zł	zgodne
T3	Zadaszenie, brak ścian, poliwęglan szary/dymiony	8 779 zł	zgodne
T4	Zadaszenie, brak ścian, szkło przezroczyste	11 383 zł	zgodne
T5	Zadaszenie, brak ścian, szkło mleczne	11 848 zł	zgodne
T6	Ogród zimowy, szyby przezroczyste	23 412 zł	zgodne
T7	Ogród zimowy, szyby mleczne	24 885 zł	zgodne
T8	Ogród zimowy, szyby przyciemniane	24 885 zł	zgodne
T9	Ogród zimowy, szyby przezroczyste + ZIP lewa	26 491 zł	zgodne
T10	Ogród zimowy, szyby przezroczyste + ZIP lewa + prawa	29 570 zł	zgodne
T11	Ogród zimowy, szyby przezroczyste + ZIP komplet	32 649 zł	zgodne
T12	Ogród zimowy, szyby przezroczyste + ZIP komplet + markiza	38 181 zł	zgodne
11. Niejasne ceny do dalszego sprawdzenia

Do weryfikacji w EG:

Test	Konfiguracja	Co sprawdzić
D1	Ogród zimowy, szyby przezroczyste + LED punktowe	czy dopłata wynosi 999 zł
D2	Ogród zimowy, szyby przezroczyste + taśma LED/COB	jaka jest dokładna dopłata
D3	Ogród zimowy, szyby przezroczyste + uchwyty	czy dopłata wynosi 465 zł
D4	Ogród zimowy, szyby przezroczyste + szczotki	czy dopłata wynosi 423 zł czy 465 zł
D5	Ogród zimowy, szyby przezroczyste + profil/spadek	czy dopłata wynosi 1 509 zł
D6	LED punktowe + szczotki	czy suma odpowiada pozycjom z macierzy
D7	taśma LED/COB + szczotki	czy suma odpowiada pozycjom z macierzy
D8	uchwyty + szczotki + profil	czy suma odpowiada macierzy
12. Kolejność dalszych prac

Rekomendowana kolejność:

Zabezpieczyć ustalenia w dokumentacji.
Poprawić logikę LED — LED punktowe i taśma LED wzajemnie się wykluczają.
Sprawdzić niejasne dodatki w EG.
Przeprojektować layout konfiguratora z większą wizualizacją.
Dodać kolor konstrukcji jako opcję wizualno-ofertową.
Przygotować architekturę realistycznego image visualizera.
Wygenerować własną scenę Glass System, mniej podobną do EG.
Dopiero po tym wrócić do integracji Bitrix24.

Po zapisaniu dokumentu możesz go dodać do commita razem z poprawką LED.

---

# Etap 2 — poprawka logiki LED

Na teraz nie robimy dużej migracji domeny. Zostawiamy:

```ts
hasLed
hasCob

ale wymuszamy w UI:

LED punktowe ON → LED taśma OFF
LED taśma ON → LED punktowe OFF

---

## 13. Wyniki testów EG — 300 x 306 cm

Testy zostały wykonane dla konfiguracji:

- szerokość wzdłuż ściany A: 306 cm,
- odstęp od ściany B: 300 cm,
- bazowy dach: poliwęglan przezroczysty,
- bazowe ściany dla testów dodatków: szyby przezroczyste.

### Potwierdzone obszary

Poniższe grupy testów są zgodne z kalkulatorem EG:

| Grupa | Zakres | Status |
| --- | --- | --- |
| A1-A5 | dachy | zgodne |
| B1-B3 | ściany przesuwne | zgodne |
| C1-C7 | rolety ZIP | zgodne |
| D1 | markiza | zgodne |
| E1 | LED punktowe | zgodne |
| E5 | profil / spadek / wyrównanie podłoża | zgodne |
| F5-F6 | sumowanie uchwytów, szczotek i profilu | zgodne |
| G1-G3 | wzajemne wykluczanie LED punktowe / taśma LED | zgodne |

### Potwierdzone ceny kontrolne

| Test | Konfiguracja | Cena EG | Wniosek |
| --- | --- | ---: | --- |
| A1 | brak ścian, poliwęglan przezroczysty | 8 383 zł | zgodne |
| A2 | brak ścian, poliwęglan mleczny | 8 779 zł | zgodne |
| A3 | brak ścian, poliwęglan szary/dymiony | 8 779 zł | zgodne |
| A4 | brak ścian, szkło przezroczyste | 11 383 zł | zgodne |
| A5 | brak ścian, szkło mleczne | 11 848 zł | zgodne |
| B1 | szyby przezroczyste | 23 412 zł | zgodne |
| B2 | szyby mleczne | 24 885 zł | zgodne |
| B3 | szyby przyciemniane/barwione | 24 885 zł | zgodne, taka sama cena jak mleczne |
| C1 | ZIP lewa | 26 491 zł | zgodne |
| C2 | ZIP prawa | 26 491 zł | zgodne |
| C3 | ZIP przednia | 26 491 zł | zgodne |
| C4 | ZIP lewa + prawa | 29 570 zł | zgodne |
| C5 | ZIP lewa + przednia | 29 570 zł | zgodne |
| C6 | ZIP prawa + przednia | 29 570 zł | zgodne |
| C7 | ZIP lewa + prawa + przednia | 32 649 zł | zgodne |
| D1 | markiza | 28 944 zł | zgodne |
| E1 | LED punktowe | 24 411 zł | zgodne |
| E5 | profil/spadek/wyrównanie | 24 921 zł | zgodne |

### Rozjazd 1 — uchwyty i szczotki

Testy EG wskazują, że wartości uchwytów i szczotek są odwrotne względem wcześniejszej interpretacji macierzy.

| Test | Opcja | Cena EG | Dopłata względem 23 412 zł |
| --- | --- | ---: | ---: |
| E3 | uchwyty | 23 835 zł | 423 zł |
| E4 | szczotki | 23 877 zł | 465 zł |

Wniosek:

- uchwyty powinny kosztować 423 zł,
- szczotki powinny kosztować 465 zł,
- aktualne mapowanie danych wymaga korekty.

Testy kombinacji potwierdzające:

| Test | Konfiguracja | Cena EG | Obliczenie |
| --- | --- | ---: | --- |
| F1 | LED punktowe + uchwyty | 24 834 zł | 23 412 + 999 + 423 |
| F2 | LED punktowe + szczotki | 24 876 zł | 23 412 + 999 + 465 |

### Rozjazd 2 — taśma LED CCT / COB

Test EG wskazał inną cenę taśmy LED CCT niż wartość wcześniej odczytana z macierzy.

| Test | Opcja | Cena EG | Dopłata względem 23 412 zł |
| --- | --- | ---: | ---: |
| E2 | taśma LED CCT ze zmienną temperaturą barwową | 24 686 zł | 1 274 zł |

Wcześniejsza interpretacja z macierzy zakładała dopłatę 1 656 zł.

Wniosek:

- cena taśmy LED CCT wymaga dalszej weryfikacji,
- możliwe, że kolumna „Taśma” z PDF nie odpowiada tej samej opcji co „Taśma LED CCT” w kalkulatorze EG,
- nie należy jeszcze automatycznie poprawiać całej macierzy bez znalezienia źródła wartości 1 274 zł.

### Wniosek po testach

Macierz cenowa jest w dużej części potwierdzona, ale przed finalnym spięciem z Bitrix24 trzeba wyjaśnić:

1. mapowanie uchwytów i szczotek,
2. źródło ceny taśmy LED CCT / COB,
3. czy rozjazdy występują tylko dla 300 x 306 cm, czy dla większej liczby wymiarów.

---

## 14. Dodatkowa kontrola taśmy LED CCT

Po dodatkowych testach w kalkulatorze EG potwierdzono, że opcja „Taśma LED CCT ze zmienną temperaturą barwową” nie odpowiada wcześniejszej interpretacji kolumny „Taśma” z głównej macierzy.

Testy wykonano dla konfiguracji bazowej:

- ściany: szyby przezroczyste,
- dach: poliwęglan przezroczysty,
- bez ZIP,
- bez markizy,
- bez uchwytów,
- bez szczotek,
- bez profilu/spadku,
- dodawana opcja: taśma LED CCT.

| Wymiar | Cena bazowa | Cena z taśmą LED CCT | Dopłata |
| --- | ---: | ---: | ---: |
| 300 x 306 | 23 412 zł | 24 686 zł | 1 274 zł |
| 300 x 406 | 26 553 zł | 28 378 zł | 1 825 zł |
| 350 x 306 | 27 172 zł | 28 630 zł | 1 458 zł |
| 400 x 306 | 28 561 zł | 30 203 zł | 1 642 zł |
| 500 x 306 | 36 778 zł | 38 787 zł | 2 009 zł |

### Robocza zależność

Na podstawie testów dopłata taśmy LED CCT wygląda na zależną od wymiarów.

Dla wymiaru bazowego 300 x 306 cm dopłata wynosi:

```text
1 274 zł