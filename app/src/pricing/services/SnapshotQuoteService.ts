import generatedPricingSnapshot from "@/data/pricing/glass-system/published-pricing.generated.json";
import {
  getProductKind,
  type ProductConfiguration,
  type ProductKind,
  type RoofOption,
  type WallOption,
} from "@/domain/ProductConfiguration";
import type { Quote, QuoteFinancials } from "@/domain/Quote";
import type {
  QuoteFinancialLineItem,
  QuoteItem,
  QuoteItemFinancials,
  QuoteItemCategory,
} from "@/domain/QuoteItem";
import type { PricingSnapshot } from "@/pricing/snapshots/PricingSnapshot";
import {
  PricingSnapshotPriceReader,
  type PricingSnapshotGrossPriceField,
  type PricingSnapshotNetPriceField,
} from "@/pricing/snapshots/PricingSnapshotPriceReader";
import {
  calculateTaxFromNet,
  roundMoney,
} from "@/pricing/snapshots/PricingSnapshotTaxCalculator";
import { validatePricingSnapshot } from "@/pricing/snapshots/PricingSnapshotValidator";

interface PricingCriteria {
  productType: ProductKind;
  widthCm: number;
  lengthCm: number;
}

interface PricingComponent {
  id: string;
  name: string;
  category: QuoteItemCategory;
  net: number;
  websiteGross: number;
  taxAmount: number;
  accountingGross: number;
}

interface SnapshotQuoteItemInput {
  id: string;
  name: string;
  category: QuoteItem["category"];
  components: PricingComponent[];
}

const snapshot = generatedPricingSnapshot as PricingSnapshot;

export class SnapshotQuoteService {
  private readonly reader: PricingSnapshotPriceReader;
  private readonly vatRate: number;

  constructor() {
    const validation = validatePricingSnapshot(snapshot);
    if (!validation.success) {
      throw new Error(
        `Generated pricing snapshot is invalid: ${validation.errors
          .map((issue) => issue.message)
          .join(", ")}`
      );
    }

    this.reader = new PricingSnapshotPriceReader(snapshot);
    this.vatRate = Number(
      snapshot.metadata.websiteDefaultVatRate ??
        snapshot.metadata.defaultVatRate ??
        8
    );

    assertValidVatRate(this.vatRate);
  }

