import forbidUseClient from './forbid-use-client.js';
import { ruleTester } from './rule-tester.js';

ruleTester.run('forbid-use-client', forbidUseClient, {
  valid: [
    { code: 'export const Panel = () => <div />;', filename: 'panel.tsx' },
    {
      code: 'const label = "use client";\nexport const Panel = () => <div>{label}</div>;',
      filename: 'panel.tsx',
    },
  ],
  invalid: [
    {
      code: '"use client";\nexport const Panel = () => <div />;',
      filename: 'panel.tsx',
      errors: [
        {
          message: 'Only a *.client.tsx file carries "use client". Rename the file or drop the directive.',
        },
      ],
    },
  ],
});
