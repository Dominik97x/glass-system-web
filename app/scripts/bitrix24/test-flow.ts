import path from "node:path";
import generatedPricingSnapshot from "../../src/data/pricing/glass-system/published-pricing.generated.json";
import { ProvisionerBitrixClient } from "./client";
import type { ProvisionerEnv } from "./env";
import { writeJson, writeText } from "./io";
import { Bitrix24Provisioner } from "./provisioner";
import type { ProvisioningMapping } from "./types";

const TEST_CONTACT_EMAIL = "bitrix-d2-test@moonglass.pl";
const TEST_CONTACT_PHONE = "+48500000001";
const TEST_CONTACT_EXTERNAL_KEY = "MOONGLASS:D2:CONTACT:V1";
const TEST_DEAL_XML_ID = "MOONGLASS:D2:DEAL:300X306:V1";
const TEST_INQUIRY_ID = "D2-TEST-300X306-V1";
const TEST_REPORT_JSON = "test-flow.json";
const TEST_REPORT_MD = "test-flow.md";
const DEAL_ENTITY_TYPE_ID = 2;
const CONTACT_ENTITY_TYPE_ID = 3;
const DEAL_OWNER_TYPE = "D";
const VAT_RATE = 8;
const MONEY_TOLERANCE = 0.02;

interface TestPricingRow {
  productType: string;
  widthCm: number;
  lengthCm: number;
  constructionGross: number;
  wallGlassClearGross: number;
  roofGlassClearGross: number;
  awningGross: number;
  ledStripGross: number;
  levelingProfileGross: number;
  active: boolean;
}

interface TestQuoteItem {
  id: string;
  name: string;
  unitPriceGross: number;
}

interface TestQuote {
  items: TestQuoteItem[];
  totalGross: number;
  currency: string;
}

const TEST_CONFIGURATION_SUMMARY = [
  "Typ produktu: Ogród zimowy",
  "Wymiary: 306 × 300 cm",
  "Dach: Szkło bezbarwne",
  "Ściany: Szkło bezbarwne",
  "Rolety ZIP: Brak",
  "Markiza: Tak",
  "Oświetlenie: LED CCT",
  "Akcesoria: profil wyrównujący",
].join("\n");

const TEST_ROW_DEFINITIONS = [
  { quoteItemId: "construction", sku: "MG-WG-BASE-D300-W306" },
  { quoteItemId: "roof", sku: "MG-ROOF-GLASS-CLEAR-D300-W306" },
  { quoteItemId: "walls", sku: "MG-WALL-CLEAR-D300-W306" },
  { quoteItemId: "awning", sku: "MG-AWNING-D300-W306" },
  { quoteItemId: "led", sku: "MG-LED-CCT-D300-W306" },
  { quoteItemId: "accessories", sku: "MG-FOUNDATION-D300-W306" },
] as const;

interface DuplicateSearchResult {
  LEAD?: number[];
  CONTACT?: number[];
  COMPANY?: number[];
}

interface CrmItemFieldDefinition {
  type?: string;
  upperName?: string;
  title?: string;
  items?: Array<{
    ID?: string | number;
    VALUE?: string;
    id?: string | number;
    value?: string;
  }>;
}

interface CrmItemFieldsResult {
  fields?: Record<string, CrmItemFieldDefinition>;
}

interface CrmItem {
  id?: number | string;
  title?: string;
  xmlId?: string;
  categoryId?: number | string;
  stageId?: string;
  sourceId?: string;
  opportunity?: number | string;
  currencyId?: string;
  isManualOpportunity?: boolean | "Y" | "N";
  contactId?: number | string;
  contactIds?: Array<number | string>;
  [key: string]: unknown;
}

interface CrmItemAddResult {
  item?: CrmItem;
}

interface CrmDealListItem {
  ID?: number | string;
  TITLE?: string;
  [key: string]: unknown;
}

interface CrmItemGetResult {
  item?: CrmItem;
}

interface ProductRowResult {
  id?: number;
  ownerId?: number;
  ownerType?: string;
  productId?: number;
  productName?: string;
  price?: number | string;
  priceBrutto?: number | string;
  quantity?: number | string;
  taxRate?: number | string | null;
  taxIncluded?: "Y" | "N" | string;
  measureCode?: number | string;
  measureName?: string;
  sort?: number | string;
}

interface ProductRowsResult {
  productRows?: ProductRowResult[];
}

interface CatalogMeasure {
  id: number;
  code: number;
  measureTitle?: string;
  symbol?: string;
  symbolIntl?: string;
  symbolLetterIntl?: string;
}

interface CatalogMeasuresResult {
  measures?: CatalogMeasure[];
}

interface TestFlowProductRowReport {
  productId: number;
  sku: string;
  productName: string;
  priceGross: number;
  quantity: number;
  taxRate: number;
  taxIncluded: "Y";
  measureCode: number;
  measureName?: string;
}

export interface Bitrix24TestFlowResult {
  generatedAt: string;
  portalHost: string;
  contactId: number;
  contactWasCreated: boolean;
  contactReusedOnSecondCheck: boolean;
  dealId: number;
  dealWasCreated: boolean;
  dealReusedOnSecondCheck: boolean;
  categoryId: number;
  stageId: string;
  sourceId: string;
  currency: string;
  totalGross: number;
  opportunity: number;
  vatRate: number;
  productRows: TestFlowProductRowReport[];
  checkedCustomFields: Record<string, unknown>;
  notes: string[];
}

export class Bitrix24TestFlow {
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

  async run(confirmValue: string | undefined): Promise<Bitrix24TestFlowResult> {
    if (confirmValue !== "MOONGLASS") {
      throw new Error(
        "Test D2 modyfikuje prawdziwy CRM i wymaga potwierdzenia: npm run bitrix:test-flow -- --confirm=MOONGLASS"
      );
    }

    const verification = await this.provisioner.verify();
    if (!verification.ok) {
      throw new Error(
        `Konfiguracja bazowa Bitrix24 nie jest kompletna. Pozostałe działania: ${verification.remainingActions.length}. Najpierw uruchom npm run bitrix:verify.`
      );
    }

    // Ponowna synchronizacja pilota jest celowa: aktualizuje istniejące produkty,
    // ustawia jednostkę „szt.” i nie tworzy duplikatów dzięki stabilnym SKU.
    const mapping = await this.provisioner.applyPilotProducts("MOONGLASS");
    assertRequiredMapping(mapping);

    const dealFields = await this.getCrmItemFields(DEAL_ENTITY_TYPE_ID);
    const contactFields = await this.getCrmItemFields(CONTACT_ENTITY_TYPE_ID);
    const pieceMeasure = await this.getPieceMeasure();

    const firstContact = await this.ensureTestContact(
      mapping,
      contactFields
    );
    const secondContact = await this.ensureTestContact(
      mapping,
      contactFields
    );
    if (firstContact.id !== secondContact.id) {
      throw new Error(
        `Kontrola duplikatu kontaktu nie powiodła się: pierwsze ID ${firstContact.id}, drugie ID ${secondContact.id}.`
      );
    }

    const quote = buildTestQuote();
    const expectedRows = buildExpectedProductRows(mapping, quote.items);

    const dealFieldsPayload = this.buildDealFields(
      mapping,
      dealFields,
      firstContact.id,
      quote.totalGross
    );

    const dealExternalKeyField = requireUserFieldName(
      mapping,
      "deal.MG_WEB_INQUIRY_ID"
    );
    const firstDeal = await this.ensureTestDeal(
      dealFieldsPayload,
      dealExternalKeyField
    );
    await sleep(400);
    const secondDeal = await this.ensureTestDeal(
      dealFieldsPayload,
      dealExternalKeyField
    );
    if (firstDeal.id !== secondDeal.id) {
      throw new Error(
        `Kontrola idempotencji Deala nie powiodła się: pierwsze ID ${firstDeal.id}, drugie ID ${secondDeal.id}.`
      );
    }

    await this.client.call<ProductRowsResult>("crm.item.productrow.set", {
      ownerType: DEAL_OWNER_TYPE,
      ownerId: firstDeal.id,
      productRows: expectedRows.map((row, index) => ({
        productId: row.productId,
        price: row.priceGross,
        quantity: 1,
        taxRate: VAT_RATE,
        taxIncluded: "Y",
        measureCode: pieceMeasure.code,
        sort: (index + 1) * 10,
      })),
    });

    const actualRows = await this.readProductRows(firstDeal.id);
    const actualDeal = await this.waitForDealAmount(
      firstDeal.id,
      quote.totalGross
    );

    const checkedCustomFields = this.verifyDeal(
      actualDeal,
      actualRows,
      expectedRows,
      mapping,
      dealFields,
      firstContact.id,
      quote.totalGross,
      pieceMeasure.code
    );

    const result: Bitrix24TestFlowResult = {
      generatedAt: new Date().toISOString(),
      portalHost: this.client.portalHost,
      contactId: firstContact.id,
      contactWasCreated: firstContact.created,
      contactReusedOnSecondCheck: !secondContact.created,
      dealId: firstDeal.id,
      dealWasCreated: firstDeal.created,
      dealReusedOnSecondCheck: !secondDeal.created,
      categoryId: mapping.pipelines.sales.categoryId,
      stageId: mapping.stages["sales.MG_NEW"].stageId,
      sourceId: mapping.sources.MG_WEB_CALC.statusId,
      currency: quote.currency,
      totalGross: quote.totalGross,
      opportunity: asMoney(actualDeal.opportunity),
      vatRate: VAT_RATE,
      productRows: actualRows.map((row) => ({
        productId: Number(row.productId),
        sku:
          expectedRows.find(
            (expected) => expected.productId === Number(row.productId)
          )?.sku ?? "UNKNOWN",
        productName: String(row.productName ?? ""),
        priceGross: asMoney(row.price),
        quantity: asNumber(row.quantity),
        taxRate: asNumber(row.taxRate),
        taxIncluded: "Y",
        measureCode: Number(row.measureCode),
        measureName: row.measureName,
      })),
      checkedCustomFields,
      notes: [
        "Montaż nie jest osobną płatną pozycją w tym teście, ponieważ opublikowany cennik strony przechowuje ceny brutto komponentów wraz z przypisanymi kosztami montażu i realizacji.",
        "crm.item.productrow.set zastępuje cały zestaw pozycji testowego Deala; stabilne pole ID zapytania MoonGlass zapobiega tworzeniu kolejnych testowych Deali.",
      ],
    };

    writeJson(path.join(this.env.reportDir, TEST_REPORT_JSON), result);
    writeText(
      path.join(this.env.reportDir, TEST_REPORT_MD),
      renderMarkdown(result)
    );
    return result;
  }

