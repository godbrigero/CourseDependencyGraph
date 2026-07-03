import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, "src/data/catalogCourses.ts");

const CATALOG_DEPARTMENTS = [
  {
    code: "AMST",
    label: "American Studies",
    url: "https://academiccatalog.umd.edu/undergraduate/approved-courses/amst/",
  },
  {
    code: "ANTH",
    label: "Anthropology",
    url: "https://academiccatalog.umd.edu/undergraduate/approved-courses/anth/",
  },
  {
    code: "ARTH",
    label: "Art History & Archaeology",
    url: "https://academiccatalog.umd.edu/undergraduate/approved-courses/arth/",
  },
  {
    code: "ASTR",
    label: "Astronomy",
    url: "https://academiccatalog.umd.edu/undergraduate/approved-courses/astr/",
  },
  {
    code: "BSCI",
    label: "Biological Sciences Program",
    url: "https://academiccatalog.umd.edu/undergraduate/approved-courses/bsci/",
  },
  {
    code: "CCJS",
    label: "Criminology and Criminal Justice",
    url: "https://academiccatalog.umd.edu/undergraduate/approved-courses/ccjs/",
  },
  {
    code: "CHEM",
    label: "Chemistry",
    url: "https://academiccatalog.umd.edu/undergraduate/approved-courses/chem/",
  },
  {
    code: "CMSC",
    label: "Computer Science",
    url: "https://academiccatalog.umd.edu/undergraduate/approved-courses/cmsc/",
  },
  {
    code: "COMM",
    label: "Communication",
    url: "https://academiccatalog.umd.edu/undergraduate/approved-courses/comm/",
  },
  {
    code: "DATA",
    label: "Data Science",
    url: "https://academiccatalog.umd.edu/undergraduate/approved-courses/data/",
  },
  {
    code: "ECON",
    label: "Economics",
    url: "https://academiccatalog.umd.edu/undergraduate/approved-courses/econ/",
  },
  {
    code: "MATH",
    label: "Mathematics",
    url: "https://academiccatalog.umd.edu/undergraduate/approved-courses/math/",
  },
  {
    code: "ENGL",
    label: "English",
    url: "https://academiccatalog.umd.edu/undergraduate/approved-courses/engl/",
  },
  {
    code: "HIST",
    label: "History",
    url: "https://academiccatalog.umd.edu/undergraduate/approved-courses/hist/",
  },
  {
    code: "INAG",
    label: "Institute of Applied Agriculture",
    url: "https://academiccatalog.umd.edu/undergraduate/approved-courses/inag/",
  },
  {
    code: "INST",
    label: "Information Studies",
    url: "https://academiccatalog.umd.edu/undergraduate/approved-courses/inst/",
  },
  {
    code: "LARC",
    label: "Landscape Architecture",
    url: "https://academiccatalog.umd.edu/undergraduate/approved-courses/larc/",
  },
  {
    code: "MUSC",
    label: "Music",
    url: "https://academiccatalog.umd.edu/undergraduate/approved-courses/musc/",
  },
  {
    code: "PHYS",
    label: "Physics",
    url: "https://academiccatalog.umd.edu/undergraduate/approved-courses/phys/",
  },
  {
    code: "PSYC",
    label: "Psychology",
    url: "https://academiccatalog.umd.edu/undergraduate/approved-courses/psyc/",
  },
  {
    code: "SOCY",
    label: "Sociology",
    url: "https://academiccatalog.umd.edu/undergraduate/approved-courses/socy/",
  },
  {
    code: "STAT",
    label: "Statistics and Probability",
    url: "https://academiccatalog.umd.edu/undergraduate/approved-courses/stat/",
  },
  {
    code: "THET",
    label: "Theatre",
    url: "https://academiccatalog.umd.edu/undergraduate/approved-courses/thet/",
  },
  {
    code: "ENAE",
    label: "Aerospace Engineering",
    url: "https://academiccatalog.umd.edu/undergraduate/approved-courses/enae/",
    rasOnly: true,
  },
  {
    code: "ENEE",
    label: "Electrical Engineering",
    url: "https://academiccatalog.umd.edu/undergraduate/approved-courses/enee/",
    rasOnly: true,
  },
  {
    code: "ENES",
    label: "Engineering Science",
    url: "https://academiccatalog.umd.edu/undergraduate/approved-courses/enes/",
    rasOnly: true,
  },
  {
    code: "ENME",
    label: "Mechanical Engineering",
    url: "https://academiccatalog.umd.edu/undergraduate/approved-courses/enme/",
    rasOnly: true,
  },
];

const RAS_PROGRAM_URL =
  "https://academiccatalog.umd.edu/undergraduate/colleges-schools/engineering/robotics-autonomous-systems-minor/";

