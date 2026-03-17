## FINEDGE design system

### Color system
- **Primary**: blue (maps to `--primary` / `--sidebar-primary`)
- **Neutrals**: `--background`, `--foreground`, `--muted`, `--border`, `--card`
- **Semantic**: `--destructive` (errors)
- **Charts**: `--chart-1` … `--chart-5`

Source of truth is `client/src/index.css` (CSS variables in `:root` and `.dark`).

### Typography
- **Base**: system sans stack (Tailwind default)
- **Headings**: use `font-semibold` + `tracking-tight`
- **Body**: use `text-muted-foreground` for secondary text

### Spacing & layout
- **Page padding**: `p-4` (inside `DashboardLayout`) with responsive expansion in page components as needed
- **Card padding**: typically `p-5` or `p-6`
- **Section spacing**: `space-y-6` / `space-y-8`

### Radius, borders, elevation
- **Radius**: `--radius` (with `--radius-sm/md/lg/xl` derived)
- **Borders**: `border-border` for consistent outline
- **Elevation**: use subtle shadow + blur where appropriate

### Common UI primitives
Located under `client/src/components/ui/*` (Radix-based primitives + Tailwind).

### Reusable patterns
- **Elegant cards**: `card-elegant` utility class
- **Brand text**: `gradient-text` utility class

