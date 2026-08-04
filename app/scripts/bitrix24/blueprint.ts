import type {
  CatalogSectionBlueprint,
  EnumValueBlueprint,
  PipelineBlueprint,
  ProvisioningBlueprint,
  SourceBlueprint,
  UserFieldBlueprint,
} from "./types";

function enumValues(values: string[]): EnumValueBlueprint[] {
  return values.map((value, index) => ({
    xmlId: value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Za-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .toUpperCase(),
    value,
    sort: (index + 1) * 100,
  }));
}

const salesPipeline: PipelineBlueprint = {
  key: "sales",
  name: "01 Sprzedaż z pomiarem",
  sort: 100,
  useDefault: true,
  stages: [
    { code: "MG_NEW", name: "Nowe zapytanie", semantics: "", sort: 100, color: "#39A8EF" },
    { code: "MG_NOCONTACT", name: "Brak kontaktu", semantics: "", sort: 200, color: "#F7A700" },
    { code: "MG_CONTACT", name: "Kontakt nawiązany", semantics: "", sort: 300, color: "#2FC6F6" },
    { code: "MG_PHOTOS", name: "Oczekiwanie na zdjęcia", semantics: "", sort: 400, color: "#9DC9E8" },
    { code: "MG_QUAL", name: "Zakwalifikowany", semantics: "", sort: 500, color: "#55D0A0" },
    { code: "MG_NOCONQ", name: "Brak kontaktu po kwalifikacji", semantics: "", sort: 600, color: "#F0C75E" },
    { code: "MG_MEASPLAN", name: "Pomiar do umówienia", semantics: "", sort: 700, color: "#A77BD8" },
    { code: "MG_MEASSET", name: "Pomiar umówiony", semantics: "", sort: 800, color: "#7C91E2" },
    { code: "MG_MEASDONE", name: "Pomiar wykonany", semantics: "", sort: 900, color: "#6EC6B5" },
    { code: "MG_OFFERPREP", name: "Przygotowanie oferty", semantics: "", sort: 1000, color: "#5EA3D6" },
    { code: "MG_OFFERSENT", name: "Oferta wysłana", semantics: "", sort: 1100, color: "#3CA5D4" },
    { code: "MG_CONTRACT", name: "Proforma / umowa wysłana", semantics: "", sort: 1200, color: "#53B6A1" },
    { code: "MG_DELAYTIME", name: "Odroczony — termin", semantics: "", sort: 1300, color: "#B6A275" },
    { code: "MG_DELAYCASH", name: "Odroczony — budżet", semantics: "", sort: 1400, color: "#AFAFAF" },
    { code: "MG_WON", name: "Wygrany — przekazany do realizacji", semantics: "S", sort: 1500, color: "#46C37B" },
    { code: "MG_BADFIT", name: "Przegrany — zła kwalifikacja", semantics: "F", sort: 1600, color: "#E05B5B" },
    { code: "MG_NODEC", name: "Przegrany — brak decyzji", semantics: "F", sort: 1700, color: "#D66B6B" },
    { code: "MG_PRICE", name: "Przegrany — konkurencja/cena", semantics: "F", sort: 1800, color: "#C95D73" },
    { code: "MG_DUP", name: "Przegrany — duplikat/test", semantics: "F", sort: 1900, color: "#A5A5A5" },
  ],
};

