import Link from "next/link";
import { readResult } from "@/lib/server/results-store";
import { formatLocalizedNumber, localizeDigits } from "@/lib/utils";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ResultsPage({ params }: Props) {
  const { id } = await params;
  const result = await readResult(id);
  const sideALabel = result?.mode === 2 ? "Player ۱" : "Team A";
  const sideBLabel = result?.mode === 2 ? "Player ۲" : "Team B";

  if (!result) {
    return (
      <main
        className="flex min-h-screen items-center justify-center px-6 text-(--ivory)"
        style={{
          backgroundImage:
            "radial-gradient(110% 90% at 15% 4%, rgba(227, 178, 90, 0.11), transparent 55%), radial-gradient(95% 85% at 88% 26%, rgba(47, 99, 80, 0.085), transparent 55%), radial-gradient(140% 130% at 50% 125%, rgba(13, 18, 16, 0.6), transparent 62%), linear-gradient(180deg, #08090a 0%, #0a0d0b 50%, #08090a 100%)",
        }}
      >
        <div className="max-w-xl rounded-3xl border border-(--line) bg-(--glass) p-10 text-center shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-[10px]">
          <h1 className="text-4xl font-semibold">Result not found</h1>
          <p className="mt-4 text-sm text-(--muted)">
            This results link is missing or expired.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-[linear-gradient(180deg,var(--gold-soft),var(--gold))] px-5.5 py-3.25 text-[12px] font-bold uppercase tracking-[0.08em] text-[#241a08] shadow-[0_8px_30px_rgba(227,178,90,0.2)] transition-transform duration-200 hover:-translate-y-0.5"
          >
            Return Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      className="px-6 py-10 text-(--ivory)"
      style={{
        backgroundImage:
          "radial-gradient(110% 90% at 15% 4%, rgba(227, 178, 90, 0.11), transparent 55%), radial-gradient(95% 85% at 88% 26%, rgba(47, 99, 80, 0.085), transparent 55%), radial-gradient(140% 130% at 50% 125%, rgba(13, 18, 16, 0.6), transparent 62%), linear-gradient(180deg, #08090a 0%, #0a0d0b 50%, #08090a 100%)",
      }}
    >
      <div className="mx-auto max-w-4xl space-y-8">
        <section className="overflow-hidden rounded-3xl border border-(--line) bg-(--glass) p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-[10px]">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="font-mono text-[12px] uppercase tracking-[0.32em] text-(--gold)">
                SERIES RESULT
              </p>
              <h1 className="mt-3 text-5xl font-semibold text-(--ivory)">
                {result.winner === "A" ? sideALabel : sideBLabel} won{" "}
                {formatLocalizedNumber(result.seriesWins.A)}-{formatLocalizedNumber(result.seriesWins.B)}
              </h1>
              <p className="mt-4 max-w-2xl text-(--muted)">
                Room {localizeDigits(result.roomCode)} played a Best of {formatLocalizedNumber(result.seriesTarget)} series. Each match
                used a first-to-
                {formatLocalizedNumber(result.target)} point target under the standard Hokm ruleset.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-(--line) bg-(--glass) px-5.5 py-3.25 text-(--ivory) backdrop-blur-[10px] transition-transform duration-200 hover:-translate-y-0.5"
            >
              New Table
            </Link>
          </div>
        </section>
        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-(--line) bg-(--glass) p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-[10px]">
            <p className="font-mono text-[12px] uppercase tracking-[0.32em] text-(--gold)">
              {sideALabel}
            </p>
            <ul className="mt-4 space-y-3">
              {result.teams.A.map((name) => (
                <li key={name} className="text-xl text-(--ivory)">
                  {name}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-(--line) bg-(--glass) p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-[10px]">
            <p className="font-mono text-[12px] uppercase tracking-[0.32em] text-(--gold)">
              {sideBLabel}
            </p>
            <ul className="mt-4 space-y-3">
              {result.teams.B.map((name) => (
                <li key={name} className="text-xl text-(--ivory)">
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </section>
        <section className="rounded-3xl border border-(--line) bg-(--glass) p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-[10px]">
          <p className="font-mono text-[12px] uppercase tracking-[0.32em] text-(--gold)">
            Match Summaries
          </p>
          <ul className="mt-4 space-y-3 text-(--muted)">
            {result.matchSummaries.map((summary, index) => (
              <li key={`${summary}-${index}`}>
                Match {formatLocalizedNumber(index + 1)}: {localizeDigits(summary)}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
