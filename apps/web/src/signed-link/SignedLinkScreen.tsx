import type { ReactElement } from 'react';
import { decideFromLink } from '../actions/approvals';
import { previewSignedLink } from '../api/approvals';
import { ApprovalDetail } from '../approvals/ApprovalDetail';

export interface SignedLinkScreenProps {
  readonly token: string;
}

/**
 * Approving straight from an e-mail. Rendering this page is a GET and changes nothing; the decision
 * is the POST behind the buttons, which is what keeps link scanners from approving (zadání kap. 2).
 */
export const SignedLinkScreen = async ({ token }: SignedLinkScreenProps): Promise<ReactElement> => {
  const approval = await previewSignedLink(token);
  return <ApprovalDetail approval={approval} onDecide={decideFromLink.bind(null, token)} />;
};
