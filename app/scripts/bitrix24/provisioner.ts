import path from "node:path";
import { MOONGLASS_BLUEPRINT, getEntityId, getUserFieldName, getUserFieldXmlId } from "./blueprint";
import { Bitrix24RestError, ProvisionerBitrixClient } from "./client";
import type { ProvisionerEnv } from "./env";
import { buildPilotProducts } from "./pilot-products";
import { fileExists, readJson, writeJson, writeText } from "./io";
import type {
  BitrixCatalog,
  BitrixCatalogSection,
  BitrixCategory,
  BitrixProduct,
  BitrixStatus,
  BitrixUserField,
  PipelineBlueprint,
  PlanAction,
  PortalAudit,
  ProductBlueprint,
  ProvisioningMapping,
  ProvisioningPlan,
  StageBlueprint,
  UserFieldBlueprint,
} from "./types";

const AUDIT_FILE = "audit.json";
const PLAN_FILE = "plan.json";
const PLAN_MD_FILE = "plan.md";
const MAPPING_FILE = "mapping.generated.json";
const VERIFY_FILE = "verify.json";

const methodChecks = [
  "crm.category.list",
  "crm.category.add",
  "crm.category.update",
  "crm.status.list",
  "crm.status.add",
  "crm.status.update",
  "crm.item.list",
  "userfieldconfig.list",
  "userfieldconfig.add",
  "catalog.catalog.list",
  "catalog.section.list",
  "catalog.section.add",
  "catalog.section.update",
  "catalog.product.list",
  "catalog.product.add",
  "catalog.product.update",
  "catalog.priceType.list",
  "catalog.price.list",
  "catalog.price.add",
  "catalog.price.update",
];

export class Bitrix24Provisioner {
  private readonly client: ProvisionerBitrixClient;

  constructor(
    private readonly cwd: string,
    private readonly env: ProvisionerEnv
  ) {
    this.client = new ProvisionerBitrixClient(
      env.webhookUrl,
      env.requestTimeoutMs,
      env.retryCount
    );
  }

  async audit(): Promise<PortalAudit> {
    const warnings: string[] = [];
    const availableMethods: Record<string, boolean> = {};

    for (const method of methodChecks) {
      try {
        availableMethods[method] = await this.client.isMethodAvailable(method);
      } catch (error) {
        availableMethods[method] = false;
        warnings.push(`Nie udało się sprawdzić metody ${method}: ${formatError(error)}`);
      }
    }

    const categories = await this.client.call<{ categories?: BitrixCategory[] }>(
      "crm.category.list",
      { entityTypeId: MOONGLASS_BLUEPRINT.dealEntityTypeId }
    ).then((result) => result.categories ?? []);

    const stagesByEntityId: Record<string, BitrixStatus[]> = {};
    const categoryDealCounts: Record<string, number> = {};

    for (const category of categories) {
      const entityId = stageEntityId(category.id);
      stagesByEntityId[entityId] = await this.client.call<BitrixStatus[]>(
        "crm.status.list",
        { filter: { ENTITY_ID: entityId }, order: { SORT: "ASC" } }
      );

      try {
        const page = await this.client.callWithMeta<{ items?: unknown[] }>(
          "crm.item.list",
          {
            entityTypeId: MOONGLASS_BLUEPRINT.dealEntityTypeId,
            select: ["id"],
            filter: { categoryId: category.id },
            start: 0,
          }
        );
        categoryDealCounts[String(category.id)] = page.total ?? page.result?.items?.length ?? 0;
      } catch (error) {
        categoryDealCounts[String(category.id)] = -1;
        warnings.push(
          `Nie udało się policzyć Deali w lejku ${category.name}: ${formatError(error)}`
        );
      }
    }

    const sources = await this.client.call<BitrixStatus[]>("crm.status.list", {
      filter: { ENTITY_ID: "SOURCE" },
      order: { SORT: "ASC" },
    });

    const userFields = await this.safeListUserFields(warnings);
    const catalogs = await this.safeListCatalogs(warnings);
    const iblockId = chooseCatalogIblockId(catalogs);
    const sections = iblockId
      ? await this.safeListSections(iblockId, warnings)
      : [];
    const products = iblockId
      ? await this.safeListProducts(iblockId, warnings)
      : [];

    const audit: PortalAudit = {
      generatedAt: new Date().toISOString(),
      portalHost: this.client.portalHost,
      availableMethods,
      categories,
      categoryDealCounts,
      stagesByEntityId,
      sources,
      userFields,
      catalogs,
      sections,
      products,
      warnings,
    };

    writeJson(this.reportPath(AUDIT_FILE), audit);
    return audit;
  }

