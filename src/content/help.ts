import type { Locale } from "@/lib/i18n";

/** Help centre: FAQ grouped by topic, and a glossary of shipping terms. Draft copy for the client to review. */

export type FaqTopic = "quotes" | "shipping" | "customs" | "account";
type Faq = { topic: FaqTopic; q: string; a: string };

export const faqTopics: Record<Locale, Record<FaqTopic, string>> = {
  en: { quotes: "Quotes & prices", shipping: "Shipping & tracking", customs: "Customs & documents", account: "Your account" },
  nl: { quotes: "Offertes & prijzen", shipping: "Verzending & tracking", customs: "Douane & documenten", account: "Uw account" },
  ar: { quotes: "عروض الأسعار والأسعار", shipping: "الشحن والتتبع", customs: "الجمارك والمستندات", account: "حسابك" },
};

export const faqs: Record<Locale, Faq[]> = {
  en: [
    { topic: "quotes", q: "How do I get a price?", a: "Fill in the quote form with your route and cargo. Our team checks the details and sends you a price by email. You can also see and accept it in My TFS." },
    { topic: "quotes", q: "Why don't you show a price straight away?", a: "Every shipment is different: weight, size, route, timing and paperwork all change the price. A person checks each request so the price you get is the price you pay." },
    { topic: "quotes", q: "How long is a price valid?", a: "Each price shows a validity date. Accept it before that date. After it expires, send a new request and we'll check the price again." },
    { topic: "quotes", q: "What information speeds up my quote?", a: "Exact pickup and delivery addresses or ports, the weight and dimensions of each piece, how the goods are packed, the ready date, and what the goods are." },
    { topic: "shipping", q: "How do I track my shipment?", a: "Enter your shipment reference (it starts with TFS-S) in the Track box at the top of any page. Logged-in customers see all their shipments in My TFS." },
    { topic: "shipping", q: "Which transport should I choose?", a: "Sea freight is the most economical for larger volumes, air freight is fastest for urgent or valuable goods, and road transport works well within Europe. Choose 'Not sure yet' and we'll advise." },
    { topic: "shipping", q: "Can you collect from my supplier?", a: "Yes. Give us the supplier's address and contact, and we arrange pickup and the export side of the shipment." },
    { topic: "customs", q: "Do you handle customs clearance?", a: "Yes. We prepare the export and import declarations and tell you which documents we need from you, such as the commercial invoice and packing list." },
    { topic: "customs", q: "Which documents do I need?", a: "Usually a commercial invoice and a packing list. Some goods also need certificates, for example of origin or for food and plants. We tell you what applies to your shipment." },
    { topic: "customs", q: "Where do I find my shipping documents?", a: "Documents we share for a shipment, like the bill of lading or customs papers, appear on that shipment's page in My TFS." },
    { topic: "account", q: "Do I need an account to request a quote?", a: "No. If you later log in with the same email address, your earlier quotes appear in My TFS automatically." },
    { topic: "account", q: "How do I log in?", a: "Enter your email on the login page and we send you a sign-in link. There is no password to remember." },
  ],
  nl: [
    { topic: "quotes", q: "Hoe krijg ik een prijs?", a: "Vul het offerteformulier in met uw route en lading. Ons team controleert de gegevens en stuurt u een prijs per e-mail. U kunt die ook bekijken en accepteren in Mijn TFS." },
    { topic: "quotes", q: "Waarom tonen jullie niet direct een prijs?", a: "Elke zending is anders: gewicht, afmetingen, route, timing en papierwerk bepalen de prijs. Een medewerker bekijkt elke aanvraag, zodat de prijs die u krijgt ook de prijs is die u betaalt." },
    { topic: "quotes", q: "Hoe lang is een prijs geldig?", a: "Bij elke prijs staat een geldigheidsdatum. Accepteer de prijs vóór die datum. Daarna stuurt u een nieuwe aanvraag en controleren we de prijs opnieuw." },
    { topic: "quotes", q: "Welke informatie versnelt mijn offerte?", a: "Exacte ophaal- en afleveradressen of havens, gewicht en afmetingen per stuk, hoe de goederen verpakt zijn, de datum waarop ze klaarstaan en wat de goederen zijn." },
    { topic: "shipping", q: "Hoe volg ik mijn zending?", a: "Vul uw zendingsreferentie in (die begint met TFS-S) in het Track-vak bovenaan elke pagina. Ingelogde klanten zien al hun zendingen in Mijn TFS." },
    { topic: "shipping", q: "Welk vervoer moet ik kiezen?", a: "Zeevracht is het voordeligst voor grotere volumes, luchtvracht is het snelst voor dringende of waardevolle goederen, en wegtransport werkt goed binnen Europa. Kies 'Weet ik nog niet' en wij adviseren u." },
    { topic: "shipping", q: "Kunnen jullie ophalen bij mijn leverancier?", a: "Ja. Geef ons het adres en de contactpersoon van de leverancier, dan regelen wij het ophalen en de exportkant van de zending." },
    { topic: "customs", q: "Regelen jullie de douane?", a: "Ja. Wij maken de export- en importaangiften klaar en laten u weten welke documenten we van u nodig hebben, zoals de handelsfactuur en paklijst." },
    { topic: "customs", q: "Welke documenten heb ik nodig?", a: "Meestal een handelsfactuur en een paklijst. Sommige goederen hebben ook certificaten nodig, bijvoorbeeld van oorsprong of voor voeding en planten. Wij vertellen u wat voor uw zending geldt." },
    { topic: "customs", q: "Waar vind ik mijn verzenddocumenten?", a: "Documenten die we bij een zending delen, zoals het cognossement of douanepapieren, staan op de pagina van die zending in Mijn TFS." },
    { topic: "account", q: "Heb ik een account nodig voor een offerte?", a: "Nee. Als u later inlogt met hetzelfde e-mailadres, verschijnen uw eerdere offertes automatisch in Mijn TFS." },
    { topic: "account", q: "Hoe log ik in?", a: "Vul uw e-mailadres in op de inlogpagina en wij sturen u een inloglink. U hoeft geen wachtwoord te onthouden." },
  ],
  ar: [
    { topic: "quotes", q: "كيف أحصل على سعر؟", a: "املأ نموذج عرض السعر بالمسار والبضاعة. يراجع فريقنا التفاصيل ويرسل لك السعر بالبريد الإلكتروني. يمكنك أيضًا مشاهدته وقبوله في حسابي في TFS." },
    { topic: "quotes", q: "لماذا لا تعرضون السعر مباشرة؟", a: "كل شحنة مختلفة: الوزن والحجم والمسار والتوقيت والأوراق كلها تغيّر السعر. يراجع موظف كل طلب، ليكون السعر الذي تحصل عليه هو السعر الذي تدفعه." },
    { topic: "quotes", q: "ما مدة صلاحية السعر؟", a: "لكل سعر تاريخ صلاحية. اقبله قبل ذلك التاريخ. بعد انتهائه، أرسل طلبًا جديدًا وسنراجع السعر مرة أخرى." },
    { topic: "quotes", q: "ما المعلومات التي تسرّع عرض السعر؟", a: "عناوين أو موانئ الاستلام والتسليم بدقة، ووزن وأبعاد كل قطعة، وطريقة التغليف، وتاريخ الجاهزية، ونوع البضاعة." },
    { topic: "shipping", q: "كيف أتتبع شحنتي؟", a: "أدخل الرقم المرجعي للشحنة (يبدأ بـ TFS-S) في خانة التتبع أعلى أي صفحة. يرى العملاء المسجلون جميع شحناتهم في حسابي في TFS." },
    { topic: "shipping", q: "أي وسيلة نقل أختار؟", a: "الشحن البحري هو الأوفر للكميات الكبيرة، والشحن الجوي هو الأسرع للبضائع العاجلة أو الثمينة، والنقل البري مناسب داخل أوروبا. اختر «لست متأكدًا بعد» وسننصحك." },
    { topic: "shipping", q: "هل يمكنكم الاستلام من مورّدي؟", a: "نعم. أعطنا عنوان المورد وجهة الاتصال، وننظم الاستلام وجانب التصدير من الشحنة." },
    { topic: "customs", q: "هل تتولون التخليص الجمركي؟", a: "نعم. نجهز بيانات التصدير والاستيراد ونخبرك بالمستندات التي نحتاجها منك، مثل الفاتورة التجارية وقائمة التعبئة." },
    { topic: "customs", q: "ما المستندات التي أحتاجها؟", a: "عادةً فاتورة تجارية وقائمة تعبئة. تحتاج بعض البضائع أيضًا إلى شهادات، مثل شهادة المنشأ أو شهادات الأغذية والنباتات. نخبرك بما ينطبق على شحنتك." },
    { topic: "customs", q: "أين أجد مستندات الشحن؟", a: "المستندات التي نشاركها لشحنة ما، مثل بوليصة الشحن أو أوراق الجمارك، تظهر في صفحة تلك الشحنة في حسابي في TFS." },
    { topic: "account", q: "هل أحتاج إلى حساب لطلب عرض سعر؟", a: "لا. إذا سجلت الدخول لاحقًا بالبريد الإلكتروني نفسه، تظهر عروضك السابقة تلقائيًا في حسابي في TFS." },
    { topic: "account", q: "كيف أسجل الدخول؟", a: "أدخل بريدك الإلكتروني في صفحة تسجيل الدخول وسنرسل لك رابط الدخول. لا توجد كلمة مرور لتتذكرها." },
  ],
};

