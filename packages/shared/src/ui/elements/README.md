# elements

The pieces a screen is assembled from once layout and text are decided: something to press, a state
to read, a panel, a table, a dialog.

| File                | Responsibility                                                            |
| ------------------- | ------------------------------------------------------------------------- |
| `Button.tsx`        | the four variants; `type` defaults to `button`                            |
| `Badge.tsx`         | a status pill, coloured by tone                                           |
| `Alert.tsx`         | something to read before going on — `alert` when it failed, else `status` |
| `Card.tsx`          | a titled panel; `body="flush"` hands the inset to a table                 |
| `Table.tsx`         | table elements with the shared insets, scrolling inside their own box     |
| `EmptyState.tsx`    | what a list says when it has nothing to say                               |
| `Dialog.client.tsx` | Radix dialog with the labelling it requires, plus `DialogClose`           |

**The rule:** this is where a Tailwind class is allowed to be written down — these are leaves, and
the look has to live somewhere. Everything above them composes `layout/` and `typography/` instead.
None of them takes a `className`: a caller that could restyle an element is a caller that will, and
then the kit stops being one.
