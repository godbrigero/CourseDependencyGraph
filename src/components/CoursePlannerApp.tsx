"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import {
  CourseDependencyCanvas,
  DEFAULT_NODE_HEIGHT,
  DEFAULT_NODE_WIDTH,
  type CourseGraphBox,
  type CourseGraphEdge,
  type CourseGraphNode,
  type GraphContextMenuState,
  type GraphPoint,
} from "@/components/graph";
import {
  catalogCourses,
  programTabs,
  type CatalogCourse,
  type ProgramKey,
} from "@/data/catalogCourses";
import {
  collectCourseIds,
  parsePrerequisiteText,
} from "@/lib/coursePrereqs";
import type { CourseRequirement } from "@/lib/courseTypes";

type PlannerNode = CourseGraphNode & {
  courseId: string;
  department: string;
  averageGpa: number | null;
  difficulty: number | null;
  rawPrerequisites: string | null;
  rawCorequisites: string | null;
  tags?: string[];
};

type PlannerPage = {
  id: string;
  name: string;
  nodes: PlannerNode[];
  boxes: PlannerBox[];
  selectedNodeIds: string[];
};

type PlannerSnapshot = {
  pages: PlannerPage[];
  activePageId: string;
  tagHistory: string[];
};

type ColorMethod = "department" | "difficulty" | "gpa" | "missing";
type CourseFilterKey = "all" | ProgramKey;

type PlannerBox = CourseGraphBox;

const COURSE_FILTER_ORDER: CourseFilterKey[] = [
  "all",
  "computerScience",
  "ras",
  "physics",
  "math",
];

const courseFilterTabs: Record<CourseFilterKey, { label: string }> = {
  all: { label: "All" },
  ...programTabs,
};

const NODE_COLORS = [
  "#2563eb",
  "#dc2626",
  "#059669",
  "#7c3aed",
  "#d97706",
  "#0891b2",
  "#be123c",
  "#374151",
];

const PLANNER_STORAGE_KEY = "umd-course-graph-state-v1";
const TAG_HISTORY_LIMIT = 24;
const DEFAULT_BOX_WIDTH = 680;
const DEFAULT_BOX_HEIGHT = 420;
const MAX_PATH_DEPTH = 8;

const DEPARTMENT_COLORS: Record<string, string> = {
  CMSC: "#2563eb",
  MATH: "#059669",
  PHYS: "#7c3aed",
  ENAE: "#d97706",
  ENEE: "#0891b2",
  ENES: "#be123c",
  ENME: "#dc2626",
};

const courseById = new Map(catalogCourses.map((course) => [course.id, course]));

