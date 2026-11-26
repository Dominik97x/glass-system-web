# MoonGlass - price-only workflow v1

Installation changes only scripts and npm aliases. No network is used by review or self-test. Backup and verify read Bitrix24; no writes. The full-catalog apply lock remains in place.

## Commands from app/

- `npm run bitrix:prices:plan` — existing mapped read-only planner.
- `npm run bitrix:prices:review -- --plan <file> --sha256 <hash>` — validate report, all 3 snapshot byte hashes, registry hash and every source SKU/price using the real catalog builder.
- `npm run bitrix:prices:self-test -- <mapped-plan-file>` — simulate all checks, apply/rollback to an in-memory inventory; no REST calls.
- `npm run bitrix:prices:backup -- --plan <file> --sha256 <hash> --run <unique-name> --scope all` — fresh read-only inventory check; create immutable-by-convention local plan and backup. Scope can instead be a comma-separated exact list of price_change SKUs (no spaces). Never defaults to all.
- `npm run bitrix:prices:verify -- --run <name>` — read-only comparison with original plan and locally verified journal events. Before apply, complete=false is expected. A pending intent stops verification and requires manual read-only investigation.

## Controlled production write phase

All three source statuses must be exactly APPROVED_PRICE_ONLY. Snapshots marked PREVIEW will be refused even with a confirmation argument. Releasing snapshots changes hashes, including the add-on hash linked by the registry; this requires a separate controlled release, updated registry reference, new mapped plan, fresh backup and explicit commercial approval. Do not edit the status to bypass the guard. Review current prices and exact approved SKUs before each batch.

- `npm run bitrix:prices:approve -- --run <name> --backup-sha256 <hash> --confirm APPROVE_PRICE_ONLY` creates a local approval for the exact plan/backup/scope; no network. SHA is an integrity binding, not authentication or digital signature.
- `npm run bitrix:prices:apply -- --run <name> --approval-sha256 <hash> --confirm APPLY_PRICE_ONLY` writes only `catalog.price.update` with the already-validated price ID and `fields.price` (net PLN). No automatic write retries. A fresh full inventory check and per-row identity/current price checks precede writes, and per-row post-read plus final inventory validation follow. Never replay a run with journal events. Use a separately approved fresh plan for remaining batches after a pilot.
- `npm run bitrix:prices:rollback -- --run <name> --approval-sha256 <hash> --confirm ROLLBACK_PRICE_ONLY` restores only journal-verified changes in reverse order, after checking the current values are still exactly the applied values and the full known managed inventory is consistent. A pending/uncertain write or interrupted rollback needs manual review. No automated overwrite of conflicting values.

Runs are stored under `../.local/pricing/price-workflow-runs/<name>/`. Keep plan.json, backup.json, approval.json, journal.jsonl together, outside Git. Intent and verified events are flushed to disk. A local exclusive lock prevents simultaneous writes from this workflow on this installation. Never delete a stale lock until the previous process and any ambiguous REST request have been investigated. A crash, timeout, or failure after sending an update may have committed remotely; do not retry automatically. Inspect live read-only state and journal first. An unrelated price change may block the entire batch or rollback; this is deliberate.

Production migration on 2026-11-26 verified all 456 approved price increases, including the recovered pilot and five subsequent batches. The final read-only audit compared 1337 source positions, found zero remaining price changes and preserved all 55 existing service products.

Limitations: REST calls are not transactional or compare-and-swap, so a remote edit between validation and update remains possible; coordinate a maintenance window and do not edit catalog prices during apply/rollback. Same-value edits are not distinguishable. Local SHA and lock do not protect against deliberate modifications to local code/files or other machines/scripts. Approval files are not cryptographically signed. Other Bitrix write paths are not disabled by this package. Alias writes, creation, deletion, names/SKU/section changes and existing deal updates are outside scope. The unmanaged product and other price types are not compared in detail. The canonical pricing generator and private supplier import tools are separate stages. Private supplier workbooks, commercial rules, alias registries and live catalog reports must remain outside Git. Each future production migration requires a new commercial approval, fresh plan and backup.

## Operational notes

- This repository does not include the private supplier importer or operational alias registry.
- The mapped planner and price workflow require the appropriate local registry and report files.
- Do not use the legacy planner as an approval source.
- Keep the full-catalog apply lock enabled.
- A completed historical migration does not authorize future price writes.
- Never retry an uncertain write automatically.
- The REST throttle is process-local: one serial queue per portal, at least 1100 ms between completed requests and the next request, with a longer cooldown after recognized rate-limit errors.
