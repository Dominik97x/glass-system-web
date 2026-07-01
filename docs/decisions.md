# Decyzje projektowe

## 2025-06-25

### Kalkulator

Zdecydowano:

Kalkulator korzysta z gotowej matrycy cenowej.

Powód:

Tak działa obecny system EcoGardens oraz CRM.

---

### Pricing Engine

Źródłem danych będzie cennik EG.

Docelowo dane zostaną przeniesione do plików JSON.

---

### CRM

Docelowym systemem CRM będzie Bitrix24.

---

### Marża

Cennik producenta nie jest ceną końcową.

System musi umożliwiać doliczenie marży.

Zakres:

20–30%

---

### Produkty

Pierwsza wersja aplikacji:

- Ogrody zimowe

- Zadaszenia tarasów

Kolejna wersja:

- Carporty

---

### Architektura

Projekt zostanie podzielony na niezależne moduły:

- Pricing Engine

- Kalkulator

- Formularze

- CRM

- Oferta PDF

Każdy moduł powinien być możliwy do rozwijania niezależnie.

## Reguły dostępności opcji

Konfigurator musi obsługiwać warunkową dostępność opcji.

Przykład:
- rolety boczne są dostępne tylko wtedy, gdy klient wybrał ściany szklane przesuwne,
- jeżeli klient zmieni ściany na "brak", system powinien usunąć rolety boczne z konfiguracji.

Powód:
Tak działa kalkulator EcoGardens i zapobiega to tworzeniu niemożliwych konfiguracji.