  private async getCrmItemFields(
    entityTypeId: number
  ): Promise<Record<string, CrmItemFieldDefinition>> {
    const result = await this.client.call<CrmItemFieldsResult>(
      "crm.item.fields",
      {
        entityTypeId,
        useOriginalUfNames: "Y",
      }
    );
    return result.fields ?? {};
  }

  private async ensureTestContact(
    mapping: ProvisioningMapping,
    contactFields: Record<string, CrmItemFieldDefinition>
  ): Promise<{ id: number; created: boolean }> {
    const idsByCommunication = new Map<string, number[]>();
    for (const [type, value] of [
      ["EMAIL", TEST_CONTACT_EMAIL],
      ["PHONE", TEST_CONTACT_PHONE],
    ] as const) {
      const result = await this.client.call<DuplicateSearchResult>(
        "crm.duplicate.findbycomm",
        {
          entity_type: "CONTACT",
          type,
          values: [value],
        }
      );
      const ids = (result.CONTACT ?? [])
        .map(Number)
        .filter(Number.isFinite);
      idsByCommunication.set(type, [...new Set(ids)]);
    }

    const existingIds = new Set(
      [...idsByCommunication.values()].flat()
    );
    if (existingIds.size > 1) {
      throw new Error(
        `Testowy e-mail i telefon wskazują różne lub zduplikowane Kontakty: ${[...existingIds].join(", ")}. Połącz/usuń duplikaty w Bitrix24 przed ponownym testem.`
      );
    }

    const fields = this.buildContactFields(
      mapping,
      contactFields
    );

    if (existingIds.size > 0) {
      const id = [...existingIds].sort((a, b) => a - b)[0];
      await this.client.call("crm.contact.update", {
        id,
        fields,
      });
      return { id, created: false };
    }

    const id = await this.client.call<number>("crm.contact.add", {
      fields,
    });
    if (!Number.isFinite(Number(id))) {
      throw new Error("Bitrix24 nie zwrócił ID testowego Kontaktu.");
    }
    return { id: Number(id), created: true };
  }

