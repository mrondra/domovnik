/**
 * Forbids LLM calls (runAgent / llm.complete / llm.extract) inside loops.
 * ADR 0004: an LLM never runs in a loop over items - batch them instead.
 */
const LLM_CALLEES = new Set(['runAgent', 'complete', 'extract', 'classify', 'embed']);
const LOOPS = new Set([
  'ForStatement',
  'ForOfStatement',
  'ForInStatement',
  'WhileStatement',
  'DoWhileStatement',
]);
const ARRAY_ITER = new Set(['map', 'forEach', 'flatMap', 'reduce']);

/**
 * @param {import('estree').Expression | import('estree').Super} callee
 * @returns {string | null}
 */
const calleeName = (callee) => {
  if (callee.type === 'Identifier') return callee.name;
  if (callee.type !== 'MemberExpression') return null;
  return callee.property.type === 'Identifier' ? callee.property.name : null;
};

/**
 * The call is either a bare `runAgent(…)` or a method on the `llm` client.
 * @param {import('estree').Expression | import('estree').Super} callee
 */
const isLlmCall = (callee) =>
  callee.type === 'Identifier' ||
  (callee.type === 'MemberExpression' && callee.object.type === 'Identifier' && callee.object.name === 'llm');

/** @param {import('eslint').Rule.Node} node */
const insideLoop = (node) => {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (LOOPS.has(parent.type)) return true;
    if (parent.type !== 'CallExpression' || parent.callee.type !== 'MemberExpression') continue;
    const iterator = calleeName(parent.callee);
    if (iterator !== null && ARRAY_ITER.has(iterator)) return true;
  }
  return false;
};

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: { type: 'problem', docs: { description: 'No LLM calls inside loops (ADR 0004)' }, schema: [] },
  create(context) {
    return {
      CallExpression(node) {
        const name = calleeName(node.callee);
        if (name === null || !LLM_CALLEES.has(name)) return;
        if (!isLlmCall(node.callee) || !insideLoop(node)) return;
        context.report({
          node,
          message: `LLM call "${name}" inside a loop. Batch the items and emit one agent event (ADR 0004).`,
        });
      },
    };
  },
};
