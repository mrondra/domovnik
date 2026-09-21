# accounting-sync/seed

| File                       | What it writes                                          |
| -------------------------- | ------------------------------------------------------- |
| `accounting-links.seed.ts` | one `accounting_link` per demo SVJ, pointed at the mock |

**The rule:** a house that already has a link is left alone. Repointing an SVJ during a
demonstration is a decision somebody made, and re-running the seed is not a reason to undo it.
