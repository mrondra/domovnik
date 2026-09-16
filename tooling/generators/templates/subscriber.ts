import type { GeneratedFile } from '../lib/files';
import { featurePath } from '../lib/repo';
import { subscriberTs } from './subscriber-source';
import { subscriberIntTest } from './subscriber-test';
import type { SubscriberInput } from './subscriber-names';

export const subscriberFiles = (input: SubscriberInput): readonly GeneratedFile[] => {
  const at = (relative: string): string => `${featurePath(input.feature.kebab)}/${relative}`;

  return [
    { path: at(`subscribers/${input.subscriber.kebab}.ts`), contents: subscriberTs(input) },
    { path: at(`tests/${input.subscriber.kebab}.int.test.ts`), contents: subscriberIntTest(input) },
  ];
};
