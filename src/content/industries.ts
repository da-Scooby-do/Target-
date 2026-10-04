import type { Locale } from "@/lib/i18n";
import type { ServiceSlug } from "@/lib/services";

/**
 * Industry pages. Draft copy describing how the services apply to each
 * customer type; no client names or numbers. Have the client confirm which
 * industries they actually serve.
 */
export const industrySlugs = [
  "retail-ecommerce",
  "food-agriculture",
  "machinery-industrial",
  "automotive-parts",
  "construction-materials",
] as const;
export type IndustrySlug = (typeof industrySlugs)[number];
export const isIndustrySlug = (v: string): v is IndustrySlug => (industrySlugs as readonly string[]).includes(v);

type IndustryText = { title: string; short: string; lead: string; body: string; points: string[]; imageAlt: string };

type Industry = {
  icon: string;
  image: string;
  isPhoto: boolean;
  services: ServiceSlug[];
  text: Record<Locale, IndustryText>;
};

export const industries: Record<IndustrySlug, Industry> = {
  "retail-ecommerce": {
    icon: "package",
    image: "/photos/warehouse.jpg",
    isPhoto: true,
    services: ["shipping-forwarding", "logistics-supply-chain", "international-trade-sourcing"],
    text: {
      en: {
        title: "Retail & e-commerce",
        short: "Stock that arrives before the season, and storage until you sell it.",
        lead: "From the factory to your warehouse or your customer, planned around your sales calendar.",
        body: "Retail runs on timing. We plan your inbound shipments around launches and seasons, combine smaller orders to keep costs down, and store and distribute stock from the Netherlands when you need it.",
        points: [
          "Consolidated shipments from several suppliers",
          "Seasonal planning for peak periods",
          "Storage and distribution in the Netherlands",
          "Sourcing new products and suppliers",
        ],
        imageAlt: "Warehouse aisle with racked pallets",
      },
      nl: {
        title: "Retail & e-commerce",
        short: "Voorraad die er is vóór het seizoen, en opslag tot u verkoopt.",
        lead: "Van de fabriek naar uw magazijn of uw klant, gepland rond uw verkoopkalender.",
        body: "In retail draait alles om timing. We plannen uw inkomende zendingen rond lanceringen en seizoenen, combineren kleinere bestellingen om kosten te besparen, en slaan voorraad op en distribueren die vanuit Nederland wanneer u dat nodig heeft.",
        points: [
          "Gecombineerde zendingen van meerdere leveranciers",
          "Seizoensplanning voor drukke periodes",
          "Opslag en distributie in Nederland",
          "Nieuwe producten en leveranciers vinden",
        ],
        imageAlt: "Gangpad in een magazijn met pallets in stellingen",
      },
      ar: {
        title: "التجزئة والتجارة الإلكترونية",
        short: "بضائع تصل قبل الموسم، وتخزين حتى تبيعها.",
        lead: "من المصنع إلى مستودعك أو إلى عميلك، وفق تقويم مبيعاتك.",
        body: "تعتمد التجزئة على التوقيت. نخطط لشحناتك الواردة حول مواعيد الإطلاق والمواسم، ونجمع الطلبات الصغيرة لخفض التكاليف، ونخزّن البضائع ونوزعها من هولندا عند الحاجة.",
        points: [
          "شحنات مجمعة من عدة موردين",
          "تخطيط موسمي لفترات الذروة",
          "التخزين والتوزيع في هولندا",
          "البحث عن منتجات وموردين جدد",
        ],
        imageAlt: "ممر في مستودع برفوف تحمل منصات بضائع",
      },
    },
  },
  "food-agriculture": {
    icon: "globe",
    image: "/photos/container-ship.jpg",
    isPhoto: true,
    services: ["shipping-forwarding", "international-trade-sourcing", "logistics-supply-chain"],
    text: {
      en: {
        title: "Food & agriculture",
        short: "Produce and ingredients moved with the right paperwork and the right timing.",
        lead: "Food and agricultural products, shipped with the documents and checks they need.",
        body: "Food shipments come with extra rules: certificates, inspections and tight timing. We arrange transport, prepare the export and import documents, and work with you on the requirements of the destination country.",
        points: [
          "Sea and road transport for packaged goods",
          "Health and origin certificates",
          "Customs clearance at export and import",
          "Finding producers and buyers abroad",
        ],
        imageAlt: "Container ship at sea at dusk",
      },
      nl: {
        title: "Voeding & landbouw",
        short: "Producten en ingrediënten vervoerd met de juiste papieren en op het juiste moment.",
        lead: "Voedings- en landbouwproducten, verzonden met de documenten en controles die nodig zijn.",
        body: "Voor voedingszendingen gelden extra regels: certificaten, inspecties en strakke planning. Wij regelen het transport, maken de export- en importdocumenten klaar en kijken samen met u naar de eisen van het land van bestemming.",
        points: [
          "Zee- en wegtransport voor verpakte goederen",
          "Gezondheids- en oorsprongscertificaten",
          "Douane-afhandeling bij export en import",
          "Producenten en kopers in het buitenland vinden",
        ],
        imageAlt: "Containerschip op zee bij schemering",
      },
      ar: {
        title: "الأغذية والزراعة",
        short: "منتجات ومكونات تُنقل بالأوراق الصحيحة وفي الوقت المناسب.",
        lead: "منتجات غذائية وزراعية تُشحن مع المستندات والفحوصات اللازمة.",
        body: "لشحنات الأغذية قواعد إضافية: شهادات وفحوصات ومواعيد دقيقة. ننظم النقل، ونجهز مستندات التصدير والاستيراد، ونعمل معك على متطلبات بلد الوجهة.",
        points: [
          "النقل البحري والبري للبضائع المعبأة",
          "الشهادات الصحية وشهادات المنشأ",
          "التخليص الجمركي عند التصدير والاستيراد",
          "إيجاد منتجين ومشترين في الخارج",
        ],
        imageAlt: "سفينة حاويات في البحر وقت الغسق",
      },
    },
  },
  "machinery-industrial": {
    icon: "warehouse",
    image: "/photos/port.jpg",
    isPhoto: true,
    services: ["shipping-forwarding", "international-trade-sourcing"],
    text: {
      en: {
        title: "Machinery & industrial",
        short: "Heavy, large or high-value equipment, moved with care.",
        lead: "Machines, spare parts and industrial equipment, from a single crate to a full container.",
        body: "Industrial cargo is often heavy, oddly shaped or urgent. We choose the right container or truck, arrange packing and lifting where needed, and keep spare parts moving fast when a line is waiting.",
        points: [
          "Full container and flat-rack shipments",
          "Urgent spare parts by air",
          "Packing, crating and lifting arrangements",
          "Export documents for machinery",
        ],
        imageAlt: "Container port at blue hour with ships and cranes",
      },
      nl: {
        title: "Machines & industrie",
        short: "Zware, grote of waardevolle apparatuur, zorgvuldig vervoerd.",
        lead: "Machines, onderdelen en industriële apparatuur, van één krat tot een volle container.",
        body: "Industriële lading is vaak zwaar, onhandig gevormd of dringend. Wij kiezen de juiste container of vrachtwagen, regelen verpakking en hijswerk waar nodig, en zorgen dat onderdelen snel aankomen als een productielijn wacht.",
        points: [
          "Volle containers en flat-racks",
          "Spoedonderdelen per luchtvracht",
          "Verpakking, kisten en hijswerk",
          "Exportdocumenten voor machines",
        ],
        imageAlt: "Containerhaven bij schemering met schepen en kranen",
      },
      ar: {
        title: "الآلات والصناعة",
        short: "معدات ثقيلة أو كبيرة أو عالية القيمة تُنقل بعناية.",
        lead: "آلات وقطع غيار ومعدات صناعية، من صندوق واحد إلى حاوية كاملة.",
        body: "غالبًا ما تكون البضائع الصناعية ثقيلة أو غير منتظمة الشكل أو عاجلة. نختار الحاوية أو الشاحنة المناسبة، وننظم التغليف والرفع عند الحاجة، ونسرّع وصول قطع الغيار عندما يتوقف خط الإنتاج.",
        points: [
          "شحنات الحاويات الكاملة والحاويات المسطحة",
          "قطع الغيار العاجلة جوًا",
          "التغليف والصناديق وترتيبات الرفع",
          "مستندات تصدير الآلات",
        ],
        imageAlt: "ميناء حاويات وقت الغسق مع سفن ورافعات",
      },
    },
  },
  "automotive-parts": {
    icon: "truck",
    image: "/photos/cargo-aircraft.jpg",
    isPhoto: true,
    services: ["shipping-forwarding", "logistics-supply-chain"],
    text: {
      en: {
        title: "Automotive & parts",
        short: "Vehicles and parts, shipped on schedule.",
        lead: "Parts, accessories and vehicles, with regular and urgent options.",
        body: "Automotive supply chains depend on parts arriving on time. We set up regular shipments for planned stock and fast options when something is needed now, with the paperwork for vehicles and parts handled for you.",
        points: [
          "Regular shipments of parts and accessories",
          "Air freight for urgent parts",
          "Vehicle export and import documents",
          "Storage and onward delivery",
        ],
        imageAlt: "Cargo aircraft being loaded at night",
      },
      nl: {
        title: "Automotive & onderdelen",
        short: "Voertuigen en onderdelen, op schema verzonden.",
        lead: "Onderdelen, accessoires en voertuigen, met vaste en spoedopties.",
        body: "Automotive-ketens zijn afhankelijk van onderdelen die op tijd aankomen. Wij zetten vaste zendingen op voor geplande voorraad en snelle opties als iets direct nodig is, en regelen de papieren voor voertuigen en onderdelen.",
        points: [
          "Vaste zendingen van onderdelen en accessoires",
          "Luchtvracht voor spoedonderdelen",
          "Export- en importdocumenten voor voertuigen",
          "Opslag en verdere levering",
        ],
        imageAlt: "Vrachtvliegtuig wordt 's nachts geladen",
      },
      ar: {
        title: "السيارات وقطع الغيار",
        short: "سيارات وقطع غيار تُشحن في موعدها.",
        lead: "قطع غيار وإكسسوارات وسيارات، بخيارات منتظمة وعاجلة.",
        body: "تعتمد سلاسل إمداد السيارات على وصول القطع في وقتها. ننظم شحنات منتظمة للمخزون المخطط له وخيارات سريعة عند الحاجة الفورية، ونتولى أوراق السيارات وقطع الغيار.",
        points: [
          "شحنات منتظمة لقطع الغيار والإكسسوارات",
          "الشحن الجوي للقطع العاجلة",
          "مستندات تصدير واستيراد السيارات",
          "التخزين والتوصيل اللاحق",
        ],
        imageAlt: "طائرة شحن يجري تحميلها ليلًا",
      },
    },
  },
  "construction-materials": {
    icon: "customs",
    image: "/illustrations/hero-containers.svg",
    isPhoto: false,
    services: ["shipping-forwarding", "international-trade-sourcing"],
    text: {
      en: {
        title: "Construction & materials",
        short: "Building materials and project cargo, delivered to the site schedule.",
        lead: "Materials and equipment for building projects, planned around your site.",
        body: "Construction projects need materials in the right order at the right time. We source and ship materials and equipment, plan deliveries around your schedule, and handle the documents for each country on the route.",
        points: [
          "Bulk and containerised building materials",
          "Deliveries planned to the project schedule",
          "Sourcing materials and equipment abroad",
          "Customs and import requirements",
        ],
        imageAlt: "",
      },
      nl: {
        title: "Bouw & materialen",
        short: "Bouwmaterialen en projectlading, geleverd volgens de bouwplanning.",
        lead: "Materialen en apparatuur voor bouwprojecten, gepland rond uw bouwplaats.",
        body: "Bouwprojecten hebben materialen nodig in de juiste volgorde en op het juiste moment. Wij kopen en verzenden materialen en apparatuur, plannen leveringen rond uw schema en regelen de documenten voor elk land op de route.",
        points: [
          "Bulk- en containerzendingen van bouwmaterialen",
          "Leveringen volgens de projectplanning",
          "Materialen en apparatuur in het buitenland inkopen",
          "Douane- en importeisen",
        ],
        imageAlt: "",
      },
      ar: {
        title: "البناء ومواد البناء",
        short: "مواد بناء وشحنات مشاريع تُسلَّم وفق جدول الموقع.",
        lead: "مواد ومعدات لمشاريع البناء، مخطط لها حول موقعك.",
        body: "تحتاج مشاريع البناء إلى المواد بالترتيب الصحيح وفي الوقت المناسب. نوفّر المواد والمعدات ونشحنها، ونخطط للتسليم حسب جدولك، ونتولى المستندات لكل بلد على المسار.",
        points: [
          "مواد بناء سائبة وفي حاويات",
          "تسليمات وفق جدول المشروع",
          "توريد المواد والمعدات من الخارج",
          "متطلبات الجمارك والاستيراد",
        ],
        imageAlt: "",
      },
    },
  },
};
