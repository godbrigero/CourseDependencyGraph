"use client";

import { memo, type MouseEvent } from "react";
import { useDraggableNode } from "../../hooks/useDraggableNode";
import { getNodeSize } from "./graphGeometry";
import styles from "./CourseDependencyCanvas.module.css";
import type {
  CourseGraphNode,
  CourseNodeClickHandler,
  CourseNodeMoveHandler,
  CourseNodeRenderer,
  GraphViewport,
} from "./types";

type CourseNodeProps = {
  node: CourseGraphNode;
  viewport: GraphViewport;
  readOnly?: boolean;
  isSelected?: boolean;
  isPathHighlighted?: boolean;
  renderNode?: CourseNodeRenderer;
  onMove?: CourseNodeMoveHandler;
  onMoveEnd?: CourseNodeMoveHandler;
  onClick?: CourseNodeClickHandler;
  onContextMenu?: (event: MouseEvent<HTMLElement>, node: CourseGraphNode) => void;
};

function CourseNodeComponent({
  node,
  viewport,
  readOnly = false,
  isSelected = false,
  isPathHighlighted = false,
  renderNode,
  onMove,
  onMoveEnd,
  onClick,
  onContextMenu,
}: CourseNodeProps) {
  const size = getNodeSize(node);
  const drag = useDraggableNode({
    node,
    viewport,
    disabled: readOnly,
    onMove,
    onMoveEnd,
  });
  const renderedPosition = drag.dragPosition ?? node;

  return (
    <article
      className={[
        styles.node,
        drag.isDragging ? styles.dragging : "",
        isPathHighlighted ? styles.pathHighlighted : "",
        isSelected ? styles.selected : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        left: renderedPosition.x,
        top: renderedPosition.y,
        width: size.width,
        minHeight: size.height,
        borderTopColor: node.color,
        backgroundColor: node.fillColor,
      }}
      data-node-id={node.id}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.(node, event);
      }}
      onContextMenu={(event) => onContextMenu?.(event, node)}
      onPointerDown={drag.beginDrag}
      onPointerMove={drag.updateDrag}
      onPointerUp={drag.endDrag}
      onPointerCancel={drag.endDrag}
    >
      {renderNode ? (
        renderNode(node)
      ) : (
        <>
          <div className={styles.nodeCode}>{node.code}</div>
          <div className={styles.nodeTitle}>{node.title}</div>
          {typeof node.credits === "number" ? (
            <div className={styles.nodeMeta}>{node.credits} credits</div>
          ) : null}
        </>
      )}
    </article>
  );
}

export const CourseNode = memo(CourseNodeComponent);
