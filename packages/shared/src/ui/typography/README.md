# typography

Every run of text on a screen. A component names a role — a heading level, a tone, a weight — and
the kit decides what that looks like, so the same kind of text reads the same everywhere.

| File          | Responsibility                                                     |
| ------------- | ------------------------------------------------------------------ |
| `Text.tsx`    | prose and labels: size, tone, weight, and the element to render as |
| `Heading.tsx` | `h1`–`h3`, with the visual size separable from the document level  |
| `Code.tsx`    | a monospaced value inline, or a recorded payload as a block        |
| `link.ts`     | the look of a text link and of a navigation item, as class names   |

**The rule:** text carries no spacing. A paragraph does not push the next one down — the `Stack`
around them does (see `../layout/README.md`). `link.ts` exports class names rather than components
because routing belongs to the application's router and the kit knows nothing about it.
