import { UnionToIntersection } from 'ts-essentials';

import {
  ElementAdditionPayload,
  ElementRemovalPayload,
} from '../transactions/types.ts';
import { CoreEdge, CoreNode } from '../types.ts';

type BulkActionConfig = {
  nodes: {};
  edges: {};
};

type BaseActions = {
  addNode: {};
  removeNode: {};

  addEdge: {};
  removeEdge: {};

  addElements: BulkActionConfig;
  removeElements: BulkActionConfig;
};

export type PartialBaseActions = Partial<{
  addNode: {};
  removeNode: {};

  addEdge: {};
  removeEdge: {};

  addElements: Partial<BulkActionConfig>;
  removeElements: Partial<BulkActionConfig>;
}>;

// the secret sauce allowing plugin definitions to omit action fields
// such as addNode or removeEdge if they do not care to extend those
// respective definitions
type ResolveActions<Actions extends PartialBaseActions> = {
  addNode: 'addNode' extends keyof Actions
    ? NonNullable<Actions['addNode']>
    : {};
  removeNode: 'removeNode' extends keyof Actions
    ? NonNullable<Actions['removeNode']>
    : {};
  addEdge: 'addEdge' extends keyof Actions
    ? NonNullable<Actions['addEdge']>
    : {};
  removeEdge: 'removeEdge' extends keyof Actions
    ? NonNullable<Actions['removeEdge']>
    : {};
  addElements: 'addElements' extends keyof Actions
    ? {
        [K in keyof BulkActionConfig]: K extends keyof Actions['addElements']
          ? Actions['addElements'][K]
          : {};
      }
    : BulkActionConfig;
  removeElements: 'removeElements' extends keyof Actions
    ? {
        [K in keyof BulkActionConfig]: K extends keyof Actions['removeElements']
          ? Actions['removeElements'][K]
          : {};
      }
    : BulkActionConfig;
};

// handles distributing union of actions so they can be resolved separately
// before being merged together by UnionToIntersection in MergeActions
type DistributeResolveActions<PartialActions extends PartialBaseActions> =
  PartialActions extends PartialActions
    ? ResolveActions<PartialActions>
    : never;

type BulkActionsField = 'addElements' | 'removeElements';

// takes an array of action shapes and combines them into a single
// interface that is used to type the graph action methods to consumers
export type MergeActions<Actions extends PartialBaseActions[]> =
  Actions extends []
    ? BaseActions
    : {
        [
          ActionsField in keyof BaseActions
        ]: ActionsField extends BulkActionsField
          ? {
              [
                ActionsSubField in keyof BaseActions[ActionsField]
              ]: UnionToIntersection<
                DistributeResolveActions<
                  Actions[number]
                >[ActionsField][ActionsSubField]
              >;
            }
          : UnionToIntersection<
              DistributeResolveActions<Actions[number]>[ActionsField]
            >;
      };

type BulkHandler<Action extends BulkActionConfig, ReturnValue> = (options: {
  nodes: Action['nodes'][];
  edges: Action['edges'][];
}) => ReturnValue;

export type GraphActions<Actions extends BaseActions> = {
  /**
   * Adds a single {@link CoreNode | node} to the graph. Missing properties get default values.
   * @returns The newly created node instance, or undefined when the graph refused it, which
   * it reports on the console. Ask {@link CoreControls.inspect | inspect} ahead of time to
   * offer the edit only when it can be made.
   */
  addNode: (options: Actions['addNode']) => CoreNode | undefined;

  /**
   * Deletes a single {@link CoreNode | node} from the graph.
   *
   * ℹ️ **Note:** This action implicitly deletes any connected {@link CoreEdge | edges}.
   * @returns A list of all nodes and edges that were deleted.
   */
  removeNode: (options: Actions['removeNode']) => ElementRemovalPayload;

  /**
   * Adds a single {@link CoreEdge | edge} connecting two existing {@link CoreNode | nodes}.
   * @returns The newly created edge instance, or undefined when the graph refused it, which
   * it reports on the console. An endpoint that no longer exists and a path that already
   * carries an edge are both ordinary refusals rather than faults, since a collaborator can
   * cause either one between the edit being offered and being made.
   */
  addEdge: (options: Actions['addEdge']) => CoreEdge | undefined;

  /**
   * Deletes a single {@link CoreEdge | edge} from the graph.
   * @returns The edge instance that was deleted.
   */
  removeEdge: (options: Actions['removeEdge']) => CoreEdge['id'];

  /**
   * Bulk adds multiple {@link CoreNode | nodes} and {@link CoreEdge | edges}.
   * @returns Lists of all nodes and/or edges that were successfully added.
   */
  addElements: BulkHandler<Actions['addElements'], ElementAdditionPayload>;

  /**
   * Bulk deletes multiple {@link CoreNode | nodes} and {@link CoreEdge | edges}.
   *
   * ℹ️ **Note:** If a node is in this batch, all its attached edges get deleted too.
   * @returns Lists of everything that got deleted during the operation.
   */
  removeElements: BulkHandler<Actions['removeElements'], ElementRemovalPayload>;
};
