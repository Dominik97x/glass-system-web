import path from "node:path";
import { MOONGLASS_BLUEPRINT, getUserFieldName } from "./blueprint";
import {
  getAutomationRules,
  MOONGLASS_AUTOMATION_BLUEPRINT_VERSION,
  type AutomationPipelineKey,
  type AutomationProfile,
  type AutomationRuleBlueprint,
} from "./automation-blueprint";
import { ProvisionerBitrixClient } from "./client";
import type { ProvisionerEnv } from "./env";
import { writeJson, writeText } from "./io";
import { Bitrix24Provisioner } from "./provisioner";
import type { BitrixCategory, BitrixStatus, PortalAudit } from "./types";

const AUDIT_JSON = "automation-audit.json";
const AUDIT_MD = "automation-audit.md";
const PLAN_JSON = "automation-plan.json";
const PLAN_MD = "automation-plan.md";
const CHECKLIST_MD = "automation-checklist.md";
const TEST_JSON = "automation-test.json";
const TEST_MD = "automation-test.md";

interface AutomationCapability {
  method: string;
  exists: boolean;
  usableWithIncomingWebhook: boolean;
  purpose: string;
  note?: string;
}

export interface AutomationAuditReport {
  generatedAt: string;
  portalHost: string;
  blueprintVersion: string;
  authMode: "incoming_webhook";
  nativeAutomationApplySupported: false;
  baseProvisioningOk: boolean;
  missingStructuralItems: number;
  categories: Array<{ key: string; id: number; name: string }>;
  stageCount: number;
  requiredFieldCount: number;
  capabilities: AutomationCapability[];
  warnings: string[];
}

interface ResolvedAutomationRule extends AutomationRuleBlueprint {
  pipelineName: string;
  categoryId: number;
  stageName: string;
  stageId: string;
  resolvedConditions: Array<{
    field: string;
    technicalFieldName: string;
    operator: string;
    value?: string;
  }>;
  resolvedTimingField?: string;
}

export interface AutomationPlanReport {
  generatedAt: string;
  portalHost: string;
  blueprintVersion: string;
  profile: AutomationProfile;
  nativeAutomationApplySupported: false;
  rules: ResolvedAutomationRule[];
  counts: {
    total: number;
    sales: number;
    realization: number;
    complaints: number;
    p0: number;
    p1: number;
    p2: number;
  };
  setupOrder: string[];
  importantDecisions: string[];
}

interface ProfileResult {
  ID?: number | string;
  NAME?: string;
  LAST_NAME?: string;
  EMAIL?: string;
}

interface DuplicateSearchResult {
  CONTACT?: Array<number | string>;
}

export interface AutomationTestReport {
  generatedAt: string;
  portalHost: string;
  pipeline: AutomationPipelineKey;
  stageCode: string;
  stageName: string;
  stageId: string;
  dealId: number;
  contactId: number;
  title: string;
  dealUrl: string;
  expectedImmediateRules: string[];
  inspectionInstructions: string[];
}

export class Bitrix24AutomationPlanner {
  private readonly client: ProvisionerBitrixClient;
  private readonly provisioner: Bitrix24Provisioner;

  constructor(
    private readonly cwd: string,
    private readonly env: ProvisionerEnv
  ) {
    this.client = new ProvisionerBitrixClient(
      env.webhookUrl,
      env.requestTimeoutMs,
      env.retryCount
    );
    this.provisioner = new Bitrix24Provisioner(cwd, env);
  }

