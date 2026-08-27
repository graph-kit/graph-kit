import { nullThrows } from '@core/utils/assert';
import { jsonClone } from '@core/utils/clone';
import { FrameCollector } from '@magic/shared/simulation';

import { AVLFrame, AVLFrameNoRoot } from '../simulations/frames.ts';
import { NodePayload, TreeNode } from './TreeNode.ts';
import { getBalanceFactor } from './getBalanceFactor.ts';
import { getNodeById } from './getNodeById.ts';

export class AVLTree {
  root: TreeNode | undefined;
  frameCollector: FrameCollector<AVLFrame> | undefined;

  constructor(root?: TreeNode) {
    this.root = root;
  }

  attachFrameCollector(frameCollector: FrameCollector<AVLFrame>) {
    this.frameCollector = frameCollector;
  }

  private addFrame(entry: AVLFrameNoRoot) {
    const collector = nullThrows(this.frameCollector, 'collector is undefined');

    collector.add({
      ...entry,
      root: jsonClone(this.root),
    });
  }

  reset() {
    this.root = undefined;
  }

  private removeMin(node: TreeNode): TreeNode | undefined {
    if (!node.left) return node.right;
    node.left = this.removeMin(node.left);
    return node;
  }

  private findMin(node: TreeNode): TreeNode {
    let current = node;
    while (current.left) {
      current = current.left;
    }
    return current;
  }

  remove(id: string) {
    const { value } = nullThrows(
      getNodeById(this.root, id),
      `cant remove ${id}, no node with that id is in the tree`,
    );

    const removeHelper = (
      parent: TreeNode | undefined,
      node: TreeNode | undefined,
      isLeft: boolean,
    ): TreeNode | undefined => {
      if (!node) {
        return undefined;
      }

      if (value < node.value) {
        node.left = removeHelper(node, node.left, true);
        return node;
      }

      if (value > node.value) {
        node.right = removeHelper(node, node.right, false);
        return node;
      }

      let replacementNode: TreeNode | undefined;

      // every branch reports its replacement before touching the tree, so the
      // frame snapshots the node still in place next to the node taking over
      if (node.left && node.right) {
        const successor = this.findMin(node.right);

        this.addFrame({
          action: 'find-replacement',
          method: 'successor',
          removedNode: node,
          replacementNode: successor,
        });

        replacementNode = new TreeNode(successor);
        replacementNode.left = node.left;
        replacementNode.right = this.removeMin(node.right);
      } else if (node.left) {
        this.addFrame({
          action: 'find-replacement',
          method: 'only-left-child',
          removedNode: node,
          replacementNode: node.left,
        });

        replacementNode = node.left;
      } else if (node.right) {
        this.addFrame({
          action: 'find-replacement',
          method: 'only-right-child',
          removedNode: node,
          replacementNode: node.right,
        });

        replacementNode = node.right;
      } else {
        this.addFrame({
          action: 'find-replacement',
          method: 'leaf',
          removedNode: node,
        });

        replacementNode = undefined;
      }

      this.attach(parent, replacementNode, isLeft);

      this.addFrame({
        action: 'remove',
        targetNodeValue: value,
      });

      return replacementNode;
    };

    this.root = removeHelper(undefined, this.root, false);

    if (!this.root) return;

    this.addFrame({ action: 'balance-check' });

    // removal can unbalance the whole path it touched, including the subtree
    // removeMin rewrote, so the repair runs as its own pass over the result
    this.balance();

    this.addFrame({ action: 'remove-complete' });

    return this.root;
  }

