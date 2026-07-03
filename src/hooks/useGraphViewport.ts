import { useCallback, useMemo, useState, type PointerEvent, type WheelEvent } from "react";
import {
  graphToScreenPoint,
  screenToGraphPoint,
} from "../components/graph/graphGeometry";
import type { GraphPoint, GraphViewport } from "../components/graph/types";

type UseGraphViewportOptions = {
  initialViewport?: GraphViewport;
  minScale?: number;
  maxScale?: number;
  onViewportChange?: (viewport: GraphViewport) => void;
};

const DEFAULT_VIEWPORT: GraphViewport = { x: 48, y: 48, scale: 1 };

export function useGraphViewport({
  initialViewport = DEFAULT_VIEWPORT,
  minScale = 0.25,
  maxScale = 3,
  onViewportChange,
}: UseGraphViewportOptions = {}) {
  const [viewport, setViewportState] = useState<GraphViewport>(initialViewport);
  const [panStart, setPanStart] = useState<{
    pointerId: number;
    pointer: GraphPoint;
    viewport: GraphViewport;
  } | null>(null);

  const setViewport = useCallback(
    (next: GraphViewport | ((current: GraphViewport) => GraphViewport)) => {
      setViewportState((current) => {
        const resolved = typeof next === "function" ? next(current) : next;
        const clamped = {
          ...resolved,
          scale: Math.min(maxScale, Math.max(minScale, resolved.scale)),
        };
        onViewportChange?.(clamped);
        return clamped;
      });
    },
    [maxScale, minScale, onViewportChange],
  );

  const toGraphPoint = useCallback(
    (point: GraphPoint) => screenToGraphPoint(point, viewport),
    [viewport],
  );

  const toScreenPoint = useCallback(
    (point: GraphPoint) => graphToScreenPoint(point, viewport),
    [viewport],
  );

  const beginPan = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (event.button !== 0) {
        return;
      }

      event.currentTarget.setPointerCapture(event.pointerId);
      setPanStart({
        pointerId: event.pointerId,
        pointer: { x: event.clientX, y: event.clientY },
        viewport,
      });
    },
    [viewport],
  );

  const updatePan = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (!panStart || panStart.pointerId !== event.pointerId) {
        return;
      }

      setViewport({
        ...panStart.viewport,
        x: panStart.viewport.x + event.clientX - panStart.pointer.x,
        y: panStart.viewport.y + event.clientY - panStart.pointer.y,
      });
    },
    [panStart, setViewport],
  );

  const endPan = useCallback((event: PointerEvent<HTMLElement>) => {
    const target = event.currentTarget;
    const pointerId = event.pointerId;

    setPanStart((current) => {
      if (!current || current.pointerId !== pointerId) {
        return current;
      }

      if (target.hasPointerCapture(pointerId)) {
        target.releasePointerCapture(pointerId);
      }

      return null;
    });
  }, []);

  const zoomAtPoint = useCallback(
    (screenPoint: GraphPoint, scaleDelta: number) => {
      setViewport((current) => {
        const nextScale = Math.min(
          maxScale,
          Math.max(minScale, current.scale * scaleDelta),
        );
        const graphPoint = screenToGraphPoint(screenPoint, current);

        return {
          scale: nextScale,
          x: screenPoint.x - graphPoint.x * nextScale,
          y: screenPoint.y - graphPoint.y * nextScale,
        };
      });
    },
    [maxScale, minScale, setViewport],
  );

  const handleWheel = useCallback(
    (event: WheelEvent<HTMLElement>) => {
      if (event.shiftKey) {
        setViewport((current) => ({
          ...current,
          x: current.x - event.deltaX,
          y: current.y - event.deltaY,
        }));
        return;
      }

      event.preventDefault();
      zoomAtPoint(
        { x: event.clientX, y: event.clientY },
        Math.exp(-event.deltaY * 0.0015),
      );
    },
    [setViewport, zoomAtPoint],
  );

  return useMemo(
    () => ({
      viewport,
      isPanning: Boolean(panStart),
      setViewport,
      toGraphPoint,
      toScreenPoint,
      beginPan,
      updatePan,
      endPan,
      handleWheel,
      zoomAtPoint,
    }),
    [
      beginPan,
      endPan,
      handleWheel,
      panStart,
      setViewport,
      toGraphPoint,
      toScreenPoint,
      updatePan,
      viewport,
      zoomAtPoint,
    ],
  );
}
