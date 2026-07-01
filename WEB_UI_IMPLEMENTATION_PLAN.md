# WEB UI Implementation Plan

Scope: web app only. This plan compares the existing `apps/web` implementation with the Stitch export in `ui_for_web` and proposes a safe UI implementation sequence. No Flutter/mobile files, `apps/mobile`, `ui_for_app`, backend contracts, route paths, checkout behavior, scanner behavior, public chat, public call flow, or admin behavior should be changed as part of this planning pass.

## 1. Stitch Asset Summary

Stitch project: `NoNumQR Web Design System`  
Design system: `Serene Privacy`  
Export directory: `ui_for_web/`

Asset counts:

| Asset type | Count | Notes |
|---|---:|---|
| HTML source files | 41 | Screen/component mockups under `ui_for_web/html/` |
| SVG source files | 2 | Privacy icon mark and wordmark logo under `ui_for_web/html/` |
| Total HTML/SVG source files | 43 | All source records except image-only screens |
| Screenshot/image PNG files | 45 | Screen captures and image-only references under `ui_for_web/screenshots/` |
| Manifest records | 45 | `screens-manifest.json` and `screens-manifest.local.json` |
| Zero-byte files found | 0 | Export appears complete |

Main screen names from the manifest:

| # | Stitch screen | Source |
|---:|---|---|
| 1 | Private Call: Ended - NoNumQR | HTML |
| 2 | A set of premium QR products for NoNumQR | Image-only |
| 3 | Chat Loading & Empty States - NoNumQR | HTML |
| 4 | NoNumQR Product Detail - Car Sticker | HTML |
| 5 | NoNumQR Privacy Icon Mark | SVG |
| 6 | Private Call: Ringing - NoNumQR | HTML |
| 7 | Order Success - NoNumQR | HTML |
| 8 | NoNumQR Wordmark Logo | SVG |
| 9 | Active Tag Scan - NoNumQR | HTML |
| 10 | Private Call: Preparing - NoNumQR | HTML |
| 11 | Active Tag Scan - NoNumQR | HTML |
| 12 | Private Chat - NoNumQR | HTML |
| 13 | Track Order - NoNumQR | HTML |
| 14 | Checkout - NoNumQR | HTML |
| 15 | Privacy - NoNumQR | HTML |
| 16 | NoNumQR Landing Page | HTML |
| 17 | Pricing - NoNumQR | HTML |
| 18 | Shipping & Terms - NoNumQR | HTML |
| 19 | Admin Overview - NoNumQR | HTML |
| 20 | Chat Expired & Unavailable - NoNumQR | HTML |
| 21 | NoNumQR Product Catalog | HTML |
| 22 | Admin Login - NoNumQR | HTML |
| 23 | Private Chat - NoNumQR (Desktop) | HTML |
| 24 | Owners List - Admin Console | HTML |
| 25 | Contact Us - NoNumQR | HTML |
| 26 | Orders - Admin Console | HTML |
| 27 | FAQ - NoNumQR | HTML |
| 28 | Private Call: Connected - NoNumQR | HTML |
| 29 | Download App - NoNumQR | HTML |
| 30 | Owner Detail - Admin Console | HTML |
| 31 | Audit Logs - Admin Console | HTML |
| 32 | Tag Details - Admin Console | HTML |
| 33 | How it Works - NoNumQR | HTML |
| 34 | Message Sent - NoNumQR | HTML |
| 35 | Premium hero image for NoNumQR | Image-only |
| 36 | Chat States (Loading & Expired) - NoNumQR (Desktop) | HTML |
| 37 | Connecting... - NoNumQR | HTML |
| 38 | Settings & Health - Admin Console | HTML |
| 39 | Tag Inactive - NoNumQR | HTML |
| 40 | Admin Dashboard Shell - NoNumQR | HTML |
| 41 | Admin Overview (Loading) - NoNumQR | HTML |
| 42 | NoNumQR Web UI Kit | HTML |
| 43 | Users - Admin Console | HTML |
| 44 | Reports - Admin Console | HTML |
| 45 | Create New QR Tag - Admin Console | HTML |

Image-only records:

| Stitch record | Screenshot path | Use |
|---|---|---|
| A set of premium QR products for NoNumQR | `ui_for_web/screenshots/02_a-set-of-premium-qr-products-for-nonumqr_e62cac20.png` | Product imagery reference. Do not copy into production blindly. |
| Premium hero image for NoNumQR | `ui_for_web/screenshots/35_premium-hero-image-for-nonumqr_a5717aac.png` | Hero image reference. Review before using as a real asset. |

Most important design files/screens:

| File/screen | Why it matters |
|---|---|
| `ui_for_web/DESIGN.md` | Foundation tokens and design principles for the web UI refresh. |
| `ui_for_web/html/42_nonumqr-web-ui-kit_aa50e1f2.html` | Shared component language for buttons, cards, forms, states, and tables. |
| `ui_for_web/html/16_nonumqr-landing-page_b69e2422.html` | Primary public marketing direction. |
| `ui_for_web/html/40_admin-dashboard-shell-nonumqr_8e330063.html` | Admin navigation and shell direction. |
| `ui_for_web/html/19_admin-overview-nonumqr_3e45bf3d.html` and `41_admin-overview-loading-nonumqr_7ad055a1.html` | Admin dashboard and loading states. |
| Scan screens `09`, `11`, `34`, `39` | Public QR scan flow states. These are high-risk and must preserve API behavior. |
| Chat screens `03`, `12`, `20`, `23`, `36` | Public conversation flow, desktop/mobile, loading, empty, expired, unavailable. |
| Call screens `01`, `06`, `10`, `28`, `37` | Public call flow states. Copy must avoid claiming phone masking. |
| Checkout/order screens `07`, `13`, `14`, `21` | Commerce flow reference. Keep COD checkout behavior intact. |
| SVG logo screens `05`, `08` | Candidate future brand assets. |

## 2. Current Web Route Summary

