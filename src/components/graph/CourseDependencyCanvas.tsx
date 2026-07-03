"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { useContextMenu } from "../../hooks/useContextMenu";
import { useGraphViewport } from "../../hooks/useGraphViewport";
import { CourseNode } from "./CourseNode";
import { GraphContextMenu } from "./GraphContextMenu";
import { PrerequisiteEdges } from "./PrerequisiteEdges";
import styles from "./CourseDependencyCanvas.module.css";
import type {
  CourseGraphBox,
  CourseGraphEdge,
  CourseGraphNode,
  CourseNodeClickHandler,
  CourseNodeMoveHandler,
  CourseNodeRenderer,
  GraphContextMenuRenderer,
  GraphPoint,
  GraphViewport,
} from "./types";

type BoxResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const BOX_RESIZE_HANDLES: BoxResizeHandle[] = [
  "n",
  "s",
  "e",
  "w",
  "ne",
  "nw",
  "se",
  "sw",
];
const MIN_BOX_WIDTH = 160;
const MIN_BOX_HEIGHT = 110;

type CourseDependencyCanvasProps = {
  nodes: CourseGraphNode[];
  edges: CourseGraphEdge[];
  boxes?: CourseGraphBox[];
  className?: string;
  readOnly?: boolean;
  selectedNodeId?: string;
  selectedNodeIds?: string[];
  highlightedNodeIds?: string[];
  selectedBoxId?: string | null;
  initialViewport?: GraphViewport;
  renderBackdrop?: ReactNode;
  renderNode?: CourseNodeRenderer;
  renderContextMenu?: GraphContextMenuRenderer;
  onNodesChange?: (nodes: CourseGraphNode[]) => void;
  onNodeMove?: CourseNodeMoveHandler;
  onNodeMoveEnd?: CourseNodeMoveHandler;
  onNodeClick?: CourseNodeClickHandler;
  onSelectionChange?: (nodeIds: string[]) => void;
  onBoxCreate?: (start: GraphPoint, end: GraphPoint) => void;
  onBoxSelect?: (boxId: string | null) => void;
  onBoxChange?: (boxId: string, box: CourseGraphBox) => void;
  onContextMenuOpen?: (state: {
    nodeId?: string;
    screenPoint: GraphPoint;
    graphPoint: GraphPoint;
  }) => void;
  onViewportChange?: (viewport: GraphViewport) => void;
};

