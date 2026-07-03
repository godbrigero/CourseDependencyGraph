import type {
  Course,
  CourseId,
  CourseRequirement,
  CourseRequirementCourse,
  CourseSeed,
} from "./courseTypes";

const COURSE_CODE_PATTERN = /\b[A-Z]{2,4}\d{3}[A-Z]?\b/g;

export function parseCourseId(courseId: CourseId): {
  subject: string;
  catalogNumber: string;
  sortKey: string;
} {
  const match = String(courseId).match(/^([A-Z]{2,4})(\d{3}[A-Z]?)$/);
  if (!match) {
    return {
      subject: "",
      catalogNumber: String(courseId),
      sortKey: String(courseId),
    };
  }

  return {
    subject: match[1],
    catalogNumber: match[2],
    sortKey: `${match[1]}-${match[2].padStart(4, "0")}`,
  };
}

export function normalizeCourse(seed: CourseSeed): Course {
  const parsedId = parseCourseId(seed.id);

  return {
    ...seed,
    ...parsedId,
    prerequisites: parsePrerequisiteText(seed.rawPrerequisites),
    corequisites: parsePrerequisiteText(seed.rawCorequisites, {
      concurrentAllowed: true,
    }),
  };
}

export function normalizeCourses(seeds: readonly CourseSeed[]): Course[] {
  return seeds.map(normalizeCourse).sort((a, b) => {
    const subject = a.subject.localeCompare(b.subject);
    return subject || a.catalogNumber.localeCompare(b.catalogNumber);
  });
}

export function parsePrerequisiteText(
  rawText?: string,
  options: { concurrentAllowed?: boolean } = {},
): CourseRequirement | undefined {
  const text = normalizeRequirementText(rawText);
  if (!text) return undefined;

  const clauses = splitTopLevelClauses(text)
    .map((clause) => parseClause(clause, options.concurrentAllowed))
    .filter(Boolean) as CourseRequirement[];

  if (clauses.length === 0) return { kind: "note", text };
  if (clauses.length === 1) return clauses[0];
  return { kind: "allOf", requirements: clauses };
}

export function collectCourseIds(
  requirement: CourseRequirement | undefined,
): CourseId[] {
  if (!requirement) return [];
  switch (requirement.kind) {
    case "course":
      return [requirement.courseId];
    case "nOf":
      return requirement.options.map((option) => option.courseId);
    case "allOf":
    case "anyOf":
      return requirement.requirements.flatMap(collectCourseIds);
    case "note":
      return [];
  }
}

function parseClause(
  clause: string,
  concurrentAllowed = false,
): CourseRequirement | undefined {
  const courseIds = unique(clause.match(COURSE_CODE_PATTERN) ?? []);
  const minimumGrade = extractMinimumGrade(clause);
  const allowsConcurrent =
    concurrentAllowed || /concurrently enrolled|completed or be concurrently/i.test(clause);

  if (courseIds.length === 0) {
    return isAdministrativeClause(clause) ? undefined : { kind: "note", text: clause };
  }

  const nOfMatch = clause.match(/\b(\d+)\s+courses?\b.*?\bfrom\b/i);
  if (nOfMatch && courseIds.length > Number(nOfMatch[1])) {
    return {
      kind: "nOf",
      count: Number(nOfMatch[1]),
      options: courseIds.map((courseId) => courseNode(courseId, minimumGrade, allowsConcurrent)),
      minimumGrade,
    };
  }

  if (looksLikeAnyOf(clause, courseIds)) {
    return {
      kind: "anyOf",
      requirements: courseIds.map((courseId) =>
        courseNode(courseId, minimumGrade, allowsConcurrent),
      ),
    };
  }

  if (courseIds.length === 1) {
    return courseNode(courseIds[0], minimumGrade, allowsConcurrent);
  }

  return {
    kind: "allOf",
    requirements: courseIds.map((courseId) =>
      courseNode(courseId, minimumGrade, allowsConcurrent),
    ),
  };
}

function splitTopLevelClauses(text: string): string[] {
  const protectedText = text.replace(/\(([^)]*)\)/g, (_, inner: string) => {
    return `(${inner.replace(/\s+and\s+/gi, " && ").replace(/\s+or\s+/gi, " || ")})`;
  });

  return protectedText
    .split(/;|\.\s+|,\s+and\s+|\s+and\s+(?=(?:minimum|must|permission|1 course|\(|[A-Z]{2,4}\d{3}))/i)
    .map((part) => part.replace(/&&/g, "and").replace(/\|\|/g, "or").trim())
    .filter(Boolean);
}

function looksLikeAnyOf(clause: string, courseIds: string[]): boolean {
  if (courseIds.length <= 1) return false;
  if (/\bor\b/i.test(clause)) return true;
  return /\([^)]*,[^)]*\)/.test(clause) && /\bfrom\b/i.test(clause);
}

function courseNode(
  courseId: CourseId,
  minimumGrade?: string,
  concurrentAllowed?: boolean,
): CourseRequirementCourse {
  return {
    kind: "course",
    courseId,
    ...(minimumGrade ? { minimumGrade } : {}),
    ...(concurrentAllowed ? { concurrentAllowed } : {}),
  };
}

function normalizeRequirementText(rawText?: string): string {
  return (rawText ?? "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;)])/g, "$1")
    .replace(/[(]\s+/g, "(")
    .trim()
    .replace(/\.$/, "");
}

function extractMinimumGrade(text: string): string | undefined {
  return text.match(/minimum grade of\s+([A-F][+-]?)/i)?.[1];
}

function isAdministrativeClause(text: string): boolean {
  return /permission|program|placement|exam|score|eligibility|experience|department|instructor/i.test(
    text,
  );
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

