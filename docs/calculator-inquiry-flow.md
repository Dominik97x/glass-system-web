# Calculator Inquiry Flow

## Cel

Ten dokument opisuje przepływ danych od konfiguracji produktu w kalkulatorze do przygotowania leada sprzedażowego.

Na tym etapie dane nie są jeszcze wysyłane do CRM, API ani na e-mail. Aplikacja przygotowuje poprawny obiekt leada i zapisuje go w konsoli przeglądarki.

Docelowo ten przepływ będzie podstawą do:

- zapisu leada w CRM,
- wygenerowania oferty PDF,
- wysłania wiadomości do klienta,
- przekazania konfiguracji do konsultanta,
- dalszego procesu sprzedażowego.

---

## Główny przepływ

```text
ProductConfiguration
↓
QuoteService
↓
PricingEngine
↓
Quote
↓
QuoteSnapshot
↓
InquiryForm
↓
CalculatorInquiryLead
↓
CalculatorInquiryService
↓
API / CRM / e-mail w przyszłości