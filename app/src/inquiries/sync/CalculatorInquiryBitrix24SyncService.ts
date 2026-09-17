import generatedPricingSnapshot from "@/data/pricing/glass-system/published-pricing.generated.json";
import type { StoredCalculatorInquiryLead } from "@/domain/StoredCalculatorInquiryLead";
import {
  getFrameColor,
  getFrameColorLabel,
  getProductKind,
} from "@/domain/ProductConfiguration";
import {
  getQuoteSnapshotWebsiteTotalGross,
  recalculateQuoteSnapshotForVat,
  type RecalculatedQuoteFinancials,
} from "@/lib/quote-snapshot";
import {
  calculatePaymentSchedule305020,
  formatBitrixMoney,
  PAYMENT_SCHEDULE_305020,
} from "@/lib/payment-schedule";
import { Bitrix24Client } from "@/integrations/bitrix24/Bitrix24Client";
import { Bitrix24InquiryProductRowBuilder } from "@/integrations/bitrix24/Bitrix24InquiryProductRowBuilder";
import {
  getBitrix24Config,
  type Bitrix24Config,
} from "@/integrations/bitrix24/Bitrix24Config";
import {
  Bitrix24RuntimeMetadataResolver,
  getEnumValueId,
  type Bitrix24RuntimeMetadata,
} from "@/integrations/bitrix24/Bitrix24RuntimeMetadataResolver";
import type {
  Bitrix24ContactAddResponse,
  Bitrix24DealListItem,
  Bitrix24DuplicateSearchResult,
  Bitrix24ItemAddResponse,
} from "@/integrations/bitrix24/Bitrix24Types";
import { CalculatorInquiryBitrix24SyncStore } from "./CalculatorInquiryBitrix24SyncStore";

const DEAL_FIELDS = {
  webInquiryId: "UF_CRM_DEAL_MG_WEB_INQUIRY_ID",
  localLeadId: "UF_CRM_DEAL_MG_LOCAL_LEAD_ID",
  quoteVersion: "UF_CRM_DEAL_MG_QUOTE_VERSION",
  sourceUrl: "UF_CRM_DEAL_MG_SOURCE_URL",
  syncStatus: "UF_CRM_DEAL_MG_SYNC_STATUS",
  syncedAt: "UF_CRM_DEAL_MG_SYNCED_AT",
  syncError: "UF_CRM_DEAL_MG_SYNC_ERROR",
  clientType: "UF_CRM_DEAL_MG_CLIENT_TYPE",
  productType: "UF_CRM_DEAL_MG_PRODUCT_TYPE",
  depthCm: "UF_CRM_DEAL_MG_DEPTH_CM",
  widthCm: "UF_CRM_DEAL_MG_WIDTH_CM",
  roofType: "UF_CRM_DEAL_MG_ROOF_TYPE",
  wallType: "UF_CRM_DEAL_MG_WALL_TYPE",
  constructionColor: "UF_CRM_DEAL_MG_CONSTRUCTION_COLOR",
  zipFront: "UF_CRM_DEAL_MG_ZIP_FRONT",
  zipLeft: "UF_CRM_DEAL_MG_ZIP_LEFT",
  zipRight: "UF_CRM_DEAL_MG_ZIP_RIGHT",
  awning: "UF_CRM_DEAL_MG_AWNING",
  ledPoint: "UF_CRM_DEAL_MG_LED_POINT",
  ledCct: "UF_CRM_DEAL_MG_LED_CCT",
  foundation: "UF_CRM_DEAL_MG_FOUNDATION",
  brushes: "UF_CRM_DEAL_MG_BRUSHES",
  handles: "UF_CRM_DEAL_MG_HANDLES",
  customQuote: "UF_CRM_DEAL_MG_CUSTOM_QUOTE",
  configurationText: "UF_CRM_DEAL_MG_CONFIGURATION_TEXT",
  serverTotalGross: "UF_CRM_DEAL_MG_SERVER_TOTAL_GROSS",
  vatRate: "UF_CRM_DEAL_MG_VAT_RATE",
  discountPercent: "UF_CRM_DEAL_MG_DISCOUNT_PERCENT",
  contactAttempts: "UF_CRM_DEAL_MG_CONTACT_ATTEMPTS",
  photosStatus: "UF_CRM_DEAL_MG_PHOTOS_STATUS",
  measurementRequired: "UF_CRM_DEAL_MG_MEASUREMENT_REQUIRED",
  advancePercent: "UF_CRM_DEAL_MG_ADVANCE_PERCENT",
  advanceAmount: "UF_CRM_DEAL_MG_ADVANCE_AMOUNT",
  remainingAmount: "UF_CRM_DEAL_MG_REMAINING_AMOUNT",
  paymentStage2Amount: "UF_CRM_DEAL_MG_PAYMENT_STAGE2_AMOUNT",
  paymentStage3Amount: "UF_CRM_DEAL_MG_PAYMENT_STAGE3_AMOUNT",
} as const;

