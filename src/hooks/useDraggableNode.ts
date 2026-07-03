import { useCallback, useRef, useState, type PointerEvent } from "react";
import type {
  CourseGraphNode,
  CourseNodeMoveHandler,
  GraphPoint,
  GraphViewport,
} from "../components/graph/types";

type UseDraggableNodeOptions = {
  node: CourseGraphNode;
  viewport: GraphViewport;
  disabled?: boolean;
  onMove?: CourseNodeMoveHandler;
  onMoveEnd?: CourseNodeMoveHandler;
};

export function useDraggableNode({
  node,
  viewport,
  disabled = false,
  onMove,
  onMoveEnd,
}: UseDraggableNodeOptions) {
  const dragStartRef = useRef<{
    pointerId: number;
    pointer: GraphPoint;
    nodePosition: GraphPoint;
  } | null>(null);
  const [dragPosition, setDragPosition] = useState<GraphPoint | null>(null);

  const beginDrag = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (disabled || event.button !== 0) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      const start = {
        pointerId: event.pointerId,
        pointer: { x: event.clientX, y: event.clientY },
        nodePosition: { x: node.x, y: node.y },
      };
      dragStartRef.current = start;
      setDragPosition(start.nodePosition);
    },
    [disabled, node.x, node.y],
  );

  const updateDrag = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const dragStart = dragStartRef.current;
      if (!dragStart || dragStart.pointerId !== event.pointerId) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      const position = {
        x:
          dragStart.nodePosition.x +
          (event.clientX - dragStart.pointer.x) / viewport.scale,
        y:
          dragStart.nodePosition.y +
          (event.clientY - dragStart.pointer.y) / viewport.scale,
      };
      setDragPosition(position);
      onMove?.(node.id, position, node);
    },
    [node, onMove, viewport.scale],
  );

  const endDrag = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const target = event.currentTarget;
      const pointerId = event.pointerId;
      const pointer = { x: event.clientX, y: event.clientY };

      event.preventDefault();
      event.stopPropagation();

      const dragStart = dragStartRef.current;
      if (!dragStart || dragStart.pointerId !== pointerId) {
        return;
      }

      const position = {
        x:
          dragStart.nodePosition.x +
          (pointer.x - dragStart.pointer.x) / viewport.scale,
        y:
          dragStart.nodePosition.y +
          (pointer.y - dragStart.pointer.y) / viewport.scale,
      };

      if (target.hasPointerCapture(pointerId)) {
        target.releasePointerCapture(pointerId);
      }

      dragStartRef.current = null;
      setDragPosition(null);
      onMoveEnd?.(node.id, position, node);
    },
    [node, onMoveEnd, viewport.scale],
  );

  return {
    isDragging: Boolean(dragPosition),
    dragPosition,
    beginDrag,
    updateDrag,
    endDrag,
  };
}
