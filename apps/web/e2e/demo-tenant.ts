/**
 * The demo tenant `pnpm db:seed` writes, as the e2e suite sees it. Nothing here imports a feature:
 * Playwright transforms its files with babel, which does not enable the decorators a Nest
 * controller is written with — and a feature's server front door pulls its controllers in with it
 * (task 019). The suite therefore drives the application instead of reaching behind it, which is
 * what an end-to-end test is for anyway.
 */
export const DEMO_PASSWORD = 'domovnik-demo';
export const DOMAIN = 'demo.domovnik.test';

export const demoUser = (role: 'tenant-admin' | 'finance' | 'committee'): string => `${role}@${DOMAIN}`;

/** The scenario the demo screen offers for an ordinary invoice; `invoices/seed` registers it. */
export const ROUTINE_SCENARIO = 'Běžná měsíční faktura za úklid';

/** The house the walkthrough is about: the routine invoice and its statement both belong to it. */
export const WALKTHROUGH_HOUSE = 'Kotlářská 14';

/**
 * Its chair. An invoice is approved by the committee of that one house, not by whoever happens to
 * have the role — which is the whole point of `svj_id` on a role row (task 007).
 */
export const WALKTHROUGH_CHAIR = 'vybor-kotlarska@demo.domovnik.test';
