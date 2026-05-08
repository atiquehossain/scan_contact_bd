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
    name: "Car QR Sticker",
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
      { question: "Does the car QR show my phone number?", answer: "No. It contains only a public ScanContact BD URL." },
      { question: "Can someone message me without installing an app?", answer: "Yes. Scanners use their mobile browser." }
    ]
  },
  {
    slug: "bike-qr-sticker",
    name: "Bike QR Sticker",
    shortName: "Bike",
    description: "Private QR contact sticker for motorcycles and delivery bikes.",
    priceBdt: 199,
    bestUseCase: "Motorbikes, scooters, and delivery riders who need private contact.",
    features: ["Phone hidden", "Camera scan friendly", "Owner app chat", "COD available"],
    included: ["1 bike QR sticker", "Private scan page", "Owner app access"],
    seoTitle: "Bike QR Sticker BD - Private Contact QR for Motorbikes",
    seoDescription:
      "Buy a bike QR sticker in Bangladesh so people can message you privately without seeing your phone number.",
    faq: [{ question: "Can delivery riders use it?", answer: "Yes. It works for delivery bikes and personal motorbikes." }]
  },
  {
    slug: "lost-item-qr-tag",
    name: "Lost Item QR Tag",
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
    name: "Business QR Contact Card",
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
    name: "Apartment Parking QR Sticker",
    shortName: "Parking",
    description: "Private QR sticker for apartment, office, and society parking contact.",
    priceBdt: 249,
    bestUseCase: "Apartment parking, building guards, visitor parking, and office parking.",
    features: ["Private parking contact", "Phone hidden", "Owner app chat", "Bulk-friendly"],
    included: ["1 parking QR sticker", "Private scan page", "Owner app access"],
    seoTitle: "Apartment Parking QR Sticker Bangladesh - Private Parking Contact",
    seoDescription:
      "Use apartment parking QR stickers so guards or neighbors can message vehicle owners privately.",
    faq: [{ question: "Can societies buy bulk tags?", answer: "Yes. Society and office bulk support can be arranged." }]
  },
  {
    slug: "shop-qr-contact-sticker",
    name: "Shop QR Contact Sticker",
    shortName: "Shop",
    description: "Private QR contact sticker for shops, counters, and service desks.",
    priceBdt: 249,
    bestUseCase: "Shops, counters, repair points, and small service businesses.",
    features: ["Customer browser messages", "Phone hidden", "Owner app chat", "COD available"],
    included: ["1 shop QR sticker", "Private contact page", "Owner app access"],
    seoTitle: "Shop QR Contact Sticker Bangladesh - Private Customer Contact",
    seoDescription:
      "Display a shop QR contact sticker so customers can send private messages without exposing your personal phone number.",
    faq: [{ question: "Can customers call directly?", answer: "Only if you later choose to enable a direct contact option." }]
  }
];

export const faqItems = [
  { question: "Does the QR code show my phone number?", answer: "No. The QR code contains only a public ScanContact BD URL." },
  { question: "Can a scanner call me directly?", answer: "Not by default. Private in-product messages come first." },
  { question: "Do scanners need an account?", answer: "No. They scan the QR and message from a mobile browser." },
  { question: "How does private chat work?", answer: "The scanner gets a private continuation link. The owner replies from the owner app." },
  { question: "What happens after the conversation expires?", answer: "After 30 minutes of no activity the chat becomes read-only. The scanner must scan again to start a new chat." },
  { question: "Can I use it for my car?", answer: "Yes. Car parking contact is one of the main use cases." },
  { question: "Can I use it for a lost item?", answer: "Yes. Bags, keys, wallets, laptops, and documents are good fits." },
  { question: "Can I buy multiple QR tags?", answer: "Yes. Choose quantity at checkout or buy a multi-tag package." },
  { question: "Is Cash on Delivery available?", answer: "Yes. COD is the first supported payment method." },
  { question: "How do I activate my QR tag?", answer: "Order with your phone number, download the owner app, and sign in with the same phone number." }
];

export function productBySlug(slug: string) {
  return publicProducts.find((product) => product.slug === slug);
}

export function formatBdt(value: number | "Custom") {
  return value === "Custom" ? "Custom" : `BDT ${value.toLocaleString("en-BD")}`;
}