| Route | File path | Purpose | Current implementation style | Client-side API dependencies | Stitch match | Risk |
|---|---|---|---|---|---|---|
| `/` | `apps/web/src/app/page.tsx` | Public landing page with privacy promise, hero, use cases, products, pricing, FAQ, CTA, SEO JSON-LD. | Server page using `PublicLayout` and `PublicSections`; mostly static content. | None. | `16_nonumqr-landing-page_b69e2422` | Medium |
| `/how-it-works` | `apps/web/src/app/how-it-works/page.tsx` | Explains scan, contact, owner response flow. | Static server page with `PublicLayout`, `SectionIntro`, lucide icons. | None. | `33_how-it-works-nonumqr_c888ec1b` | Low |
| `/pricing` | `apps/web/src/app/pricing/page.tsx` | Public pricing and COD positioning. | Static server page using shared pricing/CTA sections. | None. | `17_pricing-nonumqr_401df19b` | Low |
| `/privacy` | `apps/web/src/app/privacy/page.tsx` | Privacy promise and data handling explanation. | Static server page with `PublicLayout`, icons, content sections. | None. | `15_privacy-nonumqr_4f17c34e` | Low |
| `/faq` | `apps/web/src/app/faq/page.tsx` | Public FAQ with SEO JSON-LD. | Static server page using shared FAQ section. | None. | `27_faq-nonumqr_fb4bc511` | Low |
| `/download-app` | `apps/web/src/app/download-app/page.tsx` | App download/setup guidance. | Static server page with public layout and CTA blocks. | None. | `29_download-app-nonumqr_ea57736d` | Low |
| `/contact` | `apps/web/src/app/contact/page.tsx` | Public contact/support information. | Static server page with public layout and support cards. | None. | `25_contact-us-nonumqr_2ac74180` | Low |
| `/shipping` | `apps/web/src/app/shipping/page.tsx` | Shipping policy and delivery expectations. | Static server policy page. | None. | `18_shipping-terms-nonumqr_3bbe61d8` | Low |
| `/terms` | `apps/web/src/app/terms/page.tsx` | Terms of service. | Static server policy page. | None. | `18_shipping-terms-nonumqr_3bbe61d8` | Low |
| `/buy` | `apps/web/src/app/buy/page.tsx` | Product catalog and start of purchase journey. | Server wrapper with `PublicLayout`; client product catalog in `BuyProductsClient`. | `GET /public/products` through `apiFetch(..., "",)` | `21_nonumqr-product-catalog_2f57d134` | Medium |
| `/product/[slug]` | `apps/web/src/app/product/[slug]/page.tsx` | Product detail and SEO pages for static product slugs. | Static generated params from `publicCatalog`; server-rendered product detail. | None in page; links to checkout/buy. | `04_nonumqr-product-detail-car-sticker_edb13eae` | Medium |
| `/checkout` | `apps/web/src/app/checkout/page.tsx` | COD checkout form and public order creation. | Server wrapper with Suspense around `CheckoutClient`. | `GET /public/products`, `POST /public/orders`, `sessionStorage`, query params. | `14_checkout-nonumqr_73d750c9` | High |
| `/order-success` | `apps/web/src/app/order-success/page.tsx` | Post-order confirmation and owner app next steps. | Server wrapper around `OrderSuccessClient`. | Reads query `order`; uses `sessionStorage`; fallback `GET /public/orders/{trackingCode}`. | `07_order-success-nonumqr_4e56a1ea` | Medium |
| `/track-order` | `apps/web/src/app/track-order/page.tsx` | Public order tracking by tracking code. | Server wrapper around `TrackOrderClient`. | `GET /public/orders/{trackingCode}`. | `13_track-order-nonumqr_b7cd9eca` | Medium |
| `/shop` | `apps/web/src/app/shop/page.tsx` | Public shop/product entry page. | Static server page with public layout and product links. | None in route page. | `21_nonumqr-product-catalog_2f57d134` | Medium |
| `/t/[slug]` | `apps/web/src/app/t/[slug]/page.tsx` and `apps/web/src/components/ScanClient.tsx` | Public QR scan page, contact request creation, report, optional private call entry. | Server wrapper around high-interaction client component. | `GET /t/{slug}`, `POST /t/{slug}/scan`, `GET /public/contact-requests/{id}/validate?token=...`, `POST /t/{slug}/contact`, `POST /t/{slug}/report`, `POST /t/{slug}/call`, `localStorage`, secure-context checks. | `09`, `11`, `34`, `39` | High |
| `/c/[id]` | `apps/web/src/app/c/[id]/page.tsx`, `PublicConversationRoute.tsx`, `PublicConversation.tsx` | Tokenized public conversation between scanner and owner. | Server wrapper with Suspense; client component handles polling, submit, expired/read-only states. | Requires `token` query param; `GET /public/contact-requests/{id}/messages?token=...`, `POST /public/contact-requests/{id}/messages`. | `03`, `12`, `20`, `23`, `36` | High |
| `/call/[id]` | `apps/web/src/app/call/[id]/page.tsx` and `PublicCallClient.tsx` | Tokenized browser call session using WebRTC/signaling. | Server wrapper around client WebRTC/signaling component. | Requires `token` query param; `GET /public/calls/{id}?token=...`, `POST /public/calls/{id}/signals`, `GET /public/calls/{id}/signals?token=...`, `POST /public/calls/{id}/end`, `navigator.mediaDevices`. | `01`, `06`, `10`, `28`, `37` | High |
| `/admin/login` | `apps/web/src/app/admin/login/page.tsx` | Admin authentication. | Client form with direct login POST and shared admin UI primitives. | Direct `POST ${API_BASE}/auth/admin-login-form/`; `NEXT_PUBLIC_DEV_ADMIN_EMAIL`; token storage. | `22_admin-login-nonumqr_e560969c` | High |
| `/admin/overview` | `apps/web/src/app/admin/overview/page.tsx` | Admin dashboard metrics, recent activity, quick actions. | Client page inside `AdminShell`; shared admin cards/states. | `GET /admin/dashboard` via `apiFetch`. | `19`, `41`, shell `40` | Medium |
| `/admin/tags/new` | `apps/web/src/app/admin/tags/new/page.tsx` | Create and print/download new QR tags. | Client wizard inside `AdminShell`; QR preview and copy/download actions. | `POST /admin/tags`; `qrImageUrl(publicSlug)` for preview. | `45_create-new-qr-tag-admin-console_c4ed35f9` | High |
| `/admin/tags/[tagId]` | `apps/web/src/app/admin/tags/[tagId]/page.tsx` and `AdminTagDetailClient.tsx` | Admin QR tag detail, status changes, owner links, QR asset. | Server wrapper around client detail component. | `GET /admin/tags/{tagId}`, `PATCH /admin/tags/{tagId}`, `qrImageUrl(publicSlug)`. | `32_tag-details-admin-console_2b7b059e` | High |
| `/admin/owners` | `apps/web/src/app/admin/owners/page.tsx` | Owner list, search/filter, owner detail links. | Client page inside `AdminShell`; table/cards. | `GET /admin/owners`. | `24_owners-list-admin-console_8b21502e` | Medium |
| `/admin/owners/[ownerId]` | `apps/web/src/app/admin/owners/[ownerId]/page.tsx` and `OwnerDetailClient.tsx` | Admin owner profile, tags, contact requests, orders. | Server wrapper around client detail component. | `GET /admin/owners/{ownerId}`. | `30_owner-detail-admin-console_bb323669` | Medium |
| `/admin/orders` | `apps/web/src/app/admin/orders/page.tsx` | Admin order management and status operations. | Client page inside `AdminShell`; tables, filters, confirm/toast patterns. | `GET /admin/orders`; status/action calls from page logic. | `26_orders-admin-console_3609e67b` | High |
| `/admin/users` | `apps/web/src/app/admin/users/page.tsx` | Admin user management. | Client page inside `AdminShell`; search, table, destructive confirm. | `GET /admin/users`, `DELETE /admin/users/{id}`. | `43_users-admin-console_f95b9e6d` | High |
| `/admin/reports` | `apps/web/src/app/admin/reports/page.tsx` | Operational/abuse report queue. | Client page inside `AdminShell`; filters and status updates. | `GET /admin/operational-reports`, `PATCH /admin/reports/{id}`. | `44_reports-admin-console_4033e9f0` | Medium |
| `/admin/settings` | `apps/web/src/app/admin/settings/page.tsx` | Settings, health, backups. | Client page inside `AdminShell`; grouped panels. | `GET /admin/system-health`, `GET /admin/settings`, `GET /admin/backups`. | `38_settings-health-admin-console_d4455969` | Medium |
| `/admin/audit` | `apps/web/src/app/admin/audit/page.tsx` | Audit log review. | Client page inside `AdminShell`; filters/table/status display. | `GET /admin/audit-logs`. | `31_audit-logs-admin-console_d2c0df4e` | Medium |

