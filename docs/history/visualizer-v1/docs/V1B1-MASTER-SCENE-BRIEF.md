# MoonGlass Visualizer V1B.1 — Master Scene Brief

## 1. Cel

V1B.1 ma zdefiniować **jedną wzorcową scenę MoonGlass**, która stanie się bazą wizualizatora
dla zadaszeń tarasu i ogrodów zimowych.

Nie produkujemy jeszcze całej macierzy konfiguracji. Najpierw tworzymy jeden render,
który musi spełnić dwa warunki:

1. wygląda wystarczająco profesjonalnie, aby mógł znaleźć się na publicznej stronie MoonGlass,
2. jest zbudowany tak, aby później można było generować z tej samej kamery warianty koloru,
   ścian, ZIP, markizy i LED.

## 2. Materiały referencyjne

Brief powstał na podstawie materiałów przekazanych przez użytkownika:

- trzech poglądowych scen tego samego tarasu/zadaszenia:
  - wariant dzienny otwarty,
  - wariant wieczorny z LED,
  - wariant zabudowany szkłem,
- materiałów marketingowych MoonGlass z Facebooka,
- logo MoonGlass używanego obecnie na profilu,
- informacji, że archiwum `Wizualizacja.rar` zawiera zrzuty interfejsu wizualizatora EcoGardens.

### Zasada projektowa

- **EcoGardens** traktujemy jako inspirację UX/funkcjonalną.
- **Materiały MoonGlass i trzy sceny poglądowe** traktujemy jako inspirację dla kadru, klimatu i marki.

Nie kopiujemy geometrii ani sceny EcoGardens 1:1.

## 3. Główna decyzja artystyczna

### Kamera

Główna scena ma być pokazana **od strony ogrodu, pod kątem 3/4**.

Kadr powinien jednocześnie pokazywać:

- front konstrukcji,
- jeden bok,
- głębokość dachu,
- połączenie konstrukcji z elewacją,
- słupy frontowe,
- taras i część otoczenia.

To jest kierunek zgodny z trzema przekazanymi scenami poglądowymi.

### Czego nie chcemy

- płaskiego frontalnego kadru,
- ekstremalnie szerokiego obiektywu,
- kamery ustawionej bardzo wysoko,
- konstrukcji zajmującej 100% obrazu bez kontekstu domu,
- agresywnego „AI look” / przesadnego HDR,
- zmiany położenia kamery między wariantami.

## 4. Format finalnych assetów

### Master render

Rekomendowany format źródłowy POC:

- proporcje: **4:3**
- render roboczy: **1600 × 1200**
- finalny render: **2400 × 1800** lub większy
- format roboczy: PNG
- format WWW: WebP/AVIF po optymalizacji

### Safe zone

Produkt powinien mieścić się w centralnych ~80% kadru.
Po bokach i u góry zostawiamy zapas tła.

Powód: aktualny `VisualizationPanel` używa `object-cover`; przed produkcyjnym podpięciem
assetów zmienimy viewport na stabilne proporcje 4:3, ale grafika nadal musi bezpiecznie
znosić niewielkie cropy na urządzeniach mobilnych.

## 5. Scena bazowa

### Otoczenie

- współczesny dom jednorodzinny,
- jasna / neutralna elewacja,
- duże przeszklenia domu,
- nowoczesny taras z płyt/płytki,
- uporządkowana zieleń,
- proste meble tarasowe,
- brak elementów odciągających uwagę od produktu,
- polski / europejski charakter otoczenia.

### Konstrukcja

POC ma przedstawiać produkt reprezentatywny, nie konkretny wymiar z cennika.

Na tym etapie:
- konstrukcja aluminiowa przyścienna,
- dach jednospadowy,
- przednia belka/rynna,
- dwa frontowe słupy widoczne w kadrze,
- rytmiczne krokwie dachowe,
- czytelne połączenie z elewacją.

### Ważne ograniczenie

Przekazane materiały są referencją wizualną, a nie dokumentacją techniczną.
**Wymiary profili, przekroje i szczegóły łączeń muszą zostać zweryfikowane z dokumentacją
producenta przed uznaniem modelu za technicznie zgodny z produktem MoonGlass.**

Do POC można użyć geometrii reprezentatywnej.

## 6. Pierwszy stan do wykonania

### POC-01: DAY / OPEN / ANTHRACITE

- typ: zadaszenie tarasu,
- kolor: Antracyt RAL 7016,
- brak ścian,
- dach przezroczysty,
- bez ZIP,
- bez markizy,
- bez LED,
- jasny dzień,
- neutralne, naturalne światło.

To jest **master scene**. Dopóki ten render nie zostanie zaakceptowany, nie produkujemy kolejnych wariantów.

## 7. Kolejne rendery POC

Po zaakceptowaniu POC-01 tworzymy w tej samej scenie i z tej samej kamery:

### POC-02: DAY / CLOSED / ANTHRACITE
- identyczna scena,
- pełna zabudowa szklana,
- szkło przezroczyste.

### POC-03: EVENING / OPEN / ANTHRACITE / LED
- identyczna geometria otwartego zadaszenia,
- światło wieczorne,
- LED w konstrukcji,
- ciepłe światło domu/ogrodu.

### POC-04: DAY / OPEN / WHITE
- jak POC-01,
- konstrukcja biała.

### POC-05: DAY / OPEN / BROWN
- jak POC-01,
- konstrukcja brązowa.

### POC-06: DAY / CLOSED / TINTED
- zabudowa,
- szkło przyciemniane.

### POC-07: ZIP FRONT
- test pierwszego dodatku.

