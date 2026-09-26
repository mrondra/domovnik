# 048 – kernel: přepis audia (Gemini)

Reference: ADR 0007 (Gemini pro přepis), ADR 0012 (replay podle obsahu), vzor `packages/kernel/src/llm/*` a `packages/kernel/src/storage/*`.

## Navazuje na

- Kernel `llm` s režimy `live|record|replay` a fixturami párovanými podle obsahu.

## Cíl

Jediné místo pro přepis hlasu. Testy a e2e běží bez sítě.

## Vytvoří / upraví

- `packages/kernel/src/transcription/` – `README.md`, `index.ts`, `client.ts` (`@google/genai`), `transcribe.ts`, `fixtures.ts`, `transcription.test.ts`.
- Env (`packages/kernel/src/env/schema.ts` + `.env.example`): `GEMINI_API_KEY` (volitelný mimo `live`), `TRANSCRIPTION_MODEL` (povinný v `live`; **aktuální název modelu ověř v dokumentaci Gemini API a uveď ho v `.env.example` a reportu – nehádej**), `TRANSCRIPTION_MODE` (`live|record|replay`, default = `LLM_MODE`), `TRANSCRIPTION_FIXTURE_DIR`.
- Lint + depcruise: `@google/genai` jen z `packages/kernel/src/transcription` (pravidlo stejně jako `no-direct-anthropic`).
- Langfuse: trace `transcription` s délkou audia a počtem znaků.

## Rozhraní

```ts
export interface TranscriptionInput { readonly audio: Buffer; readonly mimeType: string; readonly languageHint?: 'cs' | 'en'; }
export interface Transcript { readonly text: string; readonly durationSeconds: number | null; readonly model: string; }
export const transcribe = (ctx: RequestContext, input: TranscriptionInput): Promise<Transcript>;
```

Podporované typy: `audio/webm`, `audio/ogg`, `audio/mp4`, `audio/mpeg`, `audio/wav` (MediaRecorder v Chrome/Safari). Jiný → `ValidationError('audio_type_unsupported')`. Max 10 MB → jinak `ValidationError('audio_too_large')`.
Instrukce modelu: doslovný přepis v češtině, bez shrnutí, bez časových značek.
Replay: klíč fixtury = sha256 audia; chybějící fixtura v `replay` → chyba s návodem na `record`.
`packages/kernel/src/testing`: `replayTranscription(dir)` + generátor krátkého WAV (`sineWav(seconds)`) pro testy – obsah nehraje roli, rozhoduje hash.

## Testy

Unit: validace typu a velikosti; replay vrátí text fixtury; `record` režim (mock klienta) zapíše fixturu.

## Akceptační kritéria

`pnpm verify`; `git grep "@google/genai"` jen v `packages/kernel/src/transcription` a `package.json`.

## Stav po dokončení

`transcribe()` pro `field-reports`.