  async audit(): Promise<AutomationAuditReport> {
    const verification = await this.provisioner.verify();
    const portal = await this.provisioner.audit();

    const methodPurposes: Array<[string, string, boolean, string?]> = [
      ["crm.deal.add", "Tworzenie testowych Deali do kontroli automatyzacji", true],
      ["crm.activity.list", "Odczyt aktywności powiązanych z Dealem", true],
      ["tasks.task.list", "Opcjonalny odczyt zadań, jeśli webhook otrzyma zakres tasks", true],
      [
        "bizproc.robot.add",
        "Rejestracja własnego robota aplikacji",
        false,
        "Metoda wymaga kontekstu zainstalowanej aplikacji OAuth; incoming webhook nie może jej użyć.",
      ],
      [
        "bizproc.workflow.template.add",
        "Import gotowego szablonu procesu biznesowego .bpt",
        false,
        "Szablon musi wcześniej powstać w projektancie, a metoda jest wiązana z aplikacją.",
      ],
      [
        "crm.automation.trigger.add",
        "Rejestracja wyzwalacza aplikacji",
        false,
        "Wyzwalacze aplikacji nie tworzą standardowych robotów Bitrix24 w kolumnach lejka.",
      ],
    ];

    const capabilities: AutomationCapability[] = [];
    for (const [method, purpose, usableWithIncomingWebhook, note] of methodPurposes) {
      let exists = false;
      try {
        exists = await this.client.isMethodAvailable(method);
      } catch {
        exists = false;
      }
      capabilities.push({ method, exists, usableWithIncomingWebhook, purpose, note });
    }

    const categories = resolveCategories(portal);
    const requiredFields = collectRequiredFields();
    const warnings: string[] = [];
    if (!verification.ok) {
      warnings.push(
        `Konfiguracja bazowa Bitrix24 ma ${verification.remainingActions.length} brakujących działań. Najpierw uruchom npm run bitrix:verify.`
      );
    }
    if (!capabilities.find((item) => item.method === "tasks.task.list")?.exists) {
      warnings.push(
        "Webhook prawdopodobnie nie ma zakresu tasks. Nie blokuje to działania natywnych robotów, ale skrypt nie odczyta zadań w teście automatyzacji."
      );
    }

    const report: AutomationAuditReport = {
      generatedAt: new Date().toISOString(),
      portalHost: this.client.portalHost,
      blueprintVersion: MOONGLASS_AUTOMATION_BLUEPRINT_VERSION,
      authMode: "incoming_webhook",
      nativeAutomationApplySupported: false,
      baseProvisioningOk: verification.ok,
      missingStructuralItems: verification.remainingActions.length,
      categories,
      stageCount: Object.values(portal.stagesByEntityId).reduce(
        (sum, stages) => sum + stages.length,
        0
      ),
      requiredFieldCount: requiredFields.length,
      capabilities,
      warnings,
    };

    writeJson(path.join(this.env.reportDir, AUDIT_JSON), report);
    writeText(path.join(this.env.reportDir, AUDIT_MD), renderAuditMarkdown(report));
    return report;
  }

  async plan(profile: AutomationProfile): Promise<AutomationPlanReport> {
    const verification = await this.provisioner.verify();
    if (!verification.ok) {
      throw new Error(
        `Konfiguracja bazowa Bitrix24 nie jest kompletna. Pozostałe działania: ${verification.remainingActions.length}. Najpierw uruchom npm run bitrix:verify.`
      );
    }

    const portal = await this.provisioner.audit();
    const rules = getAutomationRules(profile).map((rule) =>
      resolveRule(rule, portal)
    );

    const report: AutomationPlanReport = {
      generatedAt: new Date().toISOString(),
      portalHost: this.client.portalHost,
      blueprintVersion: MOONGLASS_AUTOMATION_BLUEPRINT_VERSION,
      profile,
      nativeAutomationApplySupported: false,
      rules,
      counts: {
        total: rules.length,
        sales: rules.filter((rule) => rule.pipeline === "sales").length,
        realization: rules.filter((rule) => rule.pipeline === "realization").length,
        complaints: rules.filter((rule) => rule.pipeline === "complaints").length,
        p0: rules.filter((rule) => rule.priority === "P0").length,
        p1: rules.filter((rule) => rule.priority === "P1").length,
        p2: rules.filter((rule) => rule.priority === "P2").length,
      },
      setupOrder: [
        "Najpierw skonfiguruj profil starter i wyłącznie reguły P0.",
        "Przetestuj Nowe zapytanie, Pomiar do umówienia, Oferta wysłana oraz W realizacji.",
        "Następnie dodaj reguły P1 z profilu full.",
        "Tunel sprzedażowy ustaw jako Przenieś, nigdy Kopiuj.",
        "Automatyzacje komunikacji zewnętrznej (e-mail/SMS) dodaj dopiero po podłączeniu firmowej skrzynki i zatwierdzeniu treści.",
      ],
      importantDecisions: [
        "Natywnych robotów Bitrix24 nie można zainstalować przez obecny incoming webhook. Muszą zostać dodane w interfejsie Automatyzacja albo przez zainstalowaną aplikację OAuth.",
        "W obecnym małym zespole zadania i aktywności przypisujemy do osoby odpowiedzialnej za Deal, bez sztywnych ID użytkowników.",
        "Wygrany Deal jest przenoszony do lejka realizacji. Kopiowanie utworzyłoby dwa Deale z tym samym ID zapytania MoonGlass i mogłoby powodować konflikt synchronizacji.",
      ],
    };

    writeJson(path.join(this.env.reportDir, PLAN_JSON), report);
    writeText(path.join(this.env.reportDir, PLAN_MD), renderPlanMarkdown(report));
    writeText(
      path.join(this.env.reportDir, CHECKLIST_MD),
      renderChecklistMarkdown(report)
    );
    return report;
  }