  private rebalance(
    parent: TreeNode | undefined,
    node: TreeNode,
    isLeft: boolean,
  ): TreeNode {
    const balance = getBalanceFactor(node);

    if (balance > 1 && getBalanceFactor(node.left) >= 0) {
      this.addFrame({
        action: 'balance',
        method: 'left-left',
        unbalancedNode: node,
        childNode: nullThrows(node.left, 'left left needs a left child'),
      });
      return this.rotateRight(parent, node, isLeft);
    }

    if (balance < -1 && getBalanceFactor(node.right) <= 0) {
      this.addFrame({
        action: 'balance',
        method: 'right-right',
        unbalancedNode: node,
        childNode: nullThrows(node.right, 'right right needs a right child'),
      });
      return this.rotateLeft(parent, node, isLeft);
    }

    if (balance > 1 && getBalanceFactor(node.left) < 0) {
      const leftChild = nullThrows(node.left, 'left child is undefined');
      this.addFrame({
        action: 'balance',
        method: 'left-right',
        unbalancedNode: node,
        childNode: leftChild,
      });
      this.rotateLeft(node, leftChild, true);
      return this.rotateRight(parent, node, isLeft);
    }

    if (balance < -1 && getBalanceFactor(node.right) > 0) {
      const rightChild = nullThrows(node.right, 'right child is undefined');
      this.addFrame({
        action: 'balance',
        method: 'right-left',
        unbalancedNode: node,
        childNode: rightChild,
      });
      this.rotateRight(node, rightChild, false);
      return this.rotateLeft(parent, node, isLeft);
    }

    return node;
  }

  balance() {
    const balanceNode = (
      parent: TreeNode | undefined,
      node: TreeNode | undefined,
      isLeft: boolean,
    ): TreeNode | undefined => {
      if (!node) return undefined;

      node.left = balanceNode(node, node.left, true);
      node.right = balanceNode(node, node.right, false);

      return this.rebalance(parent, node, isLeft);
    };

    this.root = balanceNode(undefined, this.root, false);
  }

  private attach(
    parent: TreeNode | undefined,
    node: TreeNode | undefined,
    isLeft: boolean,
  ) {
    if (!parent) {
      this.root = node;
      return;
    }

    if (isLeft) parent.left = node;
    else parent.right = node;
  }

  private rotateRight(
    parent: TreeNode | undefined,
    node: TreeNode,
    isLeft: boolean,
  ): TreeNode {
    const newRoot = nullThrows(node.left, 'right rotation needs a left child');
    const movedSubtree = newRoot.right;

    newRoot.right = node;
    node.left = movedSubtree;

    // frames snapshot from this.root, so the rotation has to be wired in first
    this.attach(parent, newRoot, isLeft);

    this.addFrame({
      action: 'rotation',
      side: 'right',
      rotatedNode: node,
      promotedNode: newRoot,
    });

    return newRoot;
  }

  private rotateLeft(
    parent: TreeNode | undefined,
    node: TreeNode,
    isLeft: boolean,
  ): TreeNode {
    const newRoot = nullThrows(node.right, 'left rotation needs a right child');
    const movedSubtree = newRoot.left;

    newRoot.left = node;
    node.right = movedSubtree;

    this.attach(parent, newRoot, isLeft);

    this.addFrame({
      action: 'rotation',
      side: 'left',
      rotatedNode: node,
      promotedNode: newRoot,
    });

    return newRoot;
  }

  insert(payload: NodePayload, rebalance = true) {
    if (!this.root) {
      this.root = new TreeNode(payload);
      this.addFrame({
        action: 'insert',
        targetNode: this.root,
      });
      return this.root;
    }

    let justInserted = false;

    const insertHelper = (
      parent: TreeNode | undefined,
      node: TreeNode | undefined,
      payload: NodePayload,
      isLeft: boolean,
    ): TreeNode => {
      if (!node) {
        const newNode = new TreeNode(payload);
        justInserted = true;
        return newNode;
      }

      this.addFrame({
        action: 'compare',
        comparedNode: node,
        targetNode: payload,
      });

      if (payload.value < node.value) {
        node.left = insertHelper(node, node.left, payload, true);
        if (justInserted) {
          this.addFrame({
            action: 'insert',
            targetNode: payload,
          });
          justInserted = false;
        }
      } else if (payload.value > node.value) {
        node.right = insertHelper(node, node.right, payload, false);
        if (justInserted) {
          this.addFrame({
            action: 'insert',
            targetNode: payload,
          });
          justInserted = false;
        }
      } else {
        this.addFrame({
          action: 'compare-duplicate-found',
          preexistingNode: node,
        });
        return node;
      }

      return rebalance ? this.rebalance(parent, node, isLeft) : node;
    };

    this.root = insertHelper(undefined, this.root, payload, false);
    return this.root;
  }
}