Other existing web routes include `/admin`, `/login`, `/dashboard`, `/about`, `/abuse-policy`, `/apartments`, `/business-card`, `/for-bike-owners`, `/for-car-owners`, `/for-delivery-riders`, `/lost-and-found`, `/refund`, `/reseller`, `/reseller-program`, and `/society`. These appear to be redirects or secondary legacy/support routes and should be left stable unless a phase explicitly includes them.

## 3. Design Mapping Table

| Stitch screen/file | Screenshot path | Current app route | Current file(s) | Existing reusable components to keep | New/updated components needed | Notes |
|---|---|---|---|---|---|---|
| `01_private-call-ended-nonumqr_223d5911.html` | `ui_for_web/screenshots/01_private-call-ended-nonumqr_223d5911.png` | `/call/[id]` | `apps/web/src/app/call/[id]/page.tsx`, `PublicCallClient.tsx` | `PublicCallClient` signaling and cleanup logic | Restyled call state panels | Keep end-call API and token handling unchanged. |
| Image-only product set | `ui_for_web/screenshots/02_a-set-of-premium-qr-products-for-nonumqr_e62cac20.png` | `/buy`, `/product/[slug]`, `/shop` | `PublicShopClients.tsx`, `product/[slug]/page.tsx`, `shop/page.tsx` | Product data and checkout links | Product image treatment | Reference first; do not copy until asset approval. |
| `03_chat-loading-empty-states-nonumqr_85fd919a.html` | `ui_for_web/screenshots/03_chat-loading-empty-states-nonumqr_85fd919a.png` | `/c/[id]` | `PublicConversationRoute.tsx`, `PublicConversation.tsx` | Token and polling behavior | Chat loading/empty state UI | Must preserve expired/read-only handling. |
| `04_nonumqr-product-detail-car-sticker_edb13eae.html` | `ui_for_web/screenshots/04_nonumqr-product-detail-car-sticker_edb13eae.png` | `/product/[slug]` | `apps/web/src/app/product/[slug]/page.tsx`, `publicCatalog.ts` | Static catalog and SEO metadata | Product detail layout polish | Apply across all product slugs, not only car sticker. |
| `05_nonumqr-privacy-icon-mark_a03d9eb8.svg` | `ui_for_web/screenshots/05_nonumqr-privacy-icon-mark_a03d9eb8.png` | Global brand | `PublicLayout.tsx`, `favicon.svg` | Existing favicon until replacement | Optional brand icon asset/component | Candidate later favicon/logo update. |
| `06_private-call-ringing-nonumqr_ef3cae3b.html` | `ui_for_web/screenshots/06_private-call-ringing-nonumqr_ef3cae3b.png` | `/call/[id]` | `PublicCallClient.tsx` | WebRTC/signaling state machine | Ringing call UI state | Avoid copy that claims telephone masking. |
| `07_order-success-nonumqr_4e56a1ea.html` | `ui_for_web/screenshots/07_order-success-nonumqr_4e56a1ea.png` | `/order-success` | `OrderSuccessClient` in `PublicShopClients.tsx` | Query/session tracking fallback | Confirmation layout | Keep order lookup and owner app next steps. |
| `08_nonumqr-wordmark-logo_176e283d.svg` | `ui_for_web/screenshots/08_nonumqr-wordmark-logo_176e283d.png` | Global brand | `PublicLayout.tsx`, `AdminShell.tsx` | Text brand fallback | Optional wordmark asset/component | Review for sizing before public use. |
| `09_active-tag-scan-nonumqr_79c43051.html` | `ui_for_web/screenshots/09_active-tag-scan-nonumqr_79c43051.png` | `/t/[slug]` | `ScanClient.tsx` | All scan/contact/report/call API logic | Public scan card styling | High-risk flow. Preserve owner privacy and token creation. |
| `10_private-call-preparing-nonumqr_1e0d4256.html` | `ui_for_web/screenshots/10_private-call-preparing-nonumqr_1e0d4256.png` | `/call/[id]` | `PublicCallClient.tsx` | Secure context and microphone permission checks | Preparing state UI | Keep permission failure messages accurate. |
| `11_active-tag-scan-nonumqr_5d6d39ad.html` | `ui_for_web/screenshots/11_active-tag-scan-nonumqr_5d6d39ad.png` | `/t/[slug]` | `ScanClient.tsx` | Contact form behavior | Alternate active scan layout/state | Merge with existing state model. |
| `12_private-chat-nonumqr_050b34a6.html` | `ui_for_web/screenshots/12_private-chat-nonumqr_050b34a6.png` | `/c/[id]` | `PublicConversation.tsx` | Message load/send/polling | Mobile chat visual treatment | Keep token query required. |
| `13_track-order-nonumqr_b7cd9eca.html` | `ui_for_web/screenshots/13_track-order-nonumqr_b7cd9eca.png` | `/track-order` | `TrackOrderClient` in `PublicShopClients.tsx` | Tracking code lookup | Tracking status UI | Keep public order endpoint unchanged. |
| `14_checkout-nonumqr_73d750c9.html` | `ui_for_web/screenshots/14_checkout-nonumqr_73d750c9.png` | `/checkout` | `CheckoutClient` in `PublicShopClients.tsx` | COD form submit and product fetch | Checkout form polish | Highest commerce risk. No payment claims. |
| `15_privacy-nonumqr_4f17c34e.html` | `ui_for_web/screenshots/15_privacy-nonumqr_4f17c34e.png` | `/privacy` | `apps/web/src/app/privacy/page.tsx` | `PublicLayout`, section primitives | Privacy page section styling | Good early low-risk page after global tokens. |
| `16_nonumqr-landing-page_b69e2422.html` | `ui_for_web/screenshots/16_nonumqr-landing-page_b69e2422.png` | `/` | `apps/web/src/app/page.tsx`, `PublicSections.tsx`, `PublicLayout.tsx` | Public sections and SEO JSON-LD | Landing hero and section polish | Main Phase 1 public target. |
| `17_pricing-nonumqr_401df19b.html` | `ui_for_web/screenshots/17_pricing-nonumqr_401df19b.png` | `/pricing` | `apps/web/src/app/pricing/page.tsx`, `PublicSections.tsx` | `PricingSection`, `FinalCTA` | Pricing layout styling | Preserve COD positioning. |
| `18_shipping-terms-nonumqr_3bbe61d8.html` | `ui_for_web/screenshots/18_shipping-terms-nonumqr_3bbe61d8.png` | `/shipping`, `/terms` | `shipping/page.tsx`, `terms/page.tsx` | Public policy page structure | Shared policy template styling | Same design can cover both. |
| `19_admin-overview-nonumqr_3e45bf3d.html` | `ui_for_web/screenshots/19_admin-overview-nonumqr_3e45bf3d.png` | `/admin/overview` | `apps/web/src/app/admin/overview/page.tsx` | Metrics, recent activity, quick links | Admin overview polish | Phase 4 after shell tokens. |
| `20_chat-expired-unavailable-nonumqr_eede5316.html` | `ui_for_web/screenshots/20_chat-expired-unavailable-nonumqr_eede5316.png` | `/c/[id]` | `PublicConversation.tsx` | Expired/read-only/unavailable logic | Expired state UI | Must not re-enable expired conversations. |
| `21_nonumqr-product-catalog_2f57d134.html` | `ui_for_web/screenshots/21_nonumqr-product-catalog_2f57d134.png` | `/buy`, `/shop` | `buy/page.tsx`, `shop/page.tsx`, `PublicShopClients.tsx` | Product fetch, product cards, checkout links | Product catalog card polish | Preserve API fallback/static catalog behavior. |
| `22_admin-login-nonumqr_e560969c.html` | `ui_for_web/screenshots/22_admin-login-nonumqr_e560969c.png` | `/admin/login` | `apps/web/src/app/admin/login/page.tsx` | Login submit and token storage | Login page visual polish | Do not alter auth endpoint. |
| `23_private-chat-nonumqr-desktop_1d937ebc.html` | `ui_for_web/screenshots/23_private-chat-nonumqr-desktop_1d937ebc.png` | `/c/[id]` | `PublicConversation.tsx` | Chat logic | Responsive desktop chat layout | Use media-responsive CSS only. |
| `24_owners-list-admin-console_8b21502e.html` | `ui_for_web/screenshots/24_owners-list-admin-console_8b21502e.png` | `/admin/owners` | `apps/web/src/app/admin/owners/page.tsx` | Owner fetch/search/detail links | Admin table/card styling | Admin-only private info remains admin-only. |
| `25_contact-us-nonumqr_2ac74180.html` | `ui_for_web/screenshots/25_contact-us-nonumqr_2ac74180.png` | `/contact` | `apps/web/src/app/contact/page.tsx` | Public layout | Contact page styling | Low-risk support page. |
| `26_orders-admin-console_3609e67b.html` | `ui_for_web/screenshots/26_orders-admin-console_3609e67b.png` | `/admin/orders` | `apps/web/src/app/admin/orders/page.tsx` | Order API actions, confirm/toast | Order table/filter styling | Preserve order state transitions. |
| `27_faq-nonumqr_fb4bc511.html` | `ui_for_web/screenshots/27_faq-nonumqr_fb4bc511.png` | `/faq` | `apps/web/src/app/faq/page.tsx`, `PublicSections.tsx` | FAQ content and JSON-LD | FAQ accordion/card styling | Static, low-risk. |
| `28_private-call-connected-nonumqr_eb64cbb7.html` | `ui_for_web/screenshots/28_private-call-connected-nonumqr_eb64cbb7.png` | `/call/[id]` | `PublicCallClient.tsx` | WebRTC connected state | Connected call UI | Keep mute/end behavior. |
| `29_download-app-nonumqr_ea57736d.html` | `ui_for_web/screenshots/29_download-app-nonumqr_ea57736d.png` | `/download-app` | `apps/web/src/app/download-app/page.tsx` | Public layout | Download/app guidance layout | Avoid claiming mobile app features not live. |
| `30_owner-detail-admin-console_bb323669.html` | `ui_for_web/screenshots/30_owner-detail-admin-console_bb323669.png` | `/admin/owners/[ownerId]` | `OwnerDetailClient.tsx` | Owner detail API and links | Owner detail panels/tables | Admin-only privacy boundary. |
| `31_audit-logs-admin-console_d2c0df4e.html` | `ui_for_web/screenshots/31_audit-logs-admin-console_d2c0df4e.png` | `/admin/audit` | `apps/web/src/app/admin/audit/page.tsx` | Audit fetch and filters | Audit table styling | Preserve audit data format. |
| `32_tag-details-admin-console_2b7b059e.html` | `ui_for_web/screenshots/32_tag-details-admin-console_2b7b059e.png` | `/admin/tags/[tagId]` | `AdminTagDetailClient.tsx` | Tag detail/update/QR image | Tag detail layout | Preserve status mutation behavior. |
| `33_how-it-works-nonumqr_c888ec1b.html` | `ui_for_web/screenshots/33_how-it-works-nonumqr_c888ec1b.png` | `/how-it-works` | `apps/web/src/app/how-it-works/page.tsx` | Public layout | How-it-works page styling | Static, low-risk. |
| `34_message-sent-nonumqr_db095e04.html` | `ui_for_web/screenshots/34_message-sent-nonumqr_db095e04.png` | `/t/[slug]` | `ScanClient.tsx` | Submitted state and conversation link | Message sent state UI | Keep tokenized chat link behavior. |
| Image-only hero | `ui_for_web/screenshots/35_premium-hero-image-for-nonumqr_a5717aac.png` | `/` | `page.tsx`, `PublicSections.tsx`, `apps/web/public/images/hero-qr-sticker.png` | Current hero asset if acceptable | Optional new hero image asset | Treat as reference until approved. |
| `36_chat-states-loading-expired-nonumqr-desktop_e87781a1.html` | `ui_for_web/screenshots/36_chat-states-loading-expired-nonumqr-desktop_e87781a1.png` | `/c/[id]` | `PublicConversation.tsx` | Loading/expired logic | Responsive state panels | Desktop complement to records 03 and 20. |
| `37_connecting-nonumqr_f03b1906.html` | `ui_for_web/screenshots/37_connecting-nonumqr_f03b1906.png` | `/call/[id]` | `PublicCallClient.tsx` | Connecting state machine | Connecting state UI | Keep polling and signaling cadence. |
| `38_settings-health-admin-console_d4455969.html` | `ui_for_web/screenshots/38_settings-health-admin-console_d4455969.png` | `/admin/settings` | `apps/web/src/app/admin/settings/page.tsx` | Health/settings/backups API calls | Settings/health cards | Preserve diagnostics. |
| `39_tag-inactive-nonumqr_343d2077.html` | `ui_for_web/screenshots/39_tag-inactive-nonumqr_343d2077.png` | `/t/[slug]` | `ScanClient.tsx` | Inactive/error handling | Inactive tag state UI | Must not expose owner details. |
| `40_admin-dashboard-shell-nonumqr_8e330063.html` | `ui_for_web/screenshots/40_admin-dashboard-shell-nonumqr_8e330063.png` | All `/admin/*` | `AdminShell.tsx`, `admin/ui.tsx` | Auth gate, nav, role visibility, logout | Admin shell visual update | Phase 4 prerequisite. |
| `41_admin-overview-loading-nonumqr_7ad055a1.html` | `ui_for_web/screenshots/41_admin-overview-loading-nonumqr_7ad055a1.png` | `/admin/overview` | `admin/overview/page.tsx`, `admin/ui.tsx` | LoadingState primitive | Dashboard skeleton/loading layout | Use CSS pulse only. |
| `42_nonumqr-web-ui-kit_aa50e1f2.html` | `ui_for_web/screenshots/42_nonumqr-web-ui-kit_aa50e1f2.png` | Shared components | `PublicSections.tsx`, `PublicLayout.tsx`, `admin/ui.tsx`, `globals.css`, `tailwind.config.ts` | Existing shared primitives | Token and component style updates | Most useful source for consistent implementation. |
| `43_users-admin-console_f95b9e6d.html` | `ui_for_web/screenshots/43_users-admin-console_f95b9e6d.png` | `/admin/users` | `apps/web/src/app/admin/users/page.tsx` | User list/delete logic and confirmation | User table styling | Preserve destructive confirmation. |
| `44_reports-admin-console_4033e9f0.html` | `ui_for_web/screenshots/44_reports-admin-console_4033e9f0.png` | `/admin/reports` | `apps/web/src/app/admin/reports/page.tsx` | Report fetch/update logic | Report queue styling | Preserve moderation workflow. |
| `45_create-new-qr-tag-admin-console_c4ed35f9.html` | `ui_for_web/screenshots/45_create-new-qr-tag-admin-console_c4ed35f9.png` | `/admin/tags/new` | `apps/web/src/app/admin/tags/new/page.tsx` | Tag creation and QR preview | Create tag wizard styling | High-risk admin creation flow. |

