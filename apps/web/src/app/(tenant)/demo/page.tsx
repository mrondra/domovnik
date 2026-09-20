import type { ReactElement } from 'react';
import { DemoScreen } from '../../../../../../packages/features/demo/ui/index';
import { run } from '../../../actions/demo';
import { readScenarios } from '../../../api/demo';

const Page = async (): Promise<ReactElement> => <DemoScreen scenarios={await readScenarios()} onRun={run} />;

export default Page;
