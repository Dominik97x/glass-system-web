import { getCalculatorInquiryDatabasePool } from "@/inquiries/repositories/PostgresCalculatorInquiryDatabase";

export const runtime = "nodejs";

interface DatabaseHealthCheckRow {
  now: Date | string;
}

interface DatabaseTableCheckRow {
  table_name: string | null;
}

interface DatabaseCountRow {
  count: string;
}

export async function GET(): Promise<Response> {
  if (process.env.NODE_ENV === "production") {
    return Response.json(
      {
        success: false,
        message: "Ten endpoint jest dostępny tylko w trybie developerskim.",
      },
      { status: 404 }
    );
  }

  if (!process.env.DATABASE_URL) {
    return Response.json(
      {
        success: false,
        message:
          "DATABASE_URL is not configured. Set DATABASE_URL before testing Postgres/Neon connection.",
      },
      { status: 400 }
    );
  }

  try {
    const pool = getCalculatorInquiryDatabasePool();

    const healthResult = await pool.query<DatabaseHealthCheckRow>(
      "select now() as now"
    );

    const tableResult = await pool.query<DatabaseTableCheckRow>(
      "select to_regclass('public.calculator_inquiries')::text as table_name"
    );

    const tableName = tableResult.rows[0]?.table_name ?? null;
    const tableExists = tableName === "calculator_inquiries";

    const inquiryCount = tableExists
      ? await getCalculatorInquiryCount()
      : null;

    return Response.json({
      success: true,
      database: {
        connected: true,
        serverTime: toIsoString(healthResult.rows[0]?.now),
        calculatorInquiriesTableExists: tableExists,
        calculatorInquiriesCount: inquiryCount,
      },
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unknown database health check error.",
      },
      { status: 500 }
    );
  }
}

async function getCalculatorInquiryCount(): Promise<number> {
  const pool = getCalculatorInquiryDatabasePool();

  const result = await pool.query<DatabaseCountRow>(
    "select count(*)::text as count from calculator_inquiries"
  );

  return Number(result.rows[0]?.count ?? 0);
}

function toIsoString(value: Date | string | undefined): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
}