import { defineDemoReset } from '../../demo/index';
import { demoReset } from '../service/index';

export const tasksDemoReset = defineDemoReset({ feature: 'tasks', run: demoReset });
