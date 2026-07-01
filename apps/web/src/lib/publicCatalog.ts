export type PublicProduct = {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  priceBdt: number | "Custom";
  bestUseCase: string;
  features: string[];
  included: string[];
  seoTitle: string;
  seoDescription: string;
  faq: Array<{ question: string; answer: string }>;
};

export const publicProducts: PublicProduct[] = [
  {
    slug: "car-qr-sticker",
    name: "NoNumQR Car Sticker",
    shortName: "Car",
    description: "Private QR contact sticker for cars and parking issues.",
    priceBdt: 199,
    bestUseCase: "Private cars, parking gates, apartment garages, and office parking.",
    features: ["Phone hidden by default", "Private scanner message page", "Owner app chat", "Cash on Delivery"],
    included: ["1 QR sticker", "Private contact page", "Owner app access"],
    seoTitle: "Car QR Sticker Bangladesh - Private Contact Without Showing Phone Number",
    seoDescription:
      "Buy a private QR contact sticker for your car in Bangladesh. Let people message you when your car is blocking without seeing your phone number.",
    faq: [
      { question: "Does the car QR show my phone number?", answer: "No. It contains only a public NoNumQR URL." },
      { question: "Can someone message me without installing an app?", answer: "Yes. Scanners use their mobile browser." }
    ]
  },
  {
    slug: "bike-qr-sticker",
    name: "NoNumQR Bike Sticker",
    shortName: "Bike",
    description: "Private QR contact sticker for motorcycles and delivery bikes.",
    priceBdt: 199,
    bestUseCase: "Motorbikes, scooters, and delivery riders who need private contact.",
    features: ["Phone hidden by default", "Camera scan friendly", "Owner app chat", "COD available"],
    included: ["1 bike QR sticker", "Private scan page", "Owner app access"],
    seoTitle: "Bike QR Sticker BD - Private Contact QR for Motorbikes",
    seoDescription:
      "Buy a bike QR sticker in Bangladesh so people can message you privately without seeing your phone number.",
    faq: [{ question: "Can delivery riders use it?", answer: "Yes. It works for delivery bikes and personal motorbikes." }]
  },
  {
    slug: "lost-item-qr-tag",
    name: "NoNumQR Lost Item Tag",
    shortName: "Lost Item",
    description: "Private lost-and-found QR tag for bags, keys, wallets, documents, and equipment.",
    priceBdt: 149,
    bestUseCase: "Bags, keys, laptops, wallets, documents, and office equipment.",
    features: ["Finder can message privately", "No address shown", "No scanner login", "COD available"],
    included: ["1 lost item QR tag", "Private found-item page", "Owner app alerts"],
    seoTitle: "Lost Item QR Tag Bangladesh - Private Lost and Found Contact",
    seoDescription:
      "Attach a private QR tag to bags, keys, wallets, or documents so a finder can message you without seeing your phone number.",
    faq: [{ question: "Will my address be public?", answer: "No. Public QR pages do not show your address." }]
  },
  {
    slug: "business-qr-card",
    name: "NoNumQR Business QR Card",
    shortName: "Business",
    description: "Private QR contact card for professionals, freelancers, and small businesses.",
    priceBdt: 249,
    bestUseCase: "Business cards, freelancers, small service providers, and professionals.",
    features: ["Private business inquiries", "Optional public details later", "Owner app chat", "COD available"],
    included: ["1 business QR card", "Private contact page", "Owner app access"],
    seoTitle: "Business QR Contact Card Bangladesh - Private Customer Messages",
    seoDescription:
      "Buy a QR contact card for business inquiries in Bangladesh while keeping your personal phone number private.",
    faq: [{ question: "Is this a full website?", answer: "No. It is a private QR contact flow for customer messages." }]
  },
  {
    slug: "apartment-parking-qr",
    name: "NoNumQR Apartment Parking QR",
    shortName: "Parking",
    description: "Private QR sticker for apartment, office, and society parking contact.",
    priceBdt: 249,
    bestUseCase: "Apartment parking, building guards, visitor parking, and office parking.",
    features: ["Private parking contact", "Phone hidden by default", "Owner app chat", "Bulk-friendly"],
    included: ["1 parking QR sticker", "Private scan page", "Owner app access"],
    seoTitle: "Apartment Parking QR Sticker Bangladesh - Private Parking Contact",
    seoDescription:
      "Use apartment parking QR stickers so guards or neighbors can message vehicle owners privately.",
    faq: [{ question: "Can societies buy bulk tags?", answer: "Yes. Society and office bulk support can be arranged." }]
  },
  {
    slug: "shop-qr-contact-sticker",
    name: "NoNumQR Shop QR Sticker",
    shortName: "Shop",
    description: "Private QR contact sticker for shops, counters, and service desks.",
    priceBdt: 249,
    bestUseCase: "Shops, counters, repair points, and small service businesses.",
    features: ["Customer browser messages", "Phone hidden by default", "Owner app chat", "COD available"],
    included: ["1 shop QR sticker", "Private contact page", "Owner app access"],
    seoTitle: "Shop QR Contact Sticker Bangladesh - Private Customer Contact",
    seoDescription:
      "Display a shop QR contact sticker so customers can send private messages without exposing your personal phone number.",
    faq: [{ question: "Can customers call directly?", answer: "Only if you later choose to enable a direct contact option." }]
  }
];

export const faqItems = [
  { question: "Will people see my phone number?", answer: "No. Your phone number stays hidden by default on public QR pages." },
  { question: "What is inside the QR code?", answer: "Only a public NoNumQR URL is inside the QR code. It does not encode your phone number, owner ID, address, or private profile data." },
  { question: "Can a scanner continue the chat?", answer: "Yes, after sending a message the scanner can use a private continuation link for that conversation." },
  { question: "Does the conversation expire?", answer: "Yes. After inactivity the conversation becomes read-only or unavailable, and the scanner must scan again to start a new request." },
  { question: "Can I report abuse?", answer: "Yes. Public scan flows include abuse reporting so misuse can be reviewed." },
  { question: "Does NoNumQR support calls?", answer: "NoNumQR can support browser-based private call sessions where available, but it does not claim carrier-phone number hiding." },
  { question: "Is Cash on Delivery available?", answer: "Yes. Cash on Delivery is the working payment method for public orders." },
  { question: "Are online payments available?", answer: "Online payments should not be treated as production-ready until NoNumQR explicitly launches and verifies them." },
  { question: "Do scanners need an account?", answer: "No. They scan the QR and message from a mobile browser." },
  { question: "How do I activate my QR tag?", answer: "Order with your phone number, download the owner app, and sign in with the same phone number." }
];

export function productBySlug(slug: string) {
  return publicProducts.find((product) => product.slug === slug);
}

export function formatBdt(value: number | "Custom") {
  return value === "Custom" ? "Custom" : `BDT ${value.toLocaleString("en-BD")}`;
}