  async createTestDeal(
    pipeline: AutomationPipelineKey,
    stageCode: string,
    confirmValue: string | undefined
  ): Promise<AutomationTestReport> {
    if (confirmValue !== "MOONGLASS-AUTOMATION-TEST") {
      throw new Error(
        "Test tworzy prawdziwy Deal i wymaga potwierdzenia: --confirm=MOONGLASS-AUTOMATION-TEST"
      );
    }

    const portal = await this.provisioner.audit();
    const pipelineBlueprint = MOONGLASS_BLUEPRINT.pipelines.find(
      (item) => item.key === pipeline
    );
    if (!pipelineBlueprint) {
      throw new Error(`Nieznany lejek: ${pipeline}`);
    }
    const stageBlueprint = pipelineBlueprint.stages.find(
      (item) => item.code === stageCode
    );
    if (!stageBlueprint) {
      throw new Error(`Nieznany etap ${pipeline}.${stageCode}`);
    }

    const category = resolveCategory(portal, pipeline);
    const stage = resolveStage(portal, category.id, stageBlueprint.name);
    const contactId = await this.ensureAutomationTestContact();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const title = `[TEST D5] ${stageBlueprint.name} — ${timestamp}`;
    const fields: Record<string, unknown> = {
      TITLE: title,
      CATEGORY_ID: category.id,
      STAGE_ID: stage.STATUS_ID,
      CONTACT_ID: contactId,
      CURRENCY_ID: "PLN",
      OPPORTUNITY: 12345,
      COMMENTS:
        "Deal testowy D5. Sprawdź w osi czasu, czy roboty przypisane do etapu utworzyły oczekiwane zadania/aktywności.",
      [getUserFieldByAlias("MG_WEB_INQUIRY_ID")]: `D5-AUTO-TEST-${timestamp}`,
      [getUserFieldByAlias("MG_LOCAL_LEAD_ID")]: `D5-AUTO-TEST-${timestamp}`,
    };

    const now = new Date();
    if (stageCode === "MG_MEASSET") {
      fields[getUserFieldByAlias("MG_MEASUREMENT_AT")] = new Date(
        now.getTime() + 2 * 24 * 60 * 60 * 1000
      ).toISOString();
    }
    if (stageCode === "MG_DELAYTIME" || stageCode === "MG_DELAYCASH" || stageCode === "MG_PAUSED") {
      fields[getUserFieldByAlias("MG_DEFERRED_UNTIL")] = new Date(
        now.getTime() + 2 * 24 * 60 * 60 * 1000
      ).toISOString().slice(0, 10);
    }
    if (stageCode === "MG_TEAMDATE") {
      fields[getUserFieldByAlias("MG_INSTALLATION_FROM")] = new Date(
        now.getTime() + 2 * 24 * 60 * 60 * 1000
      ).toISOString().slice(0, 10);
    }
    if (stageCode === "MG_FIXDATE") {
      fields[getUserFieldByAlias("MG_NEXT_VISIT_AT")] = new Date(
        now.getTime() + 2 * 24 * 60 * 60 * 1000
      ).toISOString();
    }

    const response = await this.client.call<number | string>("crm.deal.add", {
      fields,
    });
    const dealId = Number(response);
    if (!Number.isFinite(dealId)) {
      throw new Error("Bitrix24 nie zwrócił ID testowego Deala.");
    }

    const immediateRules = getAutomationRules("full")
      .filter(
        (rule) =>
          rule.pipeline === pipeline &&
          rule.stageCode === stageCode &&
          rule.timing.mode === "immediately"
      )
      .map((rule) => `${rule.id}: ${rule.name}`);

    const report: AutomationTestReport = {
      generatedAt: new Date().toISOString(),
      portalHost: this.client.portalHost,
      pipeline,
      stageCode,
      stageName: stageBlueprint.name,
      stageId: String(stage.STATUS_ID),
      dealId,
      contactId,
      title,
      dealUrl: `https://${this.client.portalHost}/crm/deal/details/${dealId}/`,
      expectedImmediateRules: immediateRules,
      inspectionInstructions: [
        "Otwórz Deal i sprawdź zakładkę Automatyzacja oraz oś czasu.",
        "Potwierdź, że każde oczekiwane zadanie/aktywność powstało tylko raz.",
        "Sprawdź osobę odpowiedzialną i termin wykonania.",
        "Po teście oznacz Deal jako Przegrany — duplikat/test albo usuń go ręcznie.",
      ],
    };

    writeJson(path.join(this.env.reportDir, TEST_JSON), report);
    writeText(path.join(this.env.reportDir, TEST_MD), renderTestMarkdown(report));
    return report;
  }