  async plan(audit?: PortalAudit): Promise<ProvisioningPlan> {
    const currentAudit = audit ?? (await this.getOrCreateAudit());
    const actions: PlanAction[] = [];

    const categoryByKey = resolveCategories(currentAudit.categories);

    for (const pipeline of MOONGLASS_BLUEPRINT.pipelines) {
      const category = findCategoryForPipeline(pipeline, currentAudit.categories);
      if (!category) {
        actions.push({
          kind: "create",
          resource: "pipeline",
          key: pipeline.key,
          message: `Utworzyć lejek „${pipeline.name}”.`,
        });
        for (const stage of pipeline.stages) {
          actions.push({
            kind: "create",
            resource: "stage",
            key: `${pipeline.key}.${stage.code}`,
            message: `Utworzyć etap „${stage.name}” po utworzeniu lejka.`,
          });
        }
        continue;
      }

      categoryByKey[pipeline.key] = category;
      if (category.name !== pipeline.name || Number(category.sort ?? 500) !== pipeline.sort) {
        actions.push({
          kind: "update",
          resource: "pipeline",
          key: pipeline.key,
          message: `Ustawić lejek ${category.id} jako „${pipeline.name}” i sortowanie ${pipeline.sort}.`,
          details: { categoryId: category.id, currentName: category.name },
        });
      } else {
        actions.push({
          kind: "reuse",
          resource: "pipeline",
          key: pipeline.key,
          message: `Lejek „${pipeline.name}” już istnieje.`,
          details: { categoryId: category.id },
        });
      }

      actions.push(
        ...planStages(
          pipeline,
          category,
          currentAudit.stagesByEntityId[stageEntityId(category.id)] ?? [],
          currentAudit.categoryDealCounts[String(category.id)] === 0
        )
      );
    }

    for (const source of MOONGLASS_BLUEPRINT.sources) {
      const existing = currentAudit.sources.find(
        (item) => item.STATUS_ID === source.code || normalize(item.NAME) === normalize(source.name)
      );
      if (!existing) {
        actions.push({
          kind: "create",
          resource: "source",
          key: source.code,
          message: `Utworzyć źródło „${source.name}”.`,
        });
      } else if (
        existing.NAME !== source.name ||
        Number(existing.SORT ?? 0) !== source.sort
      ) {
        actions.push({
          kind: "update",
          resource: "source",
          key: source.code,
          message: `Zaktualizować źródło „${source.name}”.`,
          details: { id: existing.ID, statusId: existing.STATUS_ID },
        });
      } else {
        actions.push({
          kind: "reuse",
          resource: "source",
          key: source.code,
          message: `Źródło „${source.name}” już istnieje.`,
        });
      }
    }

    for (const field of MOONGLASS_BLUEPRINT.userFields) {
      const fieldName = getUserFieldName(field);
      const xmlId = getUserFieldXmlId(field);
      const existing = currentAudit.userFields.find(
        (item) => item.fieldName === fieldName || item.xmlId === xmlId
      );
      if (!existing) {
        actions.push({
          kind: "create",
          resource: "user_field",
          key: `${field.entity}.${field.alias}`,
          message: `Utworzyć pole „${field.label}” (${fieldName}).`,
          details: { type: field.type },
        });
      } else if (existing.userTypeId !== field.type) {
        actions.push({
          kind: "warning",
          resource: "user_field",
          key: `${field.entity}.${field.alias}`,
          message: `Pole ${fieldName} istnieje, ale ma typ ${existing.userTypeId}, oczekiwano ${field.type}. Skrypt go nie zmieni automatycznie.`,
          details: { id: existing.id },
        });
      } else {
        actions.push({
          kind: "reuse",
          resource: "user_field",
          key: `${field.entity}.${field.alias}`,
          message: `Pole „${field.label}” już istnieje.`,
          details: { id: existing.id, fieldName: existing.fieldName },
        });
      }
    }

    const iblockId = chooseCatalogIblockId(currentAudit.catalogs);
    if (!iblockId) {
      actions.push({
        kind: "warning",
        resource: "portal",
        key: "catalog",
        message: "Nie znaleziono katalogu handlowego. Sekcje i produkty nie zostaną utworzone, dopóki katalog CRM nie będzie dostępny.",
      });
    } else {
      for (const section of MOONGLASS_BLUEPRINT.catalogSections) {
        const existing = currentAudit.sections.find(
          (item) => item.xmlId === section.xmlId || item.code === section.code
        );
        if (!existing) {
          actions.push({
            kind: "create",
            resource: "catalog_section",
            key: section.key,
            message: `Utworzyć sekcję katalogu „${section.name}”.`,
            details: { iblockId, parentKey: section.parentKey },
          });
        } else {
          actions.push({
            kind: "reuse",
            resource: "catalog_section",
            key: section.key,
            message: `Sekcja „${section.name}” już istnieje.`,
            details: { id: existing.id },
          });
        }
      }
    }

    const plan: ProvisioningPlan = {
      generatedAt: new Date().toISOString(),
      blueprintVersion: MOONGLASS_BLUEPRINT.version,
      portalHost: this.client.portalHost,
      actions,
    };

    writeJson(this.reportPath(PLAN_FILE), plan);
    writeText(this.reportPath(PLAN_MD_FILE), renderPlanMarkdown(plan));
    return plan;
  }

