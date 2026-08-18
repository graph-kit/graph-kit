import { TransactionDraft } from '@graph/primitives/transactions/types';
import { CoreEdge } from '@graph/primitives/types';

import { GraphState } from './types.ts';

/**
 * An edit that has not been asked for yet, which is what a consumer holds while deciding
 * whether to ask. Ids are optional because an element only earns one at the action.
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
  /** true when the draft survives whole, which is what a consumer gates an edit on */
  valid: boolean;
  /** the draft as the transaction would take it, holding only what survived */
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
 * TODO multigraphs are not supported yet. Lifting this means every consumer that resolves
 * a path back to a single edge has to answer with a set instead, so it is a change to the
 * edge model rather than a rule to delete here.
 */
const pathOf = (
  { source, target }: Pick<CoreEdge, 'source' | 'target'>,
  directed: boolean,
) =>
  // an undirected path is the same path travelled either way, so it is stored one way
  JSON.stringify(directed ? [source, target] : [source, target].sort());

/**
 * Answers what a transaction would make of a draft without committing anything, so an edit
 * can be refused where the user asked for it rather than thrown out of an action. Pure and
 * stateless: the transaction is what reports, and a consumer asking is not an event.
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

    // an edge on its way out frees the path it holds, so one transaction can replace an
    // edge with another along the same path. removing an endpoint takes its edges with it
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

    // an endpoint the same draft is adding counts, since restoring a node together with
    // its edges arrives as a single draft. one the same draft is removing does not
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
      // every element the transaction path hands over already carries an id, so what
      // survives an inspection of a real draft is a real draft
      draft: { ...draft, addNodes, addEdges } as Partial<TransactionDraft>,
      rejections,
    };
  };
};

/**
 * The gate every mutation passes through, so that live state can only ever hold a graph
 * that resolves. Rejected elements are dropped rather than thrown on: a peer deleting the
 * node an inbound edge points at is lawful concurrency, and only the single element actions
 * turn the resulting empty payload into an error, where the caller is local code that asked
 * for one specific thing.
 *
 * One validator per graph, because it remembers what it has already complained about.
 */
export const createValidateDraft = (
  inspectDraft: InspectDraft,
): ValidateDraft => {
  // a rejected element is usually still sitting in whatever the caller is reconciling
  // against, so it gets offered again on every later pass. one line per problem rather
  // than one per attempt
  const reported = new Set<string>();

  return (draft) => {
    const { valid, draft: accepted, rejections } = inspectDraft(draft);
    if (valid) return draft;

    for (const { id, reason } of rejections) {
      if (id !== undefined && reported.has(id)) continue;
      if (id !== undefined) reported.add(id);
      console.warn(
        `[graph/core] dropped "${id}" from a transaction: ${reason}`,
      );
    }

    return accepted;
  };
};