## 4. Component Reuse Plan

| Component/module | Current role | Plan | Notes |
|---|---|---|---|
| `PublicLayout` | Public header, footer, nav, CTA, container shell. | Restyle only | Keep links and route paths. Align header/footer with Stitch but preserve accessible nav and CTA. |
| `PublicSections` | Shared marketing sections for landing/pricing/FAQ/CTA. | Refactor lightly | Keep content and SEO helpers. Update section spacing, cards, buttons, visual hierarchy. |
| `PublicShopClients` | Product fetch, checkout, order success, track order clients. | Replace carefully only where visual markup needs it | Keep API calls, sessionStorage behavior, COD flow, query handling, and order redirects unchanged. |
| `AdminShell` | Admin auth gate, navigation, role-aware menu, mobile drawer, logout. | Restyle only | Do not change `/me` auth behavior, role visibility, or logout clearing. |
| `apps/web/src/app/admin/ui.tsx` | Admin UI primitives: `Panel`, `MetricCard`, `StatusBadge`, buttons, alerts, states, toast, dialogs. | Refactor lightly | Best place to apply admin tokens once and reduce per-page churn. |
| `Panel` in admin UI | Admin card/panel primitive. | Restyle only | Use Stitch card style, but do not nest cards unnecessarily. |
| `MetricCard` | Admin KPI card. | Restyle only | Match dashboard overview screen. |
| `StatusBadge` | Reusable status pill. | Refactor lightly | Add design token colors while preserving status text variants. |
| Loading/error/empty states | Shared admin and public state surfaces. | Restyle only | Use UI kit skeleton/pulse styles with CSS only. |
| Admin tables/dialogs | Tables, filters, confirmation dialogs across admin pages. | Refactor lightly | Standardize spacing, headers, row separators, and confirm dialog styling through existing primitives. |
| `ScanClient` | Public scan/contact/report/call entry flow. | Restyle only | High-risk. Keep endpoint paths, localStorage, token validation, report flow, and privacy boundaries. |
| `PublicConversation` | Public chat UI and tokenized message flow. | Restyle only | High-risk. Keep token-required access, polling, send, expired/read-only states. |
| `PublicCallClient` | Browser call session and WebRTC signaling. | Replace carefully only for visual states | Highest risk. Keep state machine, signaling endpoints, microphone checks, and cleanup. Adjust copy to avoid phone-masking claims. |
| Checkout/order components | COD checkout, success, tracking. | Restyle only | Do not alter public order API payload shape, status interpretation, or session fallback. |
| `AdminTagDetailClient` | Tag detail/admin QR operations. | Restyle only | Keep patch behavior and QR image URL logic. |
| `OwnerDetailClient` | Owner detail/admin-only profile data. | Restyle only | Keep admin-only display of private data; never reuse this data publicly. |
| Legacy `Brand`, `Header`, `MarketingPage`, root `Panel`, `OwnerRequestChat` | Older or secondary support components. | Keep as-is unless still used by touched pages | Avoid broad cleanup during UI phases. |
| New public UI helpers | Shared public button/card/section atoms if needed. | Create new component sparingly | Only create if it reduces repeated Tailwind churn in public pages. |
| New admin table helper | Shared admin table wrapper if repeated markup grows. | Create new component if useful | Keep simple. No dependency addition. |

