"use client";

import styles from "./CourseDependencyCanvas.module.css";
import type {
  GraphContextMenuRenderer,
  GraphContextMenuState,
} from "./types";

type GraphContextMenuProps = {
  state: GraphContextMenuState;
  renderContextMenu?: GraphContextMenuRenderer;
  scale?: number;
  onClose: () => void;
};

export function GraphContextMenu({
  state,
  renderContextMenu,
  scale = 1,
  onClose,
}: GraphContextMenuProps) {
  if (!state.isOpen) {
    return null;
  }

  return (
    <div
      className={styles.contextMenu}
      style={{
        left: state.screenPoint.x,
        top: state.screenPoint.y,
        transform: `scale(${scale})`,
      }}
      role="menu"
      onPointerDown={(event) => event.stopPropagation()}
      onWheel={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
    >
      {renderContextMenu ? (
        renderContextMenu(state, { close: onClose })
      ) : (
        <>
          <button type="button" role="menuitem" onClick={onClose}>
            {state.nodeId ? "Open course" : "Add course here"}
          </button>
          <button type="button" role="menuitem" onClick={onClose}>
            {state.nodeId ? "Edit prerequisites" : "Reset view"}
          </button>
        </>
      )}
    </div>
  );
}