  createQuote(configuration: ProductConfiguration): Quote {
    assertPriceableConfiguration(configuration);

    const productType = getProductKind(configuration);
    const criteria: PricingCriteria = {
      productType,
      widthCm: configuration.width,
      lengthCm: configuration.length,
    };
    const dimension = `${configuration.length}×${configuration.width} cm`;
    const websiteItems: QuoteItem[] = [];
    const financialLineItems: QuoteFinancialLineItem[] = [];

    const constructionName =
      productType === "winter_garden" ? "Ogród zimowy" : "Zadaszenie tarasu";

    this.addWebsiteGroup(websiteItems, financialLineItems, {
      id: "construction",
      name: "Konstrukcja z dachem poliwęglanowym",
      category: "construction",
      components: [
        this.getComponent(
          criteria,
          "construction",
          `${constructionName} ${dimension}`,
          "construction",
          "constructionNet",
          "constructionGross"
        ),
      ],
    });

    const roofFields = getRoofPriceFields(configuration.roof);
    this.addWebsiteGroup(websiteItems, financialLineItems, {
      id: "roof",
      name: "Dopłata do wariantu dachu",
      category: "roof",
      components: [
        this.getComponent(
          criteria,
          `roof_${configuration.roof}`,
          `${getRoofName(configuration.roof)} ${dimension}`,
          "roof",
          roofFields.net,
          roofFields.gross
        ),
      ],
    });

    if (configuration.walls !== "none") {
      const wallFields = getWallPriceFields(configuration.walls);
      this.addWebsiteGroup(websiteItems, financialLineItems, {
        id: "walls",
        name: "Ściany przesuwne",
        category: "walls",
        components: [
          this.getComponent(
            criteria,
            `walls_${configuration.walls}`,
            `${getWallName(configuration.walls)} ${dimension}`,
            "walls",
            wallFields.net,
            wallFields.gross
          ),
        ],
      });
    }

    const zipComponents: PricingComponent[] = [];
    if (configuration.hasFrontZip) {
      zipComponents.push(
        this.getComponent(
          criteria,
          "zip_front",
          `Roleta ZIP PRZÓD ${dimension}`,
          "zip",
          "zipFrontNet",
          "zipFrontGross"
        )
      );
    }
    if (configuration.walls !== "none" && configuration.hasLeftZip) {
      zipComponents.push(
        this.getComponent(
          criteria,
          "zip_left",
          `Roleta ZIP LEWA ${dimension}`,
          "zip",
          "zipLeftNet",
          "zipLeftGross"
        )
      );
    }
    if (configuration.walls !== "none" && configuration.hasRightZip) {
      zipComponents.push(
        this.getComponent(
          criteria,
          "zip_right",
          `Roleta ZIP PRAWA ${dimension}`,
          "zip",
          "zipRightNet",
          "zipRightGross"
        )
      );
    }
    this.addWebsiteGroup(websiteItems, financialLineItems, {
      id: "zip",
      name: "Rolety ZIP",
      category: "zip",
      components: zipComponents,
    });

    this.addWebsiteGroup(websiteItems, financialLineItems, {
      id: "awning",
      name: "Markiza",
      category: "awning",
      components: configuration.hasAwning
        ? [
            this.getComponent(
              criteria,
              "awning",
              `Markiza dachowa ${dimension}`,
              "awning",
              "awningNet",
              "awningGross"
            ),
          ]
        : [],
    });

    const lightingComponents = configuration.hasLed
      ? [
          this.getComponent(
            criteria,
            "led_point",
            `Oświetlenie LED punktowe ${dimension}`,
            "lighting",
            "ledSpotNet",
            "ledSpotGross"
          ),
        ]
      : configuration.hasCob
        ? [
            this.getComponent(
              criteria,
              "led_cct",
              `Oświetlenie LED CCT ${dimension}`,
              "lighting",
              "ledStripNet",
              "ledStripGross"
            ),
          ]
        : [];
    this.addWebsiteGroup(websiteItems, financialLineItems, {
      id: "led",
      name: configuration.hasCob
        ? "Oświetlenie LED CCT"
        : "Oświetlenie LED punktowe",
      category: "lighting",
      components: lightingComponents,
    });

    const accessoryComponents: PricingComponent[] = [];
    if (configuration.hasLevelingProfile) {
      accessoryComponents.push(
        this.getComponent(
          criteria,
          "leveling_profile",
          `Profil poziomujący / przygotowanie fundamentu ${dimension}`,
          "accessory",
          "levelingProfileNet",
          "levelingProfileGross"
        )
      );
    }
    if (configuration.hasBrushes) {
      accessoryComponents.push(
        this.getComponent(
          criteria,
          "brushes",
          `Zestaw szczotek przeciwkurzowych ${dimension}`,
          "accessory",
          "brushesNet",
          "brushesGross"
        )
      );
    }
    if (configuration.hasHandles) {
      accessoryComponents.push(
        this.getComponent(
          criteria,
          "handles",
          `Zestaw uchwytów ${dimension}`,
          "accessory",
          "handlesNet",
          "handlesGross"
        )
      );
    }
    this.addWebsiteGroup(websiteItems, financialLineItems, {
      id: "accessories",
      name: "Akcesoria",
      category: "accessory",
      components: accessoryComponents,
    });

    const websiteTotalGross = roundMoney(
      websiteItems.reduce((sum, item) => sum + item.totalPriceGross, 0)
    );
    const financials = createQuoteFinancials(
      financialLineItems,
      this.vatRate
    );

    return {
      configuration,
      items: websiteItems,
      // Zachowujemy dotychczasową orientacyjną wycenę strony bez zmian.
      totalGross: websiteTotalGross,
      financials,
      currency: "PLN",
    };
  }

