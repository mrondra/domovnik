import { composeEvidence, featureEvidenceFiles } from '../approvals/evidence.compose';
import { composeNavigation, featureNavigationFiles } from '../navigation/compose';

await composeNavigation();
await composeEvidence();

process.stdout.write(
  [
    `Navigation composed from ${String((await featureNavigationFiles()).length)} features`,
    `Approval evidence composed from ${String((await featureEvidenceFiles()).length)} features`,
    '',
  ].join('\n'),
);