  private async ensureAutomationTestContact(): Promise<number> {
    const email = "bitrix-d5-test@moonglass.pl";
    const duplicate = await this.client.call<DuplicateSearchResult>(
      "crm.duplicate.findbycomm",
      {
        entity_type: "CONTACT",
        type: "EMAIL",
        values: [email],
      }
    );
    const existingId = Number(duplicate.CONTACT?.[0]);
    if (Number.isFinite(existingId)) return existingId;

    const profile = await this.client.call<ProfileResult>("profile");
    const created = await this.client.call<number | string>(
      "crm.contact.add",
      {
        fields: {
          NAME: "Automatyzacja",
          LAST_NAME: "Test D5",
          OPENED: "N",
          EMAIL: [{ VALUE: email, VALUE_TYPE: "WORK" }],
          PHONE: [{ VALUE: "+48500000005", VALUE_TYPE: "WORK" }],
          COMMENTS: `Kontakt testowy automatyzacji D5. Utworzony przez ${[
            profile.NAME,
            profile.LAST_NAME,
          ]
            .filter(Boolean)
            .join(" ") || profile.EMAIL || "administratora"}.`,
        },
      }
    );
    const id = Number(created);
    if (!Number.isFinite(id)) {
      throw new Error("Bitrix24 nie zwrócił ID kontaktu testowego D5.");
    }
    return id;
  }
}

function collectRequiredFields(): string[] {
  const aliases = new Set<string>();
  for (const rule of MOONGLASS_AUTOMATION_RULES_ALL()) {
    if (rule.timing.fieldAlias) aliases.add(rule.timing.fieldAlias);
    for (const condition of rule.conditions ?? []) aliases.add(condition.field);
  }
  return [...aliases].sort();
}

function MOONGLASS_AUTOMATION_RULES_ALL(): AutomationRuleBlueprint[] {
  const byId = new Map<string, AutomationRuleBlueprint>();
  for (const profile of ["starter", "full"] as const) {
    for (const rule of getAutomationRules(profile)) byId.set(rule.id, rule);
  }
  return [...byId.values()];
}

function resolveCategories(portal: PortalAudit): Array<{ key: string; id: number; name: string }> {
  return (["sales", "realization", "complaints"] as const).map((key) => {
    const category = resolveCategory(portal, key);
    return { key, id: category.id, name: category.name };
  });
}

function resolveCategory(
  portal: PortalAudit,
  pipelineKey: AutomationPipelineKey
): BitrixCategory {
  const blueprint = MOONGLASS_BLUEPRINT.pipelines.find(
    (item) => item.key === pipelineKey
  );
  if (!blueprint) throw new Error(`Brak lejka w blueprint: ${pipelineKey}`);
  const category = portal.categories.find(
    (item) => normalize(item.name) === normalize(blueprint.name)
  );
  if (!category) throw new Error(`Nie znaleziono lejka „${blueprint.name}”.`);
  return category;
}

function resolveStage(
  portal: PortalAudit,
  categoryId: number,
  stageName: string
): BitrixStatus {
  const entityId = categoryId === 0 ? "DEAL_STAGE" : `DEAL_STAGE_${categoryId}`;
  const stage = (portal.stagesByEntityId[entityId] ?? []).find(
    (item) => normalize(item.NAME ?? "") === normalize(stageName)
  );
  if (!stage) {
    throw new Error(`Nie znaleziono etapu „${stageName}” w ${entityId}.`);
  }
  return stage;
}