const CONTACT_FIELDS = {
  preferredChannel: "UF_CRM_CONTACT_MG_PREFERRED_CHANNEL",
  customerType: "UF_CRM_CONTACT_MG_CUSTOMER_TYPE",
  rodoSource: "UF_CRM_CONTACT_MG_RODO_SOURCE",
  rodoDate: "UF_CRM_CONTACT_MG_RODO_DATE",
  marketingConsent: "UF_CRM_CONTACT_MG_MARKETING_CONSENT",
  externalKey: "UF_CRM_CONTACT_MG_EXTERNAL_CONTACT_KEY",
} as const;

export interface CalculatorInquiryBitrix24SyncResult {
  status: "skipped" | "busy" | "synced" | "failed";
  contactId?: number;
  dealId?: number;
  error?: string;
}

export class CalculatorInquiryBitrix24SyncService {
  private readonly config: Bitrix24Config;
  private readonly client: Bitrix24Client;
  private readonly metadataResolver: Bitrix24RuntimeMetadataResolver;
  private readonly productRowBuilder: Bitrix24InquiryProductRowBuilder;

  constructor(
    private readonly store = new CalculatorInquiryBitrix24SyncStore(),
    config = getBitrix24Config()
  ) {
    this.config = config;
    this.client = new Bitrix24Client(config);
    this.metadataResolver = new Bitrix24RuntimeMetadataResolver(
      this.client,
      config
    );
    this.productRowBuilder = new Bitrix24InquiryProductRowBuilder(this.client);
  }

  isEnabled(): boolean {
    return (
      this.config.enabled &&
      process.env.CALCULATOR_INQUIRY_REPOSITORY === "database"
    );
  }

  async syncInquiry(
    inquiryId: string
  ): Promise<CalculatorInquiryBitrix24SyncResult> {
    if (!this.isEnabled()) {
      return { status: "skipped" };
    }

    const inquiry = await this.store.claim(inquiryId);
    if (!inquiry) {
      return { status: "busy" };
    }

    let metadata: Bitrix24RuntimeMetadata | undefined;
    let dealId: number | undefined;

    try {
      metadata = await this.metadataResolver.resolve();
      const contactId = await this.ensureContact(inquiry, metadata);
      dealId = await this.ensureDeal(inquiry, contactId, metadata);
      await this.clearDealCloseDateSafely(dealId);
      await this.setProductRows(inquiry, dealId, metadata.measureCode);
      await this.markDealAsSynced(dealId, metadata);
      await this.store.markSuccess(inquiry.id, contactId, dealId);

      return { status: "synced", contactId, dealId };
    } catch (error) {
      const message = sanitizeError(error);
      const nextRetryAt = new Date(
        Date.now() + this.config.retryDelayMinutes * 60_000
      );

      if (dealId !== undefined && metadata) {
        await this.markDealAsFailedSafely(dealId, metadata, message);
      }

      await this.store.markFailure(inquiry.id, message, nextRetryAt);

      console.error("Bitrix24 inquiry synchronization failed:", {
        inquiryId: inquiry.id,
        error: message,
      });

      return { status: "failed", error: message };
    }
  }

  async retryInquiry(
    inquiryId: string
  ): Promise<CalculatorInquiryBitrix24SyncResult> {
    if (!this.isEnabled()) {
      return { status: "skipped" };
    }

    const reset = await this.store.resetForRetry(inquiryId);
    if (!reset) {
      return { status: "skipped" };
    }

    return this.syncInquiry(inquiryId);
  }

  async retryPending(limit = 20): Promise<{
    attempted: number;
    synced: number;
    failed: number;
  }> {
    if (!this.isEnabled()) {
      return { attempted: 0, synced: 0, failed: 0 };
    }

    const ids = await this.store.findRetryableIds(limit);
    let synced = 0;
    let failed = 0;

    for (const id of ids) {
      const result = await this.syncInquiry(id);
      if (result.status === "synced") synced += 1;
      if (result.status === "failed") failed += 1;
    }

    return { attempted: ids.length, synced, failed };
  }

