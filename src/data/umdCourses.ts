import { normalizeCourses } from "../lib/coursePrereqs";
import type { CourseSeed, Department } from "../lib/courseTypes";

const catalogBase = "https://academiccatalog.umd.edu/undergraduate";

export const departments = [
  {
    id: "umd-cmsc",
    code: "CMSC",
    name: "Computer Science",
    college: "Computer, Mathematical, and Natural Sciences",
    sourceUrl: `${catalogBase}/approved-courses/cmsc/`,
  },
  {
    id: "umd-math",
    code: "MATH",
    name: "Mathematics",
    college: "Computer, Mathematical, and Natural Sciences",
    sourceUrl: `${catalogBase}/approved-courses/math/`,
  },
  {
    id: "umd-phys",
    code: "PHYS",
    name: "Physics",
    college: "Computer, Mathematical, and Natural Sciences",
    sourceUrl: `${catalogBase}/approved-courses/phys/`,
  },
  {
    id: "umd-stat",
    code: "STAT",
    name: "Statistics and Probability",
    college: "Computer, Mathematical, and Natural Sciences",
    sourceUrl: `${catalogBase}/approved-courses/stat/`,
  },
  {
    id: "umd-enae",
    code: "ENAE",
    name: "Engineering, Aerospace",
    college: "A. James Clark School of Engineering",
    sourceUrl: `${catalogBase}/approved-courses/enae/`,
  },
  {
    id: "umd-enee",
    code: "ENEE",
    name: "Electrical & Computer Engineering",
    college: "A. James Clark School of Engineering",
    sourceUrl: `${catalogBase}/approved-courses/enee/`,
  },
  {
    id: "umd-enes",
    code: "ENES",
    name: "Engineering Science",
    college: "A. James Clark School of Engineering",
    sourceUrl: `${catalogBase}/approved-courses/enes/`,
  },
  {
    id: "umd-enme",
    code: "ENME",
    name: "Engineering, Mechanical",
    college: "A. James Clark School of Engineering",
    sourceUrl: `${catalogBase}/approved-courses/enme/`,
  },
] as const satisfies readonly Department[];

const departmentBySubject = Object.fromEntries(
  departments.map((department) => [department.code, department]),
) as Record<string, Department | undefined>;

function c(
  id: string,
  title: string,
  credits: CourseSeed["credits"],
  rawPrerequisites?: string,
  rawCorequisites?: string,
  tags: string[] = [],
): CourseSeed {
  const subject = id.match(/^[A-Z]+/)?.[0] ?? "";
  const department = departmentBySubject[subject];

  if (!department) {
    throw new Error(`No department seed configured for ${id}`);
  }

  return {
    id,
    title,
    credits,
    departmentId: department.id,
    sourceUrl: department.sourceUrl,
    ...(rawPrerequisites ? { rawPrerequisites } : {}),
    ...(rawCorequisites ? { rawCorequisites } : {}),
    ...(tags.length ? { tags } : {}),
  };
}