  private addWebsiteGroup(
    websiteItems: QuoteItem[],
    financialLineItems: QuoteFinancialLineItem[],
    input: SnapshotQuoteItemInput
  ): void {
    const activeComponents = input.components.filter(
      (component) => component.net > 0 || component.websiteGross > 0
    );

    if (activeComponents.length === 0) {
      return;
    }

    for (const component of activeComponents) {
      if (component.net <= 0 || component.websiteGross <= 0) {
        throw new Error(
          `Niespójna cena pozycji ${component.name}: netto=${component.net}, brutto strony=${component.websiteGross}.`
        );
      }

      financialLineItems.push(
        createFinancialLineItem(component, this.vatRate)
      );
    }

    const financials: QuoteItemFinancials = {
      priceMode: "net",
      taxIncluded: false,
      vatRate: this.vatRate,
      unitPriceNet: roundMoney(
        activeComponents.reduce((sum, component) => sum + component.net, 0)
      ),
      unitTaxAmount: roundMoney(
        activeComponents.reduce(
          (sum, component) => sum + component.taxAmount,
          0
        )
      ),
      unitPriceGross: roundMoney(
        activeComponents.reduce(
          (sum, component) => sum + component.accountingGross,
          0
        )
      ),
      totalPriceNet: 0,
      totalTaxAmount: 0,
      totalPriceGross: 0,
    };

    financials.totalPriceNet = financials.unitPriceNet;
    financials.totalTaxAmount = financials.unitTaxAmount;
    financials.totalPriceGross = financials.unitPriceGross;

    const websiteGross = roundMoney(
      activeComponents.reduce(
        (sum, component) => sum + component.websiteGross,
        0
      )
    );

    websiteItems.push({
      id: input.id,
      name: input.name,
      category: input.category,
      quantity: 1,
      unitPriceGross: websiteGross,
      totalPriceGross: websiteGross,
      financials,
    });
  }

  private getComponent(
    criteria: PricingCriteria,
    id: string,
    name: string,
    category: QuoteItemCategory,
    netField: PricingSnapshotNetPriceField,
    grossField: PricingSnapshotGrossPriceField
  ): PricingComponent {
    const net = roundMoney(this.reader.getPrice(criteria, netField));
    const websiteGross = roundMoney(
      this.reader.getPrice(criteria, grossField)
    );

    if (net <= 0 && websiteGross <= 0) {
      return {
        id,
        name,
        category,
        net: 0,
        websiteGross: 0,
        taxAmount: 0,
        accountingGross: 0,
      };
    }

    const calculation = calculateTaxFromNet(net, this.vatRate);

    return {
      id,
      name,
      category,
      net,
      websiteGross,
      taxAmount: calculation.taxAmount,
      accountingGross: calculation.gross,
    };
  }
}

function createFinancialLineItem(
  component: PricingComponent,
  vatRate: number
): QuoteFinancialLineItem {
  return {
    id: component.id,
    name: component.name,
    category: component.category,
    quantity: 1,
    priceMode: "net",
    taxIncluded: false,
    vatRate,
    unitPriceNet: component.net,
    unitTaxAmount: component.taxAmount,
    unitPriceGross: component.accountingGross,
    totalPriceNet: component.net,
    totalTaxAmount: component.taxAmount,
    totalPriceGross: component.accountingGross,
    websiteUnitPriceGross: component.websiteGross,
    websiteTotalPriceGross: component.websiteGross,
  };
}

function createQuoteFinancials(
  items: QuoteFinancialLineItem[],
  vatRate: number
): QuoteFinancials {
  const totalNet = roundMoney(
    items.reduce((sum, item) => sum + item.totalPriceNet, 0)
  );
  const totalTaxAmount = roundMoney(
    items.reduce((sum, item) => sum + item.totalTaxAmount, 0)
  );
  const totalGross = roundMoney(
    items.reduce((sum, item) => sum + item.totalPriceGross, 0)
  );

  if (roundMoney(totalNet + totalTaxAmount) !== totalGross) {
    throw new Error(
      `Niespójne podsumowanie wyceny: netto ${totalNet}, VAT ${totalTaxAmount}, brutto ${totalGross}.`
    );
  }

  return {
    priceMode: "net",
    taxIncluded: false,
    defaultVatRate: vatRate,
    items,
    totalNet,
    totalTaxAmount,
    totalGross,
  };
}

