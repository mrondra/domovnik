const DIRECTIVE = 'use client';

const leadingDirective = (program) => {
  const first = program.body[0];
  if (first?.type !== 'ExpressionStatement') return undefined;
  const { expression } = first;
  if (expression.type !== 'Literal' || expression.value !== DIRECTIVE) return undefined;
  return first;
};

/**
 * The other half of `require-use-client`: a component that is not named `*.client.tsx` stays a
 * server component, so the directive in it would move the boundary without renaming the file
 * (docs/engineering.md §3).
 */
export default {
  meta: {
    type: 'problem',
    docs: { description: 'only *.client.tsx carries "use client" (docs/engineering.md §3)' },
    schema: [],
  },
  create(context) {
    return {
      Program(node) {
        const directive = leadingDirective(node);
        if (directive === undefined) return;
        context.report({
          node: directive,
          message: 'Only a *.client.tsx file carries "use client". Rename the file or drop the directive.',
        });
      },
    };
  },
};
