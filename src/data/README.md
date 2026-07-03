# UMD Course Seed Data

This directory seeds course graph data from the public University of Maryland
2026-2027 Undergraduate Catalog. It is intentionally curated around the
Computer Science major, Mathematics major, Physics major, and Robotics and
Autonomous Systems minor instead of mirroring the full registrar catalog.

Sources used:

- UMD catalog course pages for CMSC, MATH, PHYS, STAT, ENAE, ENEE, ENES, and ENME.
- UMD catalog program pages for Computer Science Major, Mathematics Major,
  Physics Major, and Robotics and Autonomous Systems Minor.

Notes:

- `courseSeeds` keeps raw prerequisite/corequisite text where available.
- `courses` is normalized at import time with parsed subject, catalog number,
  sort key, prerequisite AST, and corequisite AST.
- The prerequisite parser is heuristic. It supports common UMD catalog patterns
  such as `and`, `or`, `1 course from (...)`, minimum grade text, and concurrent
  enrollment language. Raw catalog wording remains available for display or
  manual review.
- `ENME476` appears as a blank-titled Robotics and Autonomous Systems elective
  row in the catalog requirements table, but no current ENME476 course block was
  found in the department course page during seeding. It is documented in the
  minor notes rather than represented as a normalized course.

