import {
  KNOWN_PRICING_PRODUCT_TYPES,
  KNOWN_QUOTE_ITEM_CATEGORIES,
  createPricingSnapshotDimensionKey,
  type PricingSnapshot,
  type PricingSnapshotBitrixProductMapping,
  type PricingSnapshotDimension,
  type PricingSnapshotMetadata,
  type PricingSnapshotPriceMatrixRow,
  type PricingSnapshotProductType,
  type PricingSnapshotProductTypeRecord,
  type PricingSnapshotQuoteItemCategory,
  type PricingSnapshotVatRule,
} from "./PricingSnapshot";

export type PricingSnapshotValidationSeverity = "error" | "warning";

export interface PricingSnapshotValidationIssue {
  severity: PricingSnapshotValidationSeverity;
  path: string;
  message: string;
}

export interface PricingSnapshotValidationResult {
  success: boolean;
  errors: PricingSnapshotValidationIssue[];
  warnings: PricingSnapshotValidationIssue[];
  issues: PricingSnapshotValidationIssue[];
}

const PRICE_MATRIX_PRICE_FIELDS = [
  "constructionGross",
  "wallGlassClearGross",
  "wallGlassMilkyGross",
  "wallGlassTintedGross",
  "roofPolycarbonateClearGross",
  "roofPolycarbonateMilkyGross",
  "roofPolycarbonateGreyGross",
  "roofPolycarbonateSmokeGross",
  "roofGlassClearGross",
  "roofGlassMilkyGross",
  "roofGlassTintedGross",
  "zipRightGross",
  "zipLeftGross",
  "zipFrontGross",
  "awningGross",
  "levelingProfileGross",
  "ledSpotGross",
  "ledStripGross",
  "ledCobGross",
  "handlesGross",
  "brushesGross",
] as const satisfies ReadonlyArray<keyof PricingSnapshotPriceMatrixRow>;

export function validatePricingSnapshot(
  snapshot: PricingSnapshot
): PricingSnapshotValidationResult {
  const issues: PricingSnapshotValidationIssue[] = [];

  validateMetadata(snapshot.metadata, issues);
  validateProductTypes(snapshot.productTypes, issues);
  validateDimensions(snapshot.dimensions, snapshot.productTypes, issues);
  validatePriceMatrix(
    snapshot.priceMatrix,
    snapshot.dimensions,
    snapshot.productTypes,
    issues
  );
  validateVatRules(snapshot.vatRules, issues);
  validateBitrixProductMappings(
    snapshot.bitrixProductMappings,
    snapshot.dimensions,
    snapshot.productTypes,
    snapshot.vatRules,
    issues
  );
  validateSnapshotCompleteness(snapshot, issues);

  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");

  return {
    success: errors.length === 0,
    errors,
    warnings,
    issues,
  };
}

export function hasPricingSnapshotErrors(
  result: PricingSnapshotValidationResult
): boolean {
  return result.errors.length > 0;
}

function validateMetadata(
  metadata: PricingSnapshotMetadata,
  issues: PricingSnapshotValidationIssue[]
): void {
  validateRequiredText(
    metadata.workbookVersion,
    "metadata.workbookVersion",
    "Wersja struktury arkusza jest wymagana.",
    issues
  );
  validateRequiredText(
    metadata.pricingVersion,
    "metadata.pricingVersion",
    "Wersja cennika jest wymagana.",
    issues
  );
  validateRequiredText(
    metadata.currency,
    "metadata.currency",
    "Waluta cennika jest wymagana.",
    issues
  );
  validateRequiredText(
    metadata.source,
    "metadata.source",
    "Źródło cennika jest wymagane.",
    issues
  );
  validateRequiredText(
    metadata.publishedBy,
    "metadata.publishedBy",
    "Informacja o publikującym cennik jest wymagana.",
    issues
  );
  validateRequiredText(
    metadata.importedAt,
    "metadata.importedAt",
    "Data importu jest wymagana.",
    issues
  );

  if (metadata.currency !== "PLN") {
    addWarning(
      issues,
      "metadata.currency",
      `Waluta "${metadata.currency}" jest nietypowa. Aktualnie zakładamy PLN.`
    );
  }

  if (!isKnownPriceMode(metadata.defaultPriceMode)) {
    addError(
      issues,
      "metadata.defaultPriceMode",
      `Nieznany tryb ceny: "${metadata.defaultPriceMode}". Dozwolone wartości: gross, net.`
    );
  }

  validateVatRate(
    metadata.defaultVatRate,
    "metadata.defaultVatRate",
    issues
  );

  if (
    metadata.importedAt.trim().length > 0 &&
    Number.isNaN(Date.parse(metadata.importedAt))
  ) {
    addError(
      issues,
      "metadata.importedAt",
      "Data importu musi być poprawną datą ISO."
    );
  }
}

