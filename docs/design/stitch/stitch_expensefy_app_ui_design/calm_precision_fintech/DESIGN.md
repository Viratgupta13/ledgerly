---
name: Calm Precision Fintech
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#464555'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#950029'
  on-tertiary: '#ffffff'
  tertiary-container: '#c20038'
  on-tertiary-container: '#ffd0d2'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdada'
  tertiary-fixed-dim: '#ffb3b6'
  on-tertiary-fixed: '#40000c'
  on-tertiary-fixed-variant: '#920028'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-currency:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.03em
  display-currency-mobile:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0.005em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-sm: 0.75rem
  margin: 1rem
  margin-sm: 0.75rem
  margin-lg: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system is crafted for contemporary Indian mobile personal finance, targeting salaried professionals, gig economy creators, and young households navigating multiple bank accounts, UPI payments, credit cards, and shared expenses. The emotional baseline is quiet confidence, absolute clarity, and unhurried composure. It avoids aggressive gamification, clutter, and loud neon accents in favor of a balanced, modern utility aesthetic that reinforces fiscal responsibility and privacy.

The aesthetic fuses Modern Functionalism with Material 3 principles:
- Grounded, clean surfaces dominated by crisp light neutrals and structural borders that eliminate visual guesswork.
- Deliberate thumb-zone ergonomics tailored for one-handed handheld navigation on Android devices (360×800dp baseline viewport).
- Systematic semantic coding for financial velocity (inflow vs. outflow), paired with vibrant, distinguishable category indicators for micro-budgeting.
- Confident, architectural typography that renders complex currency amounts legibly at a glance, handling high-density Indian digit groupings without layout shift or truncation.

## Colors

The palette uses high-stability neutrals with purposeful semantic anchors. The primary indigo provides institutional confidence without looking legacy or bureaucratic.

### Functional Palette Logic
- **Primary Indigo (`#4F46E5` / Active State `#4338CA`):** Main touchpoints, interactive CTAs, key selected segments, and top-level brand markers.
- **Credit Emerald (`#10B981` / Background Tint `#ECFDF5`):** Positive financial flows (+₹), savings growth, income entries, and settled debts.
- **Debit Rose (`#E11D48` / Background Tint `#FFF1F2`):** Expenditure (-₹), outgoing transfers, recurring subscriptions, and budget depletion warnings.
- **Canvas & Surface Base:** Main background is `#F8FAFC`, inner cards and modal sheets use pure `#FFFFFF` to stand proud via luminance contrast.
- **Border Structural Neutral:** High-precision `#E2E8F0` defines cards and split rows at 1px thickness without muddying the screen.
- **Typography Neutrals:** Deep slate `#0F172A` for primary headlines and amount figures, `#475569` for contextual labels, and `#94A3B8` for input placeholders and disabled indicators.

### Category Color Tokens
- **Food & Dining:** `#F97316` (Warm Tangerine)
- **Transit & Commute:** `#06B6D4` (Cyan Teal)
- **Shopping & Lifestyle:** `#EC4899` (Vibrant Pink)
- **Bills & Utilities:** `#8B5CF6` (Electric Purple)
- **Rent & Living:** `#3B82F6` (Sky Cobalt)
- **Shared & Friends:** `#10B981` (Emerald Green)
- **Essential & Groceries:** `#EAB308` (Warm Mustard)
- **Uncategorized / Other:** `#64748B` (Muted Slate)

Category colors are never used as full card backgrounds; they serve strictly as 8dp dot indicators, 32dp circular icon container tints (at 12% opacity), and spend-velocity progress indicators.

## Typography

The type system is powered entirely by Inter, chosen for its neutral grotesque proportions, legible numeral glyphs, and extensive OpenType features (notably tabular figures `tnum` and slashed zeros).

### Currency Display & Digit Grouping
- All financial balances and ledger rows must activate tabular figures (`font-variant-numeric: tabular-nums`) to prevent horizontal jitter during real-time balance calculations.
- Display numbers must conform to the Indian numbering system convention (`en-IN` formatting: lakh and crore grouping `₹1,25,000.00`).
- The Rupee glyph (`₹`) is sized to match the cap-height of adjacent figures with a 2px right margin, ensuring balance amounts remain unified blocks of text.
- Decimal points and fractional paisa figures (`.00`) should render in `body-md` weight or with 60% opacity when paired with `display-currency` to keep primary visual focus on whole values.

## Layout & Spacing

Layouts adhere strictly to a 4dp base grid system configured for mobile-first Android viewport bounds (minimum target width: 360dp, standard vertical viewport: 800dp).

### Mobile Grid Mechanics
- **Columns & Margins:** 4-column fluid layout on mobile screens (<600dp) with a fixed outer margin of `16dp` (`margin`) and internal gutters of `16dp` (`gutter`).
- **Thumb Zone Ergonomics:** Critical creation actions (quick transaction add, scan UPI QR, search) sit in the lower 40% vertical screen zone. The Floating Action Button (FAB) or bottom navigation bar stays elevated above Android's 3-button or gesture navigation bar inset (minimum bottom padding 16dp + system window inset).
- **Touch Target Integrity:** Every interactive trigger maintains an uncompromised minimum bounding box of 48×48dp, even if the visual element (e.g., text button or icon dot) is smaller.
- **Rhythm & Stacking:** Vertical gaps between transactional list groups use `space-lg` (24dp), while adjacent sibling elements inside a card use `space-xs` (4dp) and `space-sm` (8dp).

## Elevation & Depth

