# tooling/eslint

The repository's ESLint configuration. The root `eslint.config.js` only re-exports
`eslint.config.js` from here.

| File               | What it holds                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| `eslint.config.js` | Composition: the ignores, the typescript-eslint presets, and the three blocks below.              |
| `layers.js`        | The architecture — the boundaries elements and who may import whom (AGENTS.md §2, ADR 0002/0017). |
| `practices.js`     | The house rules from AGENTS.md §4 and the `domovnik/*` plugin that carries the custom ones.       |
| `overrides.js`     | Where a house rule bends, each block carrying the reason it bends there.                          |
| `rules/`           | The custom rules themselves, one file per rule plus its test.                                     |

Every file here is plain JavaScript, because ESLint loads the config before any build step runs.
The types come from JSDoc annotations and `// @ts-check`; `tsconfig.json` in this directory is what
makes the files visible to the type checker and to type-aware linting.

A new custom rule: add `rules/<name>.js` and `rules/<name>.test.js` next to the existing ones, then
register it in the `domovnik` plugin in `practices.js` and enable it — globally in `practices.js`, or
for the files it applies to in `overrides.js`.