## 5. Web UI Implementation Phases

### Phase 1: Global tokens, shared shell, landing

| Area | Files likely changed | Components likely created/updated | Risk | Commands |
|---|---|---|---|---|
| Global design tokens and CSS polish | `apps/web/src/app/globals.css`, `apps/web/tailwind.config.ts` | CSS variables, semantic Tailwind colors/shadows/radii | Medium | `npm run lint --workspace @nonumqr/web`; `npm run build --workspace @nonumqr/web` |
| Public header/footer | `apps/web/src/components/public/PublicLayout.tsx` | Existing layout only | Low | Same |
| Shared public components | `apps/web/src/components/public/PublicSections.tsx` | Section intro/cards/buttons/FAQ/pricing visuals | Medium | Same |
| Landing page | `apps/web/src/app/page.tsx` | Hero and section composition | Medium | Same |

Phase 1 manual QA:

- Open `/`, `/pricing`, `/faq`, `/privacy`, and `/buy`.
- Check desktop/mobile header, footer, CTA links, and static export build output.
- Confirm QR privacy wording remains accurate.

### Phase 2: Marketing, commerce, order support

| Area | Files likely changed | Components likely created/updated | Risk | Commands |
|---|---|---|---|---|
| Marketing/support pages | `how-it-works/page.tsx`, `privacy/page.tsx`, `faq/page.tsx`, `download-app/page.tsx`, `contact/page.tsx`, `shipping/page.tsx`, `terms/page.tsx` | Reused public sections, policy layout | Low | `npm run lint --workspace @nonumqr/web`; `npm run build --workspace @nonumqr/web` |
| Buy/product/shop | `buy/page.tsx`, `shop/page.tsx`, `product/[slug]/page.tsx`, `PublicShopClients.tsx` | Product cards/detail layout | Medium | Same |
| Checkout | `checkout/page.tsx`, `PublicShopClients.tsx` | Checkout form styling | High | Same plus manual COD order test against configured API |
| Order success and track order | `order-success/page.tsx`, `track-order/page.tsx`, `PublicShopClients.tsx` | Success/tracking status UI | Medium | Same |

