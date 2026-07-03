import Link from "next/link";
import { notFound } from "next/navigation";

import { CalculatorInquiryAdminService } from "@/inquiries/server/CalculatorInquiryAdminService";
import { formatPrice } from "@/lib/format-price";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const inquiryAdminService = new CalculatorInquiryAdminService();

export default async function AdminLeadDetailsPage({ params }: Props) {
  const { id } = await params;
  const inquiry = await inquiryAdminService.getInquiryById(id);

  if (!inquiry) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/admin/leady"
          className="text-sm text-neutral-400 underline-offset-4 hover:text-white hover:underline"
        >
          ← Wróć do listy leadów
        </Link>

        <header className="mt-6 mb-8">
          <p className="text-sm text-neutral-400">Numer zapytania</p>

          <h1 className="mt-1 text-3xl font-bold">{inquiry.id}</h1>

          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full border border-neutral-700 px-3 py-1 text-neutral-300">
              status: {inquiry.status}
            </span>

            <span className="rounded-full border border-neutral-700 px-3 py-1 text-neutral-300">
              źródło: {inquiry.source}
            </span>

            <span className="rounded-full border border-neutral-700 px-3 py-1 text-neutral-300">
              przyjęto:{" "}
              {new Date(inquiry.receivedAt).toLocaleString("pl-PL")}
            </span>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-6">
            <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <h2 className="text-xl font-semibold">Klient</h2>

              <div className="mt-4 space-y-3 text-sm text-neutral-300">
                <p>
                  <strong className="text-white">Imię i nazwisko:</strong>{" "}
                  {inquiry.customer.name}
                </p>

                <p>
                  <strong className="text-white">E-mail:</strong>{" "}
                  {inquiry.customer.email}
                </p>

                <p>
                  <strong className="text-white">Telefon:</strong>{" "}
                  {inquiry.customer.phone}
                </p>

                <p>
                  <strong className="text-white">Wiadomość:</strong>{" "}
                  {inquiry.customer.message || "Brak"}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <h2 className="text-xl font-semibold">Wycena</h2>

              <p className="mt-4 text-3xl font-bold">
                {formatPrice(inquiry.quote.totalGross)}
              </p>

              <p className="mt-1 text-sm text-neutral-400">
                Cena brutto, waluta: {inquiry.quote.currency}
              </p>
            </section>
          </aside>

          <section className="space-y-6">
            <article className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <h2 className="text-xl font-semibold">Konfiguracja</h2>

              <dl className="mt-4 grid gap-4 md:grid-cols-2">
                {inquiry.quote.configurationSummary.map((row) => (
                  <div key={row.label}>
                    <dt className="text-sm text-neutral-400">{row.label}</dt>
                    <dd className="mt-1 font-medium text-white">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </article>

            <article className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <h2 className="text-xl font-semibold">Pozycje oferty</h2>

              <div className="mt-4 overflow-hidden rounded-xl border border-neutral-800">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-neutral-950 text-neutral-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">Pozycja</th>
                      <th className="px-4 py-3 font-medium">Kategoria</th>
                      <th className="px-4 py-3 text-right font-medium">
                        Ilość
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Cena
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {inquiry.quote.items.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t border-neutral-800"
                      >
                        <td className="px-4 py-3 text-white">{item.name}</td>
                        <td className="px-4 py-3 text-neutral-300">
                          {item.category}
                        </td>
                        <td className="px-4 py-3 text-right text-neutral-300">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-right text-white">
                          {formatPrice(item.totalPriceGross)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <h2 className="text-xl font-semibold">Dane techniczne</h2>

              <pre className="mt-4 max-h-[420px] overflow-auto rounded-xl bg-neutral-950 p-4 text-xs text-neutral-300">
                {JSON.stringify(inquiry, null, 2)}
              </pre>
            </article>
          </section>
        </div>
      </div>
    </main>
  );
}