export function CoursePlannerApp() {
  const [activeCourseFilter, setActiveCourseFilter] =
    useState<CourseFilterKey>("all");
  const [search, setSearch] = useState("");
  const [pages, setPages] = useState<PlannerPage[]>(() => [createPage(1)]);
  const [activePageId, setActivePageId] = useState(() => pages[0].id);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [pathDepth, setPathDepth] = useState(1);
  const [onlyUnlockedPathNodes, setOnlyUnlockedPathNodes] = useState(false);
  const [tagHistory, setTagHistory] = useState<string[]>([]);
  const hasHydratedStorage = useRef(false);
  const pagesRef = useRef(pages);
  const activePageIdRef = useRef(activePageId);
  const tagHistoryRef = useRef(tagHistory);
  const selectedNodeIdsRef = useRef<string[]>([]);
  const selectedBoxIdRef = useRef<string | null>(null);
  const undoStackRef = useRef<PlannerSnapshot[]>([]);
  const activePage = pages.find((page) => page.id === activePageId) ?? pages[0];
  const nodes = activePage.nodes;
  const boxes = useMemo(() => activePage.boxes ?? [], [activePage.boxes]);
  const selectedNodeIds = activePage.selectedNodeIds;
  const pathOriginNodeIds = selectedNodeIds;

  useEffect(() => {
    pagesRef.current = pages;
    activePageIdRef.current = activePageId;
    tagHistoryRef.current = tagHistory;
    selectedNodeIdsRef.current = selectedNodeIds;
    selectedBoxIdRef.current = selectedBoxId;
  }, [activePageId, pages, selectedBoxId, selectedNodeIds, tagHistory]);

  useEffect(() => {
    const saved = window.localStorage.getItem(PLANNER_STORAGE_KEY);
    if (!saved) {
      hasHydratedStorage.current = true;
      return;
    }

    try {
      const parsed = JSON.parse(saved) as {
        pages?: PlannerPage[];
        activePageId?: string;
        nodes?: PlannerNode[];
        selectedNodeIds?: string[];
        tagHistory?: string[];
      };
      queueMicrotask(() => {
        if (Array.isArray(parsed.pages) && parsed.pages.length > 0) {
          setPages(parsed.pages.map(normalizePage));
          setActivePageId(parsed.activePageId ?? parsed.pages[0].id);
        } else if (Array.isArray(parsed.nodes)) {
          const migratedPage = {
            ...createPage(1),
            nodes: parsed.nodes,
            boxes: [],
            selectedNodeIds: parsed.selectedNodeIds ?? [],
          };
          setPages([migratedPage]);
          setActivePageId(migratedPage.id);
        }
        if (Array.isArray(parsed.tagHistory)) {
          setTagHistory(parsed.tagHistory);
        }
        hasHydratedStorage.current = true;
      });
    } catch {
      window.localStorage.removeItem(PLANNER_STORAGE_KEY);
      hasHydratedStorage.current = true;
    }
  }, []);

  useEffect(() => {
    if (!hasHydratedStorage.current) return;
    window.localStorage.setItem(
      PLANNER_STORAGE_KEY,
      JSON.stringify({ pages, activePageId, tagHistory }),
    );
  }, [activePageId, pages, tagHistory]);

  useEffect(() => {
    function handleDeleteKey(event: KeyboardEvent) {
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      const selectedNodes = selectedNodeIdsRef.current;
      const selectedBox = selectedBoxIdRef.current;
      if (selectedNodes.length === 0 && !selectedBox) return;
      if (isEditableTarget(event.target)) return;

      event.preventDefault();
      const current: PlannerSnapshot = {
        pages: pagesRef.current,
        activePageId: activePageIdRef.current,
        tagHistory: tagHistoryRef.current,
      };
      const nextPages = current.pages.map((page) => {
        if (page.id !== current.activePageId) return page;
        if (selectedNodes.length > 0) {
          return {
            ...page,
            nodes: page.nodes.filter((node) => !selectedNodes.includes(node.id)),
            selectedNodeIds: [],
          };
        }
        return {
          ...page,
          boxes: page.boxes.filter((box) => box.id !== selectedBox),
        };
      });

      undoStackRef.current = [...undoStackRef.current.slice(-49), current];
      setPages(nextPages);
      pagesRef.current = nextPages;
      setSelectedBoxId(null);
      selectedBoxIdRef.current = null;
    }

    window.addEventListener("keydown", handleDeleteKey);
    return () => window.removeEventListener("keydown", handleDeleteKey);
  }, []);

  useEffect(() => {
    function handleUndoKey(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "z") return;
      if (!event.metaKey && !event.ctrlKey) return;
      if (event.shiftKey || isEditableTarget(event.target)) return;

      const previous = undoStackRef.current.pop();
      if (!previous) return;

      event.preventDefault();
      setPages(previous.pages);
      setActivePageId(previous.activePageId);
      setTagHistory(previous.tagHistory);
      setSelectedBoxId(null);
      pagesRef.current = previous.pages;
      activePageIdRef.current = previous.activePageId;
      tagHistoryRef.current = previous.tagHistory;
    }

    window.addEventListener("keydown", handleUndoKey);
    return () => window.removeEventListener("keydown", handleUndoKey);
  }, []);

  const visibleCourses = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return catalogCourses
      .filter(
        (course) =>
          activeCourseFilter === "all" ||
          course.programs.includes(activeCourseFilter),
      )
      .map((course) => ({
        course,
        rank: normalizedSearch ? searchRank(course, normalizedSearch) : 0,
      }))
      .filter(({ rank }) => rank < Number.POSITIVE_INFINITY)
      .sort((a, b) => a.rank - b.rank || a.course.id.localeCompare(b.course.id))
      .map(({ course }) => course);
  }, [activeCourseFilter, search]);

  const nodeEnvironmentById = useMemo(
    () =>
      new Map(
        nodes.map((node) => [node.id, getNodeEnvironment(node, boxes)]),
      ),
    [boxes, nodes],
  );

  const baseGraphEdges = useMemo<CourseGraphEdge[]>(() => {
    return nodes.flatMap((node) => {
      const requirement = combinedRequirement(node);
      const nodeEnvironment = nodeEnvironmentById.get(node.id);
      return collectCourseIds(requirement)
        .filter((courseId) => {
          const prereqNode = nodes.find((item) => item.courseId === String(courseId));
          return (
            prereqNode &&
            nodeEnvironmentById.get(prereqNode.id) === nodeEnvironment
          );
        })
        .map((courseId) => ({
          id: `${courseId}-${node.courseId}`,
          from: String(courseId),
          to: node.id,
          label: "prerequisite",
        }));
    });
  }, [nodeEnvironmentById, nodes]);

  const graphEdges = useMemo(
    () => applyPathHighlights(baseGraphEdges, pathOriginNodeIds, pathDepth),
    [baseGraphEdges, pathDepth, pathOriginNodeIds],
  );
  const highlightedNodeIds = useMemo(
    () =>
      collectPathNodeIds(
        baseGraphEdges,
        pathOriginNodeIds,
        pathDepth,
        onlyUnlockedPathNodes,
      ),
    [baseGraphEdges, onlyUnlockedPathNodes, pathDepth, pathOriginNodeIds],
  );

  const missingByNode = useMemo(() => {
    return new Map(
      nodes.map((node) => {
        const nodeEnvironment = nodeEnvironmentById.get(node.id);
        const scopedActiveIds = new Set(
          nodes
            .filter(
              (item) => nodeEnvironmentById.get(item.id) === nodeEnvironment,
            )
            .map((item) => item.courseId),
        );
        return [
          node.id,
          collectMissingPrereqs(combinedRequirement(node), scopedActiveIds),
        ];
      }),
    );
  }, [nodeEnvironmentById, nodes]);

  function addCourse(course: CatalogCourse, point: GraphPoint) {
    setActivePageNodes((current) => {
      if (current.some((node) => node.courseId === course.id)) {
        return current;
      }

      return [
        ...current,
        {
          id: course.id,
          courseId: course.id,
          code: course.id,
          title: course.title,
          description: course.description,
          credits:
            typeof course.credits === "number" ? course.credits : undefined,
          department: course.department,
          averageGpa: course.averageGpa,
          difficulty: course.difficulty,
          rawPrerequisites: course.rawPrerequisites,
          rawCorequisites: course.rawCorequisites,
          tags: [],
          x: Math.round(point.x),
          y: Math.round(point.y),
          width: 244,
          height: 138,
          color: DEPARTMENT_COLORS[course.departmentCode] ?? NODE_COLORS[0],
          fillColor: tintColor(
            DEPARTMENT_COLORS[course.departmentCode] ?? NODE_COLORS[0],
          ),
        },
      ];
    });
    setActiveSelection([course.id]);
    setSelectedBoxId(null);
  }

  function createBox(point: GraphPoint) {
    createBoxFromCorners(
      { x: point.x - DEFAULT_BOX_WIDTH / 2, y: point.y - DEFAULT_BOX_HEIGHT / 2 },
      { x: point.x + DEFAULT_BOX_WIDTH / 2, y: point.y + DEFAULT_BOX_HEIGHT / 2 },
    );
  }

  function createBoxFromCorners(start: GraphPoint, end: GraphPoint) {
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);
    if (width < 80 || height < 60) return;

    setActivePageBoxes((current) => {
      const boxIndex = current.length + 1;
      const color = NODE_COLORS[(boxIndex - 1) % NODE_COLORS.length];
      const box: PlannerBox = {
        id: `box-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: `Box ${boxIndex}`,
        x: Math.round(Math.min(start.x, end.x)),
        y: Math.round(Math.min(start.y, end.y)),
        width: Math.round(width),
        height: Math.round(height),
        color,
        fillColor: tintColor(color),
      };
      setSelectedBoxId(box.id);
      return [...current, box];
    });
    setActiveSelection([]);
  }

  function updateBox(boxId: string, box: PlannerBox) {
    setActivePageBoxes((current) =>
      current.map((item) => (item.id === boxId ? box : item)),
    );
    setSelectedBoxId(boxId);
  }

  function updateNodeColor(nodeIds: string[], color: string) {
    setActivePageNodes((current) =>
      current.map((node) =>
        nodeIds.includes(node.id)
          ? { ...node, color, fillColor: tintColor(color) }
          : node,
      ),
    );
  }

  function applyColorMethod(nodeIds: string[], method: ColorMethod) {
    setActivePageNodes((current) =>
      current.map((node) => {
        if (!nodeIds.includes(node.id)) return node;
        const nextColor = colorForMethod(node, method, missingByNode.get(node.id) ?? []);
        return { ...node, color: nextColor, fillColor: tintColor(nextColor) };
      }),
    );
  }

  function addTagToNodes(nodeIds: string[], rawTag: string) {
    const tag = normalizeTag(rawTag);
    if (!tag) return;

    commitPlannerState((current) => ({
      ...current,
      pages: current.pages.map((page) =>
        page.id === current.activePageId
          ? {
              ...page,
              nodes: page.nodes.map((node) =>
                nodeIds.includes(node.id)
                  ? { ...node, tags: unique([...(node.tags ?? []), tag]) }
                  : node,
              ),
            }
          : page,
      ),
      tagHistory: unique([
        tag,
        ...current.tagHistory.filter((item) => item !== tag),
      ]).slice(0, TAG_HISTORY_LIMIT),
    }));
  }

  function commitPlannerState(
    updater: (current: PlannerSnapshot) => PlannerSnapshot,
    options: { recordHistory?: boolean } = {},
  ) {
    const current: PlannerSnapshot = {
      pages: pagesRef.current,
      activePageId: activePageIdRef.current,
      tagHistory: tagHistoryRef.current,
    };
    const next = updater(current);
    if (
      next.pages === current.pages &&
      next.activePageId === current.activePageId &&
      next.tagHistory === current.tagHistory
    ) {
      return;
    }

    if (options.recordHistory !== false) {
      undoStackRef.current = [...undoStackRef.current.slice(-49), current];
    }

    setPages(next.pages);
    setActivePageId(next.activePageId);
    setTagHistory(next.tagHistory);
    pagesRef.current = next.pages;
    activePageIdRef.current = next.activePageId;
    tagHistoryRef.current = next.tagHistory;
  }

  function removeTagFromNodes(nodeIds: string[], tag: string) {
    setActivePageNodes((current) =>
      current.map((node) =>
        nodeIds.includes(node.id)
          ? {
              ...node,
              tags: (node.tags ?? []).filter((item) => item !== tag),
            }
          : node,
      ),
    );
  }

  function removeNodes(nodeIds: string[]) {
    setActivePageNodes((current) =>
      current.filter((node) => !nodeIds.includes(node.id)),
    );
    setActiveSelection((current) =>
      current.filter((nodeId) => !nodeIds.includes(nodeId)),
    );
  }

  function setActivePageNodes(
    next: PlannerNode[] | ((current: PlannerNode[]) => PlannerNode[]),
  ) {
    commitPlannerState((current) => {
      let changed = false;
      const pages = current.pages.map((page) => {
        if (page.id !== current.activePageId) return page;
        const nextNodes =
          typeof next === "function" ? next(page.nodes) : next;
        if (nextNodes === page.nodes) return page;
        changed = true;
        return { ...page, nodes: nextNodes };
      });
      return changed ? { ...current, pages } : current;
    });
  }

  function setActivePageBoxes(
    next: PlannerBox[] | ((current: PlannerBox[]) => PlannerBox[]),
  ) {
    commitPlannerState((current) => {
      let changed = false;
      const pages = current.pages.map((page) => {
        if (page.id !== current.activePageId) return page;
        const currentBoxes = page.boxes ?? [];
        const nextBoxes =
          typeof next === "function" ? next(currentBoxes) : next;
        if (nextBoxes === currentBoxes) return page;
        changed = true;
        return { ...page, boxes: nextBoxes };
      });
      return changed ? { ...current, pages } : current;
    });
  }

  function setActiveSelection(
    next: string[] | ((current: string[]) => string[]),
  ) {
    commitPlannerState(
      (current) => {
        let changed = false;
        const pages = current.pages.map((page) => {
          if (page.id !== current.activePageId) return page;
          const nextSelection =
            typeof next === "function" ? next(page.selectedNodeIds) : next;
          if (arraysEqual(nextSelection, page.selectedNodeIds)) return page;
          changed = true;
          return { ...page, selectedNodeIds: nextSelection };
        });
        return changed ? { ...current, pages } : current;
      },
      { recordHistory: false },
    );
  }

  function addPage() {
    const page = createPage(pages.length + 1);
    commitPlannerState((current) => ({
      ...current,
      pages: [...current.pages, page],
      activePageId: page.id,
    }));
    setSelectedBoxId(null);
  }

  function removeActivePage() {
    if (pages.length <= 1) {
      const replacement = createPage(1);
      commitPlannerState((current) => ({
        ...current,
        pages: [replacement],
        activePageId: replacement.id,
      }));
      setSelectedBoxId(null);
      return;
    }

    const activeIndex = pages.findIndex((page) => page.id === activePageId);
    const next = pages.filter((page) => page.id !== activePageId);
    const nextActive = next[Math.max(0, activeIndex - 1)] ?? next[0];
    commitPlannerState((current) => ({
      ...current,
      pages: current.pages.filter((page) => page.id !== current.activePageId),
      activePageId: nextActive.id,
    }));
    setSelectedBoxId(null);
  }

  function handleNodeClick(
    node: CourseGraphNode,
    event: MouseEvent<HTMLElement>,
  ) {
    if (event.shiftKey || event.metaKey || event.ctrlKey) {
      setActiveSelection((current) =>
        current.includes(node.id)
          ? current.filter((nodeId) => nodeId !== node.id)
          : [...current, node.id],
      );
      setSelectedBoxId(null);
      return;
    }

    setActiveSelection([node.id]);
    setSelectedBoxId(null);
  }

  return (
    <div className="planner-shell">
      <nav
        className="top-menu"
        aria-label="Canvas pages"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="top-menu__tabs" role="tablist" aria-label="Canvas pages">
          {pages.map((page) => (
            <button
              key={page.id}
              type="button"
              role="tab"
              aria-selected={page.id === activePageId}
              className={`top-menu__tab${page.id === activePageId ? " is-active" : ""}`}
              onClick={() => {
                setActivePageId(page.id);
                setSelectedBoxId(null);
              }}
              title={`Open ${page.name}`}
            >
              <span className="top-menu__tab-name">{page.name}</span>
            </button>
          ))}
        </div>
        <div className="top-menu__path" aria-label="Path expansion controls">
          <span>Path</span>
          <button
            type="button"
            onClick={() => setPathDepth((depth) => Math.max(1, depth - 1))}
            disabled={pathDepth <= 1}
            aria-label="Decrease path depth"
          >
            -
          </button>
          <input
            aria-label="Path depth"
            type="range"
            min="1"
            max={MAX_PATH_DEPTH}
            value={pathDepth}
            onChange={(event) => setPathDepth(Number(event.target.value))}
          />
          <output aria-label="Current path depth">{pathDepth}</output>
          <button
            type="button"
            onClick={() =>
              setPathDepth((depth) => Math.min(MAX_PATH_DEPTH, depth + 1))
            }
            disabled={pathDepth >= MAX_PATH_DEPTH}
            aria-label="Increase path depth"
          >
            +
          </button>
          <label>
            <input
              type="checkbox"
              checked={onlyUnlockedPathNodes}
              onChange={(event) =>
                setOnlyUnlockedPathNodes(event.target.checked)
              }
            />
            <span>No outside in</span>
          </label>
        </div>
        <div className="top-menu__actions" aria-label="Canvas actions">
          <button type="button" onClick={addPage} title="New canvas">
            +
          </button>
          <button
            type="button"
            className="top-menu__action--danger"
            onClick={removeActivePage}
            title={`Delete ${activePage.name}`}
          >
            Delete
          </button>
        </div>
      </nav>
      <CourseDependencyCanvas
        className="planner-canvas"
        nodes={nodes}
        edges={graphEdges}
        boxes={boxes}
        selectedNodeIds={selectedNodeIds}
        highlightedNodeIds={highlightedNodeIds}
        selectedBoxId={selectedBoxId}
        onNodesChange={(nextNodes) => setActivePageNodes(nextNodes as PlannerNode[])}
        onNodeClick={handleNodeClick}
        onSelectionChange={(nodeIds) => {
          setActiveSelection(nodeIds);
          if (nodeIds.length > 0) {
            setSelectedBoxId(null);
          }
        }}
        onBoxCreate={createBoxFromCorners}
        onBoxSelect={setSelectedBoxId}
        onBoxChange={(boxId, box) => updateBox(boxId, box as PlannerBox)}
        renderNode={(node) => (
          <PlannerNodeCard
            node={node as PlannerNode}
            missingPrerequisites={missingByNode.get(node.id) ?? []}
          />
        )}
        renderContextMenu={(state, actions) => (
          <PlannerContextMenu
            courses={visibleCourses}
            activeCourseFilter={activeCourseFilter}
            nodes={nodes}
            selectedNodeIds={selectedNodeIds}
            tagHistory={tagHistory}
            search={search}
            state={state}
            onAddCourse={(course) => {
              addCourse(course, state.graphPoint);
              actions.close();
            }}
            onCreateBox={() => {
              createBox(state.graphPoint);
              actions.close();
            }}
            onChangeCourseFilter={(filter) => {
              setActiveCourseFilter(filter);
              setSearch("");
            }}
            onChangeSearch={setSearch}
            onColorChange={(color) => {
              const targets = resolveTargetNodeIds(state.nodeId, selectedNodeIds);
              updateNodeColor(targets, color);
              actions.close();
            }}
            onCustomColorChange={(color) => {
              updateNodeColor(resolveTargetNodeIds(state.nodeId, selectedNodeIds), color);
            }}
            onApplyColorMethod={(method) => {
              applyColorMethod(
                resolveTargetNodeIds(state.nodeId, selectedNodeIds),
                method,
              );
              actions.close();
            }}
            onAddTag={(tag) => {
              addTagToNodes(resolveTargetNodeIds(state.nodeId, selectedNodeIds), tag);
            }}
            onRemoveTag={(tag) => {
              removeTagFromNodes(
                resolveTargetNodeIds(state.nodeId, selectedNodeIds),
                tag,
              );
            }}
            onRemove={() => {
              removeNodes(resolveTargetNodeIds(state.nodeId, selectedNodeIds));
              actions.close();
            }}
          />
        )}
      />
    </div>
  );
}

function PlannerNodeCard({
  node,
  missingPrerequisites,
}: {
  node: PlannerNode;
  missingPrerequisites: string[];
}) {
  return (
    <>
      <div className="course-node__header">
        <span className="course-node__code">{node.code}</span>
        <span>{node.averageGpa ? `GPA ${node.averageGpa}` : "GPA N/A"}</span>
      </div>
      <div className="course-node__title">{node.title}</div>
      <div className="course-node__metrics">
        <span>{node.department}</span>
        <span>{node.difficulty ? `${node.difficulty}/10` : "No score"}</span>
      </div>
      {node.tags?.length ? (
        <div className="course-node__tags">
          {node.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      ) : null}
      {missingPrerequisites.length > 0 ? (
        <div className="missing-prereqs">
          <span>Missing</span>
          <div>
            {missingPrerequisites.map((courseId) => (
              <b key={courseId}>{courseId}</b>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

function PlannerContextMenu({
  courses,
  activeCourseFilter,
  nodes,
  selectedNodeIds,
  tagHistory,
  search,
  state,
  onAddCourse,
  onCreateBox,
  onChangeCourseFilter,
  onChangeSearch,
  onColorChange,
  onCustomColorChange,
  onApplyColorMethod,
  onAddTag,
  onRemoveTag,
  onRemove,
}: {
  courses: CatalogCourse[];
  activeCourseFilter: CourseFilterKey;
  nodes: PlannerNode[];
  selectedNodeIds: string[];
  tagHistory: string[];
  search: string;
  state: GraphContextMenuState;
  onAddCourse: (course: CatalogCourse) => void;
  onCreateBox: () => void;
  onChangeCourseFilter: (filter: CourseFilterKey) => void;
  onChangeSearch: (value: string) => void;
  onColorChange: (color: string) => void;
  onCustomColorChange: (color: string) => void;
  onApplyColorMethod: (method: ColorMethod) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onRemove: () => void;
}) {
  const [tagDraft, setTagDraft] = useState("");

  if (state.nodeId) {
    const node = nodes.find((item) => item.id === state.nodeId);
    const course = node ? courseById.get(node.courseId) : undefined;
    const targetIds = resolveTargetNodeIds(state.nodeId, selectedNodeIds);
    const targetNodes = nodes.filter((item) => targetIds.includes(item.id));
    const tags = unique(targetNodes.flatMap((item) => item.tags ?? []));
    const menuTitle =
      targetNodes.length > 1
        ? `${targetNodes.length} selected courses`
        : (node?.code ?? "Course");

    return (
      <div className="node-menu">
        <div className="node-menu__header">
          <strong>{menuTitle}</strong>
          <span>{targetNodes.length > 1 ? "Group" : course?.departmentCode}</span>
        </div>
        {course && targetNodes.length === 1 ? (
          <div className="node-menu__details">
            <h2>{course.title}</h2>
            <CourseMetrics course={course} />
            <p>{course.description}</p>
            {course.rawPrerequisites ? (
              <div className="requirement-copy">
                <span>Prerequisites</span>
                <p>{course.rawPrerequisites}</p>
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="menu-section">
          <span className="menu-section__label">Manual color</span>
          <div className="color-row">
            {NODE_COLORS.map((color) => (
              <button
                key={color}
                className="color-swatch"
                style={{ backgroundColor: color }}
                type="button"
                aria-label={`Set color ${color}`}
                onClick={() => onColorChange(color)}
              />
            ))}
            <input
              aria-label="Custom node color"
              type="color"
              value={node?.color ?? NODE_COLORS[0]}
              onChange={(event) => onCustomColorChange(event.target.value)}
            />
          </div>
        </div>
        <div className="menu-section">
          <span className="menu-section__label">Color code</span>
          <div className="color-method-grid">
            <button type="button" onClick={() => onApplyColorMethod("department")}>
              Department
            </button>
            <button type="button" onClick={() => onApplyColorMethod("difficulty")}>
              Difficulty
            </button>
            <button type="button" onClick={() => onApplyColorMethod("gpa")}>
              GPA
            </button>
            <button type="button" onClick={() => onApplyColorMethod("missing")}>
              Prereqs
            </button>
          </div>
        </div>
        <form
          className="tag-editor"
          onSubmit={(event) => {
            event.preventDefault();
            onAddTag(tagDraft);
            setTagDraft("");
          }}
        >
          <span className="menu-section__label">Tags</span>
          {tags.length ? (
            <div className="tag-chip-row">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="tag-chip"
                  onClick={() => onRemoveTag(tag)}
                  title="Remove tag from selection"
                >
                  {tag}
                  <span aria-hidden="true">x</span>
                </button>
              ))}
            </div>
          ) : null}
          <div className="tag-entry">
            <input
              placeholder="Add tag, e.g. fall-2026"
              value={tagDraft}
              onChange={(event) => setTagDraft(event.target.value)}
            />
            <button type="submit">Add</button>
          </div>
          {tagHistory.length ? (
            <div className="tag-history">
              {tagHistory.slice(0, 10).map((tag) => (
                <button key={tag} type="button" onClick={() => onAddTag(tag)}>
                  {tag}
                </button>
              ))}
            </div>
          ) : null}
        </form>
        <button className="danger-menu-action" type="button" onClick={onRemove}>
          Remove {targetNodes.length > 1 ? "selected nodes" : "node"}
        </button>
      </div>
    );
  }

  return (
    <div className="course-menu">
      <button
        className="course-menu__box-action"
        type="button"
        onClick={onCreateBox}
      >
        Create box
      </button>
      <div className="course-menu__tabs" role="tablist" aria-label="Course groups">
        {COURSE_FILTER_ORDER.map((filterKey) => (
          <button
            key={filterKey}
            type="button"
            className={filterKey === activeCourseFilter ? "is-active" : ""}
            onClick={() => onChangeCourseFilter(filterKey)}
          >
            {courseFilterTabs[filterKey].label}
          </button>
        ))}
      </div>
      <input
        autoFocus
        className="course-menu__search"
        placeholder="Search course code, title, or topic"
        value={search}
        onChange={(event) => onChangeSearch(event.target.value)}
      />
      <div className="course-menu__list">
        {courses.slice(0, 80).map((course) => {
          const isAdded = nodes.some((node) => node.courseId === course.id);
          return (
            <button
              key={course.id}
              type="button"
              disabled={isAdded}
              onClick={() => onAddCourse(course)}
            >
              <span>
                <strong>{course.id}</strong>
                <small>{course.title}</small>
              </span>
              <em>
                {course.difficulty ? `${course.difficulty}/10` : "N/A"}
              </em>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CourseMetrics({ course }: { course: CatalogCourse }) {
  return (
    <div className="course-metrics">
      <span>{course.credits} credits</span>
      <span>{course.averageGpa ? `Avg GPA ${course.averageGpa}` : "GPA N/A"}</span>
      <span>
        {course.difficulty ? `Difficulty ${course.difficulty}/10` : "No score"}
      </span>
    </div>
  );
}

function combinedRequirement(node: PlannerNode): CourseRequirement | undefined {
  const prereq = parsePrerequisiteText(node.rawPrerequisites ?? undefined);
  const coreq = parsePrerequisiteText(node.rawCorequisites ?? undefined, {
    concurrentAllowed: true,
  });

  if (prereq && coreq) {
    return { kind: "allOf", requirements: [prereq, coreq] };
  }
  return prereq ?? coreq;
}

function collectMissingPrereqs(
  requirement: CourseRequirement | undefined,
  activeIds: Set<string>,
): string[] {
  if (!requirement) return [];

  switch (requirement.kind) {
    case "course":
      return activeIds.has(String(requirement.courseId))
        ? []
        : [String(requirement.courseId)];
    case "allOf":
      return unique(
        requirement.requirements.flatMap((item) =>
          collectMissingPrereqs(item, activeIds),
        ),
      );
    case "anyOf": {
      const optionIds = collectCourseIds(requirement).map(String);
      return optionIds.some((courseId) => activeIds.has(courseId))
        ? []
        : unique(optionIds);
    }
    case "nOf": {
      const optionIds = requirement.options.map((option) =>
        String(option.courseId),
      );
      const presentCount = optionIds.filter((courseId) =>
        activeIds.has(courseId),
      ).length;
      return presentCount >= requirement.count ? [] : unique(optionIds);
    }
    case "note":
      return [];
  }
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function applyPathHighlights(
  edges: CourseGraphEdge[],
  originNodeIds: string[],
  depth: number,
): CourseGraphEdge[] {
  if (originNodeIds.length === 0 || depth < 1) {
    return edges;
  }

  const incomingEdgeKeys = collectPathEdgeKeys(edges, originNodeIds, depth, "incoming");
  const outgoingEdgeKeys = collectPathEdgeKeys(edges, originNodeIds, depth, "outgoing");

  if (incomingEdgeKeys.size === 0 && outgoingEdgeKeys.size === 0) {
    return edges;
  }

  return edges.map((edge, index) => {
    const key = edgeKey(edge, index);
    const isIncoming = incomingEdgeKeys.has(key);
    const isOutgoing = outgoingEdgeKeys.has(key);

    if (!isIncoming && !isOutgoing) {
      return edge.highlight ? { ...edge, highlight: undefined } : edge;
    }

    const highlight: CourseGraphEdge["highlight"] =
      isIncoming && isOutgoing ? "both" : isIncoming ? "incoming" : "outgoing";

    return {
      ...edge,
      highlight,
    };
  });
}

function collectPathNodeIds(
  edges: CourseGraphEdge[],
  originNodeIds: string[],
  depth: number,
  onlyUnlockedPathNodes: boolean,
) {
  if (originNodeIds.length === 0 || depth < 1) {
    return [];
  }

  const originSet = new Set(originNodeIds);
  const outerNodeIds = collectOuterPathNodeIds(edges, originNodeIds, depth, "outgoing");
  originSet.forEach((originNodeId) => outerNodeIds.delete(originNodeId));

  if (!onlyUnlockedPathNodes) {
    return Array.from(outerNodeIds);
  }

  const allowedIncomingSourceIds = collectPathNodeIdsThroughDepth(
    edges,
    originNodeIds,
    Math.max(0, depth - 1),
    "outgoing",
  );
  originNodeIds.forEach((originNodeId) =>
    allowedIncomingSourceIds.add(originNodeId),
  );

  return Array.from(outerNodeIds).filter((nodeId) =>
    edges
      .filter((edge) => edge.to === nodeId)
      .every((edge) => allowedIncomingSourceIds.has(edge.from)),
  );
}

function collectPathEdgeKeys(
  edges: CourseGraphEdge[],
  originNodeIds: string[],
  depth: number,
  direction: "incoming" | "outgoing",
) {
  const edgeKeys = new Set<string>();
  const visitedNodes = new Set(originNodeIds);
  let frontier = new Set(originNodeIds);

  for (let level = 0; level < depth; level += 1) {
    const nextFrontier = new Set<string>();

    edges.forEach((edge, index) => {
      const touchesFrontier =
        direction === "incoming"
          ? frontier.has(edge.to)
          : frontier.has(edge.from);
      if (!touchesFrontier) return;

      edgeKeys.add(edgeKey(edge, index));
      const nextNodeId = direction === "incoming" ? edge.from : edge.to;
      if (!visitedNodes.has(nextNodeId)) {
        visitedNodes.add(nextNodeId);
        nextFrontier.add(nextNodeId);
      }
    });

    if (nextFrontier.size === 0) break;
    frontier = nextFrontier;
  }

  return edgeKeys;
}

function collectOuterPathNodeIds(
  edges: CourseGraphEdge[],
  originNodeIds: string[],
  depth: number,
  direction: "incoming" | "outgoing",
) {
  const visitedNodes = new Set(originNodeIds);
  let frontier = new Set(originNodeIds);

  for (let level = 0; level < depth; level += 1) {
    const nextFrontier = new Set<string>();

    edges.forEach((edge) => {
      const touchesFrontier =
        direction === "incoming"
          ? frontier.has(edge.to)
          : frontier.has(edge.from);
      if (!touchesFrontier) return;

      const nextNodeId = direction === "incoming" ? edge.from : edge.to;
      if (!visitedNodes.has(nextNodeId)) {
        visitedNodes.add(nextNodeId);
        nextFrontier.add(nextNodeId);
      }
    });

    if (nextFrontier.size === 0) {
      return new Set<string>();
    }
    frontier = nextFrontier;
  }

  return frontier;
}

function collectPathNodeIdsThroughDepth(
  edges: CourseGraphEdge[],
  originNodeIds: string[],
  depth: number,
  direction: "incoming" | "outgoing",
) {
  const nodeIds = new Set<string>();
  const visitedNodes = new Set(originNodeIds);
  let frontier = new Set(originNodeIds);

  for (let level = 0; level < depth; level += 1) {
    const nextFrontier = new Set<string>();

    edges.forEach((edge) => {
      const touchesFrontier =
        direction === "incoming"
          ? frontier.has(edge.to)
          : frontier.has(edge.from);
      if (!touchesFrontier) return;

      const nextNodeId = direction === "incoming" ? edge.from : edge.to;
      nodeIds.add(nextNodeId);
      if (!visitedNodes.has(nextNodeId)) {
        visitedNodes.add(nextNodeId);
        nextFrontier.add(nextNodeId);
      }
    });

    if (nextFrontier.size === 0) break;
    frontier = nextFrontier;
  }

  return nodeIds;
}

function edgeKey(edge: CourseGraphEdge, index: number) {
  return edge.id ?? `${edge.from}-${edge.to}-${index}`;
}

function arraysEqual(first: string[], second: string[]) {
  return (
    first.length === second.length &&
    first.every((value, index) => value === second[index])
  );
}

function createPage(index: number): PlannerPage {
  return {
    id: `page-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: `Canvas ${index}`,
    nodes: [],
    boxes: [],
    selectedNodeIds: [],
  };
}

function normalizePage(page: PlannerPage, index: number): PlannerPage {
  return {
    ...createPage(index + 1),
    ...page,
    boxes: (page.boxes ?? []).map(normalizeBox),
    selectedNodeIds: page.selectedNodeIds ?? [],
  };
}

function normalizeBox(box: PlannerBox & { label?: string }): PlannerBox {
  return {
    ...box,
    title: box.title ?? box.label ?? "Box",
    color: box.color ?? "#2563eb",
    fillColor: box.fillColor ?? "rgb(219 234 254 / 42%)",
  };
}

function getNodeEnvironment(node: PlannerNode, boxes: PlannerBox[]) {
  const nodeCenter = {
    x: node.x + (node.width ?? DEFAULT_NODE_WIDTH) / 2,
    y: node.y + (node.height ?? DEFAULT_NODE_HEIGHT) / 2,
  };

  for (let index = boxes.length - 1; index >= 0; index -= 1) {
    const box = boxes[index];
    if (
      nodeCenter.x >= box.x &&
      nodeCenter.x <= box.x + box.width &&
      nodeCenter.y >= box.y &&
      nodeCenter.y <= box.y + box.height
    ) {
      return box.id;
    }
  }

  return null;
}

function resolveTargetNodeIds(nodeId: string | undefined, selectedNodeIds: string[]) {
  if (!nodeId) return [];
  return selectedNodeIds.includes(nodeId) ? selectedNodeIds : [nodeId];
}

function colorForMethod(
  node: PlannerNode,
  method: ColorMethod,
  missingPrerequisites: string[],
) {
  const course = courseById.get(node.courseId);

  switch (method) {
    case "department":
      return course
        ? (DEPARTMENT_COLORS[course.departmentCode] ?? NODE_COLORS[0])
        : NODE_COLORS[0];
    case "difficulty":
      if (typeof node.difficulty !== "number") return "#64748b";
      if (node.difficulty >= 7) return "#dc2626";
      if (node.difficulty >= 5) return "#d97706";
      if (node.difficulty >= 3) return "#2563eb";
      return "#059669";
    case "gpa":
      if (typeof node.averageGpa !== "number") return "#64748b";
      if (node.averageGpa >= 3.3) return "#059669";
      if (node.averageGpa >= 2.8) return "#2563eb";
      if (node.averageGpa >= 2.4) return "#d97706";
      return "#dc2626";
    case "missing":
      return missingPrerequisites.length > 0 ? "#dc2626" : "#059669";
  }
}

function tintColor(color: string) {
  const hex = color.replace("#", "");
  if (hex.length !== 6) return "#ffffff";

  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);

  return `rgb(${Math.round(red + (255 - red) * 0.9)} ${Math.round(
    green + (255 - green) * 0.9,
  )} ${Math.round(blue + (255 - blue) * 0.9)})`;
}

function normalizeTag(rawTag: string) {
  return rawTag
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9:_-]/g, "")
    .toLowerCase()
    .slice(0, 28);
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest("input, textarea, select, [contenteditable='true']"),
  );
}

function searchRank(course: CatalogCourse, query: string) {
  const id = course.id.toLowerCase();
  const title = course.title.toLowerCase();
  const description = course.description.toLowerCase();

  if (id === query) return 0;
  if (id.startsWith(query)) return 1;
  if (title.includes(query)) return 2;
  if (description.includes(query)) return 3;
  return Number.POSITIVE_INFINITY;
}
