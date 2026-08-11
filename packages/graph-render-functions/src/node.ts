import { createNodeStyleResolver } from './resolvers.ts';
import { CreateNodeRenderFunction } from './types.ts';

export const createNodeRenderFunction: CreateNodeRenderFunction = ({
  shapes,
  resolveToken,
}) => {
  const resolveNodeStyles = createNodeStyleResolver(resolveToken);
  return (node) => {
    const styles = resolveNodeStyles(node);
    return shapes.circle({
      id: node.id,
      at: node.position,
      radius: styles.size,
      fillColor: styles.color,
      stroke: {
        color: styles.border.color,
        lineWidth: styles.border.width,
      },
      textArea: {
        textBlock: styles.text,
      },
    });
  };
};
