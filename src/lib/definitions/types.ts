/**
 * One shared shape for every "explain this" panel in the product.
 *
 * Definitions are written once, here, so the same metric never gets two slightly
 * different explanations on two different screens. Agencies live and die by
 * definitional precision (docs/01_PRODUCT_SPEC.md §8.4).
 */

export interface MetricDefinition {
  /** Plain-English name of the metric, as it appears on screen. */
  term: string;
  /** What the number means, in one or two short sentences. No jargon. */
  definition: string;
  /** How the number is produced, described in words rather than symbols. */
  formula?: string;
  /** Human-readable source label. Shown inside the panel. */
  citation?: string;
  /** Citation id from src/data/citations.ts — used to deep-link the sources page. */
  citationId?: string;
  /** Why a counselor, coordinator, or Commissioner should care. */
  whyItMatters: string;
}

export type DefinitionMap = Record<string, MetricDefinition>;
