# svj/ui

The screens this feature mounts into `apps/web`, the navigation entry that puts them in the sidebar,
and the zod shapes `apps/web` parses the API with. This directory is the feature's **second front
door**: `index.ts` at the root is the server side, `ui/index.ts` is what a browser build may import
(ADR 0017).

| File                    | Contents                                                              |
| ----------------------- | --------------------------------------------------------------------- |
| `navigation.ts`         | the sidebar entry; `apps/web` composes it into `navigation.generated` |
| `SvjOverviewScreen.tsx` | the cross-SVJ view — one card per SVJ the signed-in person may reach  |
| `SvjDetailScreen.tsx`   | one SVJ: its record and its units                                     |
| `UnitTable.tsx`         | the unit table, shared by the detail screen and anything reusing it   |
| `labels.ts`             | the Czech words and number formats the screens print                  |

**The rule:** a screen here is a pure server component — it receives what it renders and fetches
nothing. `apps/web` reads the API and hands the data in (task 006 §5, `ui-no-service` in
`.dependency-cruiser.cjs`), which is also why routes (`/svj`, `/s/<id>/svj`) are the application's
to know: a screen takes an `href` builder rather than building one itself.
