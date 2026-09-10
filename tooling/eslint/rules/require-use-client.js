const DIRECTIVE = 'use client';

const startsWithDirective = (program) => {
  const first = program.body[0];
  return (
    first?.type === 'ExpressionStatement' &&
    first.expression.type === 'Literal' &&
    first.expression.value === DIRECTIVE
  );
};

/**
 * The `"use client"` directive decides where a component runs, and the file name is the only place
 * a reviewer sees that decision without opening the file. A `*.client.tsx` therefore always carries
 * it (docs/engineering.md §3); `forbid-use-client` guards the other half.
 */
export default {
  meta: {
    type: 'problem',
    docs: { description: 'a *.client.tsx starts with "use client" (docs/engineering.md §3)' },
    schema: [],
  },
  create(context) {
    return {
      Program(node) {
        if (startsWithDirective(node)) return;
        context.report({
          node,
          message: 'A *.client.tsx file must start with the "use client" directive.',
        });
      },
    };
  },
};