  async apply(confirmValue: string | undefined): Promise<ProvisioningMapping> {
    if (confirmValue !== "MOONGLASS") {
      throw new Error(
        "Tryb apply wymaga jawnego potwierdzenia: npm run bitrix:apply -- --confirm=MOONGLASS"
      );
    }

    const auditBefore = await this.audit();
    await this.plan(auditBefore);

    const categories = await this.applyPipelines(auditBefore);
    await this.applySources();
    await this.applyUserFields();
    await this.applyCatalogSections();

    const auditAfter = await this.audit();
    const mapping = buildMapping(auditAfter, categories);
    writeJson(this.reportPath(MAPPING_FILE), mapping);
    await this.plan(auditAfter);
    return mapping;
  }

  async applyPilotProducts(confirmValue: string | undefined): Promise<ProvisioningMapping> {
    if (confirmValue !== "MOONGLASS") {
      throw new Error(
        "Import produktów wymaga potwierdzenia: npm run bitrix:products:pilot -- --confirm=MOONGLASS"
      );
    }

    const audit = await this.audit();
    const iblockId = chooseCatalogIblockId(audit.catalogs);
    if (!iblockId) throw new Error("Brak katalogu handlowego w Bitrix24.");

    const sectionMap = new Map<string, BitrixCatalogSection>();
    for (const desired of MOONGLASS_BLUEPRINT.catalogSections) {
      const existing = audit.sections.find(
        (item) => item.xmlId === desired.xmlId || item.code === desired.code
      );
      if (existing) sectionMap.set(desired.key, existing);
    }
    if (sectionMap.size < MOONGLASS_BLUEPRINT.catalogSections.length) {
      throw new Error("Brakuje sekcji katalogu. Najpierw uruchom npm run bitrix:apply -- --confirm=MOONGLASS");
    }

    const products = buildPilotProducts(this.cwd, this.env.pilotDimensions);
    const priceTypeId = await this.getBasePriceTypeId();
    const existingProducts = await this.safeListProducts(iblockId, []);

    for (const product of products) {
      const existing = existingProducts.find(
        (item) => item.xmlId === product.sku || item.code === product.sku
      );
      let productId: number;
      const sectionId = sectionMap.get(product.sectionKey)?.id;
      if (!sectionId) throw new Error(`Brak sekcji ${product.sectionKey} dla produktu ${product.sku}.`);

      if (existing) {
        productId = existing.id;
        await this.client.call("catalog.product.update", {
          id: productId,
          fields: {
            name: product.name,
            code: product.sku,
            xmlId: product.sku,
            iblockSectionId: sectionId,
            active: "Y",
            detailText: product.description ?? "",
            detailTextType: "text",
          },
        });
      } else {
        const result = await this.client.call<{ element?: BitrixProduct }>(
          "catalog.product.add",
          {
            fields: {
              iblockId,
              iblockSectionId: sectionId,
              name: product.name,
              code: product.sku,
              xmlId: product.sku,
              active: "Y",
              detailText: product.description ?? "",
              detailTextType: "text",
            },
          }
        );
        productId = Number(result.element?.id);
        if (!Number.isFinite(productId)) {
          throw new Error(`Bitrix24 nie zwrócił ID produktu ${product.sku}.`);
        }
      }

      await this.upsertPrice(productId, priceTypeId, product);
    }

    const auditAfter = await this.audit();
    const mapping = buildMapping(auditAfter);
    if (mapping.catalog) {
      for (const product of products) {
        const existing = auditAfter.products.find(
          (item) => item.xmlId === product.sku || item.code === product.sku
        );
        if (existing) {
          mapping.catalog.products[product.sku] = {
            id: existing.id,
            name: existing.name,
            priceGross: product.priceGross,
          };
        }
      }
    }
    writeJson(this.reportPath(MAPPING_FILE), mapping);
    return mapping;
  }

