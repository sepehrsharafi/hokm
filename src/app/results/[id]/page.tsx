import Link from "next/link";
import { readResult } from "@/lib/server/results-store";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ResultsPage({ params }: Props) {
  const { id } = await params;
  const result = await readResult(id);

  if (!result) {
    return (
      <main className="page-shell flex min-h-screen items-center justify-center px-6">
        <div className="panel max-w-xl p-10 text-center">
          <h1 className="text-4xl font-semibold">Result not found</h1>
          <p className="mt-4 text-sm text-[--muted]">
            This results link is missing or expired.
          </p>
          <Link href="/" className="button-primary mt-8 inline-flex">
            Return Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell px-6 py-10">
      <div className="mx-auto max-w-4xl space-y-8">
        <section className="panel overflow-hidden p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="eyebrow">SERIES RESULT</p>
              <h1 className="mt-3 text-5xl font-semibold text-[--ivory]">
                {result.winner === "A" ? "Team A" : "Team B"} won {result.seriesWins.A}-
                {result.seriesWins.B}
              </h1>
              <p className="mt-4 max-w-2xl text-[--muted]">
                Room {result.roomCode} played a Best of 7 series. Each match used a first-to-
                {result.target} point target under the standard Hokm ruleset.
              </p>
            </div>
            <Link href="/" className="button-secondary">
              New Table
            </Link>
          </div>
        </section>
        <section className="grid gap-6 md:grid-cols-2">
          <div className="panel p-6">
            <p className="mono-label">Team A</p>
            <ul className="mt-4 space-y-3">
              {result.teams.A.map((name) => (
                <li key={name} className="text-xl text-[--ivory]">
                  {name}
                </li>
              ))}
            </ul>
          </div>
          <div className="panel p-6">
            <p className="mono-label">Team B</p>
            <ul className="mt-4 space-y-3">
              {result.teams.B.map((name) => (
                <li key={name} className="text-xl text-[--ivory]">
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </section>
        <section className="panel p-6">
          <p className="mono-label">Match Summaries</p>
          <ul className="mt-4 space-y-3 text-[--muted]">
            {result.matchSummaries.map((summary, index) => (
              <li key={`${summary}-${index}`}>Match {index + 1}: {summary}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
