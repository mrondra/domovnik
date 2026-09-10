const STATUS_LINE = '- Status: Proposed | Accepted | Superseded by NNNN | Deprecated';

export interface AdrInput {
  readonly number: string;
  readonly title: string;
  readonly date: string;
  readonly template: string;
}

/** A new ADR starts as `Proposed`; only a review moves it to `Accepted` (docs/engineering.md §10). */
export const adrMarkdown = (input: AdrInput): string =>
  input.template
    .replace('# NNNN – <Title>', `# ${input.number} – ${input.title}`)
    .replace(STATUS_LINE, '- Status: Proposed')
    .replace('- Date: YYYY-MM-DD', `- Date: ${input.date}`);
