# UMD Course Dependency Graph

Interactive Next.js planner for mapping University of Maryland course prerequisites across CS, Robotics and Autonomous Systems, Physics, and Math.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Use

Right-click the graph canvas to open the course menu. Pick a program tab, search for a course, and select it to place a node at that point. Drag nodes to rearrange the graph. Existing prerequisite relationships are drawn as arrows, and missing prerequisites are shown on the target node in red. Right-click a node or use the sidebar color controls to recolor or remove it.

## Data

The generated catalog dataset lives in [src/data/catalogCourses.ts](src/data/catalogCourses.ts).

Refresh it with:

```bash
npm run data:refresh
```

Sources:

- UMD Undergraduate Catalog approved-course pages for catalog course lists, titles, credits, descriptions, and prerequisite text.
- UMD Robotics and Autonomous Systems minor catalog page for RAS course membership.
- PlanetTerp API for `average_gpa`, used as a difficulty proxy where available.

UMD prerequisite text is natural language and can include placement tests, department permission, major restrictions, concurrent enrollment, and one-of groups. The app keeps the raw catalog wording visible and parses course-code edges best-effort for graph display.

## Verify

```bash
npm run lint
npx tsc --noEmit
npm run build
```
