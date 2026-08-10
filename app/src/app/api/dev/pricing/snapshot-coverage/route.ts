import type { NextRequest } from "next/server";

import { GET as getPricingCoverage } from "../coverage/route";

export const runtime = "nodejs";

/**
 * Legacy compatibility endpoint.
 *
 * Kanoniczny test pokrycia cen znajduje sie pod:
 * /api/dev/pricing/coverage
 *
 * Ten endpoint pozostaje jako alias, aby stare linki developerskie
 * nie uruchamialy historycznego kalkulatora snapshotowego.
 */
export async function GET(request: NextRequest) {
  return getPricingCoverage(request);
}