type Term = { term: string; def: string };

export const glossary: Record<Locale, Term[]> = {
  en: [
    { term: "FCL", def: "Full container load: you use a whole container for your goods." },
    { term: "LCL", def: "Less than container load: your goods share a container with other shipments." },
    { term: "Incoterms", def: "International rules that say who pays for and arranges each part of the transport, such as EXW, FOB, CIF and DDP." },
    { term: "Bill of lading (B/L)", def: "The document a sea carrier issues for your goods. It works as a receipt and often as proof of ownership." },
    { term: "Air waybill (AWB)", def: "The transport document for air freight." },
    { term: "HS code", def: "The international product code customs use to decide duties and rules for your goods." },
    { term: "ETA / ETD", def: "Estimated time of arrival / departure." },
    { term: "Customs clearance", def: "Getting goods approved by customs to leave or enter a country, including paying duties and taxes." },
    { term: "Commercial invoice", def: "The seller's invoice for the goods. Customs use it to check value and contents." },
    { term: "Packing list", def: "A list of every package in the shipment with its contents, weight and size." },
  ],
  nl: [
    { term: "FCL", def: "Full container load: u gebruikt een hele container voor uw goederen." },
    { term: "LCL", def: "Less than container load: uw goederen delen een container met andere zendingen." },
    { term: "Incoterms", def: "Internationale regels die bepalen wie elk deel van het transport betaalt en regelt, zoals EXW, FOB, CIF en DDP." },
    { term: "Cognossement (B/L)", def: "Het document dat een zeevervoerder voor uw goederen uitgeeft. Het geldt als ontvangstbewijs en vaak als eigendomsbewijs." },
    { term: "Luchtvrachtbrief (AWB)", def: "Het vervoersdocument voor luchtvracht." },
    { term: "HS-code", def: "De internationale goederencode waarmee de douane rechten en regels voor uw goederen bepaalt." },
    { term: "ETA / ETD", def: "Verwachte aankomst- / vertrektijd." },
    { term: "Douane-afhandeling", def: "Goederen laten goedkeuren door de douane om een land te verlaten of binnen te komen, inclusief het betalen van rechten en belastingen." },
    { term: "Handelsfactuur", def: "De factuur van de verkoper voor de goederen. De douane controleert er waarde en inhoud mee." },
    { term: "Paklijst", def: "Een lijst van elk pakket in de zending met inhoud, gewicht en afmetingen." },
  ],
  ar: [
    { term: "FCL", def: "حمولة حاوية كاملة: تستخدم حاوية كاملة لبضائعك." },
    { term: "LCL", def: "حمولة أقل من حاوية: تتشارك بضائعك حاوية مع شحنات أخرى." },
    { term: "Incoterms", def: "قواعد دولية تحدد من يدفع ومن ينظم كل جزء من النقل، مثل EXW وFOB وCIF وDDP." },
    { term: "بوليصة الشحن (B/L)", def: "المستند الذي يصدره الناقل البحري لبضائعك. يُعد إيصالًا وغالبًا إثباتًا للملكية." },
    { term: "بوليصة الشحن الجوي (AWB)", def: "مستند النقل للشحن الجوي." },
    { term: "رمز النظام المنسق (HS)", def: "الرمز الدولي للمنتج الذي تستخدمه الجمارك لتحديد الرسوم والقواعد لبضائعك." },
    { term: "ETA / ETD", def: "الموعد المتوقع للوصول / المغادرة." },
    { term: "التخليص الجمركي", def: "الحصول على موافقة الجمارك لخروج البضائع من بلد أو دخولها، بما في ذلك دفع الرسوم والضرائب." },
    { term: "الفاتورة التجارية", def: "فاتورة البائع للبضائع. تستخدمها الجمارك للتحقق من القيمة والمحتوى." },
    { term: "قائمة التعبئة", def: "قائمة بكل طرد في الشحنة مع محتواه ووزنه وأبعاده." },
  ],
};