  private async ensureContact(
    inquiry: StoredCalculatorInquiryLead,
    metadata: Bitrix24RuntimeMetadata
  ): Promise<number> {
    const ids = new Set<number>();

    for (const [type, value] of [
      ["EMAIL", inquiry.customer.email],
      ["PHONE", inquiry.customer.phone],
    ] as const) {
      if (!value.trim()) continue;

      const response = await this.client.call<{
        result?: Bitrix24DuplicateSearchResult;
      }>("crm.duplicate.findbycomm", {
        entity_type: "CONTACT",
        type,
        values: [value],
      });

      for (const id of response.result?.CONTACT ?? []) {
        const parsed = Number(id);
        if (Number.isFinite(parsed)) ids.add(parsed);
      }
    }

    if (ids.size > 1) {
      throw new Error(
        `E-mail i telefon klienta wskazują różne lub zduplikowane kontakty Bitrix24: ${[
          ...ids,
        ].join(", ")}.`
      );
    }

    const fields = this.buildContactFields(inquiry, metadata);
    const existingId = [...ids][0];

    if (existingId !== undefined) {
      await this.client.call("crm.contact.update", {
        id: existingId,
        fields,
      });
      return existingId;
    }

    const response = await this.client.call<Bitrix24ContactAddResponse>(
      "crm.contact.add",
      { fields }
    );
    const id = Number(response.result);

    if (!Number.isFinite(id)) {
      throw new Error("Bitrix24 nie zwrócił ID utworzonego kontaktu.");
    }

    return id;
  }

  private buildContactFields(
    inquiry: StoredCalculatorInquiryLead,
    metadata: Bitrix24RuntimeMetadata
  ): Record<string, unknown> {
    const { firstName, lastName } = splitCustomerName(inquiry.customer.name);

    return {
      NAME: firstName,
      LAST_NAME: lastName,
      OPENED: "N",
      SOURCE_ID: metadata.sourceId,
      COMMENTS: `Kontakt utworzony lub zaktualizowany z zapytania ${inquiry.id}.`,
      ORIGINATOR_ID: "MOONGLASS",
      ORIGIN_ID: createContactExternalKey(inquiry),
      EMAIL: [{ VALUE: inquiry.customer.email, VALUE_TYPE: "WORK" }],
      PHONE: [{ VALUE: inquiry.customer.phone, VALUE_TYPE: "WORK" }],
      [CONTACT_FIELDS.preferredChannel]: getEnumValueId(
        metadata.contactFields,
        CONTACT_FIELDS.preferredChannel,
        "E-mail"
      ),
      [CONTACT_FIELDS.customerType]: getEnumValueId(
        metadata.contactFields,
        CONTACT_FIELDS.customerType,
        "Osoba prywatna"
      ),
      [CONTACT_FIELDS.rodoSource]: getEnumValueId(
        metadata.contactFields,
        CONTACT_FIELDS.rodoSource,
        "Kalkulator strony"
      ),
      [CONTACT_FIELDS.rodoDate]: inquiry.receivedAt,
      [CONTACT_FIELDS.marketingConsent]: "N",
      [CONTACT_FIELDS.externalKey]: createContactExternalKey(inquiry),
    };
  }

  private async ensureDeal(
    inquiry: StoredCalculatorInquiryLead,
    contactId: number,
    metadata: Bitrix24RuntimeMetadata
  ): Promise<number> {
    const response = await this.client.call<{
      result?: Bitrix24DealListItem[];
    }>("crm.deal.list", {
      order: { ID: "ASC" },
      filter: { [`=${DEAL_FIELDS.webInquiryId}`]: inquiry.id },
      select: ["ID", "TITLE", DEAL_FIELDS.webInquiryId],
    });
    const matches = response.result ?? [];

    if (matches.length > 1) {
      throw new Error(
        `Znaleziono ${matches.length} Deali z ID zapytania ${inquiry.id}. Wymagane jest ręczne połączenie duplikatów.`
      );
    }

    const fields = this.buildDealFields(
      inquiry,
      contactId,
      metadata,
      "Synchronizacja"
    );
    const existingId = Number(matches[0]?.ID);

    if (Number.isFinite(existingId)) {
      await this.client.call("crm.item.update", {
        entityTypeId: this.config.dealEntityTypeId,
        id: existingId,
        fields,
        useOriginalUfNames: "Y",
      });
      return existingId;
    }

    const created = await this.client.call<Bitrix24ItemAddResponse>(
      "crm.item.add",
      {
        entityTypeId: this.config.dealEntityTypeId,
        fields,
        useOriginalUfNames: "Y",
      }
    );
    const id = Number(created.result?.item?.id);

    if (!Number.isFinite(id)) {
      throw new Error("Bitrix24 nie zwrócił ID utworzonego Deala.");
    }

    return id;
  }

