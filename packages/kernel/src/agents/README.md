# agents

Declarative agent definitions and the runtime that executes them. A new agent is a new directory,
with no change to the core (ADR 0008).

| File / directory | Contents                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `definition.ts`  | `defineAgent`, `promptFromFile`, the agent registry                                       |
| `autonomy.ts`    | what `read`, `propose` and `act` are allowed to do                                        |
| `events.ts`      | `agent.run.failed` — the kernel does not know what a task is, it only reports the failure |
| `runtime/`       | one run of one agent                                                                      |
| `store/`         | persistence for definitions, configuration and runs                                       |
| `fixtures/`      | recorded model answers for the replay tests                                               |

Autonomy has two halves and the runtime enforces both, not the prompt:

- **statically** — `read` only ever sees tools marked `readOnly`;
- **at call time** — `propose` may only call a tool that leaves a proposal behind: either it is
  `readOnly`, or it is `proposal`, or its policy returned `required`. Otherwise `ForbiddenError`.

`act` is an upper bound, not a blank cheque — a tool may be stricter and still demand approval.

**The rule:** a prompt never claims a limit the runtime enforces. "You must not pay" is a wasted
sentence when the agent simply does not have that tool in its set.