  async verify(): Promise<{ ok: boolean; remainingActions: PlanAction[]; mapping: ProvisioningMapping }> {
    const audit = await this.audit();
    const plan = await this.plan(audit);
    const remainingActions = plan.actions.filter(
      (action) => action.kind === "create" || action.kind === "update" || action.kind === "warning"
    );
    const mapping = buildMapping(audit);
    const result = {
      ok: remainingActions.length === 0,
      remainingActions,
      mapping,
    };
    writeJson(this.reportPath(VERIFY_FILE), result);
    writeJson(this.reportPath(MAPPING_FILE), mapping);
    return result;
  }

  private async getOrCreateAudit(): Promise<PortalAudit> {
    const filePath = this.reportPath(AUDIT_FILE);
    if (fileExists(filePath)) return readJson<PortalAudit>(filePath);
    return this.audit();
  }

  private async applyPipelines(audit: PortalAudit): Promise<Record<string, BitrixCategory>> {
    const categoriesByKey: Record<string, BitrixCategory> = {};

    for (const pipeline of MOONGLASS_BLUEPRINT.pipelines) {
      let category = findCategoryForPipeline(pipeline, audit.categories);
      if (!category) {
        const result = await this.client.call<{ category?: BitrixCategory }>(
          "crm.category.add",
          {
            entityTypeId: MOONGLASS_BLUEPRINT.dealEntityTypeId,
            fields: { name: pipeline.name, sort: pipeline.sort },
          }
        );
        category = result.category;
        if (!category) throw new Error(`Nie udało się utworzyć lejka ${pipeline.name}.`);
      } else if (category.name !== pipeline.name || Number(category.sort ?? 500) !== pipeline.sort) {
        await this.client.call("crm.category.update", {
          entityTypeId: MOONGLASS_BLUEPRINT.dealEntityTypeId,
          id: category.id,
          fields: { name: pipeline.name, sort: pipeline.sort },
        });
        category = { ...category, name: pipeline.name, sort: pipeline.sort };
      }

      categoriesByKey[pipeline.key] = category;
      const statuses = await this.client.call<BitrixStatus[]>("crm.status.list", {
        filter: { ENTITY_ID: stageEntityId(category.id) },
        order: { SORT: "ASC" },
      });
      const dealCount = audit.categoryDealCounts[String(category.id)] ?? -1;
      await this.applyStages(pipeline, category, statuses, dealCount === 0);
    }

    return categoriesByKey;
  }

  private async applyStages(
    pipeline: PipelineBlueprint,
    category: BitrixCategory,
    existingStatuses: BitrixStatus[],
    mayReuseGeneric: boolean
  ): Promise<void> {
    const entityId = stageEntityId(category.id);
    const used = new Set<BitrixStatus>();

    for (const stage of pipeline.stages) {
      let existing = findStatus(stage, existingStatuses, used);
      if (!existing && mayReuseGeneric) {
        existing = existingStatuses.find(
          (item) => !used.has(item) && semantics(item) === stage.semantics
        );
      }

      if (existing) {
        used.add(existing);
        if (!existing.ID) throw new Error(`Etap ${existing.STATUS_ID} nie ma ID.`);
        if (
          existing.NAME !== stage.name ||
          Number(existing.SORT ?? 0) !== stage.sort ||
          (stage.color && normalizeColor(existing.COLOR) !== normalizeColor(stage.color))
        ) {
          await this.client.call("crm.status.update", {
            id: Number(existing.ID),
            fields: {
              NAME: stage.name,
              SORT: stage.sort,
              ...(stage.color ? { COLOR: stage.color } : {}),
            },
          });
        }
        continue;
      }

      await this.client.call("crm.status.add", {
        fields: {
          ENTITY_ID: entityId,
          STATUS_ID: stage.code,
          NAME: stage.name,
          SORT: stage.sort,
          SEMANTICS: stage.semantics,
          ...(stage.color ? { COLOR: stage.color } : {}),
        },
      });
    }
  }