  private buildDealFields(
    inquiry: StoredCalculatorInquiryLead,
    contactId: number,
    metadata: Bitrix24RuntimeMetadata,
    syncStatus: "Synchronizacja" | "Zsynchronizowano"
  ): Record<string, unknown> {
    const configuration = inquiry.quote.configuration;
    const productKind = getProductKind(configuration);
    const summary = inquiry.quote.configurationSummary
      .map((row) => `${row.label}: ${row.value}`)
      .join("\n");
    const targetFinancials = recalculateQuoteSnapshotForVat(
      inquiry.quote,
      this.config.vatRate
    );
    const bitrixTotalGross =
      targetFinancials?.totalGross ?? inquiry.quote.totalGross;
    const paymentSchedule = calculatePaymentSchedule305020(bitrixTotalGross);

    return removeUndefinedFields({
      title: createDealTitle(inquiry),
      xmlId: inquiry.id,
      opened: false,
      categoryId: metadata.categoryId,
      stageId: metadata.stageId,
      sourceId: metadata.sourceId,
      sourceDescription: "Kalkulator strony MoonGlass",
      contactIds: [contactId],
      currencyId: inquiry.quote.currency,
      isManualOpportunity: false,
      assignedById: this.config.assignedById,
      comments: createDealComments(inquiry, targetFinancials),
      [DEAL_FIELDS.webInquiryId]: inquiry.id,
      [DEAL_FIELDS.localLeadId]: inquiry.id,
      [DEAL_FIELDS.quoteVersion]: readQuoteVersion(),
      [DEAL_FIELDS.sourceUrl]: this.config.publicCalculatorUrl || undefined,
      [DEAL_FIELDS.syncStatus]: getEnumValueId(
        metadata.dealFields,
        DEAL_FIELDS.syncStatus,
        syncStatus
      ),
      [DEAL_FIELDS.syncedAt]:
        syncStatus === "Zsynchronizowano" ? new Date().toISOString() : undefined,
      [DEAL_FIELDS.syncError]: "",
      [DEAL_FIELDS.clientType]: getEnumValueId(
        metadata.dealFields,
        DEAL_FIELDS.clientType,
        "Osoba prywatna"
      ),
      [DEAL_FIELDS.productType]: getEnumValueId(
        metadata.dealFields,
        DEAL_FIELDS.productType,
        productKind === "winter_garden" ? "Ogród zimowy" : "Zadaszenie tarasu"
      ),
      [DEAL_FIELDS.depthCm]: configuration.length,
      [DEAL_FIELDS.widthCm]: configuration.width,
      [DEAL_FIELDS.roofType]: getEnumValueId(
        metadata.dealFields,
        DEAL_FIELDS.roofType,
        mapRoofType(configuration.roof)
      ),
      [DEAL_FIELDS.wallType]: getEnumValueId(
        metadata.dealFields,
        DEAL_FIELDS.wallType,
        mapWallType(configuration.walls)
      ),
      [DEAL_FIELDS.constructionColor]:
        getFrameColorLabel(getFrameColor(configuration)),
      [DEAL_FIELDS.zipFront]: toBitrixBoolean(configuration.hasFrontZip),
      [DEAL_FIELDS.zipLeft]: toBitrixBoolean(configuration.hasLeftZip),
      [DEAL_FIELDS.zipRight]: toBitrixBoolean(configuration.hasRightZip),
      [DEAL_FIELDS.awning]: toBitrixBoolean(configuration.hasAwning),
      [DEAL_FIELDS.ledPoint]: toBitrixBoolean(configuration.hasLed),
      [DEAL_FIELDS.ledCct]: toBitrixBoolean(configuration.hasCob),
      [DEAL_FIELDS.foundation]: toBitrixBoolean(
        configuration.hasLevelingProfile
      ),
      [DEAL_FIELDS.brushes]: toBitrixBoolean(configuration.hasBrushes),
      [DEAL_FIELDS.handles]: toBitrixBoolean(configuration.hasHandles),
      [DEAL_FIELDS.customQuote]: "N",
      [DEAL_FIELDS.configurationText]: summary,
      [DEAL_FIELDS.serverTotalGross]: `${bitrixTotalGross.toFixed(2)}|${inquiry.quote.currency}`,
      [DEAL_FIELDS.vatRate]: getEnumValueId(
        metadata.dealFields,
        DEAL_FIELDS.vatRate,
        `${this.config.vatRate}%`
      ),
      [DEAL_FIELDS.discountPercent]: 0,
      [DEAL_FIELDS.advancePercent]: PAYMENT_SCHEDULE_305020.stage1Percent,
      [DEAL_FIELDS.advanceAmount]: formatBitrixMoney(
        paymentSchedule.stage1Amount,
        inquiry.quote.currency
      ),
      [DEAL_FIELDS.remainingAmount]: formatBitrixMoney(
        paymentSchedule.remainingAfterStage1,
        inquiry.quote.currency
      ),
      [DEAL_FIELDS.paymentStage2Amount]: formatBitrixMoney(
        paymentSchedule.stage2Amount,
        inquiry.quote.currency
      ),
      [DEAL_FIELDS.paymentStage3Amount]: formatBitrixMoney(
        paymentSchedule.stage3Amount,
        inquiry.quote.currency
      ),
      [DEAL_FIELDS.contactAttempts]: 0,
      [DEAL_FIELDS.photosStatus]: getEnumValueId(
        metadata.dealFields,
        DEAL_FIELDS.photosStatus,
        "Nie wymagane"
      ),
      [DEAL_FIELDS.measurementRequired]: "Y",
    });
  }

