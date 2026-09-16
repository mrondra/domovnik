import { GeneratorError } from '../lib/cli';
import { writeAll } from '../lib/files';
import { isKebabCase, namesOf } from '../lib/names';
import { isEventName } from '../templates/subscriber-names';
import { subscriberFiles } from '../templates/subscriber';
import { requireFeature } from './tool';

export interface SubscriberOptions {
  readonly root: string;
  readonly feature: string;
  readonly event: string;
  readonly name: string;
}

export const generateSubscriber = async (options: SubscriberOptions): Promise<readonly string[]> => {
  if (!isKebabCase(options.feature) || !isKebabCase(options.name)) {
    throw new GeneratorError('Feature i subscriber musí být kebab-case.');
  }
  if (!isEventName(options.event)) {
    throw new GeneratorError(
      `Event ${options.event} nemá tvar domena.entita.akce – např. finance.invoice.approved.`,
    );
  }
  requireFeature(options.root, options.feature);

  const files = subscriberFiles({
    feature: namesOf(options.feature),
    event: options.event,
    subscriber: namesOf(options.name),
  });
  await writeAll(options.root, files);

  return files.map((file) => file.path);
};