function resolveRule(
  rule: AutomationRuleBlueprint,
  portal: PortalAudit
): ResolvedAutomationRule {
  const pipeline = MOONGLASS_BLUEPRINT.pipelines.find(
    (item) => item.key === rule.pipeline
  );
  if (!pipeline) throw new Error(`Brak lejka ${rule.pipeline}.`);
  const stageBlueprint = pipeline.stages.find(
    (item) => item.code === rule.stageCode
  );
  if (!stageBlueprint) {
    throw new Error(`Brak etapu ${rule.pipeline}.${rule.stageCode}.`);
  }
  const category = resolveCategory(portal, rule.pipeline);
  const stage = resolveStage(portal, category.id, stageBlueprint.name);

  return {
    ...rule,
    pipelineName: pipeline.name,
    categoryId: category.id,
    stageName: stageBlueprint.name,
    stageId: String(stage.STATUS_ID),
    resolvedConditions: (rule.conditions ?? []).map((condition) => ({
      ...condition,
      technicalFieldName: getUserFieldByAlias(condition.field),
    })),
    resolvedTimingField: rule.timing.fieldAlias
      ? getUserFieldByAlias(rule.timing.fieldAlias)
      : undefined,
  };
}

function getUserFieldByAlias(alias: string): string {
  const field = MOONGLASS_BLUEPRINT.userFields.find(
    (item) => item.entity === "deal" && item.alias === alias
  );
  if (!field) throw new Error(`Brak pola Deal.${alias} w blueprint.`);
  return getUserFieldName(field);
}

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("pl-PL");
}