const PROGRAMS = {
  computerScience: {
    label: "CS Major",
    departmentCodes: ["CMSC"],
    url: "https://academiccatalog.umd.edu/undergraduate/colleges-schools/computer-mathematical-natural-sciences/computer-science/computer-science-major/",
  },
  math: {
    label: "Math Major",
    departmentCodes: ["MATH"],
    url: "https://academiccatalog.umd.edu/undergraduate/colleges-schools/computer-mathematical-natural-sciences/mathematics/mathematics-major/",
  },
  physics: {
    label: "Physics Major",
    departmentCodes: ["PHYS"],
    url: "https://academiccatalog.umd.edu/undergraduate/colleges-schools/computer-mathematical-natural-sciences/physics/physics-major/",
  },
  ras: {
    label: "RAS Minor",
    departmentCodes: ["CMSC", "ENAE", "ENEE", "ENES", "ENME", "MATH"],
    url: RAS_PROGRAM_URL,
  },
  other: {
    label: "Other",
    departmentCodes: [],
    url: "https://app.testudo.umd.edu/soc/gen-ed/",
  },
};

const STATIC_RAS_COURSES = [
  "CMSC131",
  "CMSC421",
  "CMSC422",
  "CMSC426",
  "CMSC427",
  "CMSC451",
  "CMSC477",
  "CMSC498E",
  "ENAE202",
  "ENAE450",
  "ENEE150",
  "ENEE290",
  "ENEE467",
  "ENES221",
  "ENME202",
  "ENME480",
  "MATH240",
  "MATH246",
  "MATH340",
  "MATH341",
  "MATH461",
];

const GEN_ED_BY_COURSE = new Map(
  Object.entries({
    AMST101: ["DSHU", "DVUP"],
    AMST260: ["DSHS", "SCIS"],
    ANTH222: ["DSNL", "DVUP"],
    ANTH266: ["DSHS", "DVCC", "SCIS"],
    ARTH200: ["DSHU", "DVUP"],
    ASTR100: ["DSNS"],
    ASTR101: ["DSNL"],
    BSCI151: ["DSNS", "DSSP", "DVUP", "SCIS"],
    BSCI160: ["DSNS", "DSNL"],
    BSCI170: ["DSNS", "DSNL"],
    CCJS100: ["DSHS"],
    CHEM131: ["DSNS", "DSNL"],
    COMM107: ["FSOC"],
    DATA100: ["FSAR", "FSMA"],
    ECON200: ["DSHS"],
    ENES210: ["DSSP", "SCIS"],
    ENGL101: ["FSAW"],
    ENGL393: ["FSPW"],
    ENGL394: ["FSPW"],
    HIST200: ["DSHS", "DSHU"],
    INAG110: ["FSOC"],
    INST152: ["DSSP"],
    INST153: ["DSHS", "SCIS"],
    INST201: ["DSHS"],
    LARC151: ["DSSP", "SCIS"],
    MUSC205: ["DSHU", "DVUP"],
    MUSC210: ["DSHU", "DVUP"],
    PSYC100: ["DSHS", "DSNS"],
    SOCY100: ["DSHS"],
    STAT100: ["FSAR", "FSMA"],
    THET285: ["FSOC"],
    THET110: ["DSHU"],
  }),
);

async function main() {
  const [departmentCourseLists, rasCourseIds] = await Promise.all([
    Promise.all(CATALOG_DEPARTMENTS.map(fetchDepartmentCourses)),
    fetchRasCourseIds(),
  ]);

  const allCoursesById = new Map();
  for (const courses of departmentCourseLists) {
    for (const course of courses) {
      allCoursesById.set(course.id, course);
    }
  }

  const rasSet = new Set([...STATIC_RAS_COURSES, ...rasCourseIds]);
  const programKeysByCourse = new Map();

  for (const course of allCoursesById.values()) {
    const programs = [];
    if (course.departmentCode === "CMSC") programs.push("computerScience");
    if (course.departmentCode === "MATH") programs.push("math");
    if (course.departmentCode === "PHYS") programs.push("physics");
    if (rasSet.has(course.id)) programs.push("ras");
    if (GEN_ED_BY_COURSE.has(course.id)) programs.push("other");
    if (programs.length > 0) {
      programKeysByCourse.set(course.id, programs);
    }
  }

  const selectedCourses = [...allCoursesById.values()]
    .filter((course) => programKeysByCourse.has(course.id))
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  const enrichedCourses = await mapLimit(selectedCourses, 8, async (course) => {
    const planetTerp = await fetchPlanetTerpCourse(course.id);
    const averageGpa =
      typeof planetTerp?.average_gpa === "number"
        ? Number(planetTerp.average_gpa.toFixed(2))
        : null;
    const title = cleanText(planetTerp?.title) || course.title;
    const description = htmlToText(planetTerp?.description) || course.description;
    return {
      ...course,
      title,
      description,
      averageGpa,
      difficulty: gpaToDifficulty(averageGpa),
      genEd: GEN_ED_BY_COURSE.get(course.id) ?? [],
      programs: programKeysByCourse.get(course.id),
    };
  });

  await mkdir(path.dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, renderTypeScript(enrichedCourses), "utf8");
  console.log(
    `Wrote ${enrichedCourses.length} catalog courses to ${path.relative(ROOT, OUTPUT)}`,
  );
}

