---
name: Serene Privacy
project_title: NoNumQR Web Design System
project_id: "18015469485020486689"
project_name: "projects/18015469485020486689"
source: Google Stitch
fetched_at: "2026-05-27"
device_type: DESKTOP
colors:
  surface: "#faf8ff"
  surface-dim: "#d2d9f4"
  surface-bright: "#faf8ff"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#f2f3ff"
  surface-container: "#eaedff"
  surface-container-high: "#e2e7ff"
  surface-container-highest: "#dae2fd"
  on-surface: "#131b2e"
  on-surface-variant: "#3d4947"
  inverse-surface: "#283044"
  inverse-on-surface: "#eef0ff"
  outline: "#6d7a77"
  outline-variant: "#bcc9c6"
  surface-tint: "#006a61"
  primary: "#00685f"
  on-primary: "#ffffff"
  primary-container: "#008378"
  on-primary-container: "#f4fffc"
  inverse-primary: "#6bd8cb"
  secondary: "#1b6b51"
  on-secondary: "#ffffff"
  secondary-container: "#a6f2d1"
  on-secondary-container: "#237157"
  tertiary: "#924628"
  on-tertiary: "#ffffff"
  tertiary-container: "#b05e3d"
  on-tertiary-container: "#fffbff"
  error: "#ba1a1a"
  on-error: "#ffffff"
  error-container: "#ffdad6"
  on-error-container: "#93000a"
  background: "#faf8ff"
  on-background: "#131b2e"
  surface-variant: "#dae2fd"
  surface-off-white: "#F8FAFC"
  ink-slate: "#1E293B"
  info-blue: "#2563EB"
  warning-amber: "#D97706"
  danger-red: "#DC2626"
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: "700"
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: "700"
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: "600"
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: "400"
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: "400"
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: "600"
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: "500"
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The core of this design system is "Security through Serenity." It is designed for a target audience that values discretion, ownership, and modern utility. The brand personality is calm, professional, and authoritative without being cold.

The chosen style is **Modern Corporate Minimalism**. It focuses on heavy whitespace, high-quality typography, and a "less is more" philosophy to prevent cognitive load during high-stress situations, such as reporting a blocked car or finding a lost item. Every element serves a functional purpose, using subtle tonal shifts rather than decorative clutter to guide the user.

## Colors

The color palette is anchored by privacy accents: deep emerald and teal.

- **Primary & Secondary:** Used for action-oriented elements and brand reinforcement. Teal (`#0D9488`) acts as the primary driver for positive interactions.
- **Surfaces:** The interface relies on pure white and soft off-white (`#F8FAFC`) to create subtle distinction between the background and container layers.
- **Text:** Pure black is avoided. Use `ink-slate` and deep charcoal neutrals for high contrast without harshness.
- **Functional Accents:** Blue, amber, and red are reserved for system communication.

## Typography

This design system uses **Inter** for legibility and a systematic feel.

- **Headlines:** Use tighter letter spacing and heavier weight to create a strong visual anchor.
- **Body:** Set at a base of 16px for optimal readability. 14px is the minimum for secondary metadata.
- **Hierarchy:** Use weight shifts rather than extreme size differences to keep a calm rhythm.

## Layout & Spacing

The layout follows an 8px soft-grid system.

- **Grid:** Use a 12-column fluid grid for desktop admin views. Mobile views use a single-column layout with 16px side margins.
- **Breathability:** Use `stack-lg` (32px) between distinct sections and `stack-md` (16px) for related groups.
- **QR Focus:** On landing pages, the QR code or primary contact card should be vertically centered on mobile with ample whitespace.

## Elevation & Depth

Depth is conveyed through tonal layers and soft ambient shadows.

- **Surface Levels:** Use off-white for backgrounds and `#FFFFFF` for cards and primary interaction areas.
- **Shadows:** Use diffused low-opacity shadows, such as `0 4px 20px rgba(15, 23, 42, 0.05)`.
- **Depth Hierarchy:** Level 0 is background, Level 1 is cards and inputs, Level 2 is modals and toasts.

## Shapes

The shape language is rounded, using 0.5rem (8px) as the standard radius.

- **Standard (8px):** Buttons, inputs, and small cards.
- **Large (16px):** Main feature containers, such as QR display cards.
- **Full (Pill):** Chips, badges, and call state indicators.

## Components

### Buttons & Inputs

- **Primary Button:** Solid teal (`#0D9488`) with white text.
- **Secondary Button:** Ghost style with an `ink-slate` border or light slate tint.
- **Inputs:** Minimalist 1px low-opacity `ink-slate` border. On focus, transition to teal with a soft glow.

### Cards

- **Product/QR Card:** Use a 16px radius. QR codes should have a subtle shimmer on page load.
- **Chat Bubbles:** Incoming messages are slate. Outgoing messages are teal. Use 12px rounding with a tail-less modern bubble design.

### Feedback UI

- **Toasts:** Bottom-center on mobile, dark `ink-slate` background, high-contrast text.
- **Skeletons:** Pulse between `#F1F5F9` and `#E2E8F0`.
- **Call State:** Floating pill bar at the top with a pulsing teal dot for active private connections.

### Admin Elements

- **Tables:** No-border styling with very light horizontal row separators (`#F1F5F9`).
- **Metrics:** Bold slate numbers with small teal trend indicators.