  private async setProductRows(
    inquiry: StoredCalculatorInquiryLead,
    dealId: number,
    measureCode: number
  ): Promise<void> {
    const productRows = await this.productRowBuilder.build(
      inquiry,
      measureCode,
      this.config.vatRate
    );

    await this.client.setProductRows({
      ownerType: this.config.dealOwnerType,
      ownerId: dealId,
      productRows,
    });
  }

  private async clearDealCloseDateSafely(dealId: number): Promise<void> {
    let lastError: unknown;

    // Portale Bitrix24 mogą różnie interpretować czyszczenie pola daty.
    // Najpierw używamy wartości null, a następnie pustego ciągu jako
    // zgodnego wstecznie wariantu awaryjnego.
    for (const closedate of [null, ""] as const) {
      try {
        await this.client.call("crm.item.update", {
          entityTypeId: this.config.dealEntityTypeId,
          id: dealId,
          fields: { closedate },
        });
        return;
      } catch (error) {
        lastError = error;
      }
    }

    // Bitrix24 domyślnie ustawia datę końcową Deala na +7 dni.
    // Brak możliwości jej wyczyszczenia nie może jednak zerwać całej
    // synchronizacji zapytania ani spowodować utraty danych klienta.
    console.warn("Nie udało się wyczyścić daty końcowej Deala:", {
      dealId,
      error: sanitizeError(lastError),
    });
  }

  private async markDealAsSynced(
    dealId: number,
    metadata: Bitrix24RuntimeMetadata
  ): Promise<void> {
    await this.client.call("crm.item.update", {
      entityTypeId: this.config.dealEntityTypeId,
      id: dealId,
      fields: {
        [DEAL_FIELDS.syncStatus]: getEnumValueId(
          metadata.dealFields,
          DEAL_FIELDS.syncStatus,
          "Zsynchronizowano"
        ),
        [DEAL_FIELDS.syncedAt]: new Date().toISOString(),
        [DEAL_FIELDS.syncError]: "",
      },
      useOriginalUfNames: "Y",
    });
  }

  private async markDealAsFailedSafely(
    dealId: number,
    metadata: Bitrix24RuntimeMetadata,
    message: string
  ): Promise<void> {
    try {
      await this.client.call("crm.item.update", {
        entityTypeId: this.config.dealEntityTypeId,
        id: dealId,
        fields: {
          [DEAL_FIELDS.syncStatus]: getEnumValueId(
            metadata.dealFields,
            DEAL_FIELDS.syncStatus,
            "Błąd"
          ),
          [DEAL_FIELDS.syncError]: message,
        },
        useOriginalUfNames: "Y",
      });
    } catch (updateError) {
      console.warn("Nie udało się zapisać błędu synchronizacji w Dealu:", {
        dealId,
        error: sanitizeError(updateError),
      });
    }
  }
}

