import { nullThrows } from '@core/utils/assert';
import { FrameCollector } from '@magic/shared/simulation';

import { AVLFrame, AVLFrameNoRoot } from '../simulations/frames.ts';
import { NodePayload, TreeNode } from './TreeNode.ts';
import { getBalanceFactor } from './getBalanceFactor.ts';

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
      root: this.root ? JSON.parse(JSON.stringify(this.root)) : undefined,
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

  getNodeById(id: string): TreeNode | undefined {
    const search = (node: TreeNode | undefined): TreeNode | undefined => {
      if (!node) return undefined;
      if (node.id === id) return node;
      return search(node.left) ?? search(node.right);
    };

    return search(this.root);
  }

  getNodeByValue(value: number): TreeNode | undefined {
    const search = (node: TreeNode | undefined): TreeNode | undefined => {
      if (!node) return undefined;
      if (node.value === value) return node;
      return search(node.left) ?? search(node.right);
    };

    return search(this.root);
  }

  remove(value: number) {
    if (!this.root) return;

    let targetFound = false;

    const removeHelper = (
      parent: TreeNode | undefined,
      node: TreeNode | undefined,
      value: number,
      isLeft: boolean,
    ): TreeNode | undefined => {
      if (!node) {
        return undefined;
      }

      if (!targetFound) {
        this.addFrame({
          action: 'compare-removal',
          targetNode: this.getNodeByValue(value),
          comparedNode: node,
        });
      }

      if (value < node.value && !targetFound) {
        node.left = removeHelper(node, node.left, value, true);
      } else if (value > node.value && !targetFound) {
        node.right = removeHelper(node, node.right, value, false);
      } else {
        targetFound = true;

        // Handle removal
        let replacementNode: TreeNode | undefined;

        if (!node.left && !node.right) {
          // Case 1: Leaf node
          replacementNode = undefined;
        } else if (!node.left) {
          // Case 2: Only right child
          replacementNode = node.right;
        } else if (!node.right) {
          // Case 3: Only left child
          replacementNode = node.left;
        } else {
          // Case 4: Two children
          const successor = this.findMin(node.right);

          // Create a new node with the successor's value
          replacementNode = new TreeNode(successor);
          replacementNode.left = node.left;
          // Remove the successor and attach the remaining right subtree
          replacementNode.right = this.removeMin(node.right);
        }

        // Update the parent or root reference
        if (parent) {
          if (isLeft) parent.left = replacementNode;
          else parent.right = replacementNode;
        } else {
          this.root = replacementNode;
        }

        this.addFrame({
          action: 'remove',
          targetNodeValue: value,
        });

        // Restore the tree for further processing
        if (parent) {
          if (isLeft) parent.left = node;
          else parent.right = node;
        } else {
          this.root = node;
        }

        return replacementNode;
      }

      if (node) {
        return this.rebalance(parent, node, isLeft);
      }

      return node;
    };

    this.root = removeHelper(undefined, this.root, value, false);
    return this.root;
  }

  private rebalance(
    parent: TreeNode | undefined,
    node: TreeNode,
    isLeft: boolean,
  ): TreeNode {
    const balance = getBalanceFactor(node);

    // Left Left Case
    if (balance > 1 && getBalanceFactor(node.left) >= 0) {
      const result = this.rotateRight(node);
      if (parent) {
        if (isLeft) parent.left = result;
        else parent.right = result;
      } else {
        this.root = result;
      }
      this.addFrame({
        action: 'balance',
        method: 'left-left',
      });
      if (parent) {
        if (isLeft) parent.left = node;
        else parent.right = node;
      } else {
        this.root = node;
      }
      return result;
    }

    // Right Right Case
    if (balance < -1 && getBalanceFactor(node.right!) <= 0) {
      const result = this.rotateLeft(node);
      if (parent) {
        if (isLeft) parent.left = result;
        else parent.right = result;
      } else {
        this.root = result;
      }
      this.addFrame({
        action: 'balance',
        method: 'right-right',
      });
      if (parent) {
        if (isLeft) parent.left = node;
        else parent.right = node;
      } else {
        this.root = node;
      }
      return result;
    }

    // Left Right Case
    if (balance > 1 && getBalanceFactor(node.left!) < 0) {
      node.left = this.rotateLeft(node.left!);
      const result = this.rotateRight(node);
      if (parent) {
        if (isLeft) parent.left = result;
        else parent.right = result;
      } else {
        this.root = result;
      }
      this.addFrame({
        action: 'balance',
        method: 'left-right',
      });
      if (parent) {
        if (isLeft) parent.left = node;
        else parent.right = node;
      } else {
        this.root = node;
      }
      return result;
    }

    // Right Left Case
    if (balance < -1 && getBalanceFactor(node.right!) > 0) {
      node.right = this.rotateRight(node.right!);
      const result = this.rotateLeft(node);
      if (parent) {
        if (isLeft) parent.left = result;
        else parent.right = result;
      } else {
        this.root = result;
      }
      this.addFrame({
        action: 'balance',
        method: 'right-left',
      });
      if (parent) {
        if (isLeft) parent.left = node;
        else parent.right = node;
      } else {
        this.root = node;
      }
      return result;
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

      // Recursively balance left and right subtrees
      node.left = balanceNode(node, node.left, true);
      node.right = balanceNode(node, node.right, false);

      // Use existing rebalance method
      return this.rebalance(parent, node, isLeft);
    };

    this.root = balanceNode(undefined, this.root, false);
  }

  private rotateRight(y: TreeNode): TreeNode {
    const x = y.left!;
    const T2 = x.right;

    x.right = y;
    y.left = T2;

    return x;
  }

  private rotateLeft(x: TreeNode): TreeNode {
    const y = x.right!;
    const T2 = y.left;

    y.left = x;
    x.right = T2;

    return y;
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
