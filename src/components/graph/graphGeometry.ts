import {
  DEFAULT_NODE_HEIGHT,
  DEFAULT_NODE_WIDTH,
  type CourseGraphNode,
  type GraphPoint,
  type GraphViewport,
} from "./types";

export function getNodeSize(node: CourseGraphNode) {
  return {
    width: node.width ?? DEFAULT_NODE_WIDTH,
    height: node.height ?? DEFAULT_NODE_HEIGHT,
  };
}

export function screenToGraphPoint(
  point: GraphPoint,
  viewport: GraphViewport,
): GraphPoint {
  return {
    x: (point.x - viewport.x) / viewport.scale,
    y: (point.y - viewport.y) / viewport.scale,
  };
}

export function graphToScreenPoint(
  point: GraphPoint,
  viewport: GraphViewport,
): GraphPoint {
  return {
    x: point.x * viewport.scale + viewport.x,
    y: point.y * viewport.scale + viewport.y,
  };
}

export function getEdgePath(fromNode: CourseGraphNode, toNode: CourseGraphNode) {
  const fromSize = getNodeSize(fromNode);
  const toSize = getNodeSize(toNode);
  const fromCenter = {
    x: fromNode.x + fromSize.width / 2,
    y: fromNode.y + fromSize.height / 2,
  };
  const toCenter = {
    x: toNode.x + toSize.width / 2,
    y: toNode.y + toSize.height / 2,
  };
  const delta = {
    x: toCenter.x - fromCenter.x,
    y: toCenter.y - fromCenter.y,
  };
  const horizontal = Math.abs(delta.x) >= Math.abs(delta.y);
  const start = horizontal
    ? {
        x: delta.x >= 0 ? fromNode.x + fromSize.width : fromNode.x,
        y: fromCenter.y,
      }
    : {
        x: fromCenter.x,
        y: delta.y >= 0 ? fromNode.y + fromSize.height : fromNode.y,
      };
  const end = horizontal
    ? {
        x: delta.x >= 0 ? toNode.x : toNode.x + toSize.width,
        y: toCenter.y,
      }
    : {
        x: toCenter.x,
        y: delta.y >= 0 ? toNode.y : toNode.y + toSize.height,
      };
  const controlOne = horizontal
    ? {
        x: (start.x + end.x) / 2,
        y: start.y,
      }
    : {
        x: start.x,
        y: (start.y + end.y) / 2,
      };
  const controlTwo = horizontal
    ? {
        x: (start.x + end.x) / 2,
        y: end.y,
      }
    : {
        x: end.x,
        y: (start.y + end.y) / 2,
      };

  return `M ${start.x} ${start.y} C ${controlOne.x} ${controlOne.y}, ${controlTwo.x} ${controlTwo.y}, ${end.x} ${end.y}`;
}

export function getGraphBounds(nodes: CourseGraphNode[]) {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  return nodes.reduce(
    (bounds, node) => {
      const size = getNodeSize(node);
      return {
        minX: Math.min(bounds.minX, node.x),
        minY: Math.min(bounds.minY, node.y),
        maxX: Math.max(bounds.maxX, node.x + size.width),
        maxY: Math.max(bounds.maxY, node.y + size.height),
        width: 0,
        height: 0,
      };
    },
    {
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
      width: 0,
      height: 0,
    },
  );
}

export function withDimensions(bounds: ReturnType<typeof getGraphBounds>) {
  return {
    ...bounds,
    width: bounds.maxX - bounds.minX,
    height: bounds.maxY - bounds.minY,
  };
}
