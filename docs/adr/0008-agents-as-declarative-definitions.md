# 0008 – Agenti jako deklarativní definice; systémoví a uživatelští sdílejí runtime

- Status: Accepted
- Date: 2026-09-09

## Context

Agenti musí být rozšiřitelní bez zásahu do jádra a později definovatelní uživatelem v UI.

## Decision

`defineAgent()` je deklarativní (triggers, scope, tools, autonomy, prompt, model). Definice se ukládá do `agent_definition` (systémoví z kódu při startu, uživatelští z UI). Jeden runtime v `kernel`. Registrace podle konvence `features/*/agents`. Uživatelští agenti smí jen tooly s `userComposable: true`, autonomie limitovaná rolí autora, bez subagentů a vlastního kódu.

## Consequences

Nový systémový agent = nový adresář. Verze definice jsou neměnné; `agent_run` odkazuje na verzi. Agent-builder (fáze 5) nepotřebuje nový runtime.