function validateProductTypes(
  productTypes: PricingSnapshotProductTypeRecord[],
  issues: PricingSnapshotValidationIssue[]
): void {
  if (productTypes.length === 0) {
    addError(
      issues,
      "productTypes",
      "Snapshot musi zawierać przynajmniej jeden typ produktu."
    );
    return;
  }

  const seenProductTypes = new Set<string>();
  const activeProductTypes = new Set<string>();

  productTypes.forEach((productType, index) => {
    const path = `productTypes[${index}]`;

    validateRequiredText(
      productType.productType,
      `${path}.productType`,
      "Kod typu produktu jest wymagany.",
      issues
    );
    validateRequiredText(
      productType.productName,
      `${path}.productName`,
      "Nazwa typu produktu jest wymagana.",
      issues
    );

    if (seenProductTypes.has(productType.productType)) {
      addError(
        issues,
        `${path}.productType`,
        `Zduplikowany typ produktu: "${productType.productType}".`
      );
    }

    seenProductTypes.add(productType.productType);

    if (productType.active) {
      activeProductTypes.add(productType.productType);
    }

    if (!isKnownProductType(productType.productType)) {
      addWarning(
        issues,
        `${path}.productType`,
        `Typ produktu "${productType.productType}" nie jest jeszcze znany w domenie aplikacji. To może być poprawne dla przyszłych produktów, ale wymaga świadomej decyzji.`
      );
    }
  });

  if (activeProductTypes.size === 0) {
    addError(
      issues,
      "productTypes",
      "Snapshot musi zawierać przynajmniej jeden aktywny typ produktu."
    );
  }
}

function validateDimensions(
  dimensions: PricingSnapshotDimension[],
  productTypes: PricingSnapshotProductTypeRecord[],
  issues: PricingSnapshotValidationIssue[]
): void {
  if (dimensions.length === 0) {
    addError(
      issues,
      "dimensions",
      "Snapshot musi zawierać przynajmniej jeden wymiar."
    );
    return;
  }

  const productTypeSet = createProductTypeSet(productTypes);
  const activeDimensionKeys = new Set<string>();

  dimensions.forEach((dimension, index) => {
    const path = `dimensions[${index}]`;

    validateProductTypeReference(
      dimension.productType,
      productTypeSet,
      `${path}.productType`,
      issues
    );
    validatePositiveNumber(
      dimension.widthCm,
      `${path}.widthCm`,
      "Szerokość musi być liczbą większą od zera.",
      issues
    );
    validatePositiveNumber(
      dimension.lengthCm,
      `${path}.lengthCm`,
      "Długość musi być liczbą większą od zera.",
      issues
    );
    validateRequiredText(
      dimension.label,
      `${path}.label`,
      "Etykieta wymiaru jest wymagana.",
      issues
    );

    const key = createPricingSnapshotDimensionKey(
      dimension.productType,
      dimension.widthCm,
      dimension.lengthCm
    );

    if (dimension.active) {
      if (activeDimensionKeys.has(key)) {
        addError(
          issues,
          path,
          `Zduplikowany aktywny wymiar: "${key}".`
        );
      }

      activeDimensionKeys.add(key);
    }
  });
}

