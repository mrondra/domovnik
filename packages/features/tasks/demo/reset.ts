import { defineDemoReset } from '../../demo/index';

/**
 * What a demonstration threw away, once this feature has something worth throwing away. Returns
 * how many rows it removed — `0` until this feature writes something a demo scenario produces
 * (task 028).
 */
export const tasksDemoReset = defineDemoReset({
  feature: 'tasks',
  run: () => Promise.resolve(0),
});
