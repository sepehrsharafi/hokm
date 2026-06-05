import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { ResultsSnapshot } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), ".data");
const RESULTS_FILE = path.join(DATA_DIR, "results.json");

const readAll = async (): Promise<Record<string, ResultsSnapshot>> => {
  try {
    const contents = await readFile(RESULTS_FILE, "utf8");
    return JSON.parse(contents) as Record<string, ResultsSnapshot>;
  } catch {
    return {};
  }
};

const writeAll = async (value: Record<string, ResultsSnapshot>) => {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(RESULTS_FILE, JSON.stringify(value, null, 2), "utf8");
};

export const saveResult = async (result: ResultsSnapshot) => {
  const all = await readAll();
  all[result.id] = result;
  await writeAll(all);
};

export const readResult = async (id: string) => {
  const all = await readAll();
  return all[id] ?? null;
};
