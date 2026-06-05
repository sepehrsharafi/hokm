import { LandingEnhancer } from "@/components/landing-enhancer";
import { LandingEntryModals } from "@/components/landing-entry-modals";
import { cn } from "@/lib/utils";
import { landingCopy, type LandingLanguage } from "@/lib/landing-copy";
import type { MatchTarget } from "@/lib/types";

type LandingScreenProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

function splitTitle(title: string, emphasis: string) {
  const [before, after = ""] = title.split(emphasis);
  return { before, emphasis, after };
}

function HeroCards({ language }: { language: LandingLanguage }) {
  return (
    <div
      data-reveal
      className="relative h-[430px] opacity-0 [perspective:1400px] transition-[opacity,transform] duration-[900ms] translate-y-6 [transition-timing-function:cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:translate-y-0 motion-reduce:transition-opacity md:h-[520px]"
      style={{ transitionDelay: ".28s" }}
    >
      <article className="absolute left-[4%] top-16 h-[260px] w-[180px] rounded-[18px] border border-[rgba(227,178,90,0.32)] bg-[linear-gradient(160deg,#142b22,#0b1813)] p-4.5 shadow-[0_30px_70px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.18)] [transform:rotate(-15deg)_translateZ(-40px)] [animation:float_7s_ease-in-out_infinite] before:absolute before:inset-[14px] before:rounded-[12px] before:border before:border-[rgba(227,178,90,0.34)] before:content-[''] motion-reduce:animate-none md:left-0 md:h-[330px] md:w-[230px]">
        <div className="grid h-full place-items-center font-serif text-[60px] text-[rgba(227,178,90,0.5)]">
          ♛
        </div>
      </article>
      <article className="absolute left-[34%] top-[30px] h-[260px] w-[180px] rounded-[18px] border border-[rgba(255,255,255,0.5)] bg-[linear-gradient(160deg,#fbf8ef,#e9e2cf)] p-4.5 text-[#0c1410] shadow-[0_30px_70px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.18)] [transform:rotate(-3deg)] [animation:float_7s_ease-in-out_infinite] [animation-delay:-2.4s] motion-reduce:animate-none md:left-[120px] md:h-[330px] md:w-[230px]">
        <span className="absolute left-4 top-3.5 flex flex-col items-center font-serif text-[26px] leading-[0.9] font-medium">
          K<span className="mt-0.5 text-[20px]">♣</span>
        </span>
        <span className="absolute inset-0 grid place-items-center font-serif text-[84px] leading-none md:text-[104px]">
          ♣
        </span>
        <span className="absolute bottom-3.5 right-4 flex rotate-180 flex-col items-center font-serif text-[26px] leading-[0.9] font-medium">
          K<span className="mt-0.5 text-[20px]">♣</span>
        </span>
      </article>
      <article className="absolute left-[60%] top-22 h-[260px] w-[180px] rounded-[18px] border border-[rgba(255,255,255,0.5)] bg-[linear-gradient(160deg,#fbf8ef,#e9e2cf)] p-4.5 text-[#0c1410] shadow-[0_30px_70px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.18)] [transform:rotate(11deg)_translateZ(60px)] [animation:float_7s_ease-in-out_infinite] [animation-delay:-4.8s] motion-reduce:animate-none md:left-[240px] md:h-[330px] md:w-[230px]">
        <span className="absolute -top-[13px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[linear-gradient(180deg,var(--gold-soft),var(--gold))] px-3 py-[5px] font-mono text-[9.5px] font-bold tracking-[0.18em] text-[#241a08] shadow-[0_6px_18px_rgba(227,178,90,0.4)]">
          ♛ {language === "fa" ? "حاکم" : "HÂKEM"}
        </span>
        <span className="absolute left-4 top-3.5 flex flex-col items-center font-serif text-[26px] leading-[0.9] font-medium text-(--crimson)">
          A<span className="mt-0.5 text-[20px]">♥</span>
        </span>
        <span className="absolute inset-0 grid place-items-center font-serif text-[84px] leading-none text-(--crimson) md:text-[104px]">
          ♥
        </span>
        <span className="absolute bottom-3.5 right-4 flex rotate-180 flex-col items-center font-serif text-[26px] leading-[0.9] font-medium text-(--crimson)">
          A<span className="mt-0.5 text-[20px]">♥</span>
        </span>
      </article>
    </div>
  );
}

