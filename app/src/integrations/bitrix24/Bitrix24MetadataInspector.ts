import type { Bitrix24Client } from "./Bitrix24Client";
import type { Bitrix24Config } from "./Bitrix24Config";
import type {
  Bitrix24Category,
  Bitrix24ItemFieldDefinition,
  Bitrix24Status,
} from "./Bitrix24Types";

export interface Bitrix24DealStageGroup {
  categoryId: number;
  categoryName: string;
  statusEntityId: string;
  stages: Bitrix24Status[];
}

export interface Bitrix24DealMetadataInspection {
  entityTypeId: number;
  categories: Bitrix24Category[];
  stageGroups: Bitrix24DealStageGroup[];
  fields: Record<string, Bitrix24ItemFieldDefinition>;
  suggestedEnv: {
    BITRIX24_DEAL_ENTITY_TYPE_ID: string;
    BITRIX24_DEFAULT_CATEGORY_ID: string;
    BITRIX24_DEFAULT_STAGE_ID: string;
  };
}

export class Bitrix24MetadataInspector {
  constructor(
    private readonly client: Bitrix24Client,
    private readonly config: Bitrix24Config
  ) {}

  async inspectDealMetadata(): Promise<Bitrix24DealMetadataInspection> {
    const entityTypeId = this.config.dealEntityTypeId;

    const categoriesResponse = await this.client.listCrmCategories({
      entityTypeId,
    });

    const categories = categoriesResponse.result?.categories ?? [];

    const stageGroups = await Promise.all(
      categories.map(async (category) => {
        const statusEntityId = createDealStageStatusEntityId(category.id);
        const statusesResponse = await this.client.listCrmStatuses({
          filter: {
            ENTITY_ID: statusEntityId,
          },
        });

        return {
          categoryId: category.id,
          categoryName: category.name,
          statusEntityId,
          stages: statusesResponse.result ?? [],
        };
      })
    );

    const fieldsResponse = await this.client.getCrmItemFields({
      entityTypeId,
      useOriginalUfNames: true,
    });

    const fields = fieldsResponse.result?.fields ?? {};

    return {
      entityTypeId,
      categories,
      stageGroups,
      fields,
      suggestedEnv: createSuggestedEnv(categories, stageGroups, entityTypeId),
    };
  }
}

function createDealStageStatusEntityId(categoryId: number): string {
  if (categoryId === 0) {
    return "DEAL_STAGE";
  }

  return `DEAL_STAGE_${categoryId}`;
}

function createSuggestedEnv(
  categories: Bitrix24Category[],
  stageGroups: Bitrix24DealStageGroup[],
  entityTypeId: number
): Bitrix24DealMetadataInspection["suggestedEnv"] {
  const firstCategory = categories[0];
  const firstStage = stageGroups[0]?.stages[0];

  return {
    BITRIX24_DEAL_ENTITY_TYPE_ID: String(entityTypeId),
    BITRIX24_DEFAULT_CATEGORY_ID:
      firstCategory?.id !== undefined ? String(firstCategory.id) : "",
    BITRIX24_DEFAULT_STAGE_ID: firstStage?.STATUS_ID ?? "",
  };
}