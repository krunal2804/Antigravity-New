# PROJECT DESIGN HANDOFF DOCUMENT

## Purpose

This document captures the complete visual and design language of the project so that any developer working on another product in the same organization can understand the current UI style and build new screens/software with the same look and feel.

---

## 1. PROJECT DESIGN OVERVIEW

**Design Goal:**

- Build a clean, modern, professional, and user-friendly interface
- Keep all products in the organization visually consistent
- Use the same design language across dashboards, forms, cards, tables, reports, and workflows
- Maintain simplicity, readability, and product identity

**Design Personality:**

- Professional, Modern, Clean, Business-focused, Minimal but informative, Dashboard-friendly

**Main Product Type:**

- SaaS dashboard / workflow platform / enterprise application

---

## 2. TYPOGRAPHY / FONT SYSTEM

**Primary Font Family:** `'Manrope', 'Segoe UI', sans-serif`

**Usage Style:**

- **H1 / Stat Values:** 28px, Bold (700)
- **H2:** 22px, Bold (700)
- **H3 (e.g., Card Titles):** 18px, Semibold (600)
- **Body / Standard Text:** 14px, Normal (400) / Medium (500)
- **Small Text (e.g., Labels, Sub-text):** 12px, Normal (400) or bolded for table headers

**Typography Rules:**

- Keep heading hierarchy consistent.
- Avoid mixing font families.
- Use readable font sizes for dashboard and enterprise usage.
- Standard line-height relies on browser default or `1.5`.

---

## 3. COLOR PALETTE / THEME SYSTEM

**Primary / Brand Colors:**

- **Primary Navy:** `#1B2A4E`
- **Primary Blue:** `#2563EB`
- **Blue Light:** `#EFF6FF`
- **Blue Dim:** `rgba(37, 99, 235, 0.12)`

**Secondary / Accent Colors:**

- **Purple:** `#8B5CF6` (Dim: `rgba(139, 92, 246, 0.12)`)
- **Cyan:** `#06B6D4`

**Status / Feedback Colors:**

- **Success / Completed:** `#10B981` (Dim: `rgba(16, 185, 129, 0.12)`)
- **Warning / On Hold:** `#F59E0B` (Dim: `rgba(245, 158, 11, 0.12)`)
- **Danger / Suspended:** `#EF4444` (Dim: `rgba(239, 68, 68, 0.12)`)

**Neutrals / Grayscale:**

- **White:** `#ffffff`
- **Gray 50:** `#F9FAFC`
- **Gray 100:** `#F4F6FA`
- **Gray 400:** `#9CA3AF`
- **Gray 600:** `#4B5563`
- **Gray 700:** `#374151`
- **Gray 900:** `#1A1D2E`

**Borders:**

- **Light Theme:** `#E4E8F0`
- **Dark Theme:** `#2D3748`

**Dark Mode Usage:**

- **Backgrounds:** Light uses `#F4F6FA`, Dark uses `#101822`.
- **Surfaces (Cards):** Light uses `#ffffff`, Dark uses `#1e293b`.
- **Text:** Light uses `#0d131b` (Primary) / `#64748b` (Secondary). Dark uses `#f8fafc` (Primary) / `#94a3b8` (Secondary).

---

## 4. SPACING SYSTEM

**Common Spacing Values:**

- **XS:** `0.25rem` (4px)
- **SM:** `0.5rem` (8px)
- **MD:** `0.875rem` (14px)
- **LG:** `1.25rem` (20px)
- **XL:** `1.5rem` (24px)
- **XXL:** `2rem` (32px)

**Spacing Rules:**

- Dashboard hero sections use padded `1.75rem 2rem` rules.
- Card padding defaults to `1.25rem`.
- Gap between grid items commonly uses `1rem` or `1.5rem`.
- Always use the predefined scale rather than arbitrary pixel values.

---

## 5. BORDER RADIUS / SHAPE LANGUAGE

