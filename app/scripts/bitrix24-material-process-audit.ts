import path from "node:path";
import { ProvisionerBitrixClient } from "./bitrix24/client";
import { loadProvisionerEnv } from "./bitrix24/env";
import { writeJson } from "./bitrix24/io";

const TARGET_CATEGORY_NAME = "02 Realizacja";
const TARGET_FIELD_CODE = "UF_CRM_DEAL_MG_MATERIAL_STATUS";

type AnyRecord = Record<string, any>;

async function main(): Promise<void> {
  const env = loadProvisionerEnv();
  const client = new ProvisionerBitrixClient(
    env.webhookUrl,
    env.requestTimeoutMs,
    env.retryCount
  );

  const categoriesRaw = await client.call<any>("crm.category.list", {
    entityTypeId: 2,
  });

  const categories: AnyRecord[] =
    categoriesRaw?.categories ??
    categoriesRaw?.items ??
    (Array.isArray(categoriesRaw) ? categoriesRaw : []);

  const category = categories.find(
    (item) => normalize(item.name) === normalize(TARGET_CATEGORY_NAME)
  );

  if (!category) {
    throw new Error(`Nie znaleziono lejka „${TARGET_CATEGORY_NAME}”.`);
  }

  const categoryId = Number(category.id);
  const stageEntityId = categoryId === 0 ? "DEAL_STAGE" : `DEAL_STAGE_${categoryId}`;

  const stagesRaw = await client.call<any>("crm.status.list", {
    filter: { ENTITY_ID: stageEntityId },
    order: { SORT: "ASC" },
  });

  const stages: AnyRecord[] =
    stagesRaw?.result ??
    stagesRaw?.items ??
    (Array.isArray(stagesRaw) ? stagesRaw : []);

  const dealFieldsRaw = await client.call<any>("crm.deal.fields", {});
  const dealFields: AnyRecord = dealFieldsRaw?.result ?? dealFieldsRaw ?? {};
  const materialField: AnyRecord | undefined = dealFields[TARGET_FIELD_CODE];

  const report = {
    generatedAt: new Date().toISOString(),
    category: {
      id: categoryId,
      name: category.name,
      stageEntityId,
    },
    stages: stages.map((stage) => ({
      id: stage.STATUS_ID ?? stage.id,
      name: stage.NAME ?? stage.name,
      sort: Number(stage.SORT ?? stage.sort ?? 0),
      semantics: stage.SEMANTICS ?? stage.semantics ?? null,
    })),
    materialStatus: materialField
      ? {
          found: true,
          code: TARGET_FIELD_CODE,
          title:
            materialField.formLabel ??
            materialField.listLabel ??
            materialField.title ??
            materialField.FORM_LABEL ??
            materialField.LIST_COLUMN_LABEL ??
            null,
          type:
            materialField.type ??
            materialField.userTypeId ??
            materialField.USER_TYPE_ID ??
            null,
          required:
            materialField.isRequired ??
            materialField.required ??
            materialField.MANDATORY ??
            null,
          values: extractItems(materialField),
          raw: materialField,
        }
      : {
          found: false,
          code: TARGET_FIELD_CODE,
          title: null,
          type: null,
          required: null,
          values: [],
          raw: null,
        },
  };

  writeJson(path.join(env.reportDir, "material-process-audit.json"), report);

  console.log("MoonGlass — audyt procesu materiałowego v2 (READ-ONLY)");
  console.log(`Lejek: ${report.category.name} (#${report.category.id})`);
  console.log(`Etapy: ${report.stages.length}`);
  for (const stage of report.stages) {
    console.log(`- ${stage.name} [${stage.id}]`);
  }

  console.log();
  console.log(`Pole: ${TARGET_FIELD_CODE}`);
  console.log(`Znalezione: ${report.materialStatus.found ? "TAK" : "NIE"}`);

  if (report.materialStatus.found) {
    console.log(`Nazwa: ${report.materialStatus.title ?? "(brak w odpowiedzi)"}`);
    console.log(`Typ: ${report.materialStatus.type ?? "(brak w odpowiedzi)"}`);
    console.log("Wartości:");
    if (report.materialStatus.values.length === 0) {
      console.log("- brak wartości listy w odpowiedzi API");
    } else {
      for (const item of report.materialStatus.values) {
        console.log(`- ${item.value}${item.id ? ` [${item.id}]` : ""}`);
      }
    }
  }

  console.log();
  console.log(`Raport: ${path.join(env.reportDir, "material-process-audit.json")}`);
  console.log("TRYB READ-ONLY — nic nie zapisano w Bitrix24.");
}

function extractItems(field: AnyRecord): Array<{ id?: string; value: string }> {
  const candidates = [field.items, field.ITEMS, field.list, field.LIST];
  const items = candidates.find(Array.isArray) as AnyRecord[] | undefined;
  if (!items) return [];

  return items
    .map((item) => ({
      id: String(item.ID ?? item.id ?? item.VALUE_ID ?? "") || undefined,
      value: String(item.VALUE ?? item.value ?? item.NAME ?? item.name ?? "").trim(),
    }))
    .filter((item) => item.value.length > 0);
}

function normalize(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
