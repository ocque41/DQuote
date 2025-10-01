# Authenticated Shell Layout

The authenticated app routes share the `AppShell` component which wires the shadcn sidebar grid alongside a min-width constrained content column.

## Structure
- `SidebarProvider` owns the layout grid via `grid-cols-[var(--sidebar-width)_1fr]` on large screens and gracefully collapses to a column stack below `lg`.
- `AppSidebar` renders the navigation rails and collapsible behaviour. The content column (`SidebarInset`) is forced to `min-w-0` so tables and charts can shrink without forcing horizontal scroll.
- The header and main body both clamp to `max-w-[min(100%,theme(screens.4xl))]` allowing the shell to expand comfortably on 1440p–4K monitors while respecting smaller laptops.

## Breakpoints
- Tailwind `screens` now include `3xl` (1728px), `4xl` (1920px), and `5xl` (2560px) with matching `container.screens` entries.
- Inner padding scales up at `sm`, `lg`, `xl`, `2xl`, and `3xl` to keep content breathing room proportional on ultra-wide viewports.

## Usage
Wrap authenticated pages with `AppShell`, providing the viewer context plus `title`/`subtitle`. Page content can opt-in to extra constraints via the optional `contentClassName` prop when a view needs a narrower column (for example, focused forms).
