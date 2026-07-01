---
name: NoNumQR Owner Design System
project_id: "3908788758447098776"
project_name: "projects/3908788758447098776"
source: Google Stitch
fetched_at: "2026-05-27"
colors:
  surface: "#f9f9ff"
  surface-dim: "#cfdaf2"
  surface-bright: "#f9f9ff"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#f0f3ff"
  surface-container: "#e7eeff"
  surface-container-high: "#dee8ff"
  surface-container-highest: "#d8e3fb"
  on-surface: "#111c2d"
  on-surface-variant: "#3f4944"
  inverse-surface: "#263143"
  inverse-on-surface: "#ecf1ff"
  outline: "#6f7973"
  outline-variant: "#bec9c2"
  surface-tint: "#1b6b51"
  primary: "#004532"
  on-primary: "#ffffff"
  primary-container: "#065f46"
  on-primary-container: "#8bd6b7"
  inverse-primary: "#8bd6b6"
  secondary: "#006a61"
  on-secondary: "#ffffff"
  secondary-container: "#86f2e4"
  on-secondary-container: "#006f66"
  tertiary: "#003491"
  on-tertiary: "#ffffff"
  tertiary-container: "#0049c3"
  on-tertiary-container: "#b5c6ff"
  error: "#ba1a1a"
  on-error: "#ffffff"
  error-container: "#ffdad6"
  on-error-container: "#93000a"
  background: "#f9f9ff"
  on-background: "#111c2d"
  surface-variant: "#d8e3fb"
typography:
  display-sm:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: "700"
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: "600"
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: "600"
    lineHeight: 28px
  title-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: "600"
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: "400"
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: "500"
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: "500"
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: "600"
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  margin-mobile: 16px
  gutter-mobile: 12px
---

## Brand & Style

The design system is centered on **Modern Minimalism** with a focus on trust and privacy. It targets business owners who value security and professional efficiency. The aesthetic is "High-End Utility" - combining the clean, systematic logic of a SaaS platform with the soft, approachable surfaces of a premium consumer app.

The UI avoids visual clutter to maintain a calm, focused environment. It utilizes generous white space, subtle tonal layering, and precise typography to convey authority and reliability. The emotional response should be one of "effortless control" and "quiet security."

## Colors

The palette is anchored by **Deep Emerald** and **Teal**, signaling growth and security.

- **Surfaces:** Use `#FFFFFF` for primary cards and input containers. Use `#F8FAFC` (Slate 50) for the global background to provide a soft contrast that reduces eye strain.
- **Typography:** Primary text uses `#1E293B` for high legibility. Secondary or "hint" text uses `#475569`.
- **Accents:** Emerald is reserved for primary actions and "success" states. Blue is strictly for informational cues, while Amber manages the "Pending" lifecycle of requests.

## Typography

This design system utilizes **Inter** for its neutral, systematic clarity.

- **Hierarchy:** Use `display-sm` for empty state headers and major dashboard summaries. `headline-lg` is the standard for page titles.
- **Body:** `body-md` is the workhorse for all primary content.
- **Utility:** `label-sm` should be used with `uppercase` styling for section headers or small status badges to create a distinct visual rhythm.
- **Mobile Optimization:** Line heights are kept generous (minimum 1.4x) to ensure touch targets and readability are preserved on handheld devices.

## Layout & Spacing

The system follows an **8px grid** for vertical rhythm and a **4px grid** for fine-tuning component internals.

- **Margins:** Standard mobile views use a `16px` (md) horizontal margin.
- **Grouping:** Elements within a card should use `8px` (sm) spacing, while cards themselves should be separated by `16px` (md).
- **Safe Areas:** Ensure all bottom-fixed elements (like Bottom Navigation or Primary Buttons) respect the device's safe area insets.

## Elevation & Depth

To maintain a "Premium & Calm" feel, depth is created through **Tonal Layers** and **Soft Ambient Shadows**.

- **Level 0 (Background):** `#F8FAFC`.
- **Level 1 (Cards/Sheet):** `#FFFFFF` with a subtle 1px border of `#E2E8F0` or a very soft shadow (0px 4px 12px rgba(0,0,0,0.03)).
- **Level 2 (Active/Floating):** Use for active buttons or modals. Shadow: 0px 8px 24px rgba(0,0,0,0.08).
- **Glassmorphism:** Apply a `Blur(20px)` and 80% opacity to the App Bar background when scrolling to maintain a sense of context and depth without visual noise.

## Shapes

The design system uses a **Rounded** philosophy.

- **Standard (8px):** Primary buttons, text fields, and small cards.
- **Large (16px):** Main dashboard cards (QR Preview, Order cards).
- **Extra Large (24px):** Bottom sheets and modal containers.
- **Pill (100px):** Chips and status badges to differentiate them from actionable buttons.

## Components

### Buttons

- **Primary:** Deep Emerald background, White text. Elevation Level 1.
- **Secondary:** Surface color with Teal border (1px).
- **Ghost:** No background/border, Teal text. Used for secondary actions in lists.

### Input Fields & OTP

- **Text Fields:** White background, Slate 200 border. On focus, border changes to Teal 500 with a 2px outer glow.
- **OTP Input:** Individual square boxes with `rounded-md` (8px). Focused box uses a primary emerald border.

### Cards

- **QR Preview:** Centered QR code with a subtle "shimmer" loading effect. Large padding (24px).
- **Request/Order Cards:** Use `label-sm` for status (for example, "PENDING" in Amber). Detailed information should follow `body-md`.

### Status & Feedback

- **Status Badges:** Pill-shaped with a low-opacity background of the status color (for example, Red 50 for Error) and high-contrast text (Red 700).
- **Loading Skeletons:** Use a soft Slate 100 to Slate 200 pulse animation.

### Navigation

- **Bottom Navigation:** Fixed, White background, Blur effect. Active icon uses Teal; inactive icons use Slate 400.
- **App Bar:** Centered title using `title-lg`. Minimalist icons (24px) for back actions or settings.
