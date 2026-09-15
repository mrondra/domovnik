# forms

Everything a person types into or chooses from. The fields read their value and their error from
react-hook-form's context, so a form declares its schema once and the fields need no wiring.

| File                       | Responsibility                                                    |
| -------------------------- | ----------------------------------------------------------------- |
| `Form.client.tsx`          | the `<form>`, the form context, and the rhythm between the fields |
| `FieldLayout.tsx`          | label, control, hint, error — the same order in every form        |
| `TextField.client.tsx`     | a single-line value                                               |
| `TextareaField.client.tsx` | prose the person writes                                           |
| `CheckboxGroup.client.tsx` | a checklist bound to one array field                              |
| `Select.client.tsx`        | a choice outside a form, such as the SVJ switcher                 |
| `control.ts`               | the one look every control shares, valid and invalid              |
| `field-error.ts`           | the displayable message out of react-hook-form's error union      |

**The rule:** a field takes named props, never arbitrary input attributes and never a `className` —
a form that can restyle its own controls is a form that looks different from the next one. The
message shown under a control comes from the schema; the message shown above the buttons is what
the server refused, and that is an `Alert`.
