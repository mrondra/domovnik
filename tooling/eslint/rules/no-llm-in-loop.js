/**
 * Zakazuje volání LLM (runAgent / llm.complete / llm.extract) uvnitř cyklů.
 * ADR 0004: LLM nikdy neběží v cyklu nad položkami – dávkuj.
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

export default {
  meta: { type: 'problem', docs: { description: 'No LLM calls inside loops (ADR 0004)' }, schema: [] },
  create(context) {
    function insideLoop(node) {
      for (let p = node.parent; p; p = p.parent) {
        if (LOOPS.has(p.type)) return true;
        if (
          p.type === 'CallExpression' &&
          p.callee.type === 'MemberExpression' &&
          ARRAY_ITER.has(p.callee.property.name)
        )
          return true;
      }
      return false;
    }
    return {
      CallExpression(node) {
        const c = node.callee;
        const name =
          c.type === 'Identifier' ? c.name : c.type === 'MemberExpression' ? c.property.name : null;
        if (
          name &&
          LLM_CALLEES.has(name) &&
          (c.type === 'Identifier' || c.object?.name === 'llm') &&
          insideLoop(node)
        ) {
          context.report({
            node,
            message: `LLM call "${name}" inside a loop. Batch the items and emit one agent event (ADR 0004).`,
          });
        }
      },
    };
  },
};
