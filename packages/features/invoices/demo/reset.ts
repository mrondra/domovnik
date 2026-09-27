import { defineDemoReset } from '../../demo/index';
import { demoReset } from '../service/index';

export const invoicesDemoReset = defineDemoReset({ feature: 'invoices', run: demoReset });
