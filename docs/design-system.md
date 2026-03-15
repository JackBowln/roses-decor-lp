# Design System

## Tokens
- Colors: `primary`, `primary-strong`, `cream`, `surface`, `surface-card`, `surface-soft`, `foreground`, `muted`, `line`, `success`, `warning`, `danger`
- Radius: `card`, `field`, `pill`
- Shadows: `card`, `elevated`, `sticky`
- Touch target: `min-h-touch`
- Z-index: `sticky`, `sticky-bar`, `mobile-nav`, `sheet`, `overlay`
- Breakpoints: `xxs`, `xs`, `phone`, default Tailwind breakpoints

Source of truth:
- `tailwind.config.ts`
- `app/assets/css/main.css`

## Base Classes
- `app-kicker`: semantic uppercase eyebrow label
- `app-control`: shared input/select/textarea surface
- `app-data-table-shell`: horizontal scroll wrapper for tables
- `app-data-table`: shared table typography and cell rhythm

## Components
- `AppPageShell`: standard page container for admin and internal flows
- `AppPageHeader`: hero/header block with kicker, title, description and optional side content
- `AppSectionCard`: reusable surface/card container
- `AppField`: shared label + hint/error wrapper
- `AppInput`, `AppSelect`, `AppTextarea`: shared form controls
- `AppButton`, `AppIconButton`: action primitives with explicit variants
- `AppStatusBadge`: semantic status badge
- `AppEmptyState`: empty/loading fallback shell
- `AppStickyActionBar`: sticky action container for long forms
- `AppActionMenu`: compact contextual action menu
- `AppFilterSheet`: mobile filter drawer/sheet
- `AdminMobileBottomNav`: mobile navigation for `/gestao`
- `AdminSectionTabs`: tab navigation used by the budget workspace
- `AdminRecordCard`: reusable admin record card
- `AdminSummaryCard`: compact metric/summary block

## Variants
- `AppButton`: `primary`, `secondary`, `ghost`, `danger`, `success`
- `AppButton` sizes: `sm`, `md`, `lg`, `icon`
- `AppSectionCard`: `default`, `hero`, `soft`, `outline`
- `AppStatusBadge`: `primary`, `success`, `warning`, `danger`, `neutral`

## Usage Rules
- Use a design-system component when the same visual pattern appears in two or more screens.
- Use Tailwind utilities directly only for local layout composition.
- Keep `scoped CSS` for one-off animation or layout exceptions only.
- Prefer `AppField` + control components for forms instead of rebuilding labels and inputs.
- Prefer `AppSectionCard` and `AdminRecordCard` for repeated admin surfaces instead of per-page card CSS.
- Prefer `AppEmptyState` over ad hoc empty placeholders.
