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

    const removeHelper = (node: TreeNode | undefined): TreeNode | undefined => {
      if (!node) return undefined;

      if (value < node.value) {
        node.left = removeHelper(node.left);
        return node;
      }

      if (value > node.value) {
        node.right = removeHelper(node.right);
        return node;
      }

      if (!node.left) return node.right;
      if (!node.right) return node.left;

      const successor = this.findMin(node.right);

      const replacementNode = new TreeNode(successor);
      replacementNode.left = node.left;
      replacementNode.right = this.removeMin(node.right);

      return replacementNode;
    };

    this.root = removeHelper(this.root);
    return this.root;
  }

  private rebalance(
    parent: TreeNode | undefined,
    node: TreeNode,
    isLeft: boolean,
  ): TreeNode {
    const balance = getBalanceFactor(node);
    const leftBalance = getBalanceFactor(node.left);
    const rightBalance = getBalanceFactor(node.right);

    if (balance > 1 && leftBalance >= 0) {
      this.addFrame({
        action: 'balance',
        method: 'left-left',
        unbalancedNode: node,
        childNode: nullThrows(node.left, 'left left needs a left child'),
        childBalanceFactor: leftBalance,
      });
      return this.rotateRight(parent, node, isLeft);
    }

    if (balance < -1 && rightBalance <= 0) {
      this.addFrame({
        action: 'balance',
        method: 'right-right',
        unbalancedNode: node,
        childNode: nullThrows(node.right, 'right right needs a right child'),
        childBalanceFactor: rightBalance,
      });
      return this.rotateLeft(parent, node, isLeft);
    }

    if (balance > 1 && leftBalance < 0) {
      const leftChild = nullThrows(node.left, 'left child is undefined');
      this.addFrame({
        action: 'balance',
        method: 'left-right',
        unbalancedNode: node,
        childNode: leftChild,
        childBalanceFactor: leftBalance,
      });
      this.rotateLeft(node, leftChild, true);
      return this.rotateRight(parent, node, isLeft);
    }

    if (balance < -1 && rightBalance > 0) {
      const rightChild = nullThrows(node.right, 'right child is undefined');
      this.addFrame({
        action: 'balance',
        method: 'right-left',
        unbalancedNode: node,
        childNode: rightChild,
        childBalanceFactor: rightBalance,
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

  insert(payload: NodePayload) {
    const insertHelper = (node: TreeNode | undefined): TreeNode => {
      if (!node) return new TreeNode(payload);

      if (payload.value < node.value) {
        node.left = insertHelper(node.left);
      } else {
        node.right = insertHelper(node.right);
      }

      return node;
    };

    this.root = insertHelper(this.root);
    return this.root;
  }
}