**Common Border Radius:**

- **SM:** `0.375rem` (6px) - Inner elements, icon buttons
- **MD:** `0.5rem` (8px) - Inputs, standard buttons
- **LG:** `0.625rem` (10px) - Small widgets
- **XL:** `0.75rem` (12px) - Standard dashboard cards, tables
- **XXL:** `1rem` (16px) - Modals, hero banners
- **Pill:** `9999px` - Badges, status chips

**Shape Style:**

- Soft rounded modern enterprise style. Consistent corner softening across all elements.

---

## 6. SHADOW / DEPTH SYSTEM

**Common Shadows:**

- **SM (Card Base):** `0 1px 4px rgba(0, 0, 0, 0.05)`
- **MD (Card Hover):** `0 4px 12px rgba(0, 0, 0, 0.12)`
- **LG (Dropdowns):** `0 12px 32px rgba(0, 0, 0, 0.15)`
- **XL (Modals):** `0 20px 60px rgba(0, 0, 0, 0.25)`

**Usage Rules:**

- Use subtle shadows for a clean enterprise UI.
- Use hover shadows (`MD`) to indicate interactivity on cards.
- Heavy shadows (`XL`) are reserved exclusively for dialog overlays.

---

## 7. COMPONENT DESIGN LANGUAGE

### A. Buttons

- **Primary:** Blue background (`#2563EB`), White text, Medium radius, Semibold font.
- **Ghost/Outline:** Transparent background, Border matching current theme, Secondary text color.
- **Icon:** Padded appropriately for square or circle bounding boxes, color matches secondary text, subtle hover backgrounds (`rgba` hints).
- Buttons feature a slight Y-axis translation on hover `transform: translateY(-2px)`.

### B. Inputs / Form Controls

- **Style:** Background maps to `surfaceInput` (`#f8fafc` in light, `#0f172a` in dark). Border matches theme border. Medium radius (`0.5rem`).
- **Typography:** Text size `sm` (14px). Label size `sm` (14px) and semibold.

### C. Cards / Panels

- **Background:** White (Light) / `#1e293b` (Dark).
- **Border:** Standard 1px theme border.
- **Radius:** XL (`0.75rem`) or XXL (`1rem`).
- **Padding:** Usually `1.25rem`.
- Use flexbox or CSS Grid internally.

### D. Tables

- **Header:** Uppercase 12px (`xs`), bold, with a slightly differentiated background (`#0f172a` in dark, `#F9FAFC` in light).
- **Row:** Clear bottom borders except for the last child. Hover effect applies a slight translucent highlight.
- **Cells:** Vertical alignment is middle. 14px (`sm`) font.

### E. Badges / Status Chips

- Always use pill shape (`9999px`).
- Typically styled using the "Dim" background variants of the corresponding color (e.g., Success Green Dim background, Success Green text, Success Green tiny 6px circle dot).

### F. Progress Bars

- **Height:** 6px
- **Track:** Muted gray/slate.
- **Fill:** Blue or Green (automatically matching status/completion).
- Used extensively in project summaries.

### G. Modals / Dialogs

- **Background:** Matches card surfaces.
- **Radius:** XXL (`1rem`)
- **Shadow:** XL
- Clear separation between header title and modal content. Ghost icon button for closing located in the top right.

---

## 8. DESIGN DO'S AND DON'TS

**DO'S:**

- Reuse `src/shared/theme/designSystem.js` constants for _every_ styling decision.
- Maintain the same spacing rhythm and radius scale.
- Rely on `getTheme(darkMode)` for any background/border logic.
- Keep the enterprise dashboard aesthetic (minimalism, readability over flashy elements).

**DON'TS:**

- Do not introduce a new font.
- Do not use arbitrary padding or margin values (e.g. `11px`, `23px`).
- Do not hardcode hex values like `#fff` or `#000` inside individual components.
- Do not invent new shadow systems; use the presets.

---

_End of document._
