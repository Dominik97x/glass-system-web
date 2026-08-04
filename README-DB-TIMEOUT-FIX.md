# Poprawka timeoutu połączenia PostgreSQL / Neon

Pakiet naprawia sporadyczny błąd podczas zapisu formularza:

```text
Connection terminated due to connection timeout
Connection terminated unexpectedly
```

## Zmiany

- domyślny timeout nawiązania połączenia zwiększony z 10 do 20 sekund,
- włączony TCP keep-alive,
- obsługa błędów bezczynnych klientów puli,
- automatyczne odrzucenie uszkodzonej puli,
- jedna ponowna próba operacji po przejściowym błędzie połączenia,
- retry obejmuje zapis, listowanie, odczyt i aktualizację leadów.

## Instalacja

Rozpakuj pakiet do katalogu głównego repozytorium:

```text
C:\Projects\glass-system-web
```

z nadpisaniem plików.

Następnie uruchom:

```powershell
cd C:\Projects\glass-system-web\app
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run lint
npm run build
npm run dev
```

## Opcjonalne ustawienia `.env.local`

Kod ma bezpieczne wartości domyślne. Można je jawnie ustawić:

```env
DATABASE_CONNECTION_TIMEOUT_MS=20000
DATABASE_IDLE_TIMEOUT_MS=30000
DATABASE_RETRY_ATTEMPTS=1
DATABASE_POOL_MAX=5
```

Dla aplikacji należy używać połączenia pooled z Neon. Host w `DATABASE_URL`
powinien zawierać `-pooler`.