const realizationPipeline: PipelineBlueprint = {
  key: "realization",
  name: "02 Realizacja",
  sort: 200,
  stages: [
    { code: "MG_REAL", name: "W realizacji", semantics: "", sort: 100 },
    { code: "MG_GLASS", name: "Szkło na wymiar", semantics: "", sort: 200 },
    { code: "MG_SENDMAT", name: "Wysłać materiał na wycenę", semantics: "", sort: 300 },
    { code: "MG_MATQUOTE", name: "Materiał na wycenie", semantics: "", sort: 400 },
    { code: "MG_MATOK", name: "Wycena materiału zaakceptowana", semantics: "", sort: 500 },
    { code: "MG_ORDERMAT", name: "Zamówienie materiału", semantics: "", sort: 600 },
    { code: "MG_MATORDER", name: "Materiał zamówiony", semantics: "", sort: 700 },
    { code: "MG_TEAMDATE", name: "Ustalona ekipa i termin montażu", semantics: "", sort: 800 },
    { code: "MG_MATPAID", name: "Materiał opłacony", semantics: "", sort: 900 },
    { code: "MG_PAUSED", name: "Realizacja zawieszona", semantics: "", sort: 1000 },
    { code: "MG_INSTALL", name: "Montaż rozpoczęty", semantics: "", sort: 1100 },
    { code: "MG_DONEUNP", name: "Montaż skończony — nieopłacone", semantics: "", sort: 1200 },
    { code: "MG_DONECASH", name: "Montaż skończony — gotówka", semantics: "", sort: 1300 },
    { code: "MG_PROJECTOK", name: "Projekt opłacony", semantics: "", sort: 1400 },
    { code: "MG_CLOSED", name: "Zamknięty projekt", semantics: "S", sort: 1500 },
    { code: "MG_REALLOST", name: "Realizacja anulowana", semantics: "F", sort: 1600 },
  ],
};

const complaintsPipeline: PipelineBlueprint = {
  key: "complaints",
  name: "03 Reklamacje",
  sort: 300,
  stages: [
    { code: "MG_CLAIM", name: "Reklamacja zgłoszona", semantics: "", sort: 100 },
    { code: "MG_ANALYZE", name: "Analiza zgłoszenia", semantics: "", sort: 200 },
    { code: "MG_ACCEPT", name: "Reklamacja uznana", semantics: "", sort: 300 },
    { code: "MG_NEEDMAT", name: "Wymagane zamówienie towaru", semantics: "", sort: 400 },
    { code: "MG_CMATORD", name: "Towar zamówiony", semantics: "", sort: 500 },
    { code: "MG_FIXDATE", name: "Ustalony termin naprawy", semantics: "", sort: 600 },
    { code: "MG_FIXING", name: "Naprawa w toku", semantics: "", sort: 700 },
    { code: "MG_REJECT", name: "Reklamacja odrzucona", semantics: "F", sort: 800 },
    { code: "MG_FAILAN", name: "Analiza przyczyn niepowodzenia", semantics: "", sort: 900 },
    { code: "MG_CLAIMOK", name: "Reklamacja zamknięta", semantics: "S", sort: 1000 },
  ],
};

const sources: SourceBlueprint[] = [
  { code: "MG_WEB_CALC", name: "Kalkulator strony", sort: 100 },
  { code: "MG_WEB_FORM", name: "Formularz kontaktowy", sort: 200 },
  { code: "MG_PHONE", name: "Telefon", sort: 300 },
  { code: "MG_EMAIL", name: "E-mail", sort: 400 },
  { code: "MG_FACEBOOK", name: "Facebook", sort: 500 },
  { code: "MG_INSTAGRAM", name: "Instagram", sort: 600 },
  { code: "MG_REFERRAL", name: "Polecenie", sort: 700 },
  { code: "MG_OTHER", name: "Inne", sort: 800 },
];

function field(
  entity: UserFieldBlueprint["entity"],
  alias: string,
  label: string,
  type: UserFieldBlueprint["type"],
  sort: number,
  extra: Partial<UserFieldBlueprint> = {}
): UserFieldBlueprint {
  return { entity, alias, label, type, sort, ...extra };
}

