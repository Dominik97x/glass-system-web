# Strategia źródła cennika

## Cel dokumentu

Ten dokument opisuje docelowy sposób przechowywania, edycji, synchronizacji i wykorzystywania cennika w systemie EcoGardens.

Dokument powstał po analizie:

- istniejącego pliku EG Cennik,
- działania obecnego kalkulatora,
- rozmów o historycznym utrzymywaniu cennika,
- screenów z Bitrix24,
- aktualnej architektury aplikacji `glass-system-web`.

Celem dokumentu jest podjęcie jednej spójnej decyzji:

> Gdzie znajduje się źródło prawdy dla cen i jak te ceny trafiają do strony oraz Bitrix24?

---

# Decyzja główna

Docelowym źródłem prawdy dla cennika jest:

```text
Excel Online