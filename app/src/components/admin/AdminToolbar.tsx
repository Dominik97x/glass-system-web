import Link from "next/link";

interface AdminToolbarProps {
  username: string;
}

export function AdminToolbar({ username }: AdminToolbarProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-neutral-800 bg-neutral-900 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Link href="/admin/leady" className="font-semibold text-white">
          MoonGlass — panel leadów
        </Link>
        <p className="mt-1 text-xs text-neutral-400">
          Zalogowano jako: {username}
        </p>
      </div>

      <form action="/api/admin/logout" method="post">
        <button
          type="submit"
          className="rounded-xl border border-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-200 transition hover:border-neutral-500 hover:bg-neutral-800"
        >
          Wyloguj się
        </button>
      </form>
    </div>
  );
}
