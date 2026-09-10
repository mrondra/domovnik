import requireUseClient from './require-use-client.js';
import { ruleTester } from './rule-tester.js';

ruleTester.run('require-use-client', requireUseClient, {
  valid: [
    { code: '"use client";\nexport const Panel = () => <div />;', filename: 'panel.client.tsx' },
    { code: "'use client';\nexport const Panel = () => <div />;", filename: 'panel.client.tsx' },
  ],
  invalid: [
    {
      code: 'export const Panel = () => <div />;',
      filename: 'panel.client.tsx',
      errors: [{ message: 'A *.client.tsx file must start with the "use client" directive.' }],
    },
    {
      code: 'import { useState } from "react";\n"use client";\nexport const Panel = () => <div />;',
      filename: 'panel.client.tsx',
      errors: 1,
    },
  ],
});
