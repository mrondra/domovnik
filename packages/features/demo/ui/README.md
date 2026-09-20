# demo/ui

The one screen this feature has: the scenarios, and a button each.

| File                      | Contents                                               |
| ------------------------- | ------------------------------------------------------ |
| `DemoScreen.tsx`          | the list, and what every scenario is meant to show     |
| `ScenarioCard.client.tsx` | one scenario, its button, and what running it answered |
| `navigation.ts`           | „Demo" above the SVJ, for a tenant administrator only  |
| `wire.ts`                 | the zod the screen is handed data in                   |

**The rule:** nothing here fetches. `apps/web` reads the API and passes the data in as props, and
the button calls a server action the page hands down — the feature does not know the route it is
mounted at (ADR 0017).

The result stays on the card instead of navigating away. The point of the button is to watch the
platform react to something that really happened; a page change would hide the reaction.
