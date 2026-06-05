import { clsx } from "clsx";

export const cn = (...inputs: Array<string | false | null | undefined>) => clsx(inputs);

export const formatCountdown = (pausedUntil: number) => {
  const remaining = Math.max(0, pausedUntil - Date.now());
  const seconds = Math.ceil(remaining / 1000);
  return `${Math.floor(seconds / 60)}:${`${seconds % 60}`.padStart(2, "0")}`;
};

export const copyText = async (value: string) => {
  await navigator.clipboard.writeText(value);
};
