import { defineDemoReset } from '../../demo/index';
import { demoReset } from '../service/index';

export const paymentsDemoReset = defineDemoReset({ feature: 'payments', run: demoReset });
