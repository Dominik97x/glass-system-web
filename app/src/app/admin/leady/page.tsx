import Link from "next/link";

import { CalculatorInquiryAdminService } from "@/inquiries/server/CalculatorInquiryAdminService";
import { formatPrice } from "@/lib/format-price";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const inquiryAdminService = new CalculatorInquiryAdminService();

export default async function AdminLeadyPage() {
  const inquiries = await inquiryAdminService.getAllInquiries();

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Leady z kalkulatora</h1>
          <p className="mt-2 text-neutral-400">
            Developerski podgląd zapytań zapisanych lokalnie w pliku JSON.
          </p>
        </header>

        {inquiries.length === 0 ? (
          <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <p className="text-neutral-300">Brak zapisanych leadów.</p>
          </section>
        ) : (
          <section className="space-y-4">
            {inquiries.map((inquiry) => (
              <article
                key={inquiry.id}
                className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm text-neutral-400">
                      Numer zapytania
                    </p>

                    <Link
                      href={`/admin/leady/${inquiry.id}`}
                      className="mt-1 block text-xl font-semibold underline-offset-4 hover:underline"
                    >
                      {inquiry.id}
                    </Link>
                  </div>

                  <div className="rounded-full border border-neutral-700 px-3 py-1 text-sm text-neutral-300">
                    status: {inquiry.status}
                  </div>
                </div>

                <div className="mt-6 grid gap-6 md:grid-cols-3">
                  <section>
                    <h3 className="font-semibold">Klient</h3>

                    <div className="mt-3 space-y-2 text-sm text-neutral-300">
                      <p>
                        <strong className="text-white">Imię:</strong>{" "}
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

                  <section>
                    <h3 className="font-semibold">Konfiguracja</h3>

                    <dl className="mt-3 space-y-2 text-sm">
                      {inquiry.quote.configurationSummary.map((row) => (
                        <div key={row.label}>
                          <dt className="text-neutral-400">{row.label}</dt>
                          <dd className="text-white">{row.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>

                  <section>
                    <h3 className="font-semibold">Wycena</h3>

                    <div className="mt-3 space-y-2 text-sm text-neutral-300">
                      <p>
                        <strong className="text-white">Razem:</strong>{" "}
                        {formatPrice(inquiry.quote.totalGross)}
                      </p>

                      <p>
                        <strong className="text-white">Przyjęto:</strong>{" "}
                        {new Date(inquiry.receivedAt).toLocaleString("pl-PL")}
                      </p>
                    </div>

                    <ul className="mt-4 space-y-1 text-sm text-neutral-300">
                      {inquiry.quote.items.map((item) => (
                        <li key={item.id}>
                          {item.name}:{" "}
                          <span className="text-white">
                            {formatPrice(item.totalPriceGross)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}