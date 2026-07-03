import type { MouseEvent, ReactNode } from "react";

export type GraphPoint = {
  x: number;
  y: number;
};

export type GraphViewport = GraphPoint & {
  scale: number;
};

export type CourseGraphNode = GraphPoint & {
  id: string;
  code: string;
  title: string;
  description?: string;
  credits?: number;
  width?: number;
  height?: number;
  color?: string;
  fillColor?: string;
};

export type CourseGraphBox = GraphPoint & {
  id: string;
  title?: string;
  width: number;
  height: number;
  color?: string;
  fillColor?: string;
};

export type CourseGraphEdge = {
  id?: string;
  from: string;
  to: string;
  label?: string;
  highlight?: "incoming" | "outgoing" | "both";
};

export type GraphContextMenuState = {
  isOpen: boolean;
  screenPoint: GraphPoint;
  graphPoint: GraphPoint;
  nodeId?: string;
};

export type CourseNodeRenderer = (node: CourseGraphNode) => ReactNode;

export type GraphContextMenuRenderer = (
  state: GraphContextMenuState,
  actions: { close: () => void },
) => ReactNode;

export type CourseNodeMoveHandler = (
  nodeId: string,
  position: GraphPoint,
  node: CourseGraphNode,
) => void;

export type CourseNodeClickHandler = (
  node: CourseGraphNode,
  event: MouseEvent<HTMLElement>,
) => void;

export const DEFAULT_NODE_WIDTH = 176;
export const DEFAULT_NODE_HEIGHT = 84;