Phase 2 manual QA:

- Check `/buy`, `/product/car-qr-sticker`, `/checkout`, `/order-success`, `/track-order`.
- Confirm no online payment readiness claims are introduced.
- Confirm checkout payload and redirect behavior are unchanged.

### Phase 3: Public scanner, conversation, call

| Area | Files likely changed | Components likely created/updated | Risk | Commands |
|---|---|---|---|---|
| Public scanner route | `apps/web/src/components/ScanClient.tsx`, `apps/web/src/app/t/[slug]/page.tsx` if wrapper copy only | Scan states, inactive state, sent state | High | `npm run lint --workspace @nonumqr/web`; `npm run build --workspace @nonumqr/web`; manual API-backed scan flow |
| Public conversation route | `PublicConversationRoute.tsx`, `PublicConversation.tsx`, `apps/web/src/app/c/[id]/page.tsx` if wrapper copy only | Chat responsive UI, loading/empty/expired states | High | Same |
| Public call route | `PublicCallClient.tsx`, `apps/web/src/app/call/[id]/page.tsx` if wrapper copy only | Call state panels | High | Same plus HTTPS/secure-context manual call test |

Phase 3 manual QA:

- Validate active/inactive tag states on `/t/[slug]`.
- Submit a contact request and confirm generated conversation token link works.
- Confirm expired conversations are read-only/unavailable.
- Confirm call flow does not claim phone masking and does not expose owner phone number.

