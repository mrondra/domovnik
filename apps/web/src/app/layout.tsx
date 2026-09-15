import type { Metadata } from 'next';
import type { ReactElement, ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Domovník',
  description: 'AI správa domů',
};

const RootLayout = ({ children }: { readonly children: ReactNode }): ReactElement => (
  <html lang="cs">
    <body>{children}</body>
  </html>
);

export default RootLayout;
