import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getAdminAuthConfiguration } from "@/auth/admin-auth";
import { getAdminSession } from "@/auth/admin-session";

interface AdminLoginPageProps {
  searchParams: Promise<{
    error?: string;
    loggedOut?: string;
    next?: string;
  }>;
}

export const metadata: Metadata = {
  title: "Logowanie administratora | MoonGlass",
  robots: {
    index: false,
    follow: false,
  },
};

function sanitizeNextPath(value: string | undefined): string {
  if (
    value &&
    value.startsWith("/admin/") &&
    !value.startsWith("//") &&
    !value.startsWith("/admin/logowanie")
  ) {
    return value;
  }

  return "/admin/leady";
}

function getErrorMessage(error: string | undefined): string | null {
  switch (error) {
    case "invalid":
      return "Nieprawidłowa nazwa użytkownika lub hasło.";
    case "blocked":
      return "Zbyt wiele nieudanych prób. Spróbuj ponownie za około 15 minut.";
    case "configuration":
      return "Logowanie administratora nie zostało jeszcze skonfigurowane.";
    default:
      return null;
  }
}

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const params = await searchParams;
  const nextPath = sanitizeNextPath(params.next);
  const session = await getAdminSession();

  if (session) {
    redirect(nextPath);
  }

  const configuration = getAdminAuthConfiguration();
  const errorMessage = getErrorMessage(params.error);

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 py-12 text-white">
      <section className="w-full max-w-md rounded-3xl border border-neutral-800 bg-neutral-900 p-8 shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
          MoonGlass
        </p>

        <h1 className="mt-4 text-3xl font-bold">Panel administratora</h1>

        <p className="mt-3 text-sm leading-6 text-neutral-400">
          Zaloguj się, aby wyświetlać dane klientów i zarządzać statusami leadów.
        </p>

        {params.loggedOut === "1" ? (
          <div className="mt-6 rounded-xl border border-emerald-800 bg-emerald-950/60 px-4 py-3 text-sm text-emerald-200">
            Sesja została zakończona.
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-6 rounded-xl border border-red-900 bg-red-950/60 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        ) : null}

        {!configuration.configured ? (
          <div className="mt-6 rounded-xl border border-amber-800 bg-amber-950/60 px-4 py-3 text-sm leading-6 text-amber-200">
            <strong>Brak konfiguracji:</strong> {configuration.message} Uzupełnij
            ustawienia w pliku <code>.env.local</code> i uruchom ponownie serwer.
          </div>
        ) : null}

        <form action="/api/admin/session" method="post" className="mt-8 space-y-5">
          <input type="hidden" name="next" value={nextPath} />

          <label className="block text-sm font-medium text-neutral-200">
            Nazwa użytkownika
            <input
              type="text"
              name="username"
              autoComplete="username"
              required
              disabled={!configuration.configured}
              className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </label>

          <label className="block text-sm font-medium text-neutral-200">
            Hasło
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              disabled={!configuration.configured}
              className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </label>

          <button
            type="submit"
            disabled={!configuration.configured}
            className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-bold text-neutral-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
          >
            Zaloguj się
          </button>
        </form>
      </section>
    </main>
  );
}