  private async applySources(): Promise<void> {
    const existingSources = await this.client.call<BitrixStatus[]>("crm.status.list", {
      filter: { ENTITY_ID: "SOURCE" },
      order: { SORT: "ASC" },
    });

    for (const source of MOONGLASS_BLUEPRINT.sources) {
      const existing = existingSources.find(
        (item) => item.STATUS_ID === source.code || normalize(item.NAME) === normalize(source.name)
      );
      if (!existing) {
        await this.client.call("crm.status.add", {
          fields: {
            ENTITY_ID: "SOURCE",
            STATUS_ID: source.code,
            NAME: source.name,
            SORT: source.sort,
          },
        });
      } else if (existing.ID && (existing.NAME !== source.name || Number(existing.SORT ?? 0) !== source.sort)) {
        await this.client.call("crm.status.update", {
          id: Number(existing.ID),
          fields: { NAME: source.name, SORT: source.sort },
        });
      }
    }
  }

  private async applyUserFields(): Promise<void> {
    const existingFields = await this.safeListUserFields([]);

    for (const field of MOONGLASS_BLUEPRINT.userFields) {
      const fieldName = getUserFieldName(field);
      const xmlId = getUserFieldXmlId(field);
      const existing = existingFields.find(
        (item) => item.fieldName === fieldName || item.xmlId === xmlId
      );
      if (existing) {
        if (existing.userTypeId !== field.type) {
          throw new Error(
            `Pole ${fieldName} ma typ ${existing.userTypeId}, a blueprint wymaga ${field.type}. Popraw ręcznie przed apply.`
          );
        }
        continue;
      }

      await this.client.call("userfieldconfig.add", {
        moduleId: "crm",
        field: createUserFieldPayload(field),
      });
    }
  }

  private async applyCatalogSections(): Promise<void> {
    const catalogs = await this.safeListCatalogs([]);
    const iblockId = chooseCatalogIblockId(catalogs);
    if (!iblockId) throw new Error("Nie znaleziono katalogu handlowego Bitrix24.");

    const existingSections = await this.safeListSections(iblockId, []);
    const sectionByKey = new Map<string, BitrixCatalogSection>();

    for (const desired of MOONGLASS_BLUEPRINT.catalogSections) {
      const parentId = desired.parentKey ? sectionByKey.get(desired.parentKey)?.id : undefined;
      if (desired.parentKey && !parentId) {
        throw new Error(`Nie znaleziono sekcji nadrzędnej ${desired.parentKey}.`);
      }

      let existing = existingSections.find(
        (item) => item.xmlId === desired.xmlId || item.code === desired.code
      );
      if (existing) {
        if (
          existing.name !== desired.name ||
          Number(existing.sort ?? 500) !== desired.sort ||
          Number(existing.iblockSectionId ?? 0) !== Number(parentId ?? 0)
        ) {
          await this.client.call("catalog.section.update", {
            id: existing.id,
            fields: {
              name: desired.name,
              code: desired.code,
              xmlId: desired.xmlId,
              sort: desired.sort,
              iblockSectionId: parentId ?? 0,
              active: "Y",
            },
          });
          existing = {
            ...existing,
            name: desired.name,
            code: desired.code,
            xmlId: desired.xmlId,
            sort: desired.sort,
            iblockSectionId: parentId,
          };
        }
      } else {
        const result = await this.client.call<{ section?: BitrixCatalogSection }>(
          "catalog.section.add",
          {
            fields: {
              iblockId,
              iblockSectionId: parentId ?? 0,
              name: desired.name,
              code: desired.code,
              xmlId: desired.xmlId,
              sort: desired.sort,
              active: "Y",
              description: "Sekcja zarządzana przez MoonGlass Bitrix24 Provisioner.",
              descriptionType: "text",
            },
          }
        );
        existing = result.section;
        if (!existing) throw new Error(`Nie udało się utworzyć sekcji ${desired.name}.`);
      }

      sectionByKey.set(desired.key, existing);
    }
  }

