import { clsx } from "clsx";
import type { Language } from "@/lib/i18n";

export const cn = (...inputs: Array<string | false | null | undefined>) =>
  clsx(inputs);

const faNumberFormatter = new Intl.NumberFormat("fa-IR");
const faDigitsMap = new Map([
  ["0", "\u06f0"],
  ["1", "\u06f1"],
  ["2", "\u06f2"],
  ["3", "\u06f3"],
  ["4", "\u06f4"],
  ["5", "\u06f5"],
  ["6", "\u06f6"],
  ["7", "\u06f7"],
  ["8", "\u06f8"],
  ["9", "\u06f9"],
]);

export const localizeDigits = (value: string, language?: Language) => {
  void language;
  return value.replace(/\d/g, (digit) => faDigitsMap.get(digit) ?? digit);
};

export const formatLocalizedNumber = (value: number, language?: Language) => {
  void language;
  return faNumberFormatter.format(value);
};

export const formatCountdown = (pausedUntil: number) => {
  const remaining = Math.max(0, pausedUntil - Date.now());
  const seconds = Math.ceil(remaining / 1000);
  return localizeDigits(
    `${Math.floor(seconds / 60)}:${`${seconds % 60}`.padStart(2, "0")}`,
  );
};

export const copyText = async (value: string) => {
  await navigator.clipboard.writeText(value);
};
