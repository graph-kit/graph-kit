import type { AxeResults } from 'axe-core';

/** the appearances audited, since a rule like color-contrast answers differently in each */
export type Appearance = 'light' | 'dark';

export type Finding = {
  ruleId: string;
  /** axe's own severity: minor, moderate, serious, critical */
  impact: string;
  help: string;
  helpUrl: string;
  /** the wcag tags that put this rule in scope, e.g. wcag2aa, wcag143 */
  tags: string[];
  /** one entry per element the rule fired on */
  targets: string[];
};

export type PageAudit = {
  route: string;
  name: string;
  appearance: Appearance;
  findings: Finding[];
  /**
   * what axe could not decide on its own, most often contrast it cannot compute because
   * the background is a canvas rather than a colour it can read. not failures, but an AA
   * claim cannot be made without a human ruling on them
   */
  needsReview: Finding[];
};

export type AuditReport = {
  url: string;
  /** what axe was asked to check, so a report says which standard it is a report against */
  tags: string[];
  pages: PageAudit[];
};

export type RawResults = Pick<AxeResults, 'violations' | 'incomplete'>;