  private buildContactFields(
    mapping: ProvisioningMapping,
    contactFields: Record<string, CrmItemFieldDefinition>
  ): Record<string, unknown> {
    const field = (alias: string): string =>
      requireUserFieldName(mapping, `contact.${alias}`);

    return {
      NAME: "Jan",
      LAST_NAME: "Testowy MoonGlass [D2]",
      OPENED: "N",
      SOURCE_ID: mapping.sources.MG_WEB_CALC.statusId,
      COMMENTS:
        "Kontakt techniczny utworzony przez test D2 MoonGlass. Nie jest to prawdziwy klient.",
      ORIGINATOR_ID: "MOONGLASS",
      ORIGIN_ID: TEST_CONTACT_EXTERNAL_KEY,
      EMAIL: [{ VALUE: TEST_CONTACT_EMAIL, VALUE_TYPE: "WORK" }],
      PHONE: [{ VALUE: TEST_CONTACT_PHONE, VALUE_TYPE: "WORK" }],
      [field("MG_PREFERRED_CHANNEL")]: enumValue(
        contactFields,
        field("MG_PREFERRED_CHANNEL"),
        "E-mail"
      ),
      [field("MG_CUSTOMER_TYPE")]: enumValue(
        contactFields,
        field("MG_CUSTOMER_TYPE"),
        "Osoba prywatna"
      ),
      [field("MG_RODO_SOURCE")]: enumValue(
        contactFields,
        field("MG_RODO_SOURCE"),
        "Kalkulator strony"
      ),
      [field("MG_RODO_DATE")]: new Date().toISOString(),
      [field("MG_MARKETING_CONSENT")]: "N",
      [field("MG_EXTERNAL_CONTACT_KEY")]: TEST_CONTACT_EXTERNAL_KEY,
    };
  }

  private buildDealFields(
    mapping: ProvisioningMapping,
    dealFields: Record<string, CrmItemFieldDefinition>,
    contactId: number,
    totalGross: number
  ): Record<string, unknown> {
    const field = (alias: string): string =>
      requireUserFieldName(mapping, `deal.${alias}`);
    const summary = TEST_CONFIGURATION_SUMMARY;
    const pricingVersion = String(
      generatedPricingSnapshot.metadata.pricingVersion ??
        generatedPricingSnapshot.metadata.workbookVersion ??
        "MoonGlass"
    );

    return {
      title: "[TEST D2] Ogród zimowy 300×306 cm — Jan Testowy",
      xmlId: TEST_DEAL_XML_ID,
      opened: false,
      categoryId: mapping.pipelines.sales.categoryId,
      stageId: mapping.stages["sales.MG_NEW"].stageId,
      sourceId: mapping.sources.MG_WEB_CALC.statusId,
      sourceDescription: "Automatyczny test D2 integracji MoonGlass",
      contactIds: [contactId],
      currencyId: "PLN",
      isManualOpportunity: false,
      comments: [
        "DANE TESTOWE — można pozostawić do kontroli lub później usunąć ręcznie.",
        "",
        summary,
        "",
        `Oczekiwana suma brutto: ${totalGross.toFixed(2)} PLN`,
      ].join("\n"),
      [field("MG_WEB_INQUIRY_ID")]: TEST_INQUIRY_ID,
      [field("MG_LOCAL_LEAD_ID")]: TEST_INQUIRY_ID,
      [field("MG_QUOTE_VERSION")]: pricingVersion,
      [field("MG_SOURCE_URL")]: "http://localhost:3000/kalkulator",
      [field("MG_SYNC_STATUS")]: enumValue(
        dealFields,
        field("MG_SYNC_STATUS"),
        "Zsynchronizowano"
      ),
      [field("MG_SYNCED_AT")]: new Date().toISOString(),
      [field("MG_SYNC_ERROR")]: "",
      [field("MG_CLIENT_TYPE")]: enumValue(
        dealFields,
        field("MG_CLIENT_TYPE"),
        "Osoba prywatna"
      ),
      [field("MG_CITY")]: "Lublin",
      [field("MG_VOIVODESHIP")]: enumValue(
        dealFields,
        field("MG_VOIVODESHIP"),
        "Lubelskie"
      ),
      [field("MG_PRODUCT_TYPE")]: enumValue(
        dealFields,
        field("MG_PRODUCT_TYPE"),
        "Ogród zimowy"
      ),
      [field("MG_DEPTH_CM")]: 300,
      [field("MG_WIDTH_CM")]: 306,
      [field("MG_ROOF_TYPE")]: enumValue(
        dealFields,
        field("MG_ROOF_TYPE"),
        "Szkło bezbarwne"
      ),
      [field("MG_WALL_TYPE")]: enumValue(
        dealFields,
        field("MG_WALL_TYPE"),
        "Szkło bezbarwne"
      ),
      [field("MG_ZIP_FRONT")]: "N",
      [field("MG_ZIP_LEFT")]: "N",
      [field("MG_ZIP_RIGHT")]: "N",
      [field("MG_AWNING")]: "Y",
      [field("MG_LED_POINT")]: "N",
      [field("MG_LED_CCT")]: "Y",
      [field("MG_FOUNDATION")]: "Y",
      [field("MG_BRUSHES")]: "N",
      [field("MG_HANDLES")]: "N",
      [field("MG_CUSTOM_QUOTE")]: "N",
      [field("MG_CONFIGURATION_TEXT")]: summary,
      [field("MG_SERVER_TOTAL_GROSS")]: `${totalGross.toFixed(2)}|PLN`,
      [field("MG_VAT_RATE")]: enumValue(
        dealFields,
        field("MG_VAT_RATE"),
        "8%"
      ),
      [field("MG_DISCOUNT_PERCENT")]: 0,
      [field("MG_CONTACT_ATTEMPTS")]: 0,
      [field("MG_PHOTOS_STATUS")]: enumValue(
        dealFields,
        field("MG_PHOTOS_STATUS"),
        "Nie wymagane"
      ),
      [field("MG_MEASUREMENT_REQUIRED")]: "Y",
    };
  }

