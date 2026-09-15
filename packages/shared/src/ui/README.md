# ui

The design system. Everything on a screen is one of these, composed — `apps/web` and a feature's
`ui/` write no Tailwind classes of their own, so the same distance, the same grey and the same
heading mean the same thing on every page.

| Directory / file | Contents                                                                 |
| ---------------- | ------------------------------------------------------------------------ |
| `layout/`        | `Stack`, `Inline`, `Grid`, `Box`, `Container`, `Divider`                 |
| `typography/`    | `Heading`, `Text`, `Code`, and the class names for links                 |
| `elements/`      | `Button`, `Badge`, `Alert`, `Card`, `Table`, `EmptyState`, `Dialog`      |
| `forms/`         | `Form` and the fields that read their state from its context             |
| `space.ts`       | the spacing scale (`Space`) and the gap and padding classes it maps to   |
| `tones.ts`       | the colour vocabulary: text tone, surface, border, radius                |
| `cx.ts`          | joins conditional class names                                            |
| `navigation.ts`  | `NavigationItem` — what a feature exports as `navigation` from its index |

## How a screen is built

Spacing is a prop, never a class. Vertical rhythm comes from the `gap` of the `Stack` around the
elements — not from a margin under one and a padding over the next, which is two owners for one
distance. Padding is an inset a container gives its own contents, and only `Box`, `Card` and the
table cells have one. Sizes are steps on the `Space` scale; a raw number on a screen is a bug.

Text is a `Text` or a `Heading` with a named size and tone, never a `text-sm text-slate-500`. Colours
are roles — `muted`, `subtle`, `danger` — so a palette change is one file, not a search.

None of these components takes a `className`. A caller that can restyle a primitive will, and then
the kit stops being a kit; if something cannot be expressed, the missing prop belongs here.

**The rule:** a component that needs the browser is named `*.client.tsx` and starts with
`"use client"`; everything else renders on the server (docs/engineering.md §3, both halves enforced
by lint). These primitives know no domain — `shared` knows nothing (AGENTS.md §2), so anything
carrying a name from the business belongs in a feature.