### POC-08: AWNING
- test markizy.

To wystarczy do decyzji technologicznej. Nie renderujemy jeszcze wszystkich kombinacji.

## 8. Rekomendowana technika — HYBRYDA

Na podstawie charakteru konstrukcji rekomendujemy model hybrydowy:

### Pełne rendery
Używamy ich dla stanów, które mocno wpływają na:
- odbicia,
- cienie,
- światło,
- przejrzystość,
- wygląd całej sceny.

Dotyczy przede wszystkim:
- dzień / wieczór,
- otwarte / pełna zabudowa,
- rodzaj szkła,
- główny kolor konstrukcji, jeśli zmienia odbicia i cienie w sposób widoczny.

### Warstwy transparentne
Testujemy je dla dodatków, które można stabilnie nałożyć z tej samej kamery:
- ZIP,
- markiza,
- wybrane elementy oświetlenia.

Dla każdej warstwy opcjonalnie generujemy także pass cienia/odbicia, jeśli bez niego
kompozycja wygląda sztucznie.

### Dlaczego nie 100% warstw

Szkło, cienie i odbicia są zależne od całej sceny. Sama przezroczysta nakładka może
wyglądać nienaturalnie.

### Dlaczego nie 100% pełnych renderów

Macierz kombinacji bardzo szybko eksploduje. Hybryda ogranicza liczbę plików,
a zachowuje jakość.

## 9. Struktura sceny Blender

Rekomendowane kolekcje:

- `ENVIRONMENT`
  - `House`
  - `Terrace`
  - `Garden`
  - `Furniture`
- `PRODUCT`
  - `Frame`
  - `Roof`
  - `Walls`
  - `Drainage`
- `OPTIONS`
  - `ZipFront`
  - `ZipLeft`
  - `ZipRight`
  - `Awning`
  - `LedSpot`
  - `LedCct`
- `LIGHTS`
  - `Day`
  - `Evening`
  - `ProductLED`
- `CAMERAS`
  - `Camera_Master`
- `RENDER_HELPERS`
  - shadow catchers / masks / holdouts

### Nazwy materiałów

- `MAT_Frame_Anthracite_7016`
- `MAT_Frame_White`
- `MAT_Frame_Brown`
- `MAT_Glass_Clear`
- `MAT_Glass_Tinted`
- `MAT_Roof_Clear`
- `MAT_Roof_Grey`
- `MAT_Zip`
- `MAT_Awning`

## 10. Kontrakt z istniejącym kodem

V1A.2 resolver emituje logiczne klucze:

- `frame:anthracite`
- `frame:white`
- `frame:brown`
- `roof:<roof-option>`
- `walls:glass_clear`
- `walls:glass_milky`
- `walls:glass_tinted`
- `zip:front`
- `zip:left`
- `zip:right`
- `awning`
- `lighting:spot`
- `lighting:cct`

V1B ma produkować assety, które później mapujemy na te klucze.

## 11. Nazewnictwo plików

Pełne rendery:

- `mg_scene01_day_open_anthracite.webp`
- `mg_scene01_day_closed-clear_anthracite.webp`
- `mg_scene01_evening_open_anthracite_led-cct.webp`
- `mg_scene01_day_open_white.webp`
- `mg_scene01_day_open_brown.webp`
- `mg_scene01_day_closed-tinted_anthracite.webp`

Warstwy:

- `mg_scene01_overlay_zip-front.png`
- `mg_scene01_overlay_zip-left.png`
- `mg_scene01_overlay_zip-right.png`
- `mg_scene01_overlay_awning.png`
- `mg_scene01_overlay_led-spot.png`
- `mg_scene01_overlay_led-cct.png`

PNG z alfą pozostaje formatem źródłowym dla overlayów.

## 12. Branding MoonGlass

Na podstawie przekazanych materiałów marketingowych kierunek jest następujący:

- bardzo ciemna zieleń jako kolor marki,
- ciepłe złoto jako akcent,
- kość słoniowa / ciepła biel,
- antracyt jako kolor produktu,
- ciepłe światło wieczorne.

Dokładne wartości HEX powinny zostać zatwierdzone dopiero na podstawie oryginalnego
pliku logo / projektu źródłowego, bo zrzuty i pliki z komunikatorów mogą zmieniać kolory.

## 13. Warunek akceptacji master scene

POC-01 jest zaakceptowany, gdy:

- bryła konstrukcji jest czytelna w ciągu 1–2 sekund,
- front i bok są jednocześnie widoczne,
- dach jest czytelny,
- konstrukcja nie ginie na tle domu,
- aluminium wygląda jak aluminium, a nie plastik,
- szkło/dach nie wygląda jak jednolita przezroczysta płaszczyzna,
- scena wygląda wiarygodnie architektonicznie,
- tło nie konkuruje z produktem,
- kadr nadaje się do cropu na desktop/mobile,
- kamera może zostać zamrożona dla wszystkich późniejszych wariantów.

## 14. Co celowo odkładamy

Nie robimy teraz:

- pełnych 140 wymiarów,
- parametrycznej zmiany wymiarów w Blenderze,
- carportu,
- osobnej sceny dla każdego domu,
- obracanego Three.js,
- konfiguratora AR,
- renderu każdej możliwej kombinacji.

Carport otrzyma później `Scene02`.

## 15. Następny praktyczny krok

1. zainstalować Blender,
2. utworzyć scenę zgodną ze strukturą powyżej,
3. przygotować **POC-01**,
4. pokazać render do oceny,
5. dopiero po akceptacji POC-01 tworzyć kolejne warianty.