function validatePriceMatrix(
  priceMatrix: PricingSnapshotPriceMatrixRow[],
  dimensions: PricingSnapshotDimension[],
  productTypes: PricingSnapshotProductTypeRecord[],
  issues: PricingSnapshotValidationIssue[]
): void {
  if (priceMatrix.length === 0) {
    addError(
      issues,
      "priceMatrix",
      "Snapshot musi zawierać przynajmniej jeden wiersz macierzy cen."
    );
    return;
  }

  const productTypeSet = createProductTypeSet(productTypes);
  const activeDimensionKeys = createActiveDimensionKeySet(dimensions);
  const activePriceMatrixKeys = new Set<string>();

  priceMatrix.forEach((row, index) => {
    const path = `priceMatrix[${index}]`;

    validateProductTypeReference(
      row.productType,
      productTypeSet,
      `${path}.productType`,
      issues
    );
    validatePositiveNumber(
      row.widthCm,
      `${path}.widthCm`,
      "Szerokość musi być liczbą większą od zera.",
      issues
    );
    validatePositiveNumber(
      row.lengthCm,
      `${path}.lengthCm`,
      "Długość musi być liczbą większą od zera.",
      issues
    );

    PRICE_MATRIX_PRICE_FIELDS.forEach((field) => {
      validateNonNegativeNumber(
        row[field],
        `${path}.${field}`,
        `Pole "${field}" musi być liczbą większą lub równą zero.`,
        issues
      );
    });

    const key = createPricingSnapshotDimensionKey(
      row.productType,
      row.widthCm,
      row.lengthCm
    );

    if (!row.active) {
      return;
    }

    if (activePriceMatrixKeys.has(key)) {
      addError(
        issues,
        path,
        `Zduplikowany aktywny wiersz macierzy cen dla wymiaru: "${key}".`
      );
    }

    activePriceMatrixKeys.add(key);

    if (!activeDimensionKeys.has(key)) {
      addError(
        issues,
        path,
        `Aktywny wiersz macierzy cen nie ma odpowiadającego aktywnego wymiaru w app_dimensions: "${key}".`
      );
    }
  });
}

function validateVatRules(
  vatRules: PricingSnapshotVatRule[],
  issues: PricingSnapshotValidationIssue[]
): void {
  if (vatRules.length === 0) {
    addError(
      issues,
      "vatRules",
      "Snapshot musi zawierać reguły VAT."
    );
    return;
  }

  const activeCategoryKeys = new Set<string>();

  vatRules.forEach((rule, index) => {
    const path = `vatRules[${index}]`;

    validateRequiredText(
      rule.quoteItemCategory,
      `${path}.quoteItemCategory`,
      "Kategoria pozycji oferty jest wymagana.",
      issues
    );
    validateVatRate(rule.vatRate, `${path}.vatRate`, issues);

    if (!isKnownPriceMode(rule.priceMode)) {
      addError(
        issues,
        `${path}.priceMode`,
        `Nieznany tryb ceny: "${rule.priceMode}". Dozwolone wartości: gross, net.`
      );
    }

    if (!isKnownQuoteItemCategory(rule.quoteItemCategory)) {
      addWarning(
        issues,
        `${path}.quoteItemCategory`,
        `Kategoria "${rule.quoteItemCategory}" nie jest jeszcze znana w domenie aplikacji. To może być poprawne dla przyszłych pozycji, ale wymaga świadomej decyzji.`
      );
    }

    if (!rule.active) {
      return;
    }

    if (activeCategoryKeys.has(rule.quoteItemCategory)) {
      addError(
        issues,
        path,
        `Zduplikowana aktywna reguła VAT dla kategorii: "${rule.quoteItemCategory}".`
      );
    }

    activeCategoryKeys.add(rule.quoteItemCategory);
  });

  KNOWN_QUOTE_ITEM_CATEGORIES.forEach((category) => {
    if (!activeCategoryKeys.has(category)) {
      addWarning(
        issues,
        "vatRules",
        `Brakuje aktywnej reguły VAT dla kategorii "${category}".`
      );
    }
  });
}