export function LandingScreen({ searchParams }: LandingScreenProps) {
  const language: LandingLanguage = searchParams.lang === "fa" ? "fa" : "en";
  const copy = landingCopy[language];
  const initialModal =
    searchParams.modal === "create" || searchParams.modal === "join"
      ? searchParams.modal
      : null;
  const initialJoinCode =
    typeof searchParams.join === "string"
      ? searchParams.join.toUpperCase()
      : "";
  const initialTarget =
    searchParams.target === "3" ||
    searchParams.target === "5" ||
    searchParams.target === "7"
      ? (Number(searchParams.target) as MatchTarget)
      : 7;
  const titleHow = splitTitle(copy.howTitle, copy.howEmphasis);
  const titleSets = splitTitle(copy.setsTitle, copy.setsEmphasis);
  const titleRules = splitTitle(copy.rulesTitle, copy.rulesEmphasis);
  const createHref =
    language === "en" ? "/?modal=create" : "/?lang=fa&modal=create";
  const joinHref = language === "en" ? "/?modal=join" : "/?lang=fa&modal=join";
  const langToggleHref = language === "en" ? "/?lang=fa" : "/";
  const isFa = language === "fa";
  const revealClass =
    "opacity-0 translate-y-6 transition-[opacity,transform] duration-[900ms] [transition-timing-function:cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:translate-y-0 motion-reduce:transition-opacity motion-reduce:duration-200";

  return (
    <main
      className={cn(
        "relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#08090a_0%,#0a0d0b_50%,#08090a_100%)] text-(--ivory)",
        "before:pointer-events-none before:fixed before:inset-0 before:z-[1] before:bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")] before:opacity-[0.055] before:mix-blend-overlay before:content-['']",
        "font-sans",
        isFa && "font-fa-sans",
      )}
      style={{
        backgroundImage:
          "radial-gradient(110% 90% at 15% 4%, rgba(227, 178, 90, 0.11), transparent 55%), radial-gradient(95% 85% at 88% 26%, rgba(47, 99, 80, 0.085), transparent 55%), radial-gradient(140% 130% at 50% 125%, rgba(13, 18, 16, 0.6), transparent 62%), linear-gradient(180deg, #08090a 0%, #0a0d0b 50%, #08090a 100%)",
      }}
      dir={isFa ? "rtl" : "ltr"}
      lang={language}
    >
      <LandingEnhancer />
      <LandingEntryModals
        key={`${language}-${initialModal ?? "none"}-${initialJoinCode}-${initialTarget}`}
        language={language}
        initialModal={initialModal}
        initialJoinCode={initialJoinCode}
        initialTarget={initialTarget}
      />
      <div className="pointer-events-none fixed inset-[-30%] z-0 bg-[radial-gradient(40%_40%_at_50%_50%,rgba(47,99,80,0.05),transparent_70%)] [animation:drift_26s_ease-in-out_infinite_alternate] motion-reduce:animate-none" />
      <div className="pointer-events-none fixed left-[-3vw] top-[42vh] z-0 select-none font-serif text-[46vw] leading-none text-white/[0.012] rotate-[-8deg]">
        ♠
      </div>

      <div className="relative z-[2] mx-auto max-w-[1240px] px-5 pb-[60px] md:px-8">
        <nav
          data-reveal
          className={cn(
            "flex items-center justify-between gap-5 py-[26px]",
            revealClass,
          )}
        >
          <div
            className={cn(
              "inline-flex items-center gap-[11px] text-[22px] font-semibold",
              isFa ? "font-fa-serif" : "font-serif",
            )}
          >
            <span className="grid h-[30px] w-[30px] place-items-center rounded-[8px] border border-[var(--gold)] bg-[rgba(227,178,90,0.06)] text-(--gold) transition-transform duration-500 group-hover:rotate-[360deg]">
              ♠
            </span>
            {copy.brand}
          </div>
          <div className="hidden gap-[34px] md:flex">
            <a
              className="relative text-[12px] uppercase tracking-[0.32em] text-(--muted) transition-colors duration-200 after:absolute after:bottom-[-6px] after:left-0 after:h-px after:w-0 after:bg-[var(--gold)] after:transition-[width] after:duration-300 after:content-[''] hover:text-(--ivory) hover:after:w-full"
              href="#play"
            >
              {copy.navPlay}
            </a>
            <a
              className="relative text-[12px] uppercase tracking-[0.32em] text-(--muted) transition-colors duration-200 after:absolute after:bottom-[-6px] after:left-0 after:h-px after:w-0 after:bg-[var(--gold)] after:transition-[width] after:duration-300 after:content-[''] hover:text-(--ivory) hover:after:w-full"
              href="#how"
            >
              {copy.navHow}
            </a>
            <a
              className="relative text-[12px] uppercase tracking-[0.32em] text-(--muted) transition-colors duration-200 after:absolute after:bottom-[-6px] after:left-0 after:h-px after:w-0 after:bg-[var(--gold)] after:transition-[width] after:duration-300 after:content-[''] hover:text-(--ivory) hover:after:w-full"
              href="#sets"
            >
              {copy.navSets}
            </a>
            <a
              className="relative text-[12px] uppercase tracking-[0.32em] text-(--muted) transition-colors duration-200 after:absolute after:bottom-[-6px] after:left-0 after:h-px after:w-0 after:bg-[var(--gold)] after:transition-[width] after:duration-300 after:content-[''] hover:text-(--ivory) hover:after:w-full"
              href="#rules"
            >
              {copy.navRules}
            </a>
          </div>
          <div className="flex items-center gap-[14px]">
            <a
              className="inline-flex items-center justify-center rounded-full border border-[rgba(227,178,90,0.4)] px-5.5 py-3.25 text-[12px] tracking-[0.08em] text-(--gold) transition-transform duration-200 hover:-translate-y-0.5"
              href={langToggleHref}
            >
              {language === "en" ? "فارسی" : "EN"}
            </a>
            <a
              className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(180deg,var(--gold-soft),var(--gold))] px-5.5 py-3.25 text-[12px] font-bold uppercase tracking-[0.08em] text-[#241a08] shadow-[0_8px_30px_rgba(227,178,90,0.2)] transition-transform duration-200 hover:-translate-y-0.5"
              href={createHref}
              data-create-link
            >
              {copy.createRoom}
            </a>
          </div>
        </nav>

        <section
          id="play"
          className="grid min-h-[78vh] items-center gap-[30px] py-[20px] md:grid-cols-[1.05fr_0.95fr] md:py-[48px] md:pb-[80px]"
        >
          <div>
            <p
              data-reveal
              className={cn(
                "flex items-center gap-[14px] text-[12px] uppercase tracking-[0.32em] text-(--gold) before:h-px before:w-[46px] before:bg-[var(--gold)] before:opacity-60 before:content-['']",
                revealClass,
                isFa && "tracking-[0.04em] normal-case",
              )}
            >
              {copy.heroEyebrow}
            </p>
            <h1
              data-reveal
              className={cn(
                "mt-[10px] text-[clamp(72px,13vw,184px)] font-light leading-[0.86] tracking-[-0.02em]",
                revealClass,
                isFa ? "font-fa-serif" : "font-serif",
              )}
              style={{ transitionDelay: ".05s" }}
            >
              {copy.heroTitle === "HOKM." ? (
                <>
                  HOKM
                  <em className="font-medium italic text-(--gold-soft)">.</em>
                </>
              ) : (
                copy.heroTitle
              )}
            </h1>
            <p
              data-reveal
              className={cn(
                "my-[26px] mb-[36px] max-w-[440px] text-[clamp(16px,1.5vw,20px)] leading-[1.65] text-(--muted)",
                revealClass,
              )}
              style={{ transitionDelay: ".12s" }}
            >
              {copy.heroBody}
            </p>
            <div
              data-reveal
              className={cn(
                "flex flex-wrap items-center gap-[14px]",
                revealClass,
              )}
              style={{ transitionDelay: ".18s" }}
            >
              <a
                className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(180deg,var(--gold-soft),var(--gold))] px-5.5 py-3.25 text-[12px] font-bold uppercase tracking-[0.08em] text-[#241a08] shadow-[0_8px_30px_rgba(227,178,90,0.2)] transition-transform duration-200 hover:-translate-y-0.5"
                href={createHref}
                data-create-link
              >
                {copy.createARoom}
              </a>
              <a
                className="inline-flex items-center justify-center rounded-full border border-(--line) bg-(--glass) px-5.5 py-3.25 text-(--ivory) backdrop-blur-[10px] transition-transform duration-200 hover:-translate-y-0.5"
                href={joinHref}
                data-join-link
              >
                {language === "fa" ? "ورود با کد ←" : "Join with a Code →"}
              </a>
            </div>
            <div
              data-reveal
              className={cn(
                "mt-[42px] flex flex-wrap gap-4.5 text-[11px] uppercase tracking-[0.2em] text-(--muted)",
                revealClass,
                isFa && "tracking-[0.04em] normal-case",
              )}
              style={{ transitionDelay: ".24s" }}
            >
              {copy.meta.map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <i className="h-[5px] w-[5px] rounded-full bg-[var(--gold)] shadow-[0_0_10px_rgba(227,178,90,0.7)]" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <HeroCards language={language} />
        </section>

        <section id="how" className="py-[90px]">
          <div
            data-reveal
            className={cn(
              "mb-12 flex flex-wrap items-end justify-between gap-6 border-t border-(--line) pt-[34px]",
              revealClass,
            )}
          >
            <h2
              className={cn(
                "max-w-[640px] text-[clamp(34px,4.5vw,58px)] font-light leading-none tracking-[-0.01em]",
                isFa ? "font-fa-serif" : "font-serif",
              )}
            >
              {titleHow.before}
              <em className="font-medium italic text-(--gold-soft)">
                {titleHow.emphasis}
              </em>
              {titleHow.after}
            </h2>
            <div
              className={cn(
                "text-xl uppercase tracking-[0.22em] text-(--muted)",
                isFa && "tracking-[0.04em] normal-case",
              )}
            >
              {copy.howTag}
            </div>
          </div>

          <div className="grid gap-4.5 sm:grid-cols-2 xl:grid-cols-4">
            {copy.steps.map((step, index) => (
              <article
                key={step.title}
                data-reveal
                className={cn(
                  "relative overflow-hidden rounded-[18px] border border-(--line) bg-(--glass) px-5.5 pb-7.5 pt-6.5 backdrop-blur-[10px] transition-[opacity,transform,border-color,background] duration-[350ms] hover:-translate-y-1.5 hover:border-[rgba(227,178,90,0.4)] hover:bg-[var(--glass-strong)]",
                  revealClass,
                )}
                style={{ transitionDelay: `${0.08 * index}s` }}
              >
                <div
                  className={cn(
                    "text-xl tracking-[0.2em] text-(--gold)",
                    isFa && "tracking-[0.04em]",
                  )}
                >
                  {step.number}
                </div>
                <div
                  className={cn(
                    "pointer-events-none absolute -bottom-5.5 text-[120px] leading-none opacity-[0.07]",
                    isFa ? "-left-2.5" : "-right-2.5",
                    isFa ? "font-fa-serif" : "font-serif",
                  )}
                >
                  {step.suit}
                </div>
                <h3
                  className={cn(
                    "mb-[10px] mt-[30px] text-[22px] font-medium",
                    isFa ? "font-fa-serif" : "font-serif",
                  )}
                >
                  {step.title}
                </h3>
                <p className="text-[14.5px] leading-[1.6] text-(--muted)">
                  {step.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id="sets" className="pb-[90px]">
          <article
            data-reveal
            className={cn(
              "relative grid gap-10 overflow-hidden rounded-3xl border border-(--line) bg-(--glass) p-[46px] backdrop-blur-[10px] xl:grid-cols-[1fr_auto]",
              revealClass,
            )}
          >
            <div
              className={cn(
                "pointer-events-none absolute top-[-90px] text-[300px] leading-none text-[rgba(227,178,90,0.04)]",
                isFa ? "left-[-40px]" : "right-[-40px]",
                isFa ? "font-fa-serif" : "font-serif",
              )}
            >
              ♛
            </div>
            <div>
              <h3
                className={cn(
                  "text-[clamp(28px,3.4vw,42px)] font-light leading-[1.05]",
                  isFa ? "font-fa-serif" : "font-serif",
                )}
              >
                {titleSets.before}
                <em className="font-medium italic text-(--gold-soft)">
                  {titleSets.emphasis}
                </em>
                {titleSets.after}
              </h3>
              <p className="mt-3 text-[14.5px] leading-[1.6] text-(--muted)">
                {copy.setsBody}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {copy.chips.map((chip) => (
                <div
                  key={chip.value}
                  className={cn(
                    "min-w-[94px] rounded-[14px] border px-5.5 py-5 text-center transition-[transform,border-color,background] duration-300 hover:-translate-y-1",
                    chip.value === initialTarget
                      ? "border-transparent bg-[linear-gradient(180deg,var(--gold-soft),var(--gold))] text-[#241a08]"
                      : "border-(--line) bg-black/20 hover:border-[rgba(227,178,90,0.5)]",
                  )}
                >
                  <span className="block font-mono text-[34px] font-bold leading-none">
                    {language === "fa"
                      ? chip.value.toLocaleString("fa-IR")
                      : chip.value}
                  </span>
                  <span
                    className={cn(
                      "mt-1.5 block text-[10px] uppercase tracking-[0.18em] opacity-70",
                      isFa && "tracking-[0.04em] normal-case",
                    )}
                  >
                    {chip.label}
                  </span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section id="rules" className="py-[90px]">
          <div
            data-reveal
            className={cn(
              "mb-12 flex flex-wrap items-end justify-between gap-6 border-t border-(--line) pt-[34px]",
              revealClass,
            )}
          >
            <h2
              className={cn(
                "max-w-[640px] text-[clamp(34px,4.5vw,58px)] font-light leading-none tracking-[-0.01em]",
                isFa ? "font-fa-serif" : "font-serif",
              )}
            >
              {titleRules.before}
              <em className="font-medium italic text-(--gold-soft)">
                {titleRules.emphasis}
              </em>
              {titleRules.after}
            </h2>
            <div
              className={cn(
                "text-xl uppercase tracking-[0.22em] text-(--muted)",
                isFa && "tracking-[0.04em] normal-case",
              )}
            >
              {copy.rulesTag}
            </div>
          </div>

          <div className="grid gap-4.5 sm:grid-cols-2 xl:grid-cols-3">
            {copy.rules.map((rule, index) => (
              <article
                key={rule.title}
                data-reveal
                className={cn(
                  "rounded-[18px] border border-(--line) bg-(--glass) px-5.5 pb-7.5 pt-6.5 backdrop-blur-[10px] transition-[opacity,transform,border-color,background] duration-[350ms] hover:-translate-y-1.5 hover:border-[rgba(227,178,90,0.4)] hover:bg-[var(--glass-strong)]",
                  revealClass,
                )}
                style={{ transitionDelay: `${0.06 * index}s` }}
              >
                <p
                  className={cn(
                    "text-xl uppercase tracking-[0.22em] text-(--muted)",
                    isFa && "tracking-[0.04em] normal-case",
                  )}
                >
                  {rule.kicker}
                </p>
                <h3
                  className={cn(
                    "mb-[10px] mt-[30px] text-[22px] font-medium",
                    isFa ? "font-fa-serif" : "font-serif",
                  )}
                >
                  {rule.title}
                </h3>
                <p className="text-[14.5px] leading-[1.6] text-(--muted)">
                  {rule.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="py-[90px]">
          <div
            data-reveal
            className={cn(
              "flex flex-wrap items-end justify-between gap-6 border-t border-(--line) pt-[34px]",
              revealClass,
            )}
          >
            <div className="max-w-[680px]">
              <p
                className={cn(
                  "flex items-center gap-[14px] text-[12px] uppercase tracking-[0.32em] text-(--gold) before:h-px before:w-[46px] before:bg-[var(--gold)] before:opacity-60 before:content-['']",
                  isFa && "tracking-[0.04em] normal-case",
                )}
              >
                {copy.closingEyebrow}
              </p>
              <h2
                className={cn(
                  "mt-4 text-[clamp(34px,4.5vw,58px)] font-light leading-none tracking-[-0.01em]",
                  isFa ? "font-fa-serif" : "font-serif",
                )}
              >
                {copy.closingTitle}
              </h2>
              <p className="mt-[18px] max-w-[520px] text-[14.5px] leading-[1.6] text-(--muted)">
                {copy.closingBody}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-[14px]">
              <a
                className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(180deg,var(--gold-soft),var(--gold))] px-5.5 py-3.25 text-[12px] font-bold uppercase tracking-[0.08em] text-[#241a08] shadow-[0_8px_30px_rgba(227,178,90,0.2)] transition-transform duration-200 hover:-translate-y-0.5"
                href={createHref}
                data-create-link
              >
                {copy.createARoom}
              </a>
              <a
                className="inline-flex items-center justify-center rounded-full border border-(--line) bg-(--glass) px-5.5 py-3.25 text-(--ivory) backdrop-blur-[10px] transition-transform duration-200 hover:-translate-y-0.5"
                href={joinHref}
                data-join-link
              >
                {language === "fa" ? "ورود با کد ←" : "Join with a Code →"}
              </a>
            </div>
          </div>
        </section>

        <footer
          data-reveal
          className={cn(
            "mt-10 flex flex-wrap items-center justify-between gap-6 border-t border-(--line) py-[46px] pb-[60px]",
            revealClass,
          )}
        >
          <div
            className={cn(
              "inline-flex items-center gap-[11px] text-[22px] font-semibold",
              isFa ? "font-fa-serif" : "font-serif",
            )}
          >
            <span className="grid h-[30px] w-[30px] place-items-center rounded-[8px] border border-[var(--gold)] bg-[rgba(227,178,90,0.06)] text-(--gold)">
              ♠
            </span>
            {copy.brand}
          </div>
          <div
            className={cn(
              "text-xl uppercase tracking-[0.22em] text-(--muted)",
              isFa && "tracking-[0.04em] normal-case",
            )}
          >
            {copy.footerMeta}
          </div>
          <a
            className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(180deg,var(--gold-soft),var(--gold))] px-5.5 py-3.25 text-[12px] font-bold uppercase tracking-[0.08em] text-[#241a08] shadow-[0_8px_30px_rgba(227,178,90,0.2)] transition-transform duration-200 hover:-translate-y-0.5"
            href={createHref}
            data-create-link
          >
            {copy.createRoom}
          </a>
        </footer>
      </div>
    </main>
  );
}
