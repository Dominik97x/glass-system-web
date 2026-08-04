import { loadProvisionerEnv } from "./bitrix24/env";
import { Bitrix24TestFlow } from "./bitrix24/test-flow";

async function main(): Promise<void> {
  const confirmValue = readArgument("--confirm");
  const env = loadProvisionerEnv();
  const flow = new Bitrix24TestFlow(process.cwd(), env);
  const result = await flow.run(confirmValue);

  console.log("Test D2 zakończony pomyślnie.");
  console.log(
    `Kontakt: #${result.contactId} (${result.contactWasCreated ? "utworzony" : "wykorzystany ponownie"}); kontrola duplikatu: OK`
  );
  console.log(
    `Deal: #${result.dealId} (${result.dealWasCreated ? "utworzony" : "zaktualizowany"}); lejek i etap: OK`
  );
  console.log(`Pozycje produktowe: ${result.productRows.length}`);
  console.log(`Suma: ${result.totalGross.toFixed(2)} ${result.currency}`);
  console.log(`VAT: ${result.vatRate}% (ceny zawierają VAT)`);
  console.log(`Raport: ${env.reportDir}`);
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