function assertPriceableConfiguration(
  configuration: ProductConfiguration
): void {
  if (configuration.hasLed && configuration.hasCob) {
    throw new Error(
      "LED punktowe i LED CCT nie mogą być wybrane jednocześnie."
    );
  }

  if (
    configuration.walls === "none" &&
    (configuration.hasLeftZip || configuration.hasRightZip)
  ) {
    throw new Error("Boczne rolety ZIP wymagają wybrania ścian.");
  }

  if (configuration.length >= 550 && configuration.roof.startsWith("glass_")) {
    throw new Error(
      "Dach szklany dla długości 550 i 600 cm wymaga wyceny indywidualnej."
    );
  }

  if (
    configuration.roof === "glass_milky" ||
    configuration.walls === "glass_milky"
  ) {
    throw new Error("Wybrany wariant szkła nie jest publikowany na stronie.");
  }
}

function getRoofPriceFields(roof: RoofOption): {
  net: PricingSnapshotNetPriceField;
  gross: PricingSnapshotGrossPriceField;
} {
  if (roof === "polycarbonate_clear") {
    return {
      net: "roofPolycarbonateClearNet",
      gross: "roofPolycarbonateClearGross",
    };
  }
  if (roof === "polycarbonate_milky") {
    return {
      net: "roofPolycarbonateMilkyNet",
      gross: "roofPolycarbonateMilkyGross",
    };
  }
  if (roof === "polycarbonate_grey") {
    return {
      net: "roofPolycarbonateGreyNet",
      gross: "roofPolycarbonateGreyGross",
    };
  }
  if (roof === "polycarbonate_smoke") {
    return {
      net: "roofPolycarbonateSmokeNet",
      gross: "roofPolycarbonateSmokeGross",
    };
  }
  if (roof === "glass_clear") {
    return { net: "roofGlassClearNet", gross: "roofGlassClearGross" };
  }
  if (roof === "glass_milky") {
    return { net: "roofGlassMilkyNet", gross: "roofGlassMilkyGross" };
  }
  return { net: "roofGlassTintedNet", gross: "roofGlassTintedGross" };
}

function getWallPriceFields(walls: Exclude<WallOption, "none">): {
  net: PricingSnapshotNetPriceField;
  gross: PricingSnapshotGrossPriceField;
} {
  if (walls === "glass_clear") {
    return { net: "wallGlassClearNet", gross: "wallGlassClearGross" };
  }
  if (walls === "glass_milky") {
    return { net: "wallGlassMilkyNet", gross: "wallGlassMilkyGross" };
  }
  return { net: "wallGlassTintedNet", gross: "wallGlassTintedGross" };
}

function getRoofName(roof: RoofOption): string {
  const names: Record<RoofOption, string> = {
    polycarbonate_clear: "Poliwęglan bezbarwny",
    polycarbonate_milky: "Poliwęglan mleczny",
    polycarbonate_grey: "Poliwęglan szary",
    polycarbonate_smoke: "Poliwęglan dymiony",
    glass_clear: "Szkło dachowe bezbarwne",
    glass_milky: "Szkło dachowe mleczne",
    glass_tinted: "Szkło dachowe przyciemniane",
  };

  return names[roof];
}

function getWallName(walls: Exclude<WallOption, "none">): string {
  const names: Record<Exclude<WallOption, "none">, string> = {
    glass_clear: "Ściany przesuwne bezbarwne",
    glass_milky: "Ściany przesuwne mleczne",
    glass_tinted: "Ściany przesuwne przyciemniane",
  };

  return names[walls];
}

function assertValidVatRate(value: number): void {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error("Stawka VAT musi być liczbą od 0 do 100.");
  }
}