  private async ensureTestDeal(
    fields: Record<string, unknown>,
    externalKeyFieldName: string
  ): Promise<{ id: number; created: boolean }> {
    // Pole xmlId jest dostępne przy zapisie i odczycie Deala, ale Bitrix24
    // nie pozwala filtrować po nim w crm.item.list. Do idempotencji używamy
    // więc naszego stabilnego pola MG_WEB_INQUIRY_ID.
    const items = await this.client.call<CrmDealListItem[]>(
      "crm.deal.list",
      {
        order: { ID: "ASC" },
        filter: { [`=${externalKeyFieldName}`]: TEST_INQUIRY_ID },
        select: ["ID", "TITLE", externalKeyFieldName],
      }
    );
    if (items.length > 1) {
      throw new Error(
        `Znaleziono ${items.length} testowych Deali z ID zapytania ${TEST_INQUIRY_ID}. Usuń duplikaty przed ponownym uruchomieniem.`
      );
    }
    const first = items[0];
    const existingId = Number(first?.ID);

    if (Number.isFinite(existingId)) {
      await this.client.call<CrmItemAddResult>("crm.item.update", {
        entityTypeId: DEAL_ENTITY_TYPE_ID,
        id: existingId,
        fields,
        useOriginalUfNames: "Y",
      });
      return { id: existingId, created: false };
    }

    const created = await this.client.call<CrmItemAddResult>("crm.item.add", {
      entityTypeId: DEAL_ENTITY_TYPE_ID,
      fields,
      useOriginalUfNames: "Y",
    });
    const id = Number(created.item?.id);
    if (!Number.isFinite(id)) {
      throw new Error("Bitrix24 nie zwrócił ID testowego Deala.");
    }
    return { id, created: true };
  }

  private async readProductRows(dealId: number): Promise<ProductRowResult[]> {
    const result = await this.client.call<ProductRowsResult>(
      "crm.item.productrow.list",
      {
        filter: {
          "=ownerType": DEAL_OWNER_TYPE,
          "=ownerId": dealId,
        },
        order: { sort: "asc" },
      }
    );
    return result.productRows ?? [];
  }

  private async waitForDealAmount(
    dealId: number,
    expectedTotal: number
  ): Promise<CrmItem> {
    let lastItem: CrmItem | undefined;
    for (let attempt = 1; attempt <= 8; attempt += 1) {
      const result = await this.client.call<CrmItemGetResult>("crm.item.get", {
        entityTypeId: DEAL_ENTITY_TYPE_ID,
        id: dealId,
        useOriginalUfNames: "Y",
      });
      lastItem = result.item;
      if (
        lastItem &&
        nearlyEqual(asMoney(lastItem.opportunity), expectedTotal)
      ) {
        return lastItem;
      }
      if (attempt < 8) await sleep(attempt * 500);
    }

    if (!lastItem) throw new Error(`Nie udało się odczytać Deala #${dealId}.`);
    throw new Error(
      `Kwota Deala nie została przeliczona prawidłowo. Oczekiwano ${expectedTotal.toFixed(
        2
      )} PLN, otrzymano ${asMoney(lastItem.opportunity).toFixed(2)} PLN.`
    );
  }

