# @domovnik/shared

Things without a domain: the UI kit, date and money utilities, i18n, test helpers.

| Directory | Contents                                                                  |
| --------- | ------------------------------------------------------------------------- |
| `src/ui/` | the design system `apps/web` and every feature's `ui/` build screens from |

**The rule:** `shared` knows nothing — not the kernel, not a feature. If you want to put something
carrying a domain name into it (`invoice`, `svj`, `revize`), it belongs in a feature or in the
kernel.
