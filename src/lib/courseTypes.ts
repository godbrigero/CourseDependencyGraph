export type CourseId = `${string}${number}${string}` | string;

export type RequirementKind =
  | "course"
  | "allOf"
  | "anyOf"
  | "nOf"
  | "note";

export interface CourseRequirementCourse {
  kind: "course";
  courseId: CourseId;
  minimumGrade?: string;
  concurrentAllowed?: boolean;
}

export interface CourseRequirementGroup {
  kind: "allOf" | "anyOf";
  requirements: CourseRequirement[];
}

export interface CourseRequirementNOf {
  kind: "nOf";
  count: number;
  options: CourseRequirementCourse[];
  minimumGrade?: string;
}

export interface CourseRequirementNote {
  kind: "note";
  text: string;
}

export type CourseRequirement =
  | CourseRequirementCourse
  | CourseRequirementGroup
  | CourseRequirementNOf
  | CourseRequirementNote;

export interface Department {
  id: string;
  code: string;
  name: string;
  college?: string;
  sourceUrl?: string;
}

export interface CourseSeed {
  id: CourseId;
  title: string;
  credits: number | { min: number; max: number };
  departmentId: string;
  rawPrerequisites?: string;
  rawCorequisites?: string;
  tags?: string[];
  sourceUrl?: string;
}

export interface Course extends CourseSeed {
  subject: string;
  catalogNumber: string;
  sortKey: string;
  prerequisites?: CourseRequirement;
  corequisites?: CourseRequirement;
}

export type ProgramType = "major" | "minor";

export interface CourseChoiceRule {
  kind: "all" | "choose";
  title: string;
  courseIds: CourseId[];
  count?: number;
  credits?: number | { min: number; max: number };
  notes?: string;
}

export interface ProgramRequirementSection {
  id: string;
  title: string;
  rules: CourseChoiceRule[];
  notes?: string;
}

export interface Program {
  id: string;
  name: string;
  type: ProgramType;
  departmentIds: string[];
  totalCredits?: number | { min: number; max: number };
  minimumGrade?: string;
  sourceUrl: string;
  requirementSections: ProgramRequirementSection[];
  notes?: string[];
}