function validateBitrixProductMappings(
  mappings: PricingSnapshotBitrixProductMapping[],
  dimensions: PricingSnapshotDimension[],
  productTypes: PricingSnapshotProductTypeRecord[],
  vatRules: PricingSnapshotVatRule[],
  issues: PricingSnapshotValidationIssue[]
): void {
  const productTypeSet = createProductTypeSet(productTypes);
  const activeDimensionKeys = createActiveDimensionKeySet(dimensions);
  const activeVatRuleCategorySet = createActiveVatRuleCategorySet(vatRules);
  const activeMappingKeys = new Set<string>();

  mappings.forEach((mapping, index) => {
    const path = `bitrixProductMappings[${index}]`;

    validateRequiredText(
      mapping.quoteItemCategory,
      `${path}.quoteItemCategory`,
      "Kategoria pozycji oferty jest wymagana.",
      issues
    );
    validateRequiredText(
      mapping.quoteItemKey,
      `${path}.quoteItemKey`,
      "Klucz pozycji oferty jest wymagany.",
      issues
    );
    validateRequiredText(
      mapping.bitrixProductName,
      `${path}.bitrixProductName`,
      "Nazwa produktu Bitrix24 jest wymagana.",
      issues
    );
    validateVatRate(mapping.vatRate, `${path}.vatRate`, issues);

    if (
      mapping.productType !== undefined &&
      !productTypeSet.has(mapping.productType)
    ) {
      addError(
        issues,
        `${path}.productType`,
        `Mapowanie wskazuje na nieznany typ produktu: "${mapping.productType}".`
      );
    }

    if (
      mapping.widthCm !== undefined &&
      !isPositiveFiniteNumber(mapping.widthCm)
    ) {
      addError(
        issues,
        `${path}.widthCm`,
        "Szerokość w mapowaniu Bitrix24 musi być liczbą większą od zera."
      );
    }

    if (
      mapping.lengthCm !== undefined &&
      !isPositiveFiniteNumber(mapping.lengthCm)
    ) {
      addError(
        issues,
        `${path}.lengthCm`,
        "Długość w mapowaniu Bitrix24 musi być liczbą większą od zera."
      );
    }

    if (!mapping.active) {
      return;
    }

    if (!activeVatRuleCategorySet.has(mapping.quoteItemCategory)) {
      addWarning(
        issues,
        `${path}.quoteItemCategory`,
        `Aktywne mapowanie Bitrix24 nie ma aktywnej reguły VAT dla kategorii "${mapping.quoteItemCategory}".`
      );
    }

    if (mapping.bitrixProductId === undefined) {
      addWarning(
        issues,
        `${path}.bitrixProductId`,
        "Aktywne mapowanie nie ma jeszcze ID produktu Bitrix24. To jest dopuszczalne przed pobraniem katalogu, ale docelowo powinno zostać uzupełnione."
      );
    }

    const mappingKey = createBitrixProductMappingKey(mapping);

    if (activeMappingKeys.has(mappingKey)) {
      addError(
        issues,
        path,
        `Zduplikowane aktywne mapowanie Bitrix24: "${mappingKey}".`
      );
    }

    activeMappingKeys.add(mappingKey);

    if (
      mapping.productType !== undefined &&
      mapping.widthCm !== undefined &&
      mapping.lengthCm !== undefined
    ) {
      const dimensionKey = createPricingSnapshotDimensionKey(
        mapping.productType,
        mapping.widthCm,
        mapping.lengthCm
      );

      if (!activeDimensionKeys.has(dimensionKey)) {
        addWarning(
          issues,
          path,
          `Aktywne mapowanie Bitrix24 wskazuje na wymiar, którego nie ma jako aktywny wymiar: "${dimensionKey}".`
        );
      }
    }
  });
}

function validateSnapshotCompleteness(
  snapshot: PricingSnapshot,
  issues: PricingSnapshotValidationIssue[]
): void {
  const activeDimensionKeys = createActiveDimensionKeySet(snapshot.dimensions);
  const activePriceMatrixKeys = createActivePriceMatrixKeySet(
    snapshot.priceMatrix
  );

  activeDimensionKeys.forEach((dimensionKey) => {
    if (!activePriceMatrixKeys.has(dimensionKey)) {
      addError(
        issues,
        "priceMatrix",
        `Brakuje aktywnego wiersza macierzy cen dla wymiaru: "${dimensionKey}".`
      );
    }
  });

  const activeProductTypes = snapshot.productTypes.filter(
    (productType) => productType.active
  );

  activeProductTypes.forEach((productType) => {
    const hasActiveDimension = snapshot.dimensions.some(
      (dimension) =>
        dimension.active && dimension.productType === productType.productType
    );

    if (!hasActiveDimension) {
      addWarning(
        issues,
        "dimensions",
        `Aktywny typ produktu "${productType.productType}" nie ma żadnego aktywnego wymiaru.`
      );
    }
  });
}

