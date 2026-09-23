/**
 * Every metric definition in the product, in one lookup.
 *
 * Screens call `explain('fillRate')` and spread the result onto an ExplainThis or a
 * ChartFrame, so a metric is defined once and explained identically everywhere.
 */
import { FLOW_DEFINITIONS } from './flow';
import { FUNDING_DEFINITIONS } from './funding';
import { NETWORK_DEFINITIONS } from './network';
import { WIOA_DEFINITIONS } from './wioa';
import type { DefinitionMap, MetricDefinition } from './types';

export type { MetricDefinition } from './types';
export { WIOA_DEFINITIONS } from './wioa';
export { FUNDING_DEFINITIONS } from './funding';

export const DEFINITIONS: DefinitionMap = {
  ...FLOW_DEFINITIONS,
  ...NETWORK_DEFINITIONS,
  ...FUNDING_DEFINITIONS,
  ...WIOA_DEFINITIONS,
};

export type DefinitionKey = keyof typeof DEFINITIONS;

/** Props for an ExplainThis panel. Throws at build time if a key is misspelled. */
export function explain(key: string): {
  title: string;
  definition: string;
  formula?: string;
  citation?: string;
  citationHref?: string;
  whyItMatters: string;
} {
  const entry = DEFINITIONS[key];
  if (!entry) throw new Error(`No metric definition for "${key}"`);
  return toExplainProps(entry);
}

/** The same props, for a ChartFrame, which supplies its own title. */
export function explainChart(key: string): {
  definition: string;
  formula?: string;
  citation?: string;
  citationHref?: string;
  whyItMatters: string;
} {
  const { title: _title, ...rest } = explain(key);
  return rest;
}

function toExplainProps(entry: MetricDefinition) {
  return {
    title: entry.term,
    definition: entry.definition,
    ...(entry.formula ? { formula: entry.formula } : {}),
    ...(entry.citation ? { citation: entry.citation } : {}),
    ...(entry.citationId ? { citationHref: `/sources/#cite-${entry.citationId}` } : {}),
    whyItMatters: entry.whyItMatters,
  };
}
