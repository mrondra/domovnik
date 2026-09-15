# ui

The two places where the design system meets Next.js: a link and a navigation item both need the
application's router, and the kit knows nothing about it (AGENTS.md §2).

| File                 | Responsibility                                        |
| -------------------- | ----------------------------------------------------- |
| `AppLink.tsx`        | `next/link` wearing the kit's text-link styling       |
| `NavLink.client.tsx` | a left-hand navigation item, highlighted when current |

**The rule:** nothing else in `apps/web` writes a class name. If a screen needs something the kit
does not offer, the missing prop belongs in `packages/shared/src/ui`, not here.