function validateProductTypeReference(
  productType: PricingSnapshotProductType,
  productTypeSet: Set<string>,
  path: string,
  issues: PricingSnapshotValidationIssue[]
): void {
  validateRequiredText(
    productType,
    path,
    "Typ produktu jest wymagany.",
    issues
  );

  if (productType.trim().length > 0 && !productTypeSet.has(productType)) {
    addError(
      issues,
      path,
      `Nieznany typ produktu: "${productType}". Dodaj go do app_product_types.`
    );
  }
}

function validateRequiredText(
  value: string,
  path: string,
  message: string,
  issues: PricingSnapshotValidationIssue[]
): void {
  if (value.trim().length === 0) {
    addError(issues, path, message);
  }
}

function validatePositiveNumber(
  value: number,
  path: string,
  message: string,
  issues: PricingSnapshotValidationIssue[]
): void {
  if (!isPositiveFiniteNumber(value)) {
    addError(issues, path, message);
  }
}

function validateNonNegativeNumber(
  value: number,
  path: string,
  message: string,
  issues: PricingSnapshotValidationIssue[]
): void {
  if (!Number.isFinite(value) || value < 0) {
    addError(issues, path, message);
  }
}

function validateVatRate(
  value: number,
  path: string,
  issues: PricingSnapshotValidationIssue[]
): void {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    addError(
      issues,
      path,
      "Stawka VAT musi być liczbą od 0 do 100."
    );
  }
}

function createProductTypeSet(
  productTypes: PricingSnapshotProductTypeRecord[]
): Set<string> {
  return new Set(productTypes.map((productType) => productType.productType));
}

function createActiveDimensionKeySet(
  dimensions: PricingSnapshotDimension[]
): Set<string> {
  return new Set(
    dimensions
      .filter((dimension) => dimension.active)
      .map((dimension) =>
        createPricingSnapshotDimensionKey(
          dimension.productType,
          dimension.widthCm,
          dimension.lengthCm
        )
      )
  );
}

function createActivePriceMatrixKeySet(
  priceMatrix: PricingSnapshotPriceMatrixRow[]
): Set<string> {
  return new Set(
    priceMatrix
      .filter((row) => row.active)
      .map((row) =>
        createPricingSnapshotDimensionKey(
          row.productType,
          row.widthCm,
          row.lengthCm
        )
      )
  );
}

function createActiveVatRuleCategorySet(
  vatRules: PricingSnapshotVatRule[]
): Set<string> {
  return new Set(
    vatRules
      .filter((rule) => rule.active)
      .map((rule) => rule.quoteItemCategory)
  );
}

function createBitrixProductMappingKey(
  mapping: PricingSnapshotBitrixProductMapping
): string {
  return [
    mapping.quoteItemCategory,
    mapping.quoteItemKey,
    mapping.productType ?? "*",
    mapping.widthCm?.toString() ?? "*",
    mapping.lengthCm?.toString() ?? "*",
    mapping.optionCode ?? "*",
  ].join(":");
}

function isKnownProductType(productType: PricingSnapshotProductType): boolean {
  return KNOWN_PRICING_PRODUCT_TYPES.includes(
    productType as (typeof KNOWN_PRICING_PRODUCT_TYPES)[number]
  );
}

function isKnownQuoteItemCategory(
  category: PricingSnapshotQuoteItemCategory
): boolean {
  return KNOWN_QUOTE_ITEM_CATEGORIES.includes(
    category as (typeof KNOWN_QUOTE_ITEM_CATEGORIES)[number]
  );
}

function isKnownPriceMode(value: string): boolean {
  return value === "gross" || value === "net";
}

function isPositiveFiniteNumber(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function addError(
  issues: PricingSnapshotValidationIssue[],
  path: string,
  message: string
): void {
  issues.push({
    severity: "error",
    path,
    message,
  });
}

function addWarning(
  issues: PricingSnapshotValidationIssue[],
  path: string,
  message: string
): void {
  issues.push({
    severity: "warning",
    path,
    message,
  });
}