export function CourseDependencyCanvas({
  nodes,
  edges,
  boxes = [],
  className,
  readOnly = false,
  selectedNodeId,
  selectedNodeIds,
  highlightedNodeIds,
  selectedBoxId,
  initialViewport,
  renderBackdrop,
  renderNode,
  renderContextMenu,
  onNodesChange,
  onNodeMove,
  onNodeMoveEnd,
  onNodeClick,
  onSelectionChange,
  onBoxCreate,
  onBoxSelect,
  onBoxChange,
  onContextMenuOpen,
  onViewportChange,
}: CourseDependencyCanvasProps) {
  const [localNodes, setLocalNodes] = useState(nodes);
  const skipNextCanvasClickRef = useRef(false);
  const [draftPositions, setDraftPositions] = useState<
    Record<string, GraphPoint>
  >({});
  const graphNodes = onNodesChange ? nodes : localNodes;
  const viewport = useGraphViewport({ initialViewport, onViewportChange });
  const contextMenu = useContextMenu(viewport.viewport);
  const [selectionDraft, setSelectionDraft] = useState<{
    pointerId: number;
    origin: GraphPoint;
    current: GraphPoint;
  } | null>(null);
  const [boxDraft, setBoxDraft] = useState<{
    pointerId: number;
    origin: GraphPoint;
    current: GraphPoint;
  } | null>(null);
  const [resizeDraft, setResizeDraft] = useState<{
    pointerId: number;
    handle: BoxResizeHandle;
    startPointer: GraphPoint;
    startBox: CourseGraphBox;
    currentBox: CourseGraphBox;
  } | null>(null);
  const selectedSet = useMemo(
    () => new Set(selectedNodeIds ?? (selectedNodeId ? [selectedNodeId] : [])),
    [selectedNodeId, selectedNodeIds],
  );
  const highlightedNodeSet = useMemo(
    () => new Set(highlightedNodeIds ?? []),
    [highlightedNodeIds],
  );
  const renderedNodes = useMemo(
    () =>
      graphNodes.map((node) =>
        draftPositions[node.id] ? { ...node, ...draftPositions[node.id] } : node,
      ),
    [draftPositions, graphNodes],
  );
  const renderedBoxes = useMemo(
    () =>
      boxes.map((box) =>
        resizeDraft?.startBox.id === box.id ? resizeDraft.currentBox : box,
      ),
    [boxes, resizeDraft],
  );

  const beginBoxResize = useCallback(
    (
      event: PointerEvent<HTMLElement>,
      box: CourseGraphBox,
      handle: BoxResizeHandle,
    ) => {
      if (readOnly || event.button !== 0 || !onBoxChange) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      onBoxSelect?.(box.id);
      setResizeDraft({
        pointerId: event.pointerId,
        handle,
        startPointer: { x: event.clientX, y: event.clientY },
        startBox: box,
        currentBox: box,
      });
    },
    [onBoxChange, onBoxSelect, readOnly],
  );

  const updateNodePosition = useCallback(
    (
      nodeId: string,
      position: GraphPoint,
      callback?: CourseNodeMoveHandler,
    ) => {
      const currentNode = graphNodes.find((node) => node.id === nodeId);
      if (!currentNode) {
        return;
      }

      const nextNode = { ...currentNode, ...position };
      const nextNodes = graphNodes.map((node) =>
        node.id === nodeId ? nextNode : node,
      );

      setLocalNodes(nextNodes);
      onNodesChange?.(nextNodes);
      callback?.(nodeId, position, nextNode);
    },
    [graphNodes, onNodesChange],
  );

  const handleNodeMove: CourseNodeMoveHandler = useCallback(
    (nodeId, position) => {
      const currentNode = graphNodes.find((node) => node.id === nodeId);
      if (!currentNode) {
        return;
      }

      setDraftPositions((current) => ({
        ...current,
        [nodeId]: position,
      }));
      onNodeMove?.(nodeId, position, { ...currentNode, ...position });
    },
    [graphNodes, onNodeMove],
  );

  const handleNodeMoveEnd: CourseNodeMoveHandler = useCallback(
    (nodeId, position) => {
      setDraftPositions((current) => {
        if (!current[nodeId]) {
          return current;
        }
        const next = { ...current };
        delete next[nodeId];
        return next;
      });
      updateNodePosition(nodeId, position, onNodeMoveEnd);
    },
    [onNodeMoveEnd, updateNodePosition],
  );

  const openCanvasContextMenu = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      contextMenu.openFromMouseEvent(event);
      const screenPoint = { x: event.clientX, y: event.clientY };
      onContextMenuOpen?.({
        screenPoint,
        graphPoint: viewport.toGraphPoint(screenPoint),
      });
    },
    [contextMenu, onContextMenuOpen, viewport],
  );

  const selectNodesInRect = useCallback(
    (start: GraphPoint, end: GraphPoint) => {
      const bounds = {
        minX: Math.min(start.x, end.x),
        maxX: Math.max(start.x, end.x),
        minY: Math.min(start.y, end.y),
        maxY: Math.max(start.y, end.y),
      };
      const selected = renderedNodes
        .filter((node) => {
          const nodeWidth = node.width ?? 176;
          const nodeHeight = node.height ?? 84;
          return (
            node.x < bounds.maxX &&
            node.x + nodeWidth > bounds.minX &&
            node.y < bounds.maxY &&
            node.y + nodeHeight > bounds.minY
          );
        })
        .map((node) => node.id);

      onSelectionChange?.(selected);
    },
    [onSelectionChange, renderedNodes],
  );

  const openNodeContextMenu = useCallback(
    (event: MouseEvent<HTMLElement>, node: CourseGraphNode) => {
      contextMenu.openFromMouseEvent(event, node.id);
      const screenPoint = { x: event.clientX, y: event.clientY };
      onContextMenuOpen?.({
        nodeId: node.id,
        screenPoint,
        graphPoint: viewport.toGraphPoint(screenPoint),
      });
    },
    [contextMenu, onContextMenuOpen, viewport],
  );

  const canvasClassName = useMemo(
    () =>
      [
        styles.canvas,
        viewport.isPanning ? styles.panning : "",
        readOnly ? styles.readOnly : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" "),
    [className, readOnly, viewport.isPanning],
  );
  const canvasStyle = useMemo(
    () =>
      ({
        "--grid-size": `${32 * viewport.viewport.scale}px`,
        "--grid-x": `${viewport.viewport.x}px`,
        "--grid-y": `${viewport.viewport.y}px`,
      }) as CSSProperties,
    [viewport.viewport.scale, viewport.viewport.x, viewport.viewport.y],
  );

  return (
    <section
      className={canvasClassName}
      style={canvasStyle}
      aria-label="Course dependency graph"
      onPointerDown={(event) => {
        if (contextMenu.menuState.isOpen && event.button === 0) {
          event.preventDefault();
          skipNextCanvasClickRef.current = true;
          contextMenu.closeMenu();
          return;
        }
        contextMenu.closeMenu();
        if (event.button === 0 && event.detail >= 2 && onBoxCreate) {
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          const origin = viewport.toGraphPoint({
            x: event.clientX,
            y: event.clientY,
          });
          setBoxDraft({
            pointerId: event.pointerId,
            origin,
            current: origin,
          });
          return;
        }
        if (event.button === 0 && event.shiftKey && onSelectionChange) {
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          const origin = viewport.toGraphPoint({
            x: event.clientX,
            y: event.clientY,
          });
          setSelectionDraft({
            pointerId: event.pointerId,
            origin,
            current: origin,
          });
          return;
        }
        viewport.beginPan(event);
      }}
      onPointerMove={(event) => {
        if (resizeDraft?.pointerId === event.pointerId) {
          event.preventDefault();
          const delta = {
            x: (event.clientX - resizeDraft.startPointer.x) / viewport.viewport.scale,
            y: (event.clientY - resizeDraft.startPointer.y) / viewport.viewport.scale,
          };
          setResizeDraft((current) =>
            current
              ? {
                  ...current,
                  currentBox: resizeBox(
                    current.startBox,
                    current.handle,
                    delta,
                  ),
                }
              : current,
          );
          return;
        }
        if (boxDraft?.pointerId === event.pointerId) {
          setBoxDraft((current) =>
            current
              ? {
                  ...current,
                  current: viewport.toGraphPoint({
                    x: event.clientX,
                    y: event.clientY,
                  }),
                }
              : current,
          );
          return;
        }
        if (selectionDraft?.pointerId === event.pointerId) {
          setSelectionDraft((current) =>
            current
              ? {
                  ...current,
                  current: viewport.toGraphPoint({
                    x: event.clientX,
                    y: event.clientY,
                  }),
                }
              : current,
          );
          return;
        }
        viewport.updatePan(event);
      }}
      onPointerUp={(event) => {
        if (resizeDraft?.pointerId === event.pointerId) {
          onBoxChange?.(resizeDraft.startBox.id, resizeDraft.currentBox);
          setResizeDraft(null);
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          return;
        }
        if (boxDraft?.pointerId === event.pointerId) {
          const current = viewport.toGraphPoint({
            x: event.clientX,
            y: event.clientY,
          });
          onBoxCreate?.(boxDraft.origin, current);
          setBoxDraft(null);
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          return;
        }
        if (selectionDraft?.pointerId === event.pointerId) {
          const current = viewport.toGraphPoint({
            x: event.clientX,
            y: event.clientY,
          });
          selectNodesInRect(selectionDraft.origin, current);
          setSelectionDraft(null);
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          return;
        }
        viewport.endPan(event);
      }}
      onPointerCancel={(event) => {
        if (resizeDraft?.pointerId === event.pointerId) {
          setResizeDraft(null);
          return;
        }
        if (boxDraft?.pointerId === event.pointerId) {
          setBoxDraft(null);
          return;
        }
        if (selectionDraft?.pointerId === event.pointerId) {
          setSelectionDraft(null);
          return;
        }
        viewport.endPan(event);
      }}
      onWheel={viewport.handleWheel}
      onContextMenu={openCanvasContextMenu}
      onClick={(event) => {
        if (skipNextCanvasClickRef.current) {
          skipNextCanvasClickRef.current = false;
          return;
        }
        if (event.target === event.currentTarget) {
          onSelectionChange?.([]);
          onBoxSelect?.(null);
        }
      }}
    >
      <div
        className={styles.viewport}
        style={{
          transform: `translate(${viewport.viewport.x}px, ${viewport.viewport.y}px) scale(${viewport.viewport.scale})`,
        }}
      >
        {renderBackdrop}
        {renderedBoxes.map((box) => (
          <div
            key={box.id}
            className={[
              styles.box,
              selectedBoxId === box.id ? styles.selectedBox : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{
              left: box.x,
              top: box.y,
              width: box.width,
              height: box.height,
              borderColor: box.color,
              backgroundColor: box.fillColor,
            }}
            onClick={(event) => {
              event.stopPropagation();
              onBoxSelect?.(box.id);
              onSelectionChange?.([]);
            }}
            onPointerDown={(event) => {
              event.stopPropagation();
              onBoxSelect?.(box.id);
              onSelectionChange?.([]);
            }}
          >
            {box.title ? (
              <span className={styles.boxTitle}>{box.title}</span>
            ) : null}
            {selectedBoxId === box.id && !readOnly ? (
              <>
                {BOX_RESIZE_HANDLES.map((handle) => (
                  <span
                    key={handle}
                    className={[
                      styles.boxResizeHandle,
                      boxResizeHandleClass(handle),
                    ].join(" ")}
                    aria-hidden="true"
                    onPointerDown={(event) => beginBoxResize(event, box, handle)}
                  />
                ))}
              </>
            ) : null}
          </div>
        ))}
        <PrerequisiteEdges edges={edges} nodes={renderedNodes} />
        {renderedNodes.map((node) => (
          <CourseNode
            key={node.id}
            node={node}
            viewport={viewport.viewport}
            readOnly={readOnly}
            isSelected={selectedSet.has(node.id)}
            isPathHighlighted={
              highlightedNodeSet.has(node.id) && !selectedSet.has(node.id)
            }
            renderNode={renderNode}
            onMove={handleNodeMove}
            onMoveEnd={handleNodeMoveEnd}
            onClick={onNodeClick}
            onContextMenu={openNodeContextMenu}
          />
        ))}
      </div>

      {selectionDraft ? (
        <div
          className={styles.selectionBox}
          aria-hidden="true"
          style={{
            left:
              Math.min(selectionDraft.origin.x, selectionDraft.current.x) *
                viewport.viewport.scale +
              viewport.viewport.x,
            top:
              Math.min(selectionDraft.origin.y, selectionDraft.current.y) *
                viewport.viewport.scale +
              viewport.viewport.y,
            width:
              Math.abs(selectionDraft.current.x - selectionDraft.origin.x) *
              viewport.viewport.scale,
            height:
              Math.abs(selectionDraft.current.y - selectionDraft.origin.y) *
              viewport.viewport.scale,
          }}
        />
      ) : null}

      {boxDraft ? (
        <div
          className={styles.draftBox}
          aria-hidden="true"
          style={{
            left:
              Math.min(boxDraft.origin.x, boxDraft.current.x) *
                viewport.viewport.scale +
              viewport.viewport.x,
            top:
              Math.min(boxDraft.origin.y, boxDraft.current.y) *
                viewport.viewport.scale +
              viewport.viewport.y,
            width:
              Math.abs(boxDraft.current.x - boxDraft.origin.x) *
              viewport.viewport.scale,
            height:
              Math.abs(boxDraft.current.y - boxDraft.origin.y) *
              viewport.viewport.scale,
          }}
        />
      ) : null}

      <GraphContextMenu
        state={contextMenu.menuState}
        renderContextMenu={renderContextMenu}
        scale={viewport.viewport.scale}
        onClose={contextMenu.closeMenu}
      />
    </section>
  );
}