function renderAuditMarkdown(report: AutomationAuditReport): string {
  const lines = [
    "# D5 — audyt możliwości automatyzacji Bitrix24",
    "",
    `- Portal: \`${report.portalHost}\``,
    `- Wersja blueprintu: \`${report.blueprintVersion}\``,
    `- Konfiguracja bazowa: **${report.baseProvisioningOk ? "OK" : "NIEKOMPLETNA"}**`,
    `- Lejki: ${report.categories.map((item) => `${item.name} (#${item.id})`).join(", ")}`,
    `- Etapy odczytane: ${report.stageCount}`,
    "",
    "## Najważniejszy wniosek",
    "",
    "Portal jest połączony przez incoming webhook. Ten typ autoryzacji może tworzyć i aktualizować dane CRM, ale nie może instalować natywnych robotów CRM ani szablonów procesów biznesowych wymagających kontekstu aplikacji OAuth. Dlatego D5 generuje dokładny plan i checklistę konfiguracji w interfejsie Bitrix24 oraz narzędzie do tworzenia testowych Deali.",
    "",
    "## Metody",
    "",
    "| Metoda | Istnieje | Incoming webhook | Zastosowanie |",
    "|---|---:|---:|---|",
    ...report.capabilities.map(
      (item) =>
        `| \`${item.method}\` | ${item.exists ? "tak" : "nie/ukryta"} | ${
          item.usableWithIncomingWebhook ? "tak" : "nie"
        } | ${item.purpose}${item.note ? ` — ${item.note}` : ""} |`
    ),
  ];

  if (report.warnings.length) {
    lines.push("", "## Ostrzeżenia", "", ...report.warnings.map((item) => `- ${item}`));
  }
  return `${lines.join("\n")}\n`;
}

function renderPlanMarkdown(report: AutomationPlanReport): string {
  const lines = [
    `# D5 — plan automatyzacji Bitrix24 (${report.profile})`,
    "",
    `- Portal: \`${report.portalHost}\``,
    `- Blueprint: \`${report.blueprintVersion}\``,
    `- Reguły: **${report.counts.total}**`,
    `- Sprzedaż: ${report.counts.sales}, realizacja: ${report.counts.realization}, reklamacje: ${report.counts.complaints}`,
    `- Priorytety: P0=${report.counts.p0}, P1=${report.counts.p1}, P2=${report.counts.p2}`,
    "",
    "> Reguły należy dodać w interfejsie CRM → Deale → Automatyzacja. Incoming webhook nie ma prawa instalować natywnych robotów. Plan zawiera rzeczywiste nazwy lejków, etapów i techniczne nazwy pól odczytane z konfiguracji MoonGlass.",
    "",
    "## Kolejność wdrożenia",
    "",
    ...report.setupOrder.map((item, index) => `${index + 1}. ${item}`),
    "",
    "## Decyzje architektoniczne",
    "",
    ...report.importantDecisions.map((item) => `- ${item}`),
  ];

  for (const pipeline of ["sales", "realization", "complaints"] as const) {
    const pipelineRules = report.rules.filter((rule) => rule.pipeline === pipeline);
    if (!pipelineRules.length) continue;
    lines.push("", `## ${pipelineRules[0].pipelineName}`, "");
    for (const rule of pipelineRules) {
      lines.push(
        `### ${rule.id} — ${rule.name}`,
        "",
        `- Priorytet: **${rule.priority}**`,
        `- Etap: **${rule.stageName}** (\`${rule.stageId}\`)`,
        `- Typ: \`${rule.kind}\``,
        `- Uruchomienie: ${renderTiming(rule)}`,
        `- Wykonanie: ${rule.execution === "parallel" ? "niezależnie/równolegle" : "kolejno po poprzedniej regule"}`
      );
      if (rule.resolvedConditions.length) {
        lines.push(
          `- Warunki: ${rule.resolvedConditions
            .map(
              (condition) =>
                `\`${condition.technicalFieldName}\` ${condition.operator}${
                  condition.value ? ` ${condition.value}` : ""
                }`
            )
            .join("; ")}`
        );
      }
      lines.push("", "**Ustawienia:**", "", "```json", JSON.stringify(rule.settings, null, 2), "```", "", "**Test akceptacyjny:**", "", ...rule.acceptance.map((item) => `- ${item}`));
      if (rule.notes?.length) {
        lines.push("", "**Uwagi:**", "", ...rule.notes.map((item) => `- ${item}`));
      }
      lines.push("");
    }
  }
  return `${lines.join("\n")}\n`;
}

function renderChecklistMarkdown(report: AutomationPlanReport): string {
  const lines = [
    `# D5 — checklista konfiguracji (${report.profile})`,
    "",
    "Każdą pozycję zaznacz dopiero po zapisaniu robota i wykonaniu testu akceptacyjnego.",
    "",
  ];
  let currentPipeline = "";
  let currentStage = "";
  for (const rule of report.rules) {
    if (rule.pipelineName !== currentPipeline) {
      currentPipeline = rule.pipelineName;
      currentStage = "";
      lines.push(`## ${currentPipeline}`, "");
    }
    if (rule.stageName !== currentStage) {
      currentStage = rule.stageName;
      lines.push(`### ${currentStage}`, "");
    }
    lines.push(`- [ ] **${rule.id}** ${rule.name} (${rule.priority})`);
  }
  lines.push(
    "",
    "## Testy końcowe",
    "",
    "- [ ] Nowe zapytanie tworzy aktywność i zadanie tylko raz.",
    "- [ ] Pomiar do umówienia tworzy zadanie z poprawnym terminem.",
    "- [ ] Oferta wysłana planuje kontakt po dwóch dniach roboczych.",
    "- [ ] Wygrany Deal jest przenoszony, a nie kopiowany, do 02 Realizacja.",
    "- [ ] W realizacji powstaje zadanie kontroli kompletu dokumentów.",
    "- [ ] Zamknięcie procesu kończy otwarte zadania robotów.",
    "- [ ] Automatyzacje nie wysyłają wiadomości do klientów testowych.",
    ""
  );
  return lines.join("\n");
}

function renderTiming(rule: ResolvedAutomationRule): string {
  const timing = rule.timing;
  if (timing.mode === "immediately") return "natychmiast";
  if (timing.mode === "after") {
    return `po ${timing.value} ${timing.unit ?? ""}${
      timing.respectBusinessHours ? ", z uwzględnieniem godzin pracy" : ""
    }`;
  }
  if (timing.mode === "before_field") {
    return `${timing.value} ${timing.unit ?? ""} przed polem \`${
      rule.resolvedTimingField
    }\``;
  }
  return `w terminie z pola \`${rule.resolvedTimingField}\``;
}

function renderTestMarkdown(report: AutomationTestReport): string {
  return `${[
    "# D5 — test automatyzacji",
    "",
    `- Portal: \`${report.portalHost}\``,
    `- Deal: #${report.dealId}`,
    `- Tytuł: ${report.title}`,
    `- Lejek/etap: ${report.pipeline} / ${report.stageName}`,
    `- Link: ${report.dealUrl}`,
    "",
    "## Oczekiwane roboty natychmiastowe",
    "",
    ...(report.expectedImmediateRules.length
      ? report.expectedImmediateRules.map((item) => `- ${item}`)
      : ["- Brak reguł natychmiastowych w blueprintcie dla tego etapu."]),
    "",
    "## Kontrola",
    "",
    ...report.inspectionInstructions.map((item) => `- ${item}`),
    "",
  ].join("\n")}\n`;
}
