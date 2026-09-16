import type { ReactElement } from 'react';
import { SvjOverviewScreen } from '../../../../../../packages/features/svj/ui/index';
import { readSvjSummaries } from '../../../api/svj';

const Page = async (): Promise<ReactElement> => (
  <SvjOverviewScreen svj={await readSvjSummaries()} detailHref={(svjId) => `/s/${svjId}/svj`} />
);

export default Page;