const userFields: UserFieldBlueprint[] = [
  field("contact", "MG_PREFERRED_CHANNEL", "Preferowany kanał kontaktu", "enumeration", 100, {
    enumValues: enumValues(["Telefon", "E-mail", "SMS", "WhatsApp"]),
  }),
  field("contact", "MG_CUSTOMER_TYPE", "Typ klienta", "enumeration", 200, {
    enumValues: enumValues(["Osoba prywatna", "Firma"]),
  }),
  field("contact", "MG_RODO_SOURCE", "Źródło danych / zgody", "enumeration", 300, {
    enumValues: enumValues(["Kalkulator strony", "Formularz kontaktowy", "Telefon", "E-mail", "Reklama", "Polecenie", "Inne"]),
  }),
  field("contact", "MG_RODO_DATE", "Data pozyskania danych", "datetime", 400),
  field("contact", "MG_MARKETING_CONSENT", "Zgoda marketingowa", "boolean", 500),
  field("contact", "MG_EXTERNAL_CONTACT_KEY", "Klucz kontaktu MoonGlass", "string", 600, { searchable: true }),

  field("company", "MG_NIP", "NIP", "string", 100, { searchable: true }),
  field("company", "MG_REGON", "REGON", "string", 200, { searchable: true }),
  field("company", "MG_COMPANY_NOTES", "Uwagi handlowe", "string", 300, { settings: { ROWS: 5 } }),

  field("deal", "MG_WEB_INQUIRY_ID", "ID zapytania ze strony", "string", 100, { searchable: true }),
  field("deal", "MG_LOCAL_LEAD_ID", "ID rekordu MoonGlass", "string", 110, { searchable: true }),
  field("deal", "MG_QUOTE_VERSION", "Wersja cennika / wyceny", "string", 120),
  field("deal", "MG_SOURCE_URL", "Adres źródłowy", "url", 130),
  field("deal", "MG_SYNC_STATUS", "Status synchronizacji", "enumeration", 140, {
    enumValues: enumValues(["Oczekuje", "Synchronizacja", "Zsynchronizowano", "Błąd", "Do ponowienia"]),
  }),
  field("deal", "MG_SYNCED_AT", "Ostatnia synchronizacja", "datetime", 150),
  field("deal", "MG_SYNC_ERROR", "Błąd synchronizacji", "string", 160, { settings: { ROWS: 5 } }),

  field("deal", "MG_CLIENT_TYPE", "Typ klienta", "enumeration", 200, {
    enumValues: enumValues(["Osoba prywatna", "Firma"]),
  }),
  field("deal", "MG_INSTALL_ADDRESS", "Adres montażu", "address", 210),
  field("deal", "MG_POSTAL_CODE", "Kod pocztowy", "string", 220),
  field("deal", "MG_CITY", "Miejscowość", "string", 230),
  field("deal", "MG_COUNTY", "Powiat", "string", 240),
  field("deal", "MG_VOIVODESHIP", "Województwo", "enumeration", 250, {
    enumValues: enumValues([
      "Dolnośląskie", "Kujawsko-pomorskie", "Lubelskie", "Lubuskie", "Łódzkie", "Małopolskie", "Mazowieckie", "Opolskie",
      "Podkarpackie", "Podlaskie", "Pomorskie", "Śląskie", "Świętokrzyskie", "Warmińsko-mazurskie", "Wielkopolskie", "Zachodniopomorskie",
    ]),
  }),
  field("deal", "MG_ACCESS_NOTES", "Informacje o dojeździe / miejscu", "string", 260, { settings: { ROWS: 5 } }),
  field("deal", "MG_SECOND_CONTACT_ROLE", "Rola drugiej osoby", "enumeration", 270, {
    enumValues: enumValues(["Współmałżonek", "Pełnomocnik", "Osoba techniczna", "Inna"]),
  }),

  field("deal", "MG_PRODUCT_TYPE", "Typ produktu", "enumeration", 300, {
    enumValues: enumValues(["Ogród zimowy", "Zadaszenie tarasu", "Carport", "Inne"]),
  }),
  field("deal", "MG_DEPTH_CM", "Głębokość [cm]", "integer", 310),
  field("deal", "MG_WIDTH_CM", "Szerokość [cm]", "integer", 320),
  field("deal", "MG_ROOF_TYPE", "Pokrycie dachu", "enumeration", 330, {
    enumValues: enumValues(["Poliwęglan bezbarwny", "Poliwęglan mleczny", "Poliwęglan szary", "Poliwęglan dymiony", "Szkło bezbarwne", "Szkło przyciemniane", "Indywidualne"]),
  }),
  field("deal", "MG_WALL_TYPE", "Ściany", "enumeration", 340, {
    enumValues: enumValues(["Brak", "Szkło bezbarwne", "Szkło przyciemniane", "Indywidualne"]),
  }),
  field("deal", "MG_ZIP_FRONT", "ZIP przód", "boolean", 350),
  field("deal", "MG_ZIP_LEFT", "ZIP lewy", "boolean", 360),
  field("deal", "MG_ZIP_RIGHT", "ZIP prawy", "boolean", 370),
  field("deal", "MG_AWNING", "Markiza", "boolean", 380),
  field("deal", "MG_LED_POINT", "LED punktowe", "boolean", 390),
  field("deal", "MG_LED_CCT", "LED CCT", "boolean", 400),
  field("deal", "MG_FOUNDATION", "Fundament / profil", "boolean", 410),
  field("deal", "MG_BRUSHES", "Szczotki", "boolean", 420),
  field("deal", "MG_HANDLES", "Uchwyty", "boolean", 430),
  field("deal", "MG_CUSTOM_QUOTE", "Wycena indywidualna", "boolean", 440),
  field("deal", "MG_CONFIGURATION_TEXT", "Pełne podsumowanie konfiguracji", "string", 450, { settings: { ROWS: 12 } }),

  field("deal", "MG_SERVER_TOTAL_GROSS", "Zweryfikowana kwota brutto", "money", 500),
  field("deal", "MG_VAT_RATE", "Stawka VAT", "enumeration", 510, {
    enumValues: enumValues(["8%", "23%", "Indywidualna"]),
  }),
  field("deal", "MG_DISCOUNT_PERCENT", "Rabat [%]", "double", 520, { settings: { PRECISION: 2 } }),
  field("deal", "MG_OFFER_DATE", "Data przygotowania oferty", "date", 530),
  field("deal", "MG_OFFER_VALID_UNTIL", "Oferta ważna do", "date", 540),
  field("deal", "MG_ADVANCE_AMOUNT", "Zaliczka / proforma", "money", 550),
  field("deal", "MG_PAID_AMOUNT", "Wpłacona kwota", "money", 560),
  field("deal", "MG_REMAINING_AMOUNT", "Pozostało do zapłaty", "money", 570),

  field("deal", "MG_CONTACT_ATTEMPTS", "Liczba prób kontaktu", "integer", 600),
  field("deal", "MG_NEXT_CONTACT_AT", "Termin następnego kontaktu", "datetime", 610),
  field("deal", "MG_PHOTOS_STATUS", "Status zdjęć", "enumeration", 620, {
    enumValues: enumValues(["Nie wymagane", "Oczekujemy", "Otrzymane"]),
  }),
  field("deal", "MG_QUALIFIED_BY", "Zakwalifikowany przez", "employee", 630),
  field("deal", "MG_MEASUREMENT_REQUIRED", "Czy wymagany pomiar", "boolean", 640),
  field("deal", "MG_MEASUREMENT_AT", "Termin pomiaru", "datetime", 650),
  field("deal", "MG_MEASUREMENT_OWNER", "Osoba wykonująca pomiar", "employee", 660),
  field("deal", "MG_MEASUREMENT_NOTES", "Notatki z pomiaru", "string", 670, { settings: { ROWS: 8 } }),
  field("deal", "MG_DEFERRED_UNTIL", "Powrót do klienta", "date", 680),
  field("deal", "MG_DEFERRED_REASON", "Powód odroczenia", "enumeration", 690, {
    enumValues: enumValues(["Termin", "Budżet", "Budowa / przygotowanie miejsca", "Oczekiwanie na decyzję innej osoby", "Inny"]),
  }),
  field("deal", "MG_LOST_REASON", "Przyczyna przegranej", "enumeration", 700, {
    enumValues: enumValues(["Zła kwalifikacja", "Brak decyzji", "Konkurencja", "Cena", "Brak kontaktu", "Duplikat / test", "Inna"]),
  }),

  field("deal", "MG_MATERIAL_STATUS", "Status materiału", "enumeration", 800, {
    enumValues: enumValues(["Nie dotyczy", "Do wyceny", "W wycenie", "Zaakceptowany", "Zamówiony", "Dostarczony", "Opłacony", "Problem"]),
  }),
  field("deal", "MG_INSTALLATION_TEAM", "Ekipa montażowa", "string", 810),
  field("deal", "MG_INSTALLATION_FROM", "Montaż od", "date", 820),
  field("deal", "MG_INSTALLATION_TO", "Montaż do", "date", 830),
  field("deal", "MG_NEXT_VISIT_AT", "Najbliższa wizyta", "datetime", 840),
  field("deal", "MG_DEFECTS", "Usterki / uwagi", "string", 850, { settings: { ROWS: 8 } }),
  field("deal", "MG_PROJECT_PAID", "Projekt opłacony", "boolean", 860),
];

