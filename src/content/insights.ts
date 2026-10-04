import type { Locale } from "@/lib/i18n";

/**
 * Insights: practical guides. Evergreen explanations only, no invented news,
 * figures or client stories. Company news goes here once the client supplies it.
 */
export const insightSlugs = ["fcl-or-lcl", "incoterms-explained", "faster-quote"] as const;
export type InsightSlug = (typeof insightSlugs)[number];
export const isInsightSlug = (v: string): v is InsightSlug => (insightSlugs as readonly string[]).includes(v);

type Block = { h?: string; p: string };
type InsightText = { title: string; summary: string; blocks: Block[] };

type Insight = {
  date: string;
  minutes: number;
  image: string;
  isPhoto: boolean;
  text: Record<Locale, InsightText & { imageAlt: string }>;
};

export const insights: Record<InsightSlug, Insight> = {
  "fcl-or-lcl": {
    date: "2026-10-01",
    minutes: 4,
    image: "/photos/container-ship.jpg",
    isPhoto: true,
    text: {
      en: {
        title: "FCL or LCL: which one fits your shipment?",
        summary: "A full container or a shared one? How to choose based on volume, cost and timing.",
        imageAlt: "Container ship at sea at dusk",
        blocks: [
          { p: "When you ship by sea you have two options: book a whole container for your goods (FCL, full container load) or share a container with other shippers (LCL, less than container load). The right choice depends on how much you ship, how fast it needs to arrive and how it is packed." },
          { h: "When LCL makes sense", p: "LCL suits smaller volumes, roughly up to a third of a container. You pay for the space your goods use, so it keeps costs down for a few pallets. Shared containers are loaded and unloaded at a warehouse, which adds a few days and some extra handling." },
          { h: "When FCL makes sense", p: "Once your goods fill around half a container or more, a full container is often cheaper per unit and quicker. The container is sealed at loading and opened only at the destination, so there is less handling and less risk of damage." },
          { h: "Other things to consider", p: "Fragile or high-value goods often travel better in their own container. Tight deadlines favour FCL because there is no waiting for a shared container to fill. If you are unsure, tell us the volume and ready date and we'll price both options." },
        ],
      },
      nl: {
        title: "FCL of LCL: wat past bij uw zending?",
        summary: "Een volle container of een gedeelde? Zo kiest u op basis van volume, kosten en timing.",
        imageAlt: "Containerschip op zee bij schemering",
        blocks: [
          { p: "Bij zeevracht heeft u twee opties: een hele container voor uw goederen boeken (FCL, full container load) of een container delen met andere verladers (LCL, less than container load). De juiste keuze hangt af van hoeveel u verzendt, hoe snel het moet aankomen en hoe het verpakt is." },
          { h: "Wanneer LCL logisch is", p: "LCL past bij kleinere volumes, ongeveer tot een derde van een container. U betaalt voor de ruimte die uw goederen innemen, dus bij een paar pallets blijven de kosten laag. Gedeelde containers worden in een magazijn geladen en gelost, wat een paar dagen en wat extra handelingen toevoegt." },
          { h: "Wanneer FCL logisch is", p: "Vullen uw goederen ongeveer een halve container of meer, dan is een volle container per eenheid vaak goedkoper en sneller. De container wordt bij het laden verzegeld en pas op de bestemming geopend, dus er is minder handling en minder kans op schade." },
          { h: "Waar u verder op let", p: "Breekbare of waardevolle goederen reizen vaak beter in een eigen container. Krappe deadlines pleiten voor FCL, omdat u niet hoeft te wachten tot een gedeelde container vol is. Twijfelt u? Geef ons het volume en de datum en we prijzen beide opties." },
        ],
      },
      ar: {
        title: "FCL أم LCL: أيهما يناسب شحنتك؟",
        summary: "حاوية كاملة أم مشتركة؟ كيف تختار حسب الحجم والتكلفة والتوقيت.",
        imageAlt: "سفينة حاويات في البحر وقت الغسق",
        blocks: [
          { p: "عند الشحن البحري لديك خياران: حجز حاوية كاملة لبضائعك (FCL) أو مشاركة حاوية مع شاحنين آخرين (LCL). يعتمد الاختيار الصحيح على كمية ما تشحنه، وسرعة الوصول المطلوبة، وطريقة التغليف." },
          { h: "متى يكون LCL مناسبًا", p: "يناسب LCL الكميات الصغيرة، حتى ثلث الحاوية تقريبًا. تدفع مقابل المساحة التي تشغلها بضائعك، فتبقى التكلفة منخفضة لبضع منصات. تُحمّل الحاويات المشتركة وتُفرّغ في مستودع، ما يضيف بضعة أيام وبعض المناولة الإضافية." },
          { h: "متى يكون FCL مناسبًا", p: "عندما تملأ بضائعك نصف حاوية أو أكثر، تكون الحاوية الكاملة غالبًا أرخص لكل وحدة وأسرع. تُختم الحاوية عند التحميل ولا تُفتح إلا في الوجهة، فتقل المناولة ويقل خطر التلف." },
          { h: "أمور أخرى يجب مراعاتها", p: "البضائع الهشة أو الثمينة تُنقل غالبًا بشكل أفضل في حاوية خاصة. المواعيد الضيقة تفضّل FCL لأنه لا انتظار حتى تمتلئ حاوية مشتركة. إن لم تكن متأكدًا، أخبرنا بالحجم وتاريخ الجاهزية وسنسعّر الخيارين." },
        ],
      },
    },
  },
  "incoterms-explained": {
    date: "2026-09-24",
    minutes: 5,
    image: "/photos/port.jpg",
    isPhoto: true,
    text: {
      en: {
        title: "Incoterms in plain language",
        summary: "EXW, FOB, CIF, DDP: what they mean for who pays and who arranges what.",
        imageAlt: "Container port at blue hour with ships and cranes",
        blocks: [
          { p: "Incoterms are short codes in a sales contract that say where the seller's responsibility ends and the buyer's begins: who arranges transport, who pays for it, and who carries the risk at each stage. Getting them right avoids surprise costs." },
          { h: "EXW (Ex Works)", p: "The seller makes the goods available at their premises. The buyer arranges and pays for everything from there: pickup, export clearance, transport and import. It gives the buyer the most control and the most work." },
          { h: "FOB (Free On Board)", p: "Used for sea freight. The seller delivers the goods onto the ship at the port of loading and handles export clearance. From that moment the buyer pays and carries the risk." },
          { h: "CIF (Cost, Insurance and Freight)", p: "The seller pays for transport and minimum insurance to the destination port, but the risk passes to the buyer once the goods are on board at the origin." },
          { h: "DDP (Delivered Duty Paid)", p: "The seller takes care of everything up to the buyer's door, including import duties and taxes. It is the easiest option for the buyer and the most work for the seller." },
          { h: "How we help", p: "Tell us the Incoterm in your contract when you request a quote. We price only the part of the journey you are responsible for, and point out anything that is unclear." },
        ],
      },
      nl: {
        title: "Incoterms in gewone taal",
        summary: "EXW, FOB, CIF, DDP: wat ze betekenen voor wie betaalt en wie wat regelt.",
        imageAlt: "Containerhaven bij schemering met schepen en kranen",
        blocks: [
          { p: "Incoterms zijn korte codes in een verkoopcontract die aangeven waar de verantwoordelijkheid van de verkoper eindigt en die van de koper begint: wie het transport regelt, wie betaalt en wie in elke fase het risico draagt. Met de juiste keuze voorkomt u onverwachte kosten." },
          { h: "EXW (Ex Works)", p: "De verkoper stelt de goederen beschikbaar op zijn eigen locatie. De koper regelt en betaalt vanaf daar alles: ophalen, exportaangifte, transport en import. De koper heeft zo de meeste controle en het meeste werk." },
          { h: "FOB (Free On Board)", p: "Voor zeevracht. De verkoper levert de goederen aan boord van het schip in de laadhaven en regelt de exportaangifte. Vanaf dat moment betaalt de koper en draagt hij het risico." },
          { h: "CIF (Cost, Insurance and Freight)", p: "De verkoper betaalt transport en minimale verzekering tot de haven van bestemming, maar het risico gaat over op de koper zodra de goederen in de vertrekhaven aan boord zijn." },
          { h: "DDP (Delivered Duty Paid)", p: "De verkoper regelt alles tot aan de deur van de koper, inclusief invoerrechten en belastingen. De makkelijkste optie voor de koper en het meeste werk voor de verkoper." },
          { h: "Hoe wij helpen", p: "Vermeld de Incoterm uit uw contract in uw offerteaanvraag. Wij prijzen alleen het deel van de reis waarvoor u verantwoordelijk bent en wijzen u op wat onduidelijk is." },
        ],
      },
      ar: {
        title: "مصطلحات Incoterms بلغة بسيطة",
        summary: "EXW وFOB وCIF وDDP: ماذا تعني بالنسبة لمن يدفع ومن ينظم.",
        imageAlt: "ميناء حاويات وقت الغسق مع سفن ورافعات",
        blocks: [
          { p: "مصطلحات Incoterms رموز قصيرة في عقد البيع تحدد أين تنتهي مسؤولية البائع وتبدأ مسؤولية المشتري: من ينظم النقل، ومن يدفع، ومن يتحمل المخاطر في كل مرحلة. اختيارها الصحيح يجنبك تكاليف مفاجئة." },
          { h: "EXW (تسليم المصنع)", p: "يضع البائع البضائع تحت التصرف في مقره. ويتولى المشتري ويدفع كل شيء بعد ذلك: الاستلام والتخليص للتصدير والنقل والاستيراد. يمنح هذا المشتري أكبر قدر من التحكم وأكبر قدر من العمل." },
          { h: "FOB (التسليم على ظهر السفينة)", p: "يُستخدم للشحن البحري. يسلّم البائع البضائع على السفينة في ميناء الشحن ويتولى التخليص للتصدير. ومن تلك اللحظة يدفع المشتري ويتحمل المخاطر." },
          { h: "CIF (التكلفة والتأمين والشحن)", p: "يدفع البائع النقل والحد الأدنى من التأمين حتى ميناء الوجهة، لكن المخاطر تنتقل إلى المشتري بمجرد تحميل البضائع على السفينة في بلد المنشأ." },
          { h: "DDP (التسليم مع دفع الرسوم)", p: "يتولى البائع كل شيء حتى باب المشتري، بما في ذلك الرسوم والضرائب عند الاستيراد. هو الخيار الأسهل للمشتري والأكثر عملًا للبائع." },
          { h: "كيف نساعدك", p: "اذكر مصطلح Incoterms الوارد في عقدك عند طلب عرض السعر. نسعّر فقط الجزء الذي تتحمل مسؤوليته من الرحلة، وننبهك إلى أي نقطة غير واضحة." },
        ],
      },
    },
  },
  "faster-quote": {
    date: "2026-09-17",
    minutes: 3,
    image: "/photos/warehouse.jpg",
    isPhoto: true,
    text: {
      en: {
        title: "Five details that get you a faster, more accurate quote",
        summary: "What to include in your request so we can price it right the first time.",
        imageAlt: "Warehouse aisle with racked pallets",
        blocks: [
          { p: "Every price we send is checked by a person. The more complete your request, the fewer questions we need to ask and the faster your price arrives." },
          { h: "1. Exact pickup and delivery points", p: "A full address or the name of the port or airport. 'Germany' or 'the Gulf' is a start; 'Hamburg port' or a street address lets us price precisely." },
          { h: "2. Weight and size of each piece", p: "Total weight, plus the dimensions of each pallet, crate or carton. Volume often matters as much as weight." },
          { h: "3. How the goods are packed", p: "Pallets, crates, loose cartons or a full container. Packaging decides how the cargo is loaded and handled." },
          { h: "4. What the goods are", p: "A short description helps us check customs rules, certificates and any special handling, for example for food, chemicals or batteries." },
          { h: "5. When the goods are ready", p: "The ready date and any deadline for arrival. Timing decides which transport options and sailings are possible." },
        ],
      },
      nl: {
        title: "Vijf gegevens voor een snellere, nauwkeurigere offerte",
        summary: "Wat u in uw aanvraag zet zodat we het in één keer goed kunnen prijzen.",
        imageAlt: "Gangpad in een magazijn met pallets in stellingen",
        blocks: [
          { p: "Elke prijs die we sturen, wordt door een mens gecontroleerd. Hoe completer uw aanvraag, hoe minder vragen we hoeven te stellen en hoe sneller uw prijs er is." },
          { h: "1. Exacte ophaal- en afleverpunten", p: "Een volledig adres of de naam van de haven of luchthaven. 'Duitsland' of 'de Golf' is een begin; 'haven van Hamburg' of een straatadres laat ons precies prijzen." },
          { h: "2. Gewicht en afmetingen per stuk", p: "Het totale gewicht, plus de afmetingen van elke pallet, kist of doos. Volume telt vaak net zo zwaar als gewicht." },
          { h: "3. Hoe de goederen verpakt zijn", p: "Pallets, kisten, losse dozen of een volle container. De verpakking bepaalt hoe de lading geladen en behandeld wordt." },
          { h: "4. Wat de goederen zijn", p: "Een korte omschrijving helpt ons douaneregels, certificaten en speciale behandeling te controleren, bijvoorbeeld voor voeding, chemicaliën of batterijen." },
          { h: "5. Wanneer de goederen klaarstaan", p: "De datum waarop ze klaarstaan en een eventuele deadline voor aankomst. De timing bepaalt welke vervoersopties en afvaarten mogelijk zijn." },
        ],
      },
      ar: {
        title: "خمس معلومات تمنحك عرض سعر أسرع وأدق",
        summary: "ما الذي تضيفه إلى طلبك لنسعّره بشكل صحيح من المرة الأولى.",
        imageAlt: "ممر في مستودع برفوف تحمل منصات بضائع",
        blocks: [
          { p: "كل سعر نرسله يراجعه شخص. كلما كان طلبك أكمل، قلّت الأسئلة التي نحتاج إلى طرحها ووصلك السعر أسرع." },
          { h: "1. نقاط الاستلام والتسليم بدقة", p: "عنوان كامل أو اسم الميناء أو المطار. «ألمانيا» أو «الخليج» بداية، أما «ميناء هامبورغ» أو عنوان الشارع فيتيح لنا تسعيرًا دقيقًا." },
          { h: "2. وزن وأبعاد كل قطعة", p: "الوزن الإجمالي، وأبعاد كل منصة أو صندوق أو كرتونة. الحجم مهم غالبًا بقدر أهمية الوزن." },
          { h: "3. طريقة تغليف البضائع", p: "منصات أو صناديق أو كراتين منفردة أو حاوية كاملة. التغليف يحدد طريقة تحميل البضاعة ومناولتها." },
          { h: "4. نوع البضائع", p: "وصف قصير يساعدنا على التحقق من قواعد الجمارك والشهادات وأي مناولة خاصة، مثل الأغذية أو المواد الكيميائية أو البطاريات." },
          { h: "5. موعد جاهزية البضائع", p: "تاريخ الجاهزية وأي موعد نهائي للوصول. التوقيت يحدد خيارات النقل والرحلات الممكنة." },
        ],
      },
    },
  },
};
