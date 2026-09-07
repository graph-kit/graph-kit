export type NodePayload = { value: number; id: string };

/** a single node in a binary tree, holding its own value and its two child links */
export class TreeNode {
  id: string;
  value: number;
  left: TreeNode | undefined;
  right: TreeNode | undefined;

  constructor(node: NodePayload) {
    this.id = node.id;
    this.value = node.value;
    this.left = undefined;
    this.right = undefined;
  }
}
