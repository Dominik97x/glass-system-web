import { loadProvisionerEnv } from "./bitrix24/env";
import {
  Bitrix24AutomationPlanner,
} from "./bitrix24/automation-planner";
import type {
  AutomationPipelineKey,
  AutomationProfile,
} from "./bitrix24/automation-blueprint";

async function main(): Promise<void> {
  const command = process.argv[2];
  const env = loadProvisionerEnv();
  const planner = new Bitrix24AutomationPlanner(process.cwd(), env);

  if (command === "audit") {
    const report = await planner.audit();
    console.log("Audyt automatyzacji D5 zakończony.");
    console.log(`Portal: ${report.portalHost}`);
    console.log(`Konfiguracja bazowa: ${report.baseProvisioningOk ? "OK" : "NIEKOMPLETNA"}`);
    console.log("Automatyczny zapis natywnych robotów przez incoming webhook: NIE");
    console.log(`Raport: ${env.reportDir}`);
    return;
  }

  if (command === "plan") {
    const profile = readProfile();
    const report = await planner.plan(profile);
    console.log("Plan automatyzacji D5 gotowy.");
    console.log(`Profil: ${profile}`);
    console.log(
      `Reguły: ${report.counts.total} (sprzedaż ${report.counts.sales}, realizacja ${report.counts.realization}, reklamacje ${report.counts.complaints})`
    );
    console.log(`Priorytet P0: ${report.counts.p0}, P1: ${report.counts.p1}`);
    console.log(`Raport i checklista: ${env.reportDir}`);
    return;
  }

  if (command === "test") {
    const pipeline = readPipeline();
    const stageCode = readRequiredArgument("--stage");
    const confirm = readArgument("--confirm");
    const report = await planner.createTestDeal(pipeline, stageCode, confirm);
    console.log("Utworzono testowy Deal D5.");
    console.log(`Deal: #${report.dealId}`);
    console.log(`Etap: ${report.stageName} (${report.stageId})`);
    console.log(`Oczekiwane roboty natychmiastowe: ${report.expectedImmediateRules.length}`);
    console.log(`Link: ${report.dealUrl}`);
    console.log(`Raport: ${env.reportDir}`);
    return;
  }

  if (command === "apply") {
    throw new Error(
      "D5 nie wykonuje automatycznego apply. Standardowe roboty Bitrix24 nie mogą być instalowane przez incoming webhook. Uruchom plan i skonfiguruj je w CRM → Deale → Automatyzacja zgodnie z checklistą."
    );
  }

  throw new Error(
    "Nieznane polecenie. Dostępne: audit, plan, test, apply (apply wyjaśnia ograniczenie API)."
  );
}

function readProfile(): AutomationProfile {
  const value = (readArgument("--profile") ?? "starter").toLowerCase();
  if (value !== "starter" && value !== "full") {
    throw new Error("--profile musi mieć wartość starter albo full.");
  }
  return value;
}

function readPipeline(): AutomationPipelineKey {
  const value = (readArgument("--pipeline") ?? "sales").toLowerCase();
  if (value !== "sales" && value !== "realization" && value !== "complaints") {
    throw new Error("--pipeline musi mieć wartość sales, realization albo complaints.");
  }
  return value;
}

function readRequiredArgument(name: string): string {
  const value = readArgument(name);
  if (!value) throw new Error(`Brak wymaganego argumentu ${name}.`);
  return value;
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
