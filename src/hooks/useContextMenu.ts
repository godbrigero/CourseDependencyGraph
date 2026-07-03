import { useCallback, useState, type MouseEvent } from "react";
import { screenToGraphPoint } from "../components/graph/graphGeometry";
import type {
  GraphContextMenuState,
  GraphPoint,
  GraphViewport,
} from "../components/graph/types";

const CLOSED_STATE: GraphContextMenuState = {
  isOpen: false,
  screenPoint: { x: 0, y: 0 },
  graphPoint: { x: 0, y: 0 },
};

export function useContextMenu(viewport: GraphViewport) {
  const [menuState, setMenuState] =
    useState<GraphContextMenuState>(CLOSED_STATE);

  const openMenu = useCallback(
    (screenPoint: GraphPoint, nodeId?: string) => {
      setMenuState({
        isOpen: true,
        screenPoint,
        graphPoint: screenToGraphPoint(screenPoint, viewport),
        nodeId,
      });
    },
    [viewport],
  );

  const openFromMouseEvent = useCallback(
    (event: MouseEvent<HTMLElement>, nodeId?: string) => {
      event.preventDefault();
      event.stopPropagation();
      openMenu({ x: event.clientX, y: event.clientY }, nodeId);
    },
    [openMenu],
  );

  const closeMenu = useCallback(() => {
    setMenuState(CLOSED_STATE);
  }, []);

  return {
    menuState,
    openMenu,
    openFromMouseEvent,
    closeMenu,
  };
}
