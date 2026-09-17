import generatedPricingSnapshot from "@/data/pricing/glass-system/published-pricing.generated.json";
import {
  getProductKind,
  type ProductConfiguration,
  type ProductKind,
} from "@/domain/ProductConfiguration";
import type { Quote, QuoteFinancials } from "@/domain/Quote";
import type {
  QuoteFinancialLineItem,
  QuoteItem,
  QuoteItemFinancials,
  QuoteItemCategory,
} from "@/domain/QuoteItem";
import {
  getCrmCoreProduct,
  type CrmCoreProduct,
  type CrmCoreProductFamily,
} from "@/pricing/catalog/CrmCoreCatalog";
import type { PricingSnapshot } from "@/pricing/snapshots/PricingSnapshot";
import {
  PricingSnapshotPriceReader,
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
  quantity: number;
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

    const suffix = `D${configuration.length}-W${configuration.width}`;

    const completeProduct = getCrmCoreProduct(
      getCompleteProductFamily(productType, configuration.roof),
      configuration.length,
      configuration.width
    );
    this.addWebsiteGroup(websiteItems, financialLineItems, {
      id: "complete_product",
      name: completeProduct.name,
      category: "construction",
      components: [this.getCatalogComponent(completeProduct, "construction")],
    });

    const installation = getCrmCoreProduct(
      getInstallationFamily(productType),
      configuration.length,
      configuration.width
    );
    this.addWebsiteGroup(websiteItems, financialLineItems, {
      id: "installation",
      name: installation.name,
      category: "installation",
      components: [this.getCatalogComponent(installation, "installation")],
    });

    const roofSurchargeFamily = getRoofSurchargeFamily(configuration.roof);
    if (roofSurchargeFamily) {
      const roofSurcharge = getCrmCoreProduct(
        roofSurchargeFamily,
        configuration.length,
        configuration.width
      );
      this.addWebsiteGroup(websiteItems, financialLineItems, {
        id: "roof_surcharge",
        name: roofSurcharge.name,
        category: "roof",
        components: [this.getCatalogComponent(roofSurcharge, "roof")],
      });
    }

    if (
      productType === "winter_garden" &&
      configuration.walls === "glass_tinted"
    ) {
      const wallSurcharge = getCrmCoreProduct(
        "wall_glass_tint_surcharge",
        configuration.length,
        configuration.width
      );
      this.addWebsiteGroup(websiteItems, financialLineItems, {
        id: "wall_surcharge",
        name: wallSurcharge.name,
        category: "walls",
        components: [this.getCatalogComponent(wallSurcharge, "walls")],
      });
    }

    const zipComponents: PricingComponent[] = [];
    if (configuration.hasFrontZip) {
      zipComponents.push(
        this.getComponent(
          criteria,
          `MG-ZIP-FRONT-${suffix}`,
          `Roleta ZIP front ${dimension}`,
          "zip",
          "zipFrontNet"
        )
      );
    }

    const sideZipQuantity =
      Number(configuration.hasLeftZip) + Number(configuration.hasRightZip);
    if (productType === "winter_garden" && sideZipQuantity > 0) {
      zipComponents.push(
        this.getComponent(
          criteria,
          `MG-ZIP-SIDE-${suffix}`,
          `Roleta ZIP boczna ${dimension}`,
          "zip",
          "zipRightNet",
          sideZipQuantity
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
              `MG-AWNING-${suffix}`,
              `Markiza dachowa ${dimension}`,
              "awning",
              "awningNet"
            ),
          ]
        : [],
    });

    const lightingComponents = configuration.hasLed
      ? [
          this.getComponent(
            criteria,
            `MG-LED-POINT-${suffix}`,
            `Oświetlenie LED punktowe ${dimension}`,
            "lighting",
            "ledSpotNet"
          ),
        ]
      : configuration.hasCob
        ? [
            this.getCatalogComponent(
              getCrmCoreProduct(
                "led_rgb_cct",
                configuration.length,
                configuration.width
              ),
              "lighting"
            ),
          ]
        : [];
    this.addWebsiteGroup(websiteItems, financialLineItems, {
      id: "led",
      name: configuration.hasCob
        ? "Oświetlenie LED RGB CCT"
        : "Oświetlenie LED punktowe",
      category: "lighting",
      components: lightingComponents,
    });

    const accessoryComponents: PricingComponent[] = [];
    if (configuration.hasLevelingProfile) {
      accessoryComponents.push(
        this.getComponent(
          criteria,
          `MG-FOUNDATION-${suffix}`,
          `Fundament / profil poziomujący ${dimension}`,
          "accessory",
          "levelingProfileNet"
        )
      );
    }
    if (configuration.hasBrushes) {
      accessoryComponents.push(
        this.getComponent(
          criteria,
          `MG-BRUSHES-${suffix}`,
          `Zestaw szczotek przeciwkurzowych ${dimension}`,
          "accessory",
          "brushesNet"
        )
      );
    }
    if (configuration.hasHandles) {
      accessoryComponents.push(
        this.getComponent(
          criteria,
          `MG-HANDLES-${suffix}`,
          `Zestaw uchwytów ${dimension}`,
          "accessory",
          "handlesNet"
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

    if (websiteTotalGross !== financials.totalGross) {
      throw new Error(
        `Niespójna suma brutto: strona ${websiteTotalGross}, finanse ${financials.totalGross}.`
      );
    }

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
        activeComponents.reduce(
          (sum, component) => sum + component.net * component.quantity,
          0
        )
      ),
      unitTaxAmount: roundMoney(
        activeComponents.reduce(
          (sum, component) =>
            sum + component.taxAmount * component.quantity,
          0
        )
      ),
      unitPriceGross: roundMoney(
        activeComponents.reduce(
          (sum, component) =>
            sum + component.accountingGross * component.quantity,
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
        (sum, component) =>
          sum + component.websiteGross * component.quantity,
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
    quantity = 1
  ): PricingComponent {
    const net = roundMoney(this.reader.getPrice(criteria, netField));
    const calculation = calculateTaxFromNet(net, this.vatRate);
    const websiteGross = calculation.gross;

    if (net <= 0 && websiteGross <= 0) {
      return {
        id,
        name,
        category,
        quantity,
        net: 0,
        websiteGross: 0,
        taxAmount: 0,
        accountingGross: 0,
      };
    }

    return {
      id,
      name,
      category,
      quantity,
      net,
      websiteGross,
      taxAmount: calculation.taxAmount,
      accountingGross: calculation.gross,
    };
  }

  private getCatalogComponent(
    product: CrmCoreProduct,
    category: QuoteItemCategory,
    quantity = 1
  ): PricingComponent {
    const net = roundMoney(product.priceNet);
    const calculation = calculateTaxFromNet(net, this.vatRate);

    return {
      id: product.sku,
      name: product.name,
      category,
      quantity,
      net,
      // Widok klienta korzysta z tej samej kwoty brutto co finanse i Bitrix24.
      websiteGross: calculation.gross,
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
    quantity: component.quantity,
    priceMode: "net",
    taxIncluded: false,
    vatRate,
    unitPriceNet: component.net,
    unitTaxAmount: component.taxAmount,
    unitPriceGross: component.accountingGross,
    totalPriceNet: roundMoney(component.net * component.quantity),
    totalTaxAmount: roundMoney(component.taxAmount * component.quantity),
    totalPriceGross: roundMoney(
      component.accountingGross * component.quantity
    ),
    websiteUnitPriceGross: component.websiteGross,
    websiteTotalPriceGross: roundMoney(
      component.websiteGross * component.quantity
    ),
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
      "LED punktowe i LED RGB CCT nie mogą być wybrane jednocześnie."
    );
  }

  const productType = getProductKind(configuration);
  if (productType === "terrace_roof" && configuration.walls !== "none") {
    throw new Error("Zadaszenie tarasu nie może zawierać ścian ogrodu zimowego.");
  }
  if (productType === "winter_garden" && configuration.walls === "none") {
    throw new Error("Ogród zimowy wymaga standardowych ścian przesuwnych.");
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

function getCompleteProductFamily(
  productType: ProductKind,
  roof: ProductConfiguration["roof"]
): CrmCoreProductFamily {
  const glassRoof = roof.startsWith("glass_");

  if (productType === "winter_garden") {
    return glassRoof ? "winter_garden_glass" : "winter_garden_poly";
  }

  return glassRoof ? "terrace_roof_glass" : "terrace_roof_poly";
}

function getInstallationFamily(
  productType: ProductKind
): CrmCoreProductFamily {
  return productType === "winter_garden"
    ? "installation_winter_garden"
    : "installation_terrace_roof";
}

function getRoofSurchargeFamily(
  roof: ProductConfiguration["roof"]
): CrmCoreProductFamily | null {
  if (roof === "polycarbonate_clear" || roof === "glass_clear") {
    return null;
  }

  return roof.startsWith("glass_")
    ? "roof_glass_color_surcharge"
    : "roof_poly_color_surcharge";
}

function assertValidVatRate(value: number): void {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error("Stawka VAT musi być liczbą od 0 do 100.");
  }
}