  private async getBasePriceTypeId(): Promise<number> {
    const result = await this.client.call<{ priceTypes?: Array<{ id: number; base?: "Y" | "N" | boolean }> }>(
      "catalog.priceType.list",
      { select: ["id", "base"], order: { id: "ASC" } }
    );
    const priceTypes = result.priceTypes ?? [];
    const base = priceTypes.find((item) => item.base === "Y" || item.base === true) ?? priceTypes[0];
    if (!base) throw new Error("Nie znaleziono bazowego typu ceny w katalogu.");
    return Number(base.id);
  }

  private async upsertPrice(
    productId: number,
    priceTypeId: number,
    product: ProductBlueprint
  ): Promise<void> {
    const result = await this.client.call<{ prices?: Array<{ id: number; catalogGroupId: number; price: number; currency: string }> }>(
      "catalog.price.list",
      {
        select: ["id", "productId", "catalogGroupId", "price", "currency"],
        filter: { productId, catalogGroupId: priceTypeId },
        order: { id: "ASC" },
      }
    );
    const existing = result.prices?.[0];
    if (existing) {
      if (Number(existing.price) !== product.priceGross || existing.currency !== product.currency) {
        await this.client.call("catalog.price.update", {
          id: existing.id,
          fields: { price: product.priceGross, currency: product.currency },
        });
      }
    } else {
      await this.client.call("catalog.price.add", {
        fields: {
          productId,
          catalogGroupId: priceTypeId,
          price: product.priceGross,
          currency: product.currency,
        },
      });
    }
  }

  private async safeListUserFields(warnings: string[]): Promise<BitrixUserField[]> {
    try {
      return await this.client.listAll<BitrixUserField>(
        "userfieldconfig.list",
        {
          moduleId: "crm",
          select: ["*", "language"],
          order: { id: "ASC" },
        },
        (result) => asRecord(result).fields as BitrixUserField[] ?? []
      );
    } catch (error) {
      warnings.push(`Nie udało się odczytać pól niestandardowych: ${formatError(error)}`);
      return [];
    }
  }

  private async safeListCatalogs(warnings: string[]): Promise<BitrixCatalog[]> {
    try {
      const result = await this.client.call<{ catalogs?: BitrixCatalog[] }>(
        "catalog.catalog.list",
        { select: ["id", "iblockId", "productIblockId", "name", "xmlId"] }
      );
      return result.catalogs ?? [];
    } catch (error) {
      warnings.push(`Nie udało się odczytać katalogów: ${formatError(error)}`);
      return [];
    }
  }

  private async safeListSections(
    iblockId: number,
    warnings: string[]
  ): Promise<BitrixCatalogSection[]> {
    try {
      return await this.client.listAll<BitrixCatalogSection>(
        "catalog.section.list",
        {
          select: ["id", "iblockId", "iblockSectionId", "name", "code", "xmlId", "sort"],
          filter: { iblockId },
          order: { sort: "ASC", id: "ASC" },
        },
        (result) => asRecord(result).sections as BitrixCatalogSection[] ?? []
      );
    } catch (error) {
      warnings.push(`Nie udało się odczytać sekcji katalogu: ${formatError(error)}`);
      return [];
    }
  }

  private async safeListProducts(
    iblockId: number,
    warnings: string[]
  ): Promise<BitrixProduct[]> {
    try {
      return await this.client.listAll<BitrixProduct>(
        "catalog.product.list",
        {
          select: ["id", "iblockId", "iblockSectionId", "name", "code", "xmlId"],
          filter: { iblockId },
          order: { id: "ASC" },
        },
        (result) => asRecord(result).products as BitrixProduct[] ?? []
      );
    } catch (error) {
      warnings.push(`Nie udało się odczytać produktów: ${formatError(error)}`);
      return [];
    }
  }

  private reportPath(fileName: string): string {
    return path.join(this.env.reportDir, fileName);
  }
}

function createUserFieldPayload(field: UserFieldBlueprint): Record<string, unknown> {
  return {
    entityId: getEntityId(field.entity),
    fieldName: getUserFieldName(field),
    userTypeId: field.type,
    xmlId: getUserFieldXmlId(field),
    sort: field.sort,
    multiple: field.multiple ? "Y" : "N",
    mandatory: field.mandatory ? "Y" : "N",
    showFilter: field.showFilter === false ? "N" : "E",
    editInList: "Y",
    isSearchable: field.searchable ? "Y" : "N",
    editFormLabel: { pl: field.label, en: field.label },
    ...(field.settings ? { settings: field.settings } : {}),
    ...(field.enumValues
      ? {
          enum: field.enumValues.map((item) => ({
            xmlId: item.xmlId,
            value: item.value,
            sort: item.sort,
            default: item.default ? "Y" : "N",
          })),
        }
      : {}),
  };
}