### Phase 4: Admin login, shell, overview

| Area | Files likely changed | Components likely created/updated | Risk | Commands |
|---|---|---|---|---|
| Admin login | `apps/web/src/app/admin/login/page.tsx` | Login visual surface | High | `npm run lint --workspace @nonumqr/web`; `npm run build --workspace @nonumqr/web`; manual login/logout |
| Admin shell | `apps/web/src/components/admin/AdminShell.tsx`, `apps/web/src/app/admin/ui.tsx` | Nav, header, drawer, shared admin tokens | Medium | Same |
| Admin overview | `apps/web/src/app/admin/overview/page.tsx` | Metric cards, loading/error/empty states | Medium | Same |

Phase 4 manual QA:

- Login with admin credentials.
- Confirm role-aware nav, logout, mobile drawer, and `/admin/overview`.
- Confirm unauthenticated users still land on `/admin/login`.

### Phase 5: Remaining admin screens

| Area | Files likely changed | Components likely created/updated | Risk | Commands |
|---|---|---|---|---|
| Tag create/detail | `admin/tags/new/page.tsx`, `AdminTagDetailClient.tsx` | Create wizard, tag detail, QR preview panels | High | `npm run lint --workspace @nonumqr/web`; `npm run build --workspace @nonumqr/web`; manual create/update tag |
| Owners | `admin/owners/page.tsx`, `OwnerDetailClient.tsx` | Owner list/detail cards and tables | Medium | Same |
| Orders | `admin/orders/page.tsx` | Order queue/table/actions | High | Same plus manual order status transition |
| Users | `admin/users/page.tsx` | User table/delete dialog | High | Same plus confirm destructive action behavior |
| Reports | `admin/reports/page.tsx` | Report queue/status UI | Medium | Same |
| Settings/health/backups | `admin/settings/page.tsx` | Health/settings/backups panels | Medium | Same |
| Audit logs | `admin/audit/page.tsx` | Audit filters/table | Medium | Same |

Phase 5 manual QA:

- Check every admin nav item.
- Validate loading/error/empty states.
- Confirm all destructive or mutating actions still use existing confirmation/error handling.

## 6. Privacy and Behavior Guardrails

These rules must not be broken:

- Public QR pages must not show the owner phone number.
- QR codes must contain only a public URL such as `/t/{publicSlug}`.
- No phone number, name, address, owner ID, vehicle owner identity, or private profile data may be encoded in a QR.
- Public conversation access requires the token query parameter.
- Public conversations must expire or become read-only/unavailable when expired.
- Public call copy must not claim telephone masking or imply PSTN phone-number masking. It may say the QR page does not reveal the owner's number.
- Do not expose owner private profile data on public routes.
- Do not change API endpoint paths, payload contracts, auth token behavior, or response assumptions.
- Do not change route paths.
- Do not break checkout or COD order creation flow.
- Do not claim online payments are production-ready.
- Do not modify backend unless absolutely necessary and explicitly planned.
- Do not modify mobile app files, `apps/mobile`, or `ui_for_app`.
- Preserve static export compatibility by keeping dynamic public/admin data fetching on the client.
- Keep all scanner, report, public chat, public call, admin, and checkout flows working.

## 7. Visual Tokens To Implement

Extracted from `ui_for_web/DESIGN.md` and Stitch screens:

