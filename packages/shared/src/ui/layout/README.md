# layout

Where things sit and how far apart. A screen composes these and never writes a spacing class of its
own, so one distance has one name everywhere.

| File                | Responsibility                                                            |
| ------------------- | ------------------------------------------------------------------------- |
| `Stack.tsx`         | things above each other, separated by a `gap`                             |
| `Inline.tsx`        | things next to each other, with alignment and justification               |
| `Grid.tsx`          | equal columns that fall back to one on a narrow screen                    |
| `Box.tsx`           | the only owner of an inset, a background, a border and a radius           |
| `Container.tsx`     | centres a column and holds the page's horizontal gutter                   |
| `Center.tsx`        | centres its children vertically, optionally within the viewport           |
| `SidebarLayout.tsx` | a side column next to a main column that fills the rest                   |
| `Divider.tsx`       | a hairline, with no spacing of its own                                    |
| `flex.ts`           | the alignment and justification vocabulary shared by `Stack` and `Inline` |

**The rule:** vertical rhythm is made with `gap`, never with a margin below one element or a padding
above the next — two sources for one distance drift apart the moment either is edited. Padding is an
inset a container gives its own contents (`Card`, `Box`), not a way to push siblings apart. Sizes
come from the `Space` scale in `../space.ts`; a raw number in a screen is a bug.
