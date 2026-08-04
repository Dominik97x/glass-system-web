import { loadProvisionerEnv } from "./bitrix24/env";
import { Bitrix24Provisioner } from "./bitrix24/provisioner";

async function main(): Promise<void> {
  const command = process.argv[2];
  const confirmValue = readArgument("--confirm");
  const env = loadProvisionerEnv();
  const provisioner = new Bitrix24Provisioner(process.cwd(), env);

  if (command === "audit") {
    const audit = await provisioner.audit();
    console.log(`Audit zakończony: ${audit.portalHost}`);
    console.log(`Lejki: ${audit.categories.length}, pola: ${audit.userFields.length}, sekcje: ${audit.sections.length}, produkty: ${audit.products.length}`);
    console.log(`Raport: ${env.reportDir}`);
    return;
  }

  if (command === "plan") {
    const plan = await provisioner.plan();
    const pending = plan.actions.filter((item) => item.kind === "create" || item.kind === "update").length;
    const warnings = plan.actions.filter((item) => item.kind === "warning").length;
    console.log(`Plan gotowy. Zmiany: ${pending}, ostrzeżenia: ${warnings}`);
    console.log(`Raport: ${env.reportDir}`);
    return;
  }

  if (command === "apply") {
    const mapping = await provisioner.apply(confirmValue);
    console.log("Konfiguracja podstawowa została zastosowana.");
    console.log(`Lejki: ${Object.keys(mapping.pipelines).length}, pola: ${Object.keys(mapping.userFields).length}`);
    console.log(`Mapowanie: ${env.reportDir}`);
    return;
  }

  if (command === "products:pilot") {
    const mapping = await provisioner.applyPilotProducts(confirmValue);
    console.log("Pilotażowe produkty zostały zsynchronizowane.");
    console.log(`Produkty MoonGlass w mapowaniu: ${Object.keys(mapping.catalog?.products ?? {}).length}`);
    console.log(`Mapowanie: ${env.reportDir}`);
    return;
  }

  if (command === "verify") {
    const result = await provisioner.verify();
    console.log(result.ok ? "Weryfikacja OK." : "Weryfikacja wykryła brakujące elementy lub ostrzeżenia.");
    console.log(`Pozostałe działania: ${result.remainingActions.length}`);
    console.log(`Raport: ${env.reportDir}`);
    if (!result.ok) process.exitCode = 2;
    return;
  }

  throw new Error(
    "Nieznane polecenie. Dostępne: audit, plan, apply, products:pilot, verify."
  );
}

function readArgument(name: string): string | undefined {
  const prefix = `${name}=`;
  const inline = process.argv.find((value) => value.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
