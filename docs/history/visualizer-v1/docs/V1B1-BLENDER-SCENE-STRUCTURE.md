# V1B.1 — Blender Scene Structure

## Cel

Ten dokument nie opisuje jeszcze modelowania profili krok po kroku.
Definiuje **strukturę pliku `.blend`**, aby wszystkie późniejsze rendery były automatyzowalne.

## Kolekcje

```text
MG_SCENE01
├── ENVIRONMENT
│   ├── House
│   ├── Terrace
│   ├── Garden
│   └── Furniture
├── PRODUCT
│   ├── Frame
│   ├── Roof
│   ├── Walls
│   └── Drainage
├── OPTIONS
│   ├── ZipFront
│   ├── ZipLeft
│   ├── ZipRight
│   ├── Awning
│   ├── LedSpot
│   └── LedCct
├── LIGHTS
│   ├── Day
│   ├── Evening
│   └── ProductLED
├── CAMERAS
│   └── Camera_Master
└── RENDER_HELPERS
```

## Reguły

1. `Camera_Master` pozostaje nieruchoma po zatwierdzeniu POC-01.
2. Wszystkie warianty koloru korzystają z tej samej geometrii.
3. Opcje są osobnymi obiektami/kolekcjami, nie są na stałe połączone z ramą.
4. Wszystkie obiekty mają stabilne, techniczne nazwy — bez `Cube.001`.
5. Ściany szklane muszą być osobnymi obiektami od konstrukcji.
6. ZIP front/lewa/prawa muszą być osobnymi kolekcjami.
7. Markiza jest osobną kolekcją.
8. LED punktowe i CCT są osobnymi zestawami obiektów/źródeł światła.
9. Przed eksportem overlayu renderujemy z przezroczystym tłem i z identycznej kamery.
10. Finalne pliki WWW nie są zapisywane ręcznie bezpośrednio z Blendera — najpierw zachowujemy źródłowy render PNG.

## Materiały

```text
MAT_Frame_Anthracite_7016
MAT_Frame_White
MAT_Frame_Brown

MAT_Roof_Clear
MAT_Roof_Grey

MAT_Glass_Clear
MAT_Glass_Tinted

MAT_Zip
MAT_Awning
```

## Render states

Docelowo stan renderu ma dać się ustawić przez skrypt, np.:

```text
FRAME_COLOR=anthracite
WALLS=none
ROOF=clear
ZIP_FRONT=false
ZIP_LEFT=false
ZIP_RIGHT=false
AWNING=false
LIGHTING=none
TIME=day
```

To pozwoli później wygenerować warianty seryjnie bez ręcznego przełączania obiektów.
