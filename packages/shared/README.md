# @domovnik/shared

Things without a domain: the UI kit, date and money utilities, i18n, test helpers.

Only a skeleton so far — the contents arrive together with `apps/web` (task 006).

**The rule:** `shared` knows nothing — not the kernel, not a feature. If you want to put something
carrying a domain name into it (`invoice`, `svj`, `revize`), it belongs in a feature or in the
kernel.
