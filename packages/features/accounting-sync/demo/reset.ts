import { defineDemoReset } from '../../demo/index';
import { demoReset } from '../service/index';

export const accountingSyncDemoReset = defineDemoReset({ feature: 'accounting-sync', run: demoReset });