  private verifyDeal(
    deal: CrmItem,
    actualRows: ProductRowResult[],
    expectedRows: ExpectedProductRow[],
    mapping: ProvisioningMapping,
    dealFields: Record<string, CrmItemFieldDefinition>,
    contactId: number,
    expectedTotal: number,
    pieceMeasureCode: number
  ): Record<string, unknown> {
    assertEqual(
      Number(deal.categoryId),
      mapping.pipelines.sales.categoryId,
      "lejek Deala"
    );
    assertEqual(
      String(deal.stageId),
      mapping.stages["sales.MG_NEW"].stageId,
      "etap Deala"
    );
    assertEqual(
      String(deal.sourceId),
      mapping.sources.MG_WEB_CALC.statusId,
      "źródło Deala"
    );
    const contacts = (deal.contactIds ?? [deal.contactId])
      .filter((value) => value !== undefined && value !== null)
      .map(Number);
    if (!contacts.includes(contactId)) {
      throw new Error(
        `Deal nie jest powiązany z testowym Kontaktem #${contactId}. Odczytane kontakty: ${contacts.join(", ") || "brak"}.`
      );
    }

    if (actualRows.length !== expectedRows.length) {
      throw new Error(
        `Nieprawidłowa liczba pozycji produktowych. Oczekiwano ${expectedRows.length}, otrzymano ${actualRows.length}.`
      );
    }

    for (const expected of expectedRows) {
      const actual = actualRows.find(
        (row) => Number(row.productId) === expected.productId
      );
      if (!actual) {
        throw new Error(
          `Brakuje pozycji produktu ${expected.sku} (#${expected.productId}) w Dealu.`
        );
      }
      if (!nearlyEqual(asMoney(actual.price), expected.priceGross)) {
        throw new Error(
          `Cena produktu ${expected.sku} jest nieprawidłowa. Oczekiwano ${expected.priceGross}, otrzymano ${asMoney(actual.price)}.`
        );
      }
      assertEqual(asNumber(actual.quantity), 1, `ilość ${expected.sku}`);
      assertEqual(
        String(actual.taxIncluded),
        "Y",
        `flaga VAT w cenie ${expected.sku}`
      );
      assertEqual(
        asNumber(actual.taxRate),
        VAT_RATE,
        `stawka VAT ${expected.sku}`
      );
      assertEqual(
        Number(actual.measureCode),
        pieceMeasureCode,
        `jednostka ${expected.sku}`
      );
    }

    const rowsTotal = actualRows.reduce(
      (sum, row) => sum + asMoney(row.price) * asNumber(row.quantity),
      0
    );
    if (!nearlyEqual(rowsTotal, expectedTotal)) {
      throw new Error(
        `Suma pozycji jest nieprawidłowa. Oczekiwano ${expectedTotal.toFixed(
          2
        )}, otrzymano ${rowsTotal.toFixed(2)}.`
      );
    }
    if (!nearlyEqual(asMoney(deal.opportunity), expectedTotal)) {
      throw new Error(
        `Kwota Deala jest nieprawidłowa. Oczekiwano ${expectedTotal.toFixed(
          2
        )}, otrzymano ${asMoney(deal.opportunity).toFixed(2)}.`
      );
    }

    const expectedFields: Array<[string, unknown, string]> = [
      ["MG_WEB_INQUIRY_ID", TEST_INQUIRY_ID, "ID zapytania"],
      ["MG_DEPTH_CM", 300, "głębokość"],
      ["MG_WIDTH_CM", 306, "szerokość"],
      ["MG_AWNING", "Y", "markiza"],
      ["MG_LED_CCT", "Y", "LED CCT"],
      ["MG_FOUNDATION", "Y", "fundament/profil"],
      [
        "MG_PRODUCT_TYPE",
        enumValue(
          dealFields,
          requireUserFieldName(mapping, "deal.MG_PRODUCT_TYPE"),
          "Ogród zimowy"
        ),
        "typ produktu",
      ],
      [
        "MG_ROOF_TYPE",
        enumValue(
          dealFields,
          requireUserFieldName(mapping, "deal.MG_ROOF_TYPE"),
          "Szkło bezbarwne"
        ),
        "typ dachu",
      ],
      [
        "MG_WALL_TYPE",
        enumValue(
          dealFields,
          requireUserFieldName(mapping, "deal.MG_WALL_TYPE"),
          "Szkło bezbarwne"
        ),
        "typ ścian",
      ],
    ];

    const checked: Record<string, unknown> = {};
    for (const [alias, expected, label] of expectedFields) {
      const fieldName = requireUserFieldName(mapping, `deal.${alias}`);
      const actual = deal[fieldName];
      if (!looselyEqual(actual, expected)) {
        throw new Error(
          `Pole ${label} (${fieldName}) ma nieprawidłową wartość. Oczekiwano ${String(
            expected
          )}, otrzymano ${String(actual)}.`
        );
      }
      checked[fieldName] = actual;
    }

    const moneyField = requireUserFieldName(
      mapping,
      "deal.MG_SERVER_TOTAL_GROSS"
    );
    const moneyValue = String(deal[moneyField] ?? "");
    if (!moneyValue.startsWith(expectedTotal.toFixed(2)) && !moneyValue.startsWith(String(expectedTotal))) {
      throw new Error(
        `Pole zweryfikowanej kwoty brutto (${moneyField}) ma wartość ${moneyValue}, oczekiwano ${expectedTotal}|PLN.`
      );
    }
    checked[moneyField] = deal[moneyField];
    return checked;
  }