function planStages(
  pipeline: PipelineBlueprint,
  category: BitrixCategory,
  existingStatuses: BitrixStatus[],
  mayReuseGeneric: boolean
): PlanAction[] {
  const actions: PlanAction[] = [];
  const used = new Set<BitrixStatus>();

  for (const stage of pipeline.stages) {
    let existing = findStatus(stage, existingStatuses, used);
    let reusedGeneric = false;
    if (!existing && mayReuseGeneric) {
      existing = existingStatuses.find(
        (item) => !used.has(item) && semantics(item) === stage.semantics
      );
      reusedGeneric = Boolean(existing);
    }

    const key = `${pipeline.key}.${stage.code}`;
    if (!existing) {
      actions.push({
        kind: "create",
        resource: "stage",
        key,
        message: `Utworzyć etap „${stage.name}” w lejku „${pipeline.name}”.`,
        details: { categoryId: category.id, semantics: stage.semantics },
      });
      continue;
    }

    used.add(existing);
    if (
      existing.NAME !== stage.name ||
      Number(existing.SORT ?? 0) !== stage.sort ||
      (stage.color && normalizeColor(existing.COLOR) !== normalizeColor(stage.color))
    ) {
      actions.push({
        kind: "update",
        resource: "stage",
        key,
        message: `${reusedGeneric ? "Zaadaptować" : "Zaktualizować"} etap „${existing.NAME ?? existing.STATUS_ID}” jako „${stage.name}”.`,
        details: { id: existing.ID, stageId: existing.STATUS_ID, categoryId: category.id },
      });
    } else {
      actions.push({
        kind: "reuse",
        resource: "stage",
        key,
        message: `Etap „${stage.name}” już istnieje.`,
        details: { stageId: existing.STATUS_ID, categoryId: category.id },
      });
    }
  }

  return actions;
}

function findStatus(
  desired: StageBlueprint,
  existingStatuses: BitrixStatus[],
  used: Set<BitrixStatus>
): BitrixStatus | undefined {
  return existingStatuses.find(
    (item) =>
      !used.has(item) &&
      (statusCode(item.STATUS_ID) === desired.code || normalize(item.NAME) === normalize(desired.name))
  );
}

function statusCode(statusId: string): string {
  const separator = statusId.indexOf(":");
  return separator >= 0 ? statusId.slice(separator + 1) : statusId;
}

function semantics(status: BitrixStatus): "" | "S" | "F" {
  return status.SEMANTICS === "S" || status.SEMANTICS === "F" ? status.SEMANTICS : "";
}

function stageEntityId(categoryId: number): string {
  return categoryId === 0 ? "DEAL_STAGE" : `DEAL_STAGE_${categoryId}`;
}

function findCategoryForPipeline(
  pipeline: PipelineBlueprint,
  categories: BitrixCategory[]
): BitrixCategory | undefined {
  const byName = categories.find((item) => normalize(item.name) === normalize(pipeline.name));
  if (byName) return byName;
  if (pipeline.useDefault) {
    return categories.find((item) => item.id === 0 || item.isDefault === "Y" || item.isDefault === true);
  }
  return undefined;
}

function resolveCategories(categories: BitrixCategory[]): Record<string, BitrixCategory> {
  const result: Record<string, BitrixCategory> = {};
  for (const pipeline of MOONGLASS_BLUEPRINT.pipelines) {
    const category = findCategoryForPipeline(pipeline, categories);
    if (category) result[pipeline.key] = category;
  }
  return result;
}

function chooseCatalogIblockId(catalogs: BitrixCatalog[]): number | undefined {
  for (const catalog of catalogs) {
    const value = catalog.iblockId ?? catalog.productIblockId ?? catalog.id;
    if (value !== undefined && Number.isFinite(Number(value))) return Number(value);
  }
  return undefined;
}