Visual hierarchy relies on a layered surface model combining subtle ambient cast shadows with crisp 1px structural outlines. This prevents reliance on muddy, heavy shadows while maintaining tactile distinction under bright daylight.

### Elevation Hierarchy
- **Level 0 (App Canvas):** Flat `#F8FAFC`. Zero elevation, zero shadow.
- **Level 1 (Default Transaction & Analytic Cards):** Solid `#FFFFFF`, bordered by 1px solid `#E2E8F0`. Shadow: `0px 1px 3px rgba(15, 23, 42, 0.04), 0px 1px 2px rgba(15, 23, 42, 0.02)`.
- **Level 2 (Hover/Tapped Cards & Elevated Widgets):** Solid `#FFFFFF`, border shifts to `#CBD5E1`. Shadow: `0px 4px 6px -1px rgba(15, 23, 42, 0.06), 0px 2px 4px -2px rgba(15, 23, 42, 0.04)`.
- **Level 3 (Bottom Navigation & Sticky Summaries):** `#FFFFFF` with an integrated top border 1px solid `#F1F5F9`. Shadow: `0px -4px 12px rgba(15, 23, 42, 0.05)`.
- **Level 4 (Modal Bottom Sheets & Transaction Drawers):** `#FFFFFF`, no side/bottom border, top drag pill centered (36×4dp, `#CBD5E1`). Shadow: `0px -8px 24px rgba(15, 23, 42, 0.08)`. Scrim overlay uses `#0F172A` with 40% opacity.
- **Level 5 (FAB / Primary Quick Add):** `#4F46E5`. Shadow: `0px 8px 16px -2px rgba(79, 70, 229, 0.35)`.

## Shapes

The shape philosophy uses balanced, organic radii that feel friendly yet mathematically disciplined. Surfaces avoid harsh corners while maintaining crisp readability.

### Corner Radius Mapping
- **Primary Cards & Summary Modules:** 16dp to 24dp corner radii (`rounded-lg` to `rounded-xl`). Large hero expense cards (e.g., monthly summary card) use 20dp; sub-cards use 16dp.
- **Buttons & Text Fields:** 12dp to 16dp corner radii. Primary action buttons sit at 14dp; input form containers sit at 12dp.
- **Category Badges & Status Chips:** Fully pill-shaped (`9999dp`) for micro-tags to contrast clearly with structural rectangular card containers.
- **Modal Sheets:** Top-left and top-right corners clipped to 24dp; bottom corners remain flush with screen edges.

## Components

### Buttons
- **Primary Button:** 52dp height for primary mobile actions; 14dp corner radius; solid `#4F46E5` background with white `label-lg` text; active state drops to `#4338CA`. Ripple feedback utilizes a subtle 15% white overlay.
- **Secondary / Outlined Button:** 48dp height; 12dp corner radius; transparent background; 1.5px border in `#E2E8F0`; `#0F172A` label; active state adopts `#F1F5F9` background fill.
- **Destructive Action:** 48dp height; `#FFF1F2` background with `#E11D48` text and icon.

### Form Inputs & Keypads
- **Text Inputs:** 52dp container height; 12dp corner radius; `#FFFFFF` surface with 1px border `#E2E8F0`. On focus: border shifts to 2px solid `#4F46E5` without layout jump. Floating label uses `label-md` in `#475569`.
- **Quick-Amount Keypad Input:** Numeric entry field dedicated to amounts renders in `display-currency-mobile` font size with an immovable, dimmed prefix (`₹`). Error messages appear below in `body-sm` using `#E11D48`.

### Transaction List Items
- **Container:** Height 64dp; padding 12dp horizontal, 8dp vertical; divided by an inset 1px horizontal line (`#F1F5F9`) starting at the text baseline (bypassing the icon).
- **Left Element:** 40×40dp category container (rounded 10dp) tinted with 12% category token color, housing the centered 20dp category icon in full saturation.
- **Center Element:** Title in `title-md` (`#0F172A`), subtitle (time and account source, e.g., "HDFC • 2:14 PM") in `body-sm` (`#64748B`).
- **Right Element:** Numeric amount aligned right. Debit formatted as `-₹1,420.00` in `title-md` with color `#0F172A` (or `#E11D48` if flagged high spend); credit formatted as `+₹24,500.00` in `title-md` with color `#10B981`.

### Chips & Category Filters
- **Filter Chips:** 36dp height; 9999dp pill radius; default state has `#F8FAFC` background with 1px solid `#E2E8F0` and `label-md` slate text.
- **Selected State:** `#4F46E5` solid fill with white text, or category color at 15% tint with full-color text and an 8dp category dot indicator on the leading edge.

### Cards (Summary & Category Breakdowns)
- **Primary Hero Balance Card:** 20dp corner radius; dual-surface treatment with `#0F172A` dark slate base or pure `#FFFFFF` with a subtle deep indigo gradient ring. Contains current monthly burn rate, remaining budget progress bar (6dp height, rounded 9999dp), and comparison delta percentage against past month.
- **Category Progress Card:** 16dp corner radius; white surface; 1px `#E2E8F0` outline; houses category dot, category title, percentage of monthly spend, and a segmented progress track tinted to the category's specific token.

### Selection Controls
- **Checkboxes & Radios:** 20×20dp box with a 48×48dp ripple hit area. Unchecked: 1.5px border `#94A3B8`. Checked: `#4F46E5` fill with crisp white vector mark.
- **Toggle Switches:** 52×32dp track with 24dp thumb; off-track is `#E2E8F0`; on-track is `#4F46E5`. Thumb always remains `#FFFFFF` with a 2dp drop shadow.