  private async getPieceMeasure(): Promise<CatalogMeasure> {
    const result = await this.client.call<CatalogMeasuresResult>(
      "catalog.measure.list",
      {
        select: [
          "id",
          "code",
          "measureTitle",
          "symbol",
          "symbolIntl",
          "symbolLetterIntl",
        ],
        order: { id: "asc" },
      }
    );
    const measures = result.measures ?? [];
    const piece =
      measures.find((measure) => Number(measure.code) === 796) ??
      measures.find((measure) => {
        const label = [
          measure.measureTitle,
          measure.symbol,
          measure.symbolIntl,
          measure.symbolLetterIntl,
        ]
          .join(" ")
          .toLowerCase();
        return /(^|\s)(szt\.?|pcs?|piece)(\s|$)/i.test(label);
      });
    if (!piece) {
      throw new Error(
        "Nie znaleziono jednostki szt. w katalog.measure.list. Dodaj ją w katalogu Bitrix24 albo ustaw kod 796."
      );
    }
    return piece;
  }
}

interface ExpectedProductRow {
  quoteItemId: string;
  sku: string;
  productId: number;
  productName: string;
  priceGross: number;
}

function buildExpectedProductRows(
  mapping: ProvisioningMapping,
  quoteItems: Array<{
    id: string;
    name: string;
    unitPriceGross: number;
  }>
): ExpectedProductRow[] {
  if (!mapping.catalog) throw new Error("Brak mapowania katalogu Bitrix24.");
  return TEST_ROW_DEFINITIONS.map((definition) => {
    const product = mapping.catalog?.products[definition.sku];
    if (!product) {
      throw new Error(
        `Brak produktu ${definition.sku}. Uruchom npm run bitrix:products:pilot -- --confirm=MOONGLASS.`
      );
    }
    const quoteItem = quoteItems.find(
      (item) => item.id === definition.quoteItemId
    );
    if (!quoteItem) {
      throw new Error(
        `W wycenie testowej brakuje pozycji ${definition.quoteItemId}.`
      );
    }
    return {
      quoteItemId: definition.quoteItemId,
      sku: definition.sku,
      productId: Number(product.id),
      productName: product.name,
      priceGross: quoteItem.unitPriceGross,
    };
  });
}

function buildTestQuote(): TestQuote {
  const snapshot = generatedPricingSnapshot as unknown as {
    metadata: { currency?: string };
    priceMatrix: TestPricingRow[];
  };
  const row = snapshot.priceMatrix.find(
    (candidate) =>
      candidate.productType === "winter_garden" &&
      candidate.lengthCm === 300 &&
      candidate.widthCm === 306 &&
      candidate.active
  );
  if (!row) {
    throw new Error(
      "Brak aktywnego wiersza cennika winter_garden 300×306 w published-pricing.generated.json."
    );
  }

  const items: TestQuoteItem[] = [
    {
      id: "construction",
      name: "Konstrukcja ogrodu zimowego",
      unitPriceGross: row.constructionGross,
    },
    {
      id: "roof",
      name: "Szkło dachowe bezbarwne",
      unitPriceGross: row.roofGlassClearGross,
    },
    {
      id: "walls",
      name: "Ściany szklane bezbarwne",
      unitPriceGross: row.wallGlassClearGross,
    },
    {
      id: "awning",
      name: "Markiza dachowa",
      unitPriceGross: row.awningGross,
    },
    {
      id: "led",
      name: "Oświetlenie LED CCT",
      unitPriceGross: row.ledStripGross,
    },
    {
      id: "accessories",
      name: "Profil poziomujący / przygotowanie fundamentu",
      unitPriceGross: row.levelingProfileGross,
    },
  ];
  for (const item of items) {
    if (!Number.isFinite(item.unitPriceGross) || item.unitPriceGross <= 0) {
      throw new Error(
        `Pozycja testowa ${item.id} ma nieprawidłową cenę brutto: ${item.unitPriceGross}.`
      );
    }
  }
  return {
    items,
    totalGross: items.reduce(
      (sum, item) => sum + item.unitPriceGross,
      0
    ),
    currency: snapshot.metadata.currency ?? "PLN",
  };
}