// Seeded from the public UMD 2026-2027 Undergraduate Catalog course pages.
// This is a curated graph seed for the CS major, Math major, Physics major,
// and Robotics and Autonomous Systems minor, not a complete registrar mirror.
export const courseSeeds = [
  c("CMSC131", "Object-Oriented Programming I", 4, undefined, "MATH140.", [
    "cs-major",
    "ras-minor",
  ]),
  c(
    "CMSC132",
    "Object-Oriented Programming II",
    4,
    "Minimum grade of C- in CMSC131; or must have earned a score of 5 on the A Java AP exam; or must have earned a satisfactory score on the departmental placement exam; and minimum grade of C- in MATH140.",
    undefined,
    ["cs-major"],
  ),
  c(
    "CMSC216",
    "Introduction to Computer Systems",
    4,
    "Minimum grade of C- in CMSC132; and minimum grade of C- in MATH141.",
    undefined,
    ["cs-major"],
  ),
  c(
    "CMSC250",
    "Discrete Structures",
    4,
    "Minimum grade of C- in CMSC131; and minimum grade of C- in MATH141.",
    undefined,
    ["cs-major"],
  ),
  c(
    "CMSC320",
    "Introduction to Data Science",
    3,
    "Minimum grade of C- in CMSC216 and CMSC250.",
    undefined,
    ["cs-major-elective"],
  ),
  c(
    "CMSC330",
    "Organization of Programming Languages",
    3,
    "Minimum grade of C- in CMSC250 and CMSC216.",
    undefined,
    ["cs-major"],
  ),
  c(
    "CMSC351",
    "Algorithms",
    3,
    "Minimum grade of C- in CMSC250 and CMSC216.",
    undefined,
    ["cs-major"],
  ),
  c("CMSC411", "Computer Systems Architecture", 3, "Minimum grade of C- in CMSC330.", undefined, [
    "cs-area-systems",
  ]),
  c(
    "CMSC412",
    "Operating Systems",
    4,
    "Minimum grade of C- in CMSC330 and CMSC351; and 1 course with a minimum grade of C- from (CMSC414, CMSC417, CMSC420, CMSC430, CMSC433, CMSC435, ENEE440, ENEE457).",
    undefined,
    ["cs-area-systems"],
  ),
  c("CMSC414", "Computer and Network Security", 3, "Minimum grade of C- in CMSC330 and CMSC351.", undefined, [
    "cs-area-systems",
  ]),
  c("CMSC416", "Introduction to Parallel Computing", 3, "Minimum grade of C- in CMSC330 and CMSC351.", undefined, [
    "cs-area-systems",
  ]),
  c("CMSC417", "Computer Networks", 3, "Minimum grade of C- in CMSC351 and CMSC330.", undefined, [
    "cs-area-systems",
  ]),
  c("CMSC420", "Advanced Data Structures", 3, "Minimum grade of C- in CMSC351 and CMSC330.", undefined, [
    "cs-area-information",
    "ras-minor",
  ]),
  c("CMSC421", "Introduction to Artificial Intelligence", 3, "Minimum grade of C- in CMSC351 and CMSC330.", undefined, [
    "cs-area-information",
    "ras-minor",
  ]),
  c(
    "CMSC422",
    "Introduction to Machine Learning",
    3,
    "Minimum grade of C- in CMSC320, CMSC330, and CMSC351; and 1 course with a minimum grade of C- from (MATH240, MATH341, MATH461, ENEE290).",
    undefined,
    ["cs-area-information", "ras-minor"],
  ),
  c("CMSC423", "Computational Genomics", 3, "Minimum grade of C- in CMSC351 and CMSC330.", undefined, [
    "cs-area-information",
  ]),
  c("CMSC424", "Database Design", 3, "Minimum grade of C- in CMSC351 and CMSC330.", undefined, [
    "cs-area-information",
  ]),
  c(
    "CMSC426",
    "Computer Vision",
    3,
    "Minimum grade of C- in CMSC330 and CMSC351 and 1 course with a minimum grade of C- from (MATH240, MATH341, MATH461, ENEE290).",
    undefined,
    ["cs-area-information", "ras-minor"],
  ),
  c(
    "CMSC427",
    "Computer Graphics",
    3,
    "Minimum grade of C- in CMSC330 and CMSC351; 1 course with a minimum grade of C- from (MATH240, MATH341, MATH461, ENEE290).",
    undefined,
    ["cs-area-information", "ras-minor"],
  ),
  c("CMSC430", "Introduction to Compilers", 3, "Minimum grade of C- in CMSC330 and CMSC351.", undefined, [
    "cs-area-software",
  ]),
  c("CMSC433", "Programming Language Technologies and Paradigms", 3, "Minimum grade of C- in CMSC330.", undefined, [
    "cs-area-software",
  ]),
  c("CMSC434", "Introduction to Human-Computer Interaction", 3, "Minimum grade of C- in CMSC330 and CMSC351.", undefined, [
    "cs-area-software",
  ]),
  c(
    "CMSC435",
    "Software Engineering",
    3,
    "1 course with a minimum grade of C- from (CMSC412, CMSC417, CMSC420, CMSC430, CMSC433, ENEE447).",
    undefined,
    ["cs-area-software"],
  ),
  c("CMSC436", "Programming Handheld Systems", 3, "Minimum grade of C- in CMSC330 and CMSC351.", undefined, [
    "cs-area-software",
  ]),
  c("CMSC451", "Design and Analysis of Computer Algorithms", 3, "Minimum grade of C- in CMSC351.", undefined, [
    "cs-area-theory",
    "ras-minor",
  ]),
  c("CMSC452", "Elementary Theory of Computation", 3, "Minimum grade of C- in CMSC351.", undefined, [
    "cs-area-theory",
  ]),
  c("CMSC454", "Algorithms for Data Science", 3, "Minimum grade of C- in CMSC330 and CMSC351.", undefined, [
    "cs-area-theory",
  ]),
  c(
    "CMSC456",
    "Cryptography",
    3,
    "(CMSC106, CMSC131, or ENEE150; or equivalent programming experience); and (2 courses from (CMSC330, CMSC351, ENEE324, or ENEE382); or any one of these courses and a 400-level MATH course, or two 400-level MATH courses).",
    undefined,
    ["cs-area-theory"],
  ),
  c(
    "CMSC457",
    "Introduction to Quantum Computing",
    3,
    "1 course with a minimum grade of C- from (ENEE290, MATH240, MATH341, MATH461, MATH243); and 1 course with a minimum grade of C- from (CMSC351, PHYS313).",
    undefined,
    ["cs-area-theory"],
  ),
  c(
    "CMSC460",
    "Computational Methods",
    3,
    "1 course with a minimum grade of C- from (MATH240, MATH341, MATH461, ENEE290, MATH243); and 1 course with a minimum grade of C- from (MATH241, MATH340); and 1 course with a minimum grade of C- from (CMSC106, CMSC131); and 1 course with a minimum grade of C- from (MATH246, MATH341, ENEE290, MATH243).",
    undefined,
    ["cs-area-numerical"],
  ),
  c("CMSC466", "Introduction to Numerical Analysis I", 3, "1 course with a minimum grade of C- from (CMSC106, CMSC131); and minimum grade of C- in MATH410.", undefined, [
    "cs-area-numerical",
  ]),
  c(
    "CMSC470",
    "Introduction to Natural Language Processing",
    3,
    "Minimum grade of C- in CMSC320, CMSC330, and CMSC351; and 1 course with a minimum grade of C- from (MATH240, MATH341, MATH461, ENEE290).",
    undefined,
    ["cs-area-information"],
  ),
  c("CMSC471", "Introduction to Data Visualization", 3, "Minimum grade of C- in CMSC330 and CMSC351.", undefined, [
    "cs-area-information",
    "cs-area-software",
  ]),
  c(
    "CMSC472",
    "Introduction to Deep Learning",
    3,
    "Minimum grade of C- or higher in CMSC330 and CMSC351; and 1 course with a minimum grade of C- or higher from (MATH240, MATH341, MATH461, ENEE290).",
    undefined,
    ["cs-area-information"],
  ),
  c("CMSC474", "Introduction to Computational Game Theory", 3, "Minimum grade of C- in CMSC351 and CMSC330.", undefined, [
    "cs-area-theory",
  ]),
  c(
    "CMSC477",
    "Robotics Perception and Planning",
    3,
    "1 course from (MATH240, MATH341, MATH461, ENEE290); and (ENEE467 or CMSC420).",
    undefined,
    ["ras-minor"],
  ),
  c(
    "CMSC498",
    "Selected Topics in Computer Science",
    { min: 1, max: 3 },
    undefined,
    undefined,
    ["ras-minor"],
  ),

  c("MATH140", "Calculus I", 4, "Minimum grade of C- in MATH115; or must have math eligibility of MATH140.", undefined, [
    "cs-major",
    "math-major",
    "phys-major",
  ]),
  c("MATH141", "Calculus II", 4, "Minimum grade of C- in MATH140.", undefined, [
    "cs-major",
    "math-major",
    "phys-major",
  ]),
  c("MATH240", "Introduction to Linear Algebra", 4, "1 course with a minimum grade of C- from (MATH131, MATH141).", undefined, [
    "math-major",
    "ras-minor",
  ]),
  c("MATH241", "Calculus III", 4, "Minimum grade of C- in MATH141.", undefined, [
    "math-major",
    "phys-major",
  ]),
  c("MATH243", "Introduction to Linear Algebra and Differential Equations", 4, "Minimum grade of C- in MATH141.", undefined, [
    "phys-major",
  ]),
  c("MATH246", "Differential Equations for Scientists and Engineers", 3, "Minimum grade of C- in MATH141.", undefined, [
    "math-major",
    "ras-minor",
  ]),
  c(
    "MATH310",
    "Introduction to Mathematical Proof",
    3,
    "Minimum grade of C- in MATH141; and must have completed or be concurrently enrolled in MATH240, MATH341, or MATH461; and must have completed or be concurrently enrolled in MATH241 or MATH340.",
    undefined,
    ["math-major"],
  ),
  c("MATH340", "Multivariable Calculus, Linear Algebra and Differential Equations I (Honors)", 4, "MATH141 and MATH140.", undefined, [
    "math-major",
    "ras-minor",
  ]),
  c("MATH341", "Multivariable Calculus, Linear Algebra, Differential Equations II (Honors)", 4, "Minimum grade of C- in MATH340.", undefined, [
    "math-major",
    "ras-minor",
  ]),
  c("MATH401", "Applications of Linear Algebra", 3, "1 course with a minimum grade of C- from (MATH461, MATH240, MATH341).", undefined, [
    "math-elective",
  ]),
  c("MATH402", "Algebraic Structures", 3, "1 course with a minimum grade of C- from (MATH240, MATH341, MATH461).", undefined, [
    "math-elective",
  ]),
  c("MATH403", "Introduction to Abstract Algebra", 3, "1 course with a minimum grade of C- from (MATH405 or MATH410).", undefined, [
    "math-elective",
  ]),
  c("MATH404", "Field Theory", 3, "Minimum grade of C- in MATH403.", undefined, [
    "math-elective",
  ]),
  c("MATH405", "Linear Algebra", 3, "1 course with a minimum grade of C- from (MATH240, MATH461, MATH341); and minimum grade of C- in MATH310.", undefined, [
    "math-major",
    "math-elective",
  ]),
  c("MATH406", "Introduction to Number Theory", 3, "1 course with a minimum grade of C- from (MATH240, MATH241, MATH246, MATH340, MATH341, MATH461, MATH243, ENEE290).", undefined, [
    "math-elective",
  ]),
  c(
    "MATH410",
    "Advanced Calculus I",
    3,
    "1 course with a minimum grade of C- from (MATH240, MATH461, MATH341); and 1 course with a minimum grade of C- from (MATH340, MATH241); and minimum grade of C- in MATH310.",
    undefined,
    ["math-major", "math-elective"],
  ),
  c("MATH411", "Advanced Calculus II", 3, "Minimum grade of C- in MATH410.", undefined, [
    "math-major",
    "math-elective",
  ]),
  c("MATH416", "Applied Harmonic Analysis: An Introduction to Signal Processing", 3, "Minimum grade of C- in MATH141; and 1 course with a minimum grade of C- from (MATH240, MATH461, MATH341).", undefined, [
    "math-elective",
  ]),
  c(
    "MATH420",
    "Mathematical Modeling",
    3,
    "1 course with a minimum grade of C- from (MATH240, MATH461, MATH341, ENEE290, MATH243); and 1 course with a minimum grade of C- from (MATH241, MATH340); and 1 course with a minimum grade of C- from (MATH246, MATH341, ENEE290, MATH243); and 1 course with a minimum grade of C- from (STAT400, STAT410); and 1 course with a minimum grade C- from (CMSC106, CMSC131).",
    undefined,
    ["math-elective"],
  ),
  c("MATH424", "Introduction to the Mathematics of Finance", 3, "Minimum grade of C- in MATH141; and 1 course with a minimum grade of C- from (STAT400, STAT410).", undefined, [
    "math-elective",
  ]),
  c("MATH430", "Euclidean and Non-Euclidean Geometries", 3, "1 course with a minimum grade of C- from (MATH240, MATH341, MATH461).", undefined, [
    "math-elective",
  ]),
  c("MATH431", "Geometry for Computer Applications", 3, "1 course with a minimum grade of C- from (MATH461, MATH240, MATH341).", undefined, [
    "math-elective",
  ]),
  c("MATH432", "Introduction to Topology", 3, "Minimum grade of C- in MATH410.", undefined, [
    "math-elective",
  ]),
  c(
    "MATH436",
    "Differential Geometry of Curves and Surfaces I",
    3,
    "1 course with a minimum grade of C- from (MATH241, MATH340); and 1 course with a minimum grade of C- from (MATH461, MATH240, MATH341); and must have completed two 400-level MATH courses with a minimum grade of C-.",
    undefined,
    ["math-elective"],
  ),
  c("MATH437", "Differential Forms", 3, "1 course with a minimum grade of C- from (MATH241, MATH340); and 1 course with a minimum grade of C- from (MATH240, MATH341, MATH461).", undefined, [
    "math-elective",
  ]),
  c("MATH445", "Elementary Mathematical Logic", 3, "Minimum grade of C- in MATH141.", undefined, [
    "math-elective",
  ]),
  c("MATH452", "Introduction to Dynamics and Chaos", 3, "MATH341; or MATH246 and one of (MATH240 or MATH461).", undefined, [
    "math-elective",
  ]),
  c("MATH456", "Cryptography", 3, "(CMSC106, CMSC131, or ENEE150); and (2 courses from (CMSC330, CMSC351, ENEE324, or ENEE382); or any one of these courses and a 400-level MATH course, or two 400-level MATH courses).", undefined, [
    "math-elective",
  ]),
  c("MATH461", "Linear Algebra for Scientists and Engineers", 3, "Minimum grade of C- in MATH141.", undefined, [
    "math-major",
    "ras-minor",
  ]),
  c("MATH462", "Partial Differential Equations", 3, "1 course with a minimum grade of C- from (MATH241, MATH340); and 1 course with a minimum grade of C- from (MATH246, MATH341, ENEE290, MATH243).", undefined, [
    "math-elective",
  ]),
  c("MATH463", "Complex Variables", 3, "1 course with a minimum grade of C- from (MATH241, MATH340).", undefined, [
    "math-elective",
  ]),
  c("MATH464", "Transform Methods", 3, "1 course with a minimum grade of C- from (MATH246, MATH341, ENEE290, MATH243).", undefined, [
    "math-elective",
  ]),
  c(
    "MATH475",
    "Combinatorics and Graph Theory",
    3,
    "1 course with a minimum grade of C- from (MATH240, MATH341, MATH461, ENEE290, MATH243); and 1 course with a minimum grade of C- from (MATH241, MATH340); and 1 course with a minimum grade of C- from (MATH310, CMSC250).",
    undefined,
    ["math-elective"],
  ),

  c("STAT400", "Applied Probability and Statistics I", 3, "1 course with a minimum grade of C- from (MATH131, MATH141).", undefined, [
    "cs-major",
    "math-elective",
  ]),
  c("STAT401", "Applied Probability and Statistics II", 3, "1 course with a minimum grade of C- from (STAT400, STAT410).", undefined, [
    "math-elective",
  ]),
  c("STAT410", "Introduction to Probability Theory", 3, "1 course with a minimum grade of C- from (MATH240, MATH461, MATH341); and 1 course with a minimum grade of C- from (MATH340, MATH241).", undefined, [
    "math-elective",
  ]),
  c("STAT420", "Theory and Methods of Statistics", 3, "1 course with a minimum grade of C- from (SURV410, STAT410); and a minimum grade of C- from (MATH410).", undefined, [
    "math-elective",
  ]),
  c("STAT430", "Introduction to Statistical Computing with SAS", 3, "1 course with a minimum grade of C- from (STAT400, STAT410); and must have completed or be concurrently enrolled in STAT401 or STAT420.", undefined, [
    "math-elective",
  ]),
  c("STAT440", "Sampling Theory", 3, "1 course with a minimum grade of C- from (STAT401, STAT420).", undefined, [
    "math-elective",
  ]),

  c("PHYS170", "Professional Physics Seminar", 1, undefined, "MATH140.", ["phys-major"]),
  c("PHYS171", "Introductory Physics: Mechanics", 3, "MATH140.", undefined, [
    "phys-major",
  ]),
  c("PHYS265", "Introduction to Scientific Programming", 3, "PHYS171, PHYS141, or PHYS161.", undefined, [
    "phys-major",
  ]),
  c(
    "PHYS272",
    "Introductory Physics: Electricity and Magnetism",
    3,
    "PHYS161 or PHYS171; and MATH141; and must have completed or be concurrently enrolled in MATH241.",
    undefined,
    ["phys-major"],
  ),
  c(
    "PHYS273",
    "Intermediate Oscillations and Waves",
    3,
    "MATH241 and PHYS272; and must have completed or be concurrently enrolled in one of the following: (PHYS274, MATH243, MATH246 or equivalent).",
    undefined,
    ["phys-major"],
  ),
  c("PHYS275", "Experimental Physics I: Mechanics and Waves", 2, "Must have completed or be concurrently enrolled in PHYS171 or PHYS161.", undefined, [
    "phys-major",
  ]),
  c("PHYS276", "Experimental Physics II: Analog Circuits", 2, "PHYS272 and PHYS275.", undefined, [
    "phys-major",
  ]),
  c("PHYS313", "Electricity and Magnetism I", 4, "MATH241, PHYS273, and one of the following: PHYS274, MATH240, MATH243, MATH246, or equivalent courses.", undefined, [
    "phys-major",
  ]),
  c("PHYS371", "Modern Physics", 3, "PHYS273; and 1 course from (PHYS274, MATH243, or MATH246).", undefined, [
    "phys-major",
  ]),
  c("PHYS375", "Experimental Physics III: Experimental Optics", 3, "PHYS273, PHYS276, and (PHYS265, CMSC106, CMSC131, or another acceptable computer programming course with approval from the Physics Department).", undefined, [
    "phys-major",
  ]),
  c("PHYS401", "Quantum Physics I", 4, "PHYS265 and PHYS371; and 1 course from (PHYS313, PHYS373, or MATH462).", undefined, [
    "phys-major",
  ]),
  c("PHYS402", "Quantum Physics II", 3, "PHYS401.", undefined, ["phys-major"]),
  c("PHYS404", "Introduction to Statistical Thermodynamics", 3, "PHYS371 or PHYS420.", undefined, [
    "phys-major",
  ]),
  c("PHYS405", "Advanced Experiments", 3, "PHYS375.", undefined, ["phys-major"]),
  c("PHYS406", "Experimental Research Development", 3, "PHYS375.", undefined, [
    "phys-major",
  ]),
  c("PHYS407", "Undergraduate Experimental Research", 3, "PHYS406.", undefined, [
    "phys-major",
  ]),
  c("PHYS410", "Classical Mechanics", 3, "PHYS265 and PHYS273; and (MATH243 or MATH246).", undefined, [
    "phys-major",
  ]),
  c("PHYS413", "Electricity and Magnetism II", 3, "PHYS313 or PHYS412.", undefined, [
    "phys-major",
  ]),
  c("PHYS456", "Making Physics Experiments", 3, "PHYS276.", undefined, [
    "phys-major",
  ]),
  c("PHYS474", "Computational Physics", 3, "PHYS373; and (PHYS165, CMSC106, or CMSC131).", undefined, [
    "phys-major",
  ]),
  c("PHYS485", "Electronic Circuits", 3, "PHYS272 and PHYS276.", undefined, [
    "phys-major",
  ]),
  c("PHYS487", "Computerized Instrumentation", 3, "PHYS276.", undefined, [
    "phys-major",
  ]),

  c("ENAE202", "Computing Fundamentals for Engineers", 3, undefined, "MATH141.", [
    "ras-minor",
  ]),
  c("ENAE380", "Flight Software Systems", 3, "ENAE283 and ENAE202.", undefined, [
    "ras-minor",
  ]),
  c("ENAE403", "Aircraft Flight Dynamics", 3, "ENAE414 and ENAE432.", undefined, [
    "ras-minor",
  ]),
  c("ENAE432", "Control of Aerospace Systems", 3, "Minimum grade of C- in ENAE301 and ENAE283.", undefined, [
    "ras-minor",
  ]),
  c("ENAE441", "Space Navigation and Guidance", 3, "Minimum grade of C- or better in ENAE432; and must have completed or be concurrently enrolled in ENAE404.", undefined, [
    "ras-minor",
  ]),
  c("ENAE450", "Robotics Programming", 3, "ENME480 or ENAE380.", undefined, [
    "ras-minor",
  ]),
  c("ENAE488", "Topics in Aerospace Engineering", { min: 1, max: 4 }, "Permission of student's advisor required.", undefined, [
    "ras-minor",
  ]),
  c(
    "ENEE150",
    "Intermediate Programming Concepts for Engineers",
    3,
    "ENEE140 or CMSC131; or score of 5 on the A Java AP exam; or score of 4 or 5 on the AB Java AP exam; or satisfactory performance on the department's placement exam.",
    "MATH140.",
    ["ras-minor"],
  ),
  c("ENEE290", "Introduction to Differential Equations and Linear Algebra for Engineers", 4, "Minimum grade of C- in MATH141.", undefined, [
    "ras-minor",
  ]),
  c("ENEE408", "Capstone Design Project", 3, "Must have earned a minimum grade of regular (letter) C- in all required 200-level ENEE courses.", undefined, [
    "ras-minor",
  ]),
  c("ENEE425", "Digital Signal Processing", 3, "Minimum grade of C- in ENEE322 or ENEE323.", undefined, [
    "ras-minor",
  ]),
  c("ENEE426", "Communication Networks", 3, "ENEE324 or STAT400.", undefined, [
    "ras-minor",
  ]),
  c("ENEE440", "Microprocessors", 3, "ENEE350.", undefined, ["ras-minor"]),
  c(
    "ENEE460",
    "Control Systems",
    3,
    "Minimum grade of C- in ENEE205, ENEE222, ENEE245, and (ENEE322 or ENEE323); and (ENEE290, MATH240, or MATH461).",
    undefined,
    ["ras-minor"],
  ),
  c("ENEE461", "Control Systems Laboratory", 3, "Minimum grade of C- in ENEE205; and minimum grade of C- in ENEE322 or ENEE323.", undefined, [
    "ras-minor",
  ]),
  c("ENEE467", "Robotics Project Laboratory", 3, "Minimum grade of C- in ENAE450.", undefined, [
    "ras-minor",
  ]),
  c("ENES221", "Dynamics", 3, "Minimum grade of C- in ENES102; and (MATH141 and PHYS161).", undefined, [
    "ras-minor",
  ]),
  c("ENES467", "Engineering for Social Change", 3, undefined, undefined, [
    "ras-minor",
  ]),
  c("ENME202", "Computing Fundamentals for Engineers", 3, undefined, "Must be concurrently enrolled in MATH141.", [
    "ras-minor",
  ]),
  c("ENME400", "Machine Design", 3, "Must have completed or be concurrently enrolled in ENME361.", undefined, [
    "ras-minor",
  ]),
  c("ENME410", "Design Optimization", 3, "ENME271; or MATH206.", undefined, [
    "ras-minor",
  ]),
  c("ENME413", "Bio-Inspired Robotics", 3, "Must have completed or be concurrently enrolled in ENME351.", undefined, [
    "ras-minor",
  ]),
  c("ENME435", "Remote Sensing Instrumentation", 3, "ENME351.", undefined, [
    "ras-minor",
  ]),
  c("ENME441", "Mechatronics and the Internet of Things", 3, "ENME351.", undefined, [
    "ras-minor",
  ]),
  c("ENME444", "Assistive Robotics", 3, "ENME351; and must have completed or be concurrently enrolled in ENME462.", undefined, [
    "ras-minor",
  ]),
  c("ENME461", "Control Systems Laboratory", 3, "ENME351 and ENME361.", undefined, [
    "ras-minor",
  ]),
  c("ENME467", "Engineering for Social Change", 3, undefined, undefined, [
    "ras-minor",
  ]),
  c("ENME480", "Introduction to Robotics", 3, "MATH246 or ENES221; and (CMSC131, ENME202, ENAE202 or ENEE150).", undefined, [
    "ras-minor",
  ]),
] as const satisfies readonly CourseSeed[];

export const courses = normalizeCourses(courseSeeds);

export const coursesById = Object.fromEntries(
  courses.map((course) => [course.id, course]),
);
