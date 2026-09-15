import type { ReactElement } from 'react';

/** A hairline. It carries no spacing of its own — the surrounding `Stack` gap does that. */
export const Divider = (): ReactElement => <hr className="border-t border-slate-200" />;