function createDealTitle(inquiry: StoredCalculatorInquiryLead): string {
  const productType = inquiry.quote.configurationSummary.find(
    (row) => row.label === "Typ produktu"
  )?.value;
  const configuration = inquiry.quote.configuration;
  const dimensions = `${configuration.length} × ${configuration.width} cm`;

  return `${productType ?? "Zapytanie"} ${dimensions} — ${
    inquiry.customer.name
  }`.trim();
}

function createDealComments(
  inquiry: StoredCalculatorInquiryLead,
  targetFinancials: RecalculatedQuoteFinancials | null
): string {
  const configuration = inquiry.quote.configurationSummary
    .map((row) => `${row.label}: ${row.value}`)
    .join("\n");

  const items = targetFinancials
    ? targetFinancials.items
        .map(
          (item) =>
            `${item.name}: netto ${item.totalPriceNet.toFixed(2)} ${
              inquiry.quote.currency
            }, VAT ${targetFinancials.vatRate}% ${item.totalTaxAmount.toFixed(
              2
            )} ${inquiry.quote.currency}, brutto ${item.totalPriceGross.toFixed(
              2
            )} ${inquiry.quote.currency}`
        )
        .join("\n")
    : inquiry.quote.items
        .map(
          (item) =>
            `${item.name}: ${item.totalPriceGross.toFixed(2)} ${
              inquiry.quote.currency
            }`
        )
        .join("\n");

  const financialSummary = targetFinancials
    ? [
        `Razem netto: ${targetFinancials.totalNet.toFixed(2)} ${
          inquiry.quote.currency
        }`,
        `VAT ${targetFinancials.vatRate}%: ${targetFinancials.totalTaxAmount.toFixed(
          2
        )} ${inquiry.quote.currency}`,
        `Razem brutto Deala: ${targetFinancials.totalGross.toFixed(2)} ${
          inquiry.quote.currency
        }`,
        `Wycena orientacyjna strony: ${getQuoteSnapshotWebsiteTotalGross(
          inquiry.quote
        ).toFixed(2)} ${inquiry.quote.currency}`,
      ]
    : [
        `Razem: ${inquiry.quote.totalGross.toFixed(2)} ${
          inquiry.quote.currency
        }`,
      ];

  return [
    "Źródło: Kalkulator strony MoonGlass",
    `Numer zapytania: ${inquiry.id}`,
    `Data przyjęcia: ${inquiry.receivedAt}`,
    "",
    `Klient: ${inquiry.customer.name}`,
    `E-mail: ${inquiry.customer.email}`,
    `Telefon: ${inquiry.customer.phone}`,
    `Wiadomość: ${inquiry.customer.message || "Brak"}`,
    "",
    "Konfiguracja:",
    configuration,
    "",
    "Pozycje:",
    items,
    "",
    ...financialSummary,
  ].join("\n");
}

function splitCustomerName(name: string): {
  firstName: string;
  lastName: string;
} {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length <= 1) {
    return { firstName: parts[0] ?? "Klient", lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function createContactExternalKey(
  inquiry: StoredCalculatorInquiryLead
): string {
  return inquiry.customer.email.trim().toLowerCase() || inquiry.id;
}

function mapRoofType(
  roof: StoredCalculatorInquiryLead["quote"]["configuration"]["roof"]
): string {
  const mapping = {
    polycarbonate_clear: "Poliwęglan bezbarwny",
    polycarbonate_milky: "Poliwęglan mleczny",
    polycarbonate_grey: "Poliwęglan szary",
    polycarbonate_smoke: "Poliwęglan dymiony",
    glass_clear: "Szkło bezbarwne",
    glass_milky: "Indywidualne",
    glass_tinted: "Szkło przyciemniane",
  } as const;

  return mapping[roof];
}

function mapWallType(
  walls: StoredCalculatorInquiryLead["quote"]["configuration"]["walls"]
): string {
  const mapping = {
    none: "Brak",
    glass_clear: "Szkło bezbarwne",
    glass_milky: "Indywidualne",
    glass_tinted: "Szkło przyciemniane",
  } as const;

  return mapping[walls];
}

function readQuoteVersion(): string {
  return String(
    generatedPricingSnapshot.metadata.pricingVersion ??
      generatedPricingSnapshot.metadata.workbookVersion ??
      "MoonGlass"
  );
}

function toBitrixBoolean(value: boolean): "Y" | "N" {
  return value ? "Y" : "N";
}

function removeUndefinedFields(
  fields: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined)
  );
}

function sanitizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/https:\/\/[^\s/]+\/rest\/\d+\/[^\s/]+/gi, "[BITRIX24_WEBHOOK]")
    .slice(0, 4000);
}
