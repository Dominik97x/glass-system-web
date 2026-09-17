# Etap D3.3 — przedni ZIP bez ścian

Zmiana reguły biznesowej kalkulatora MoonGlass:

- roleta ZIP **przednia** jest dostępna zarówno dla ogrodu zimowego, jak i samego zadaszenia,
- rolety ZIP **lewa i prawa** nadal wymagają wybranych ścian,
- usunięcie ścian zachowuje przedni ZIP, ale automatycznie wyłącza ZIP-y boczne,
- serwer odrzuca próbę przesłania bocznego ZIP-u bez ścian,
- cena przedniego ZIP-u jest pobierana z pola `zipFrontGross` także dla `terrace_roof`,
- pozycja przedniego ZIP-u może zostać przekazana do Bitrix24 bez ścian.

## Kontrola po instalacji

```powershell
cd C:\Projects\glass-system-web\app
npm run lint
npm run build
```

Następnie przy uruchomionym `npm run dev` sprawdź:

```text
http://localhost:3000/api/dev/inquiries/server-quote-check
```

Oczekiwane: `success: true`, w tym test akceptujący przedni ZIP bez ścian i test odrzucający ZIP boczny bez ścian.
