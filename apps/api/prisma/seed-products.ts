import { ProductType } from "@prisma/client";
import { prisma } from "../src/lib/prisma.js";

const products = [
  {
    slug: "car-qr-sticker",
    type: ProductType.CAR_STICKER,
    name: "Car QR Sticker",
    description: "Private QR contact sticker for cars and parking issues.",
    priceBdt: 199,
    metadata: {
      bestUseCase: "Private cars, parking gates, apartment garages, and office parking.",
      estimatedDeliveryNote: "Estimated delivery inside Bangladesh after admin confirmation.",
      features: ["Phone hidden by default", "Private scanner message page", "Owner app chat", "COD available"],
      included: ["1 weather-friendly QR sticker", "Private contact page", "Owner app access"],
      seoTitle: "Car QR Sticker Bangladesh - Private Contact Without Showing Phone Number",
      seoDescription:
        "Buy a private QR contact sticker for your car in Bangladesh. Let people message you when your car is blocking without seeing your phone number.",
      faq: [
        { question: "Will my phone number be inside the QR?", answer: "No. The QR contains only a public ScanContact URL." },
        { question: "Can the scanner message me without an app?", answer: "Yes. The scanner uses a mobile browser." }
      ]
    }
  },
  {
    slug: "bike-qr-sticker",
    type: ProductType.BIKE_STICKER,
    name: "Bike QR Sticker",
    description: "Private QR contact sticker for motorcycles and delivery bikes.",
    priceBdt: 199,
    metadata: {
      bestUseCase: "Motorbikes, scooters, and delivery riders who need private contact.",
      estimatedDeliveryNote: "Estimated delivery inside Bangladesh after admin confirmation.",
      features: ["Phone hidden by default", "Works from phone camera", "Owner app chat", "COD available"],
      included: ["1 bike QR sticker", "Private scan page", "Owner app access"],
      seoTitle: "Bike QR Sticker BD - Private Contact QR for Motorbikes",
      seoDescription:
        "Buy a bike QR sticker in Bangladesh so people can message you privately without seeing your phone number.",
      faq: [
        { question: "Can delivery riders use it?", answer: "Yes. It is suitable for delivery bikes and personal motorbikes." }
      ]
    }
  },
  {
    slug: "lost-item-qr-tag",
    type: ProductType.LOST_AND_FOUND_STICKER,
    name: "Lost Item QR Tag",
    description: "Private lost-and-found QR tag for bags, keys, wallets, documents, and equipment.",
    priceBdt: 149,
    metadata: {
      bestUseCase: "Bags, keys, laptops, wallets, documents, and office equipment.",
      estimatedDeliveryNote: "Estimated delivery inside Bangladesh after admin confirmation.",
      features: ["Finder can message privately", "Phone hidden by default", "No scanner login", "COD available"],
      included: ["1 lost item QR tag", "Private found-item page", "Owner app alerts"],
      seoTitle: "Lost Item QR Tag Bangladesh - Private Lost and Found Contact",
      seoDescription:
        "Attach a private QR tag to bags, keys, wallets, or documents so a finder can message you without seeing your phone number.",
      faq: [
        { question: "Can someone see my address?", answer: "No. Public pages do not show your address." }
      ]
    }
  },
  {
    slug: "business-qr-card",
    type: ProductType.BUSINESS_QR_CARD,
    name: "Business QR Contact Card",
    description: "Private QR contact card for professionals, freelancers, and small businesses.",
    priceBdt: 249,
    metadata: {
      bestUseCase: "Business cards, freelancers, small service providers, and professionals.",
      estimatedDeliveryNote: "Estimated delivery inside Bangladesh after admin confirmation.",
      features: ["Private contact request", "Optional business info later", "Owner app chat", "COD available"],
      included: ["1 business QR card", "Private contact page", "Owner app access"],
      seoTitle: "Business QR Contact Card Bangladesh - Private Customer Messages",
      seoDescription:
        "Buy a QR contact card for business inquiries in Bangladesh while keeping your personal phone number private.",
      faq: [
        { question: "Is this a full website?", answer: "No. It is a private QR contact flow for customer messages." }
      ]
    }
  },
  {
    slug: "apartment-parking-qr",
    type: ProductType.APARTMENT_PARKING_QR,
    name: "Apartment Parking QR Sticker",
    description: "Private QR sticker for apartment, office, and society parking contact.",
    priceBdt: 249,
    metadata: {
      bestUseCase: "Apartment parking, building guards, visitor parking, and office parking.",
      estimatedDeliveryNote: "Estimated delivery inside Bangladesh after admin confirmation.",
      features: ["Private parking contact", "Phone hidden by default", "Owner app chat", "Bulk-friendly"],
      included: ["1 parking QR sticker", "Private scan page", "Owner app access"],
      seoTitle: "Apartment Parking QR Sticker Bangladesh - Private Parking Contact",
      seoDescription:
        "Use apartment parking QR stickers so guards or neighbors can message vehicle owners privately.",
      faq: [
        { question: "Can societies buy bulk tags?", answer: "Yes. Contact admin for society or office bulk support." }
      ]
    }
  },
  {
    slug: "shop-qr-contact-sticker",
    type: ProductType.BUSINESS_QR_CARD,
    name: "Shop QR Contact Sticker",
    description: "Private QR contact sticker for shops, counters, and service desks.",
    priceBdt: 249,
    metadata: {
      bestUseCase: "Shops, counters, repair points, and small service businesses.",
      estimatedDeliveryNote: "Estimated delivery inside Bangladesh after admin confirmation.",
      features: ["Customer can message from browser", "Phone hidden by default", "Owner app chat", "COD available"],
      included: ["1 shop QR sticker", "Private contact page", "Owner app access"],
      seoTitle: "Shop QR Contact Sticker Bangladesh - Private Customer Contact",
      seoDescription:
        "Display a shop QR contact sticker so customers can send private messages without exposing your personal phone number.",
      faq: [
        { question: "Can customers call directly?", answer: "Only if you later choose to expose a direct contact option." }
      ]
    }
  }
] as const;

async function main() {
  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        type: product.type,
        name: product.name,
        description: product.description,
        priceBdt: product.priceBdt,
        active: true,
        metadata: product.metadata
      },
      create: {
        slug: product.slug,
        type: product.type,
        name: product.name,
        description: product.description,
        priceBdt: product.priceBdt,
        active: true,
        metadata: product.metadata
      }
    });
  }
  console.info(`Seeded ${products.length} ScanContact BD public products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
