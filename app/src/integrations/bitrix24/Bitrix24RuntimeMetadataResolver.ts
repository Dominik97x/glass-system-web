import type { Bitrix24Client } from "./Bitrix24Client";
import type { Bitrix24Config } from "./Bitrix24Config";
import type {
  Bitrix24ItemFieldDefinition,
  Bitrix24Measure,
  Bitrix24Status,
} from "./Bitrix24Types";

const CONTACT_ENTITY_TYPE_ID = 3;

export interface Bitrix24RuntimeMetadata {
  categoryId: number;
  stageId: string;
  sourceId: string;
  measureCode: number;
  dealFields: Record<string, Bitrix24ItemFieldDefinition>;
  contactFields: Record<string, Bitrix24ItemFieldDefinition>;
}

const globalForBitrixMetadata = globalThis as typeof globalThis & {
  bitrix24RuntimeMetadataPromise?: Promise<Bitrix24RuntimeMetadata>;
};

export class Bitrix24RuntimeMetadataResolver {
  constructor(
    private readonly client: Bitrix24Client,
    private readonly config: Bitrix24Config
  ) {}

  async resolve(): Promise<Bitrix24RuntimeMetadata> {
    if (!globalForBitrixMetadata.bitrix24RuntimeMetadataPromise) {
      globalForBitrixMetadata.bitrix24RuntimeMetadataPromise =
        this.resolveFresh().catch((error) => {
          delete globalForBitrixMetadata.bitrix24RuntimeMetadataPromise;
          throw error;
        });
    }

    return globalForBitrixMetadata.bitrix24RuntimeMetadataPromise;
  }

  private async resolveFresh(): Promise<Bitrix24RuntimeMetadata> {
    const [categoryResponse, dealFieldsResponse, contactFieldsResponse] =
      await Promise.all([
        this.client.listCrmCategories({
          entityTypeId: this.config.dealEntityTypeId,
        }),
        this.client.getCrmItemFields({
          entityTypeId: this.config.dealEntityTypeId,
          useOriginalUfNames: "Y",
        }),
        this.client.getCrmItemFields({
          entityTypeId: CONTACT_ENTITY_TYPE_ID,
          useOriginalUfNames: "Y",
        }),
      ]);

    const categories = categoryResponse.result?.categories ?? [];
    const category = this.config.defaultCategoryId !== undefined
      ? categories.find(
          (candidate) => Number(candidate.id) === this.config.defaultCategoryId
        )
      : categories.find(
          (candidate) =>
            normalize(candidate.name) === normalize(this.config.salesPipelineName)
        );

    if (!category) {
      throw new Error(
        `Nie znaleziono lejka Bitrix24 „${this.config.salesPipelineName}”. Uruchom npm run bitrix:verify.`
      );
    }

    const stageResponse = await this.client.listCrmStatuses({
      filter: {
        ENTITY_ID:
          Number(category.id) === 0
            ? "DEAL_STAGE"
            : `DEAL_STAGE_${category.id}`,
      },
    });
    const stages = stageResponse.result ?? [];
    const stage = this.config.defaultStageId
      ? stages.find(
          (candidate) => candidate.STATUS_ID === this.config.defaultStageId
        )
      : findStatusByName(stages, this.config.newInquiryStageName);

    if (!stage) {
      throw new Error(
        `Nie znaleziono etapu Bitrix24 „${this.config.newInquiryStageName}”. Uruchom npm run bitrix:verify.`
      );
    }

    const sourceResponse = await this.client.listCrmStatuses({
      filter: { ENTITY_ID: "SOURCE" },
    });
    const sources = sourceResponse.result ?? [];
    const source = this.config.sourceId
      ? sources.find((candidate) => candidate.STATUS_ID === this.config.sourceId)
      : findStatusByName(sources, this.config.calculatorSourceName);

    if (!source) {
      throw new Error(
        `Nie znaleziono źródła Bitrix24 „${this.config.calculatorSourceName}”. Uruchom npm run bitrix:verify.`
      );
    }

    const measureCode = await this.resolvePieceMeasureCode();

    return {
      categoryId: Number(category.id),
      stageId: stage.STATUS_ID,
      sourceId: source.STATUS_ID,
      measureCode,
      dealFields: dealFieldsResponse.result?.fields ?? {},
      contactFields: contactFieldsResponse.result?.fields ?? {},
    };
  }

  private async resolvePieceMeasureCode(): Promise<number> {
    const response = await this.client.call<{
      result?: { measures?: Bitrix24Measure[] };
    }>("catalog.measure.list", {
      select: [
        "id",
        "code",
        "measureTitle",
        "symbol",
        "symbolIntl",
        "symbolLetterIntl",
      ],
      order: { id: "asc" },
      filter: {},
    });
    const measures = response.result?.measures ?? [];

    // Kod 796 jest standardowym kodem jednostki „sztuka” i został już
    // potwierdzony przez zakończony powodzeniem test D2 na tym portalu.
    const piece =
      measures.find((measure) => Number(measure.code) === 796) ??
      measures.find((measure) => {
        const label = [
          measure.measureTitle,
          measure.symbol,
          measure.symbolIntl,
          measure.symbolLetterIntl,
        ]
          .filter(Boolean)
          .join(" ");

        return ["szt", "sztuka", "piece", "pcs"].some((candidate) =>
          normalize(label).includes(candidate)
        );
      });
    const code = Number(piece?.code);

    if (!Number.isFinite(code) || code <= 0) {
      const availableCodes = measures
        .map((measure) => String(measure.code ?? ""))
        .filter(Boolean)
        .join(", ");

      throw new Error(
        `Nie znaleziono jednostki „szt.” w katalogu Bitrix24. Dostępne kody: ${availableCodes || "brak"}.`
      );
    }

    return code;
  }
}

export function getEnumValueId(
  fields: Record<string, Bitrix24ItemFieldDefinition>,
  fieldName: string,
  wantedValue: string
): string | number {
  const definition = fields[fieldName];

  if (!definition) {
    throw new Error(`Bitrix24 nie zwrócił pola ${fieldName}.`);
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

function findStatusByName(
  statuses: Bitrix24Status[],
  name: string
): Bitrix24Status | undefined {
  return statuses.find(
    (candidate) =>
      normalize(candidate.NAME ?? candidate.NAME_INIT ?? "") === normalize(name)
  );
}

function normalize(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}