const catalogSections: CatalogSectionBlueprint[] = [
  { key: "construction", name: "01 Konstrukcje", code: "mg-construction", xmlId: "MOONGLASS_SECTION_CONSTRUCTION", sort: 100 },
  { key: "winter_gardens", name: "Ogrody zimowe", code: "mg-winter-gardens", xmlId: "MOONGLASS_SECTION_WINTER_GARDENS", sort: 110, parentKey: "construction" },
  { key: "terrace_roofs", name: "Zadaszenia tarasowe", code: "mg-terrace-roofs", xmlId: "MOONGLASS_SECTION_TERRACE_ROOFS", sort: 120, parentKey: "construction" },
  { key: "roof", name: "02 Pokrycia dachu", code: "mg-roof", xmlId: "MOONGLASS_SECTION_ROOF", sort: 200 },
  { key: "roof_poly", name: "Poliwęglan", code: "mg-roof-poly", xmlId: "MOONGLASS_SECTION_ROOF_POLY", sort: 210, parentKey: "roof" },
  { key: "roof_glass", name: "Szkło dachowe", code: "mg-roof-glass", xmlId: "MOONGLASS_SECTION_ROOF_GLASS", sort: 220, parentKey: "roof" },
  { key: "walls", name: "03 Ściany i systemy przesuwne", code: "mg-walls", xmlId: "MOONGLASS_SECTION_WALLS", sort: 300 },
  { key: "zip", name: "04 Rolety ZIP", code: "mg-zip", xmlId: "MOONGLASS_SECTION_ZIP", sort: 400 },
  { key: "awning", name: "05 Markizy", code: "mg-awning", xmlId: "MOONGLASS_SECTION_AWNING", sort: 500 },
  { key: "lighting", name: "06 Oświetlenie", code: "mg-lighting", xmlId: "MOONGLASS_SECTION_LIGHTING", sort: 600 },
  { key: "foundation", name: "07 Fundamenty i profile", code: "mg-foundation", xmlId: "MOONGLASS_SECTION_FOUNDATION", sort: 700 },
  { key: "accessories", name: "08 Akcesoria", code: "mg-accessories", xmlId: "MOONGLASS_SECTION_ACCESSORIES", sort: 800 },
  { key: "services", name: "09 Montaż i usługi", code: "mg-services", xmlId: "MOONGLASS_SECTION_SERVICES", sort: 900 },
  { key: "custom", name: "99 Wyceny indywidualne", code: "mg-custom", xmlId: "MOONGLASS_SECTION_CUSTOM", sort: 9900 },
];

export const MOONGLASS_BLUEPRINT: ProvisioningBlueprint = {
  version: "2026-08-04.1",
  portalLabel: "MoonGlass",
  dealEntityTypeId: 2,
  pipelines: [salesPipeline, realizationPipeline, complaintsPipeline],
  sources,
  userFields,
  catalogSections,
};

export function getEntityId(entity: UserFieldBlueprint["entity"]): string {
  if (entity === "deal") return "CRM_DEAL";
  if (entity === "contact") return "CRM_CONTACT";
  return "CRM_COMPANY";
}

export function getUserFieldName(field: UserFieldBlueprint): string {
  return `UF_${getEntityId(field.entity)}_${field.alias}`;
}

export function getUserFieldXmlId(field: UserFieldBlueprint): string {
  return `MOONGLASS:${field.entity.toUpperCase()}:${field.alias}`;
}
