import { devWarning } from '@core/utils/debugging';
import { TransactionDraft } from '@graph/primitives/transactions/types';
import { CoreEdge } from '@graph/primitives/types';

import { GraphState } from './types.ts';

/**
 * An edit a consumer is still deciding whether to ask for. Ids are optional because an
 * element only earns one at the action.
 */
export type ProspectiveDraft = {
  addNodes?: { id?: string }[];
  addEdges?: { id?: string; source: string; target: string }[];
  removeNodeIds?: string[];
  removeEdgeIds?: string[];
};

export type DraftRejection = {
  /** absent while the element is still prospective */
  id?: string;
  reason: string;
};

export type DraftInspection = {
  /** true when the draft survives whole */
  valid: boolean;
  /** the draft as the transaction would take it */
  draft: Partial<TransactionDraft>;
  rejections: DraftRejection[];
};

export type InspectDraft = (draft: ProspectiveDraft) => DraftInspection;
export type ValidateDraft = (
  draft: Partial<TransactionDraft>,
) => Partial<TransactionDraft>;

/**
 * What an edge occupies, which at most one edge may hold.
 *
 * TODO multigraphs are not supported yet. Lifting this means every consumer resolving a
 * path back to a single edge answers with a set instead, so it is a change to the edge
 * model rather than a rule to delete here.
 */
const pathOf = (
  { source, target }: Pick<CoreEdge, 'source' | 'target'>,
  directed: boolean,
) => JSON.stringify(directed ? [source, target] : [source, target].sort());

/**
 * Answers what a transaction would make of a draft without committing it, so an edit can be
 * refused where the user asked rather than dropped inside an action. Pure and stateless:
 * asking is not an event.
 */
export const createInspectDraft = (
  graph: GraphState,
  directed: boolean,
): InspectDraft => {
  return (draft) => {
    const nodeIds = new Set(graph.nodes().map((node) => node.id));
    const edgeIds = new Set(graph.edges().map((edge) => edge.id));
    const removedNodeIds = new Set(draft.removeNodeIds ?? []);
    const removedEdgeIds = new Set(draft.removeEdgeIds ?? []);

    // an edge on its way out frees its path, and removing an endpoint takes its edges
    const survives = (edge: CoreEdge) =>
      !removedEdgeIds.has(edge.id) &&
      !removedNodeIds.has(edge.source) &&
      !removedNodeIds.has(edge.target);

    const takenPaths = new Set(
      graph
        .edges()
        .filter(survives)
        .map((edge) => pathOf(edge, directed)),
    );

    const rejections: DraftRejection[] = [];
    const reject = (id: string | undefined, reason: string) => {
      rejections.push({ id, reason });
    };

    const addNodes = [];
    for (const node of draft.addNodes ?? []) {
      if (node.id !== undefined && nodeIds.has(node.id)) {
        reject(node.id, 'a node already holds that id');
        continue;
      }
      if (node.id !== undefined) nodeIds.add(node.id);
      addNodes.push(node);
    }

    // an endpoint the same draft adds counts, since a node and its edges are restored in
    // one draft; one it removes does not
    const resolves = (nodeId: string) =>
      nodeIds.has(nodeId) && !removedNodeIds.has(nodeId);

    const addEdges = [];
    for (const edge of draft.addEdges ?? []) {
      if (edge.id !== undefined && edgeIds.has(edge.id)) {
        reject(edge.id, 'an edge already holds that id');
        continue;
      }
      if (!resolves(edge.source) || !resolves(edge.target)) {
        reject(
          edge.id,
          `no node to connect (${edge.source} -> ${edge.target})`,
        );
        continue;
      }
      const path = pathOf(edge, directed);
      if (takenPaths.has(path)) {
        reject(
          edge.id,
          `an edge already runs ${edge.source} ${directed ? '->' : '<->'} ${edge.target}`,
        );
        continue;
      }
      if (edge.id !== undefined) edgeIds.add(edge.id);
      takenPaths.add(path);
      addEdges.push(edge);
    }

    return {
      valid: rejections.length === 0,
      // elements from the transaction path already carry ids, so what survives a real
      // draft is a real draft
      draft: { ...draft, addNodes, addEdges } as Partial<TransactionDraft>,
      rejections,
    };
  };
};

/**
 * The gate every mutation passes through, so live state only ever holds a graph that
 * resolves. Rejected elements are dropped, since a peer deleting the node an inbound edge
 * points at is lawful concurrency; only the single element actions turn the empty payload
 * into an error.
 *
 * One validator per graph, because it remembers what it has already complained about.
 */
export const createValidateDraft = (
  inspectDraft: InspectDraft,
): ValidateDraft => {
  // a rejected element gets offered again on every later pass, so warn once per problem
  // rather than once per attempt
  const reported = new Set<string>();

  return (draft) => {
    const { valid, draft: accepted, rejections } = inspectDraft(draft);
    if (valid) return draft;

    for (const { id, reason } of rejections) {
      if (id !== undefined && reported.has(id)) continue;
      if (id !== undefined) reported.add(id);
      devWarning(`[graph/core] dropped "${id}" from a transaction: ${reason}`);
    }

    return accepted;
  };
};