function buildMapping(
  audit: PortalAudit,
  knownCategories: Record<string, BitrixCategory> = {}
): ProvisioningMapping {
  const mapping: ProvisioningMapping = {
    generatedAt: new Date().toISOString(),
    blueprintVersion: MOONGLASS_BLUEPRINT.version,
    portalHost: audit.portalHost,
    pipelines: {},
    stages: {},
    sources: {},
    userFields: {},
  };

  for (const pipeline of MOONGLASS_BLUEPRINT.pipelines) {
    const category = knownCategories[pipeline.key] ?? findCategoryForPipeline(pipeline, audit.categories);
    if (!category) continue;
    mapping.pipelines[pipeline.key] = { categoryId: category.id, name: category.name };
    const entityId = stageEntityId(category.id);
    const statuses = audit.stagesByEntityId[entityId] ?? [];
    for (const stage of pipeline.stages) {
      const found = statuses.find(
        (item) => statusCode(item.STATUS_ID) === stage.code || normalize(item.NAME) === normalize(stage.name)
      );
      if (found) {
        mapping.stages[`${pipeline.key}.${stage.code}`] = {
          categoryId: category.id,
          entityId,
          stageId: found.STATUS_ID,
          name: found.NAME ?? stage.name,
        };
      }
    }
  }

  for (const source of MOONGLASS_BLUEPRINT.sources) {
    const found = audit.sources.find(
      (item) => item.STATUS_ID === source.code || normalize(item.NAME) === normalize(source.name)
    );
    if (found) {
      mapping.sources[source.code] = {
        statusId: found.STATUS_ID,
        name: found.NAME ?? source.name,
      };
    }
  }

  for (const field of MOONGLASS_BLUEPRINT.userFields) {
    const fieldName = getUserFieldName(field);
    const xmlId = getUserFieldXmlId(field);
    const found = audit.userFields.find(
      (item) => item.fieldName === fieldName || item.xmlId === xmlId
    );
    if (found) {
      mapping.userFields[`${field.entity}.${field.alias}`] = {
        fieldId: found.id,
        fieldName: found.fieldName,
        entityId: found.entityId,
        type: found.userTypeId,
      };
    }
  }

  const iblockId = chooseCatalogIblockId(audit.catalogs);
  if (iblockId) {
    mapping.catalog = { iblockId, sections: {}, products: {} };
    for (const desired of MOONGLASS_BLUEPRINT.catalogSections) {
      const found = audit.sections.find(
        (item) => item.xmlId === desired.xmlId || item.code === desired.code
      );
      if (found) {
        mapping.catalog.sections[desired.key] = {
          id: found.id,
          name: found.name,
          xmlId: found.xmlId ?? desired.xmlId,
        };
      }
    }
    for (const product of audit.products.filter((item) => item.xmlId?.startsWith("MG-") || item.code?.startsWith("MG-"))) {
      const sku = product.xmlId || product.code;
      if (sku) mapping.catalog.products[sku] = { id: product.id, name: product.name };
    }
  }

  return mapping;
}

function renderPlanMarkdown(plan: ProvisioningPlan): string {
  const counts = plan.actions.reduce<Record<string, number>>((acc, action) => {
    acc[action.kind] = (acc[action.kind] ?? 0) + 1;
    return acc;
  }, {});

  const symbols: Record<string, string> = {
    create: "+",
    update: "~",
    reuse: "=",
    skip: "-",
    warning: "!",
  };

  return [
    "# Plan konfiguracji Bitrix24 MoonGlass",
    "",
    `- Portal: \`${plan.portalHost}\``,
    `- Blueprint: \`${plan.blueprintVersion}\``,
    `- Wygenerowano: \`${plan.generatedAt}\``,
    `- Utworzyć: ${counts.create ?? 0}`,
    `- Zaktualizować: ${counts.update ?? 0}`,
    `- Wykorzystać bez zmian: ${counts.reuse ?? 0}`,
    `- Ostrzeżenia: ${counts.warning ?? 0}`,
    "",
    "## Działania",
    "",
    ...plan.actions.map(
      (action) => `- \`${symbols[action.kind] ?? "?"}\` **${action.resource} / ${action.key}** — ${action.message}`
    ),
    "",
    "> `plan` nie wprowadza zmian. Dopiero `apply` modyfikuje portal i wymaga parametru `--confirm=MOONGLASS`.",
    "",
  ].join("\n");
}

function normalize(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[—–]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeColor(value: unknown): string {
  return String(value ?? "").trim().toUpperCase();
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function formatError(error: unknown): string {
  if (error instanceof Bitrix24RestError) return `${error.code}: ${error.description}`;
  return error instanceof Error ? error.message : String(error);
}
