# MoonGlass D6.6.2.1 — hotfix Bitrix24 `price`

Rozpakuj nakładkę do katalogu `C:\Projects\glass-system-web` z nadpisaniem plików.

Następnie uruchom w `app`:

```powershell
npm run pricing:verify-net
npm run bitrix:net-rows:verify
npm run lint
npm run build
```

Po zaliczeniu kontroli uruchom aplikację i utwórz **nowe** zapytanie testowe. Nie używaj Deala utworzonego przed hotfixem.