function assertRequiredMapping(mapping: ProvisioningMapping): void {
  const required = [
    mapping.pipelines.sales,
    mapping.stages["sales.MG_NEW"],
    mapping.sources.MG_WEB_CALC,
    mapping.catalog,
  ];
  if (required.some((value) => !value)) {
    throw new Error(
      "Mapowanie Bitrix24 jest niekompletne. Uruchom npm run bitrix:verify i npm run bitrix:products:pilot."
    );
  }
  for (const definition of TEST_ROW_DEFINITIONS) {
    if (!mapping.catalog?.products[definition.sku]) {
      throw new Error(`Brak produktu pilotażowego ${definition.sku}.`);
    }
  }
}

function requireUserFieldName(
  mapping: ProvisioningMapping,
  key: string
): string {
  const field = mapping.userFields[key];
  if (!field?.fieldName) {
    throw new Error(`Brak mapowania pola ${key}.`);
  }
  return field.fieldName;
}

function enumValue(
  fields: Record<string, CrmItemFieldDefinition>,
  fieldName: string,
  wantedValue: string
): string | number {
  const definition = fields[fieldName];
  if (!definition) {
    throw new Error(`crm.item.fields nie zwrócił pola ${fieldName}.`);
  }
  const item = definition.items?.find(
    (candidate) =>
      normalize(candidate.VALUE ?? candidate.value) === normalize(wantedValue)
  );
  const id = item?.ID ?? item?.id;
  if (id === undefined || id === null || id === "") {
    throw new Error(
      `Pole ${fieldName} nie ma wartości listy „${wantedValue}”.`
    );
  }
  return id;
}

function asMoney(value: unknown): number {
  if (typeof value === "number") return value;
  const raw = String(value ?? "0").split("|")[0].replace(",", ".");
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function asNumber(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function nearlyEqual(left: number, right: number): boolean {
  return Math.abs(left - right) <= MONEY_TOLERANCE;
}

function looselyEqual(actual: unknown, expected: unknown): boolean {
  if (typeof expected === "number") return Number(actual) === expected;
  if (expected === "Y" || expected === "N") {
    return normalizeBoolean(actual) === expected;
  }
  return String(actual ?? "") === String(expected ?? "");
}

function normalizeBoolean(value: unknown): "Y" | "N" {
  return value === true || value === 1 || value === "1" || value === "Y"
    ? "Y"
    : "N";
}

function assertEqual(
  actual: unknown,
  expected: unknown,
  label: string
): void {
  if (String(actual) !== String(expected)) {
    throw new Error(
      `Nieprawidłowa wartość „${label}”. Oczekiwano ${String(
        expected
      )}, otrzymano ${String(actual)}.`
    );
  }
}

function normalize(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function renderMarkdown(result: Bitrix24TestFlowResult): string {
  return [
    "# Wynik testu D2 — Bitrix24 MoonGlass",
    "",
    `- Portal: \`${result.portalHost}\``,
    `- Kontakt: \`#${result.contactId}\``,
    `- Deal: \`#${result.dealId}\``,
    `- Lejek: \`${result.categoryId}\``,
    `- Etap: \`${result.stageId}\``,
    `- Źródło: \`${result.sourceId}\``,
    `- Suma: **${result.totalGross.toFixed(2)} ${result.currency}**`,
    `- VAT: **${result.vatRate}%**, zawarty w cenach`,
    `- Pozycje: **${result.productRows.length}**`,
    "",
    "## Pozycje produktowe",
    "",
    ...result.productRows.map(
      (row) =>
        `- \`${row.sku}\` — ${row.productName}: ${row.priceGross.toFixed(
          2
        )} PLN, ${row.quantity} szt., VAT ${row.taxRate}%`
    ),
    "",
    "## Kontrole",
    "",
    "- ponowne wyszukanie Kontaktu zwróciło ten sam rekord,",
    "- ponowne uruchomienie dla ID zapytania MoonGlass wykorzystało ten sam Deal,",
    "- lejek, etap, źródło i powiązanie z Kontaktem są poprawne,",
    "- pola niestandardowe przyjęły wartości,",
    "- suma pozycji i kwota Deala są zgodne z kalkulatorem serwerowym,",
    "- pozycje mają jednostkę szt. i VAT 8% zawarty w cenie.",
    "",
    ...result.notes.map((note) => `> ${note}`),
    "",
  ].join("\n");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