async function fetchDepartmentCourses(department) {
  const html = await fetchText(department.url);
  const blocks = html.match(/<div class="courseblock">[\s\S]*?<\/div>/g) ?? [];
  return blocks
    .map((block) => parseCourseBlock(block, department))
    .filter(Boolean);
}

function parseCourseBlock(block, department) {
  const titleHtml = block.match(/<p class="courseblocktitle[^"]*">([\s\S]*?)<\/p>/)?.[1];
  const titleText = htmlToText(titleHtml);
  const match = titleText.match(/^([A-Z]{2,4}\d{3}[A-Z]?)\s+(.+?)\s+\(([^)]*Credits?)\)$/i);
  if (!match) return null;

  const [, id, title, creditsText] = match;
  const description = htmlToText(
    block.match(/<p class="courseblockdesc[^"]*">([\s\S]*?)<\/p>/)?.[1],
  );
  const extras = [...block.matchAll(/<p class="courseblockextra[^"]*">([\s\S]*?)<\/p>/g)].map(
    (extra) => htmlToText(extra[1]),
  );

  return {
    id,
    title: cleanText(title),
    credits: parseCredits(creditsText),
    departmentCode: department.code,
    department: department.label,
    description,
    rawPrerequisites: findExtra(extras, "Prerequisite"),
    rawCorequisites: findExtra(extras, "Corequisite"),
    sourceUrl: department.url,
  };
}

async function fetchRasCourseIds() {
  const html = await fetchText(RAS_PROGRAM_URL);
  return new Set(htmlToText(html).match(/\b[A-Z]{2,4}\d{3}[A-Z]?\b/g) ?? []);
}

async function fetchPlanetTerpCourse(courseId) {
  try {
    const response = await fetch(
      `https://planetterp.com/api/v1/course?name=${encodeURIComponent(courseId)}`,
    );
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { "user-agent": "CourseDependencyGraph/0.1" },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
}

function findExtra(extras, label) {
  const extra = extras.find((item) => item.toLowerCase().startsWith(`${label.toLowerCase()}:`));
  return extra ? cleanText(extra.replace(new RegExp(`^${label}:\\s*`, "i"), "")) : null;
}

function parseCredits(text) {
  const range = text.match(/(\d+)\s*-\s*(\d+)/);
  if (range) return `${range[1]}-${range[2]}`;
  return Number(text.match(/\d+/)?.[0] ?? 0);
}

function gpaToDifficulty(averageGpa) {
  if (typeof averageGpa !== "number") return null;
  const normalized = 1 + ((4 - averageGpa) / 3) * 9;
  return Number(Math.max(1, Math.min(10, normalized)).toFixed(1));
}

function htmlToText(value = "") {
  return decodeEntities(
    String(value ?? "")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/p>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&ndash;|&mdash;/g, "-");
}

function cleanText(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

async function mapLimit(items, limit, mapper) {
  const output = [];
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const currentIndex = index++;
      output[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return output;
}

function renderTypeScript(courses) {
  return `// Generated by scripts/generate-catalog-data.mjs.
// Sources: UMD Undergraduate Catalog approved-course pages, UMD RAS minor catalog page, UMD Testudo Gen Ed pages, and PlanetTerp course API.

export type ProgramKey = ${Object.keys(PROGRAMS).map((key) => JSON.stringify(key)).join(" | ")};

export type CatalogCourse = {
  id: string;
  title: string;
  credits: number | string;
  departmentCode: string;
  department: string;
  description: string;
  rawPrerequisites: string | null;
  rawCorequisites: string | null;
  averageGpa: number | null;
  difficulty: number | null;
  genEd: string[];
  sourceUrl: string;
  programs: ProgramKey[];
};

export const programTabs: Record<ProgramKey, { label: string; sourceUrl: string }> = ${JSON.stringify(
    Object.fromEntries(
      Object.entries(PROGRAMS).map(([key, program]) => [
        key,
        { label: program.label, sourceUrl: program.url },
      ]),
    ),
    null,
    2,
  )};

export const catalogCourses: CatalogCourse[] = ${JSON.stringify(courses, null, 2)};
`;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
