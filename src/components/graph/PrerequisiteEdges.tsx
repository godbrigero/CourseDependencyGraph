import { memo } from "react";
import { getEdgePath } from "./graphGeometry";
import styles from "./CourseDependencyCanvas.module.css";
import type { CourseGraphEdge, CourseGraphNode } from "./types";

type PrerequisiteEdgesProps = {
  edges: CourseGraphEdge[];
  nodes: CourseGraphNode[];
};

function PrerequisiteEdgesComponent({ edges, nodes }: PrerequisiteEdgesProps) {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));

  return (
    <svg
      className={styles.edges}
      aria-hidden="true"
      focusable="false"
      width="1"
      height="1"
    >
      <defs>
        <marker
          id="course-graph-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
        >
          <path className={styles.arrowHead} d="M 0 0 L 10 5 L 0 10 z" />
        </marker>
        <marker
          id="course-graph-arrow-incoming"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="9"
          markerHeight="9"
          orient="auto-start-reverse"
        >
          <path className={styles.arrowHeadIncoming} d="M 0 0 L 10 5 L 0 10 z" />
        </marker>
        <marker
          id="course-graph-arrow-outgoing"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="9"
          markerHeight="9"
          orient="auto-start-reverse"
        >
          <path className={styles.arrowHeadOutgoing} d="M 0 0 L 10 5 L 0 10 z" />
        </marker>
        <marker
          id="course-graph-arrow-both"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="9"
          markerHeight="9"
          orient="auto-start-reverse"
        >
          <path className={styles.arrowHeadBoth} d="M 0 0 L 10 5 L 0 10 z" />
        </marker>
      </defs>

      {edges.map((edge, index) => {
        const fromNode = nodesById.get(edge.from);
        const toNode = nodesById.get(edge.to);

        if (!fromNode || !toNode) {
          return null;
        }

        const id = edge.id ?? `${edge.from}-${edge.to}-${index}`;

        return (
          <g className={styles.edge} key={id}>
            <path
              className={edgeClassName(edge.highlight)}
              d={getEdgePath(fromNode, toNode)}
              markerEnd={`url(#${markerIdForHighlight(edge.highlight)})`}
            />
            {edge.label ? (
              <title>{`${edge.label}: ${fromNode.code} to ${toNode.code}`}</title>
            ) : (
              <title>{`${fromNode.code} prerequisite for ${toNode.code}`}</title>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export const PrerequisiteEdges = memo(PrerequisiteEdgesComponent);

function edgeClassName(highlight: CourseGraphEdge["highlight"]) {
  return [
    styles.edgePath,
    highlight ? styles.edgePathHighlighted : "",
    highlight === "incoming" ? styles.edgePathIncoming : "",
    highlight === "outgoing" ? styles.edgePathOutgoing : "",
    highlight === "both" ? styles.edgePathBoth : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function markerIdForHighlight(highlight: CourseGraphEdge["highlight"]) {
  switch (highlight) {
    case "incoming":
      return "course-graph-arrow-incoming";
    case "outgoing":
      return "course-graph-arrow-outgoing";
    case "both":
      return "course-graph-arrow-both";
    default:
      return "course-graph-arrow";
  }
}