function resizeBox(
  box: CourseGraphBox,
  handle: BoxResizeHandle,
  delta: GraphPoint,
) {
  const next = { ...box };

  if (handle.includes("e")) {
    next.width = box.width + delta.x;
  }
  if (handle.includes("s")) {
    next.height = box.height + delta.y;
  }
  if (handle.includes("w")) {
    next.x = box.x + delta.x;
    next.width = box.width - delta.x;
  }
  if (handle.includes("n")) {
    next.y = box.y + delta.y;
    next.height = box.height - delta.y;
  }

  if (next.width < MIN_BOX_WIDTH) {
    if (handle.includes("w")) {
      next.x = box.x + box.width - MIN_BOX_WIDTH;
    }
    next.width = MIN_BOX_WIDTH;
  }

  if (next.height < MIN_BOX_HEIGHT) {
    if (handle.includes("n")) {
      next.y = box.y + box.height - MIN_BOX_HEIGHT;
    }
    next.height = MIN_BOX_HEIGHT;
  }

  return {
    ...next,
    x: Math.round(next.x),
    y: Math.round(next.y),
    width: Math.round(next.width),
    height: Math.round(next.height),
  };
}

function boxResizeHandleClass(handle: BoxResizeHandle) {
  switch (handle) {
    case "n":
      return styles.resizeN;
    case "s":
      return styles.resizeS;
    case "e":
      return styles.resizeE;
    case "w":
      return styles.resizeW;
    case "ne":
      return styles.resizeNe;
    case "nw":
      return styles.resizeNw;
    case "se":
      return styles.resizeSe;
    case "sw":
      return styles.resizeSw;
  }
}