| Token area | Stitch direction | Existing implementation | Proposed implementation |
|---|---|---|---|
| Primary color | Privacy teal, including `#0D9488` and theme primary around `#00685f`. | `--color-primary: #0f766e`; Tailwind `trust #0f766e`. | Update CSS variables and Tailwind extension to use Stitch teal while keeping accessible hover/focus states. |
| Supporting colors | Deep green `#065f46`/`#1b6b51`, blue `#2563EB`, amber `#D97706`, danger `#DC2626`. | Existing success/warning/danger are close. | Normalize semantic status colors in CSS variables and `StatusBadge`. |
| Backgrounds | Soft lavender/blue-white surfaces such as `#faf8ff`, `#F8FAFC`, `#f2f3ff`, `#eaedff`, `#e2e7ff`, `#dae2fd`. | `--color-page-bg: #f6faf8`. | Use subtle cool page background and tonal bands without making the app one-note. |
| Text | Ink around `#1E293B` / `#131b2e`; muted slate/gray. | `--color-ink: #111827`; muted `#6b7280`. | Align ink/muted variables for better consistency across public/admin. |
| Typography | Inter; display 32/40/700, mobile 24/32, heading 20/28/600, body 16/24, body-large 18/28, label sizes. | System font via body. | Use Inter/system fallback in `globals.css`; apply type scale through Tailwind classes/components. Avoid negative letter spacing globally. |
| Border radius | 8px standard, 16px large, 24px extra-large, pills for badges/buttons. | Card/button variables at 8px. | Keep 8px for compact controls; use 16px for larger product/hero/admin surfaces where Stitch calls for it. |
| Shadows | Soft ambient shadow, low opacity, e.g. `0 4px 20px rgba(15,23,42,0.05)`. | `--shadow-card` and Tailwind `shadow-soft`. | Add/update `shadow-soft`, `shadow-card`, and focus ring tokens. |
| Card style | White or tonal cards, subtle border, soft shadow, spacious but not nested. | Mixed Tailwind card styles. | Centralize card style in shared public/admin primitives. Avoid cards inside cards. |
| Button style | Solid teal primary, quiet secondary/border buttons, clear disabled states. | Mixed public/admin button classes. | Update existing buttons and `admin/ui.tsx` button variants; keep link/button semantics. |
| Form style | 1px subtle border, 8px radius, teal focus ring, clear errors. | Forms already use Tailwind borders/focus patterns. | Standardize inputs in checkout, login, scanner, admin filters through local classes/components. |
| Admin table style | Dense, calm tables with row separators, subtle headers, status badges. | Per-page tables with repeated classes. | Restyle existing tables and optionally introduce a tiny shared admin table wrapper if repetition grows. |
| Motion | CSS-only: skeleton pulse, QR shimmer, call state pulse; respect reduced motion. | Some CSS hero animations and `animate-pulse`. | Keep CSS/Tailwind animations only. No Framer Motion. Respect `prefers-reduced-motion`. |

Implementation notes:

- Primary implementation points are `apps/web/src/app/globals.css` and `apps/web/tailwind.config.ts`.
- Favor semantic CSS variables for colors and focus states so public and admin can converge without broad rewrites.
- Keep the current Tailwind setup and lucide-react icons.
- Do not add shadcn/ui, MUI, Framer Motion, or other heavy dependencies.

## 8. Asset Plan

Current web assets:

| Asset | Status | Plan |
|---|---|---|
| `apps/web/public/images/hero-qr-sticker.png` | Existing hero/product asset. | Keep for now. It remains useful unless visual QA finds stale brand text or mismatch with Stitch. |
| `apps/web/public/favicon.svg` | Existing green shield/QR favicon without obvious old brand text. | Good enough for now. Consider later update using Stitch privacy icon mark after review. |

Stitch assets:

| Asset/source | Should copy to `apps/web/public`? | Reason |
|---|---|---|
| Most `ui_for_web/screenshots/*.png` | No | These are mockup screenshots and should remain references. |
| `02_a-set-of-premium-qr-products-for-nonumqr_e62cac20.png` | Not yet | Image-only product reference. Copy only after approval that it is intended as production imagery. |
| `35_premium-hero-image-for-nonumqr_a5717aac.png` | Not yet | Hero reference. Copy only after reviewing details, text, and asset suitability. |
| `05_nonumqr-privacy-icon-mark_a03d9eb8.svg` | Later candidate | Good candidate for favicon/logo icon, but should be reviewed in context before replacing current favicon. |
| `08_nonumqr-wordmark-logo_176e283d.svg` | Later candidate | Good candidate for public/admin brand treatment if sizing and accessibility are acceptable. |
| HTML files under `ui_for_web/html/` | No | Use as design references only, not runtime assets. |

Old brand text review:

- No old brand text is obvious from filenames.
- Because some PNGs may contain embedded text, do a visual pass before copying any image-only asset into production.
- Product imagery may need manual design/export later so it represents real NoNumQR stickers/tags accurately.

## 9. Build/Test Plan

Package manager and lockfile:

- Root lockfile: `package-lock.json`
- Package manager: npm workspaces
- Node engine: `>=20.11.0`

Relevant root scripts:

| Command | Purpose |
|---|---|
| `npm install` | Install workspace dependencies if needed on a fresh checkout. |
| `npm run dev:web` | Run the web dev server through the root workspace script. |
| `npm run lint --workspace @nonumqr/web` | Lint only the web app. |
| `npm run build --workspace @nonumqr/web` | Build the web app. In production mode, Next static export is configured by `next.config.mjs`. |
| `npm run lint --workspaces --if-present` | Lint all workspaces if a broader check is needed. |
| `npm run build --workspaces --if-present` | Build all workspaces if a release-level check is needed. |
| `npm run test --workspaces --if-present` | Run workspace tests where present. The web package does not define its own test script. |

Relevant web scripts from `apps/web/package.json`:

| Command | Purpose |
|---|---|
| `npm run dev --workspace @nonumqr/web` | Runs `next dev --webpack -p 3000`. |
| `npm run build --workspace @nonumqr/web` | Runs `next build`. |
| `npm run lint --workspace @nonumqr/web` | Runs `eslint .`. |
| `npm run start --workspace @nonumqr/web` | Prints that static export should be served from `out/`; not a runtime server. |

No separate typecheck or static export command exists in `apps/web/package.json`; do not invent one. Static export behavior is controlled by `apps/web/next.config.mjs`.

Recommended checks after each phase:

| Phase | Commands |
|---|---|
| Phase 1 | `npm run lint --workspace @nonumqr/web`; `npm run build --workspace @nonumqr/web`; `npm run dev:web` for manual public-page QA |
| Phase 2 | `npm run lint --workspace @nonumqr/web`; `npm run build --workspace @nonumqr/web`; manual checkout/order tracking QA against configured API |
| Phase 3 | `npm run lint --workspace @nonumqr/web`; `npm run build --workspace @nonumqr/web`; manual `/t`, `/c`, `/call` tokenized flow QA |
| Phase 4 | `npm run lint --workspace @nonumqr/web`; `npm run build --workspace @nonumqr/web`; manual admin login/logout/overview QA |
| Phase 5 | `npm run lint --workspace @nonumqr/web`; `npm run build --workspace @nonumqr/web`; manual admin CRUD/action QA |

## 10. Questions/Blockers

No blocking questions. Ready to implement Phase 1.
