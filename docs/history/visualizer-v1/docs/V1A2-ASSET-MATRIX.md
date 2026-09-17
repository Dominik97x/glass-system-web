# MoonGlass Visualizer V1A.2 — kontrakt assetów

## Cel

V1A.2 oddziela wizualizację od cennika. Kalkulator przekazuje do renderera wyłącznie
`VisualizerState`, a `VisualizerAssetResolver` decyduje, jakiej sceny/warstw potrzebuje.

Na tym etapie UI nadal pokazuje dotychczasowe obrazy poglądowe. Nie generujemy jeszcze
renderów Blendera.

## Stan visualizera

Renderer zna wyłącznie:

- typ: `terrace_roof` / `winter_garden`,
- kolor konstrukcji: `anthracite` / `white` / `brown`,
- wymiar: długość i szerokość,
- dach,
- rodzaj ścian,
- ZIP: przód / lewa / prawa,
- markizę,
- oświetlenie: brak / punktowe / CCT.

Akcesoria takie jak uchwyty, szczotki i profil pozostają w wycenie i podsumowaniu,
ale nie tworzą osobnych warstw wizualnych V1.

## Ważne ograniczenie obecnego modelu

Aktualny `ProductConfiguration` ma jeden wspólny wariant ścian (`walls`). Nie posiada
osobnych przełączników „ściana front / lewa / prawa”. Nie dokładamy ich sztucznie do
visualizera. Jeśli biznesowo będą potrzebne, rozszerzymy najpierw model konfiguracji.

## Logiczne warstwy docelowe

Resolver emituje następujący kontrakt:

- `frame:anthracite`
- `frame:white`
- `frame:brown`
- `roof:<roof-option>`
- `walls:glass_clear`
- `walls:glass_milky` — kompatybilność historyczna
- `walls:glass_tinted`
- `zip:front`
- `zip:left`
- `zip:right`
- `awning`
- `lighting:spot`
- `lighting:cct`

To są klucze logiczne, a nie jeszcze ścieżki do plików.

## POC Blendera — kolejny etap

Nie renderujemy całej macierzy od razu. Pierwszy POC powinien używać jednej stałej
kamery i jednej przykładowej geometrii ogrodu zimowego.

Minimalny zestaw do oceny rozwiązania:

1. konstrukcja antracyt,
2. konstrukcja biała,
3. konstrukcja brązowa,
4. ściany przezroczyste,
5. ściany przyciemniane,
6. ZIP front,
7. ZIP lewa,
8. markiza,
9. LED punktowe,
10. LED CCT.

Po tym teście zdecydujemy, czy produkcja będzie oparta o:

- transparentne warstwy,
- pełne rendery głównych wariantów,
- model hybrydowy.

## Wymiary

Długość/szerokość są już częścią `VisualizerState` i klucza sceny, ale V1A.2 nie
przełącza jeszcze osobnych obrazów dla 140 kombinacji wymiarowych. Dzięki temu nie
blokujemy dalszego rozwoju, a jednocześnie nie produkujemy setek assetów przed POC.
