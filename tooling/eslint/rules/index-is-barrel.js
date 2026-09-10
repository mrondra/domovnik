/**
 * An `index.ts` is the public face of a directory, not a place to live in. It may re-export and it
 * may compose already-imported functions into a namespace object; anything else belongs in a file
 * next to it, so a reader can tell what a directory offers without reading an implementation.
 */
const isNamespaceObject = (declaration) => {
  if (declaration?.type !== 'VariableDeclaration') return false;
  return declaration.declarations.every((declarator) => {
    const init = declarator.init;
    const unwrapped = init?.type === 'TSAsExpression' ? init.expression : init;
    return unwrapped?.type === 'ObjectExpression';
  });
};

const isAllowed = (node) => {
  switch (node.type) {
    case 'ImportDeclaration':
    case 'ExportAllDeclaration':
      return true;
    case 'ExportNamedDeclaration':
      return node.source !== null || node.declaration === null || isNamespaceObject(node.declaration);
    default:
      return false;
  }
};

export default {
  meta: {
    type: 'problem',
    docs: { description: 'index.ts only re-exports (AGENTS.md §4)' },
    schema: [],
  },
  create(context) {
    return {
      Program(node) {
        for (const statement of node.body) {
          if (isAllowed(statement)) continue;
          context.report({
            node: statement,
            message: 'index.ts only re-exports. Move this into a file next to it and re-export it here.',
          });
        }
      },
    };
  },
};
