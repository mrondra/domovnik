import { createServer, type Server } from 'node:http';
import { text as readBody } from 'node:stream/consumers';
import { toEventStream, type FixtureMessage } from '../../../packages/kernel/src/testing/sse';
import { readInvoice } from './model-stub-extraction';
import { idOf, transcriptOf, toolsCalled } from './model-stub-transcript';

export const AGENT_REPLAY_PORT = 4310;

const EVENT_STREAM = 'text/event-stream';
const JSON_TYPE = 'application/json';
const HEADING = 'FAKTURA - DANOVY DOKLAD';

const message = (
  content: FixtureMessage['content'],
  stopReason: FixtureMessage['stopReason'],
): FixtureMessage => ({
  id: `msg_${String(Date.now())}`,
  model: 'claude-sonnet-5',
  content,
  stopReason,
  inputTokens: 1000,
  outputTokens: 50,
});

const call = (name: string, input: Readonly<Record<string, unknown>>): FixtureMessage =>
  message([{ type: 'tool_use', id: `toolu_${name}`, name: `mcp__domovnik__${name}`, input }], 'tool_use');

const says = (text: string): FixtureMessage => message([{ type: 'text', text }], 'end_turn');

const SUMMARY =
  'Úklid společných prostor podle smlouvy, částka i splatnost odpovídají obvyklé faktuře. ' +
  'Doporučuji schválit.';

/**
 * What the invoice-processor would say about an ordinary invoice: read it, then propose approving
 * it. The proposal is a real tool call, so the approval that lands in the committee's inbox is the
 * one the tool makes — only the sentence above it is canned.
 */
const invoiceProcessor = (body: string): FixtureMessage => {
  const invoiceId = idOf(body, 'invoiceId');
  const called = toolsCalled(body);

  if (!called.includes('mcp__domovnik__invoice_get')) return call('invoice_get', { invoiceId });
  if (!called.includes('mcp__domovnik__invoice_approve')) {
    return call('invoice_approve', { invoiceId, summary: SUMMARY, recommendation: 'approve', risks: [] });
  }

  return says('Fakturu jsem předal výboru ke schválení.');
};

/**
 * The other two agents are woken by the same demonstration and must not fail the run; what they
 * would propose is not what this suite is about, so they read their batch and say so.
 */
const readsAndReports = (body: string, tool: string, field: string): FixtureMessage =>
  toolsCalled(body).includes(`mcp__domovnik__${tool}`)
    ? says('Prošel jsem dávku a nechávám ji člověku.')
    : call(tool, { [field]: idOf(body, field) });

const answer = (body: string): FixtureMessage => {
  const transcript = transcriptOf(body);

  if (transcript.includes('naming a coding session')) return says('{"title":"Demo"}');
  if (transcript.includes('finance.invoice.extracted')) return invoiceProcessor(body);
  if (transcript.includes('finance.transactions.unmatched')) {
    return readsAndReports(body, 'payment_listUnmatched', 'svjId');
  }
  if (transcript.includes('finance.sync.conflict')) {
    return readsAndReports(body, 'accounting_getConflict', 'conflictId');
  }

  return says('Nemám co dodat.');
};

/** A structured-output answer, which the SDK reads off the first text block. */
const extraction = (body: string): string => {
  const transcript = transcriptOf(body);
  const start = transcript.indexOf(HEADING);

  return JSON.stringify({
    id: 'msg_extract',
    type: 'message',
    role: 'assistant',
    model: 'claude-haiku-4-5-20251001',
    content: [{ type: 'text', text: JSON.stringify(readInvoice(transcript.slice(Math.max(start, 0)))) }],
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage: { input_tokens: 1200, output_tokens: 380 },
  });
};

/**
 * The model, offline. Both halves of the walkthrough go through here — reading the invoice and
 * every agent run — so the suite proves the chain, subscriber by subscriber, without a network and
 * without a bill. What it does not prove is what a real model would answer; that is what the evals
 * are for (task 026).
 */
export const startAgentReplay = (): Promise<Server> =>
  new Promise((resolve) => {
    const server = createServer((request, response) => {
      void (async () => {
        const body = await readBody(request);
        if (body === '') {
          response.writeHead(404, { 'content-type': JSON_TYPE }).end('{}');
          return;
        }

        if (body.includes('"stream":true')) {
          response.writeHead(200, { 'content-type': EVENT_STREAM }).end(toEventStream(answer(body)));
          return;
        }

        response.writeHead(200, { 'content-type': JSON_TYPE }).end(extraction(body));
      })();
    });

    server.listen(AGENT_REPLAY_PORT, '127.0.0.1', () => {
      resolve(server);
    });
  });
