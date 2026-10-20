import { LandingEnhancer } from "@/components/landing-enhancer";
import { LandingEntryModals } from "@/components/landing-entry-modals";
import { landingCopy, type LandingLanguage } from "@/lib/landing-copy";
import type { MatchTarget, PlayerMode } from "@/lib/types";
import { cn, formatLocalizedNumber } from "@/lib/utils";

type LandingScreenProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

type HeroCardsProps = {
  isFa: boolean;
  language: LandingLanguage;
};

const revealClass =
  "translate-y-6 opacity-0 transition-[opacity,transform] duration-900 ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:translate-y-0 motion-reduce:transition-opacity motion-reduce:duration-200";

const navLinkClass =
  "relative text-[12px] uppercase tracking-[0.32em] text-(--muted) transition-colors duration-200 after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-(--gold) after:transition-[width] after:duration-300 after:content-[''] hover:text-(--ivory) hover:after:w-full";

const primaryButtonClass =
  "button-primary px-5.5 py-3.25 text-[12px] shadow-[0_8px_30px_rgba(227,178,90,0.2)]";

const secondaryButtonClass = "button-secondary px-5.5 py-3.25 text-[12px]";

const sectionTagClass = "text-xl uppercase tracking-[0.22em] text-(--muted)";
const glassPanelClass =
  "rounded-[18px] border border-(--line) bg-(--glass) backdrop-blur-[10px]";
const cardHoverClass =
  "transition-[opacity,transform,border-color,background] duration-350 hover:-translate-y-1.5 hover:border-[rgba(227,178,90,0.4)] hover:bg-(--glass-strong)";

function splitTitle(title: string, emphasis: string) {
  const [before, after = ""] = title.split(emphasis);
  return { before, emphasis, after };
}

function HeroCards({ isFa, language }: HeroCardsProps) {
  return (
    <div
      data-reveal
      className="relative h-107.5 translate-y-6 opacity-0 perspective-[1400px] transition-[opacity,transform] duration-900 ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:translate-y-0 motion-reduce:transition-opacity md:h-130"
      style={{ transitionDelay: ".28s" }}
    >
      <article className="hero-card hero-card-back absolute left-[4%] top-16 h-65 w-45 rounded-[18px] border border-[rgba(227,178,90,0.32)] bg-[linear-gradient(160deg,#142b22,#0b1813)] p-4.5 shadow-[0_30px_70px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.18)] before:absolute before:inset-3.5 before:rounded-xl before:border before:border-[rgba(227,178,90,0.34)] before:content-[''] motion-reduce:animate-none md:left-0 md:h-82.5 md:w-57.5">
        <div className="grid h-full place-items-center font-serif text-[60px] text-[rgba(227,178,90,0.5)]">
          ♛
        </div>
      </article>
      <article className="hero-card hero-card-mid absolute left-[34%] top-7.5 h-65 w-45 rounded-[18px] border border-[rgba(255,255,255,0.5)] bg-[linear-gradient(160deg,#fbf8ef,#e9e2cf)] p-4.5 text-[#0c1410] shadow-[0_30px_70px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.18)] [animation-delay:-2.4s] motion-reduce:animate-none md:left-30 md:h-82.5 md:w-57.5">
        <span className="absolute left-4 top-3.5 flex flex-col items-center font-serif text-[26px] font-medium leading-[0.9]">
          K<span className="mt-0.5 text-[20px]">♣</span>
        </span>
        <span className="absolute inset-0 grid place-items-center font-serif text-[84px] leading-none md:text-[104px]">
          ♣
        </span>
        <span className="absolute bottom-3.5 right-4 flex rotate-180 flex-col items-center font-serif text-[26px] font-medium leading-[0.9]">
          K<span className="mt-0.5 text-[20px]">♣</span>
        </span>
      </article>
      <article className="hero-card hero-card-front absolute left-[60%] top-22 h-65 w-45 rounded-[18px] border border-[rgba(255,255,255,0.5)] bg-[linear-gradient(160deg,#fbf8ef,#e9e2cf)] p-4.5 text-[#0c1410] shadow-[0_30px_70px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.18)] [animation-delay:-4.8s] motion-reduce:animate-none md:left-60 md:h-82.5 md:w-57.5">
        <span className="absolute -top-3.25 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[linear-gradient(180deg,var(--gold-soft),var(--gold))] px-3 py-1.25 text-[9.5px] font-bold tracking-[0.18em] text-[#241a08] shadow-[0_6px_18px_rgba(227,178,90,0.4)]">
          ♛ {language === "fa" ? "حاکم" : "HAKEM"}
        </span>
        <span className="absolute left-4 top-3.5 flex flex-col items-center font-serif text-[26px] font-medium leading-[0.9] text-(--crimson)">
          A<span className="mt-0.5 text-[20px]">♥</span>
        </span>
        <span className="absolute inset-0 grid place-items-center font-serif text-[84px] leading-none text-(--crimson) md:text-[104px]">
          ♥
        </span>
        <span className="absolute bottom-3.5 right-4 flex rotate-180 flex-col items-center font-serif text-[26px] font-medium leading-[0.9] text-(--crimson)">
          A<span className="mt-0.5 text-[20px]">♥</span>
        </span>
      </article>
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 mx-auto h-20 w-72 rounded-full bg-[radial-gradient(circle,rgba(227,178,90,0.12),transparent_72%)] blur-2xl",
          isFa && "w-80",
        )}
      />
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
  const initialMode: PlayerMode = searchParams.mode === "2" ? 2 : 4;
  const titleHow = splitTitle(copy.howTitle, copy.howEmphasis);
  const titleSets = splitTitle(copy.setsTitle, copy.setsEmphasis);
  const titleRules = splitTitle(copy.rulesTitle, copy.rulesEmphasis);
  const createHref =
    language === "en" ? "/?modal=create" : "/?lang=fa&modal=create";
  const joinHref = language === "en" ? "/?modal=join" : "/?lang=fa&modal=join";
  const langToggleHref = language === "en" ? "/?lang=fa" : "/";
  const isFa = language === "fa";
  const formatNumber = (value: number) => formatLocalizedNumber(value, language);
  const titleFontClass = isFa ? "font-fa-sans" : "font-serif";
  const labelClass = cn(
    "font-mono text-[12px] uppercase tracking-[0.32em]",
    isFa && "font-fa-sans text-[13px] normal-case tracking-[0.04em]",
  );
  const navItems = [
    { href: "#play", label: copy.navPlay },
    { href: "#how", label: copy.navHow },
    { href: "#sets", label: copy.navSets },
    { href: "#rules", label: copy.navRules },
  ];

  return (
    <main
      className={cn(
        "relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#08090a_0%,#0a0d0b_50%,#08090a_100%)] text-(--ivory)",
        "before:pointer-events-none before:fixed before:inset-0 before:z-1 before:bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")] before:opacity-[0.055] before:mix-blend-overlay before:content-['']",
        isFa ? "font-fa-sans" : "font-sans",
      )}
      style={{
        backgroundImage:
          "radial-gradient(110% 90% at 15% 4%, rgba(227, 178, 90, 0.11), transparent 55%), radial-gradient(95% 85% at 88% 26%, rgba(47, 99, 80, 0.085), transparent 55%), radial-gradient(140% 130% at 50% 125%, rgba(13, 18, 16, 0.6), transparent 62%), linear-gradient(180deg, #08090a 0%, #0a0d0b 50%, #08090a 100%)",
      }}
      dir={isFa ? "rtl" : "ltr"}
      lang={language}
    >
      <LandingEnhancer language={language} />
      <LandingEntryModals
        key={`${language}-${initialModal ?? "none"}-${initialJoinCode}-${initialTarget}-${initialMode}`}
        language={language}
        initialModal={initialModal}
        initialJoinCode={initialJoinCode}
        initialTarget={initialTarget}
        initialMode={initialMode}
      />
      <div className="pointer-events-none fixed inset-[-30%] z-0 bg-[radial-gradient(40%_40%_at_50%_50%,rgba(47,99,80,0.05),transparent_70%)] animate-[drift_26s_ease-in-out_infinite_alternate] motion-reduce:animate-none" />
      <div className="pointer-events-none fixed left-[-3vw] top-[42vh] z-0 rotate-[-8deg] select-none font-serif text-[46vw] leading-none text-white/[0.012]">
        ♠
      </div>

      <div className="relative z-2 mx-auto max-w-310 px-5 pb-15 md:px-8">
        <nav
          data-reveal
          className={cn(
            "flex items-center justify-between gap-5 py-6.5",
            revealClass,
          )}
        >
          <div
            className={cn(
              "brand-mark text-[22px]",
              isFa && "gap-3 text-[26px] font-semibold",
            )}
          >
            {copy.brand}
          </div>
          <div className="nav-links hidden gap-8.5 md:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                className={cn(
                  navLinkClass,
                  isFa &&
                    "font-fa-sans text-[13px] normal-case tracking-[0.04em]",
                )}
                href={item.href}
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3.5">
            <a
              className={cn(
                "lang-toggle inline-flex items-center justify-center rounded-full border border-[rgba(227,178,90,0.4)] px-5.5 py-3.25 text-(--gold) transition-transform duration-200 hover:-translate-y-0.5",
                labelClass,
              )}
              href={langToggleHref}
            >
              {language === "en" ? "فارسی" : "EN"}
            </a>
            <a
              className={cn(
                primaryButtonClass,
                isFa &&
                  "font-fa-sans text-[13px] normal-case tracking-[0.04em]",
              )}
              href={createHref}
              data-create-link
            >
              {copy.createRoom}
            </a>
          </div>
        </nav>

        <section
          id="play"
          className="grid min-h-[78vh] items-center gap-7.5 py-5 md:grid-cols-[1.05fr_0.95fr] md:py-12 md:pb-20"
        >
          <div>
            <p
              data-reveal
              className={cn(
                "eyebrow flex items-center gap-3.5 text-(--gold) before:h-px before:w-11.5 before:bg-(--gold) before:opacity-60 before:content-['']",
                revealClass,
                isFa && "text-[13px] tracking-[0.04em] normal-case",
              )}
            >
              {copy.heroEyebrow}
            </p>
            <h1
              data-reveal
              className={cn(
                "hero-title mt-2.5 text-[clamp(72px,13vw,184px)] font-light leading-[0.86] tracking-[-0.02em]",
                revealClass,
                titleFontClass,
                isFa &&
                  "text-[clamp(80px,15vw,180px)] leading-[1.02] tracking-[-0.03em]",
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
                "my-6.5 mb-9 max-w-110 text-[clamp(16px,1.5vw,20px)] leading-[1.65] text-(--muted)",
                revealClass,
                isFa &&
                  "max-w-132 text-[clamp(18px,1.8vw,22px)] leading-[1.95] text-[#a9ada7]",
              )}
              style={{ transitionDelay: ".12s" }}
            >
              {copy.heroBody}
            </p>
            <div
              data-reveal
              className={cn("flex flex-wrap items-center gap-3.5", revealClass)}
              style={{ transitionDelay: ".18s" }}
            >
              <a
                className={cn(
                  primaryButtonClass,
                  isFa &&
                    "font-fa-sans text-[13px] normal-case tracking-[0.04em]",
                )}
                href={createHref}
                data-create-link
              >
                {copy.createARoom}
              </a>
              <a
                className={cn(
                  secondaryButtonClass,
                  isFa &&
                    "font-fa-sans text-[13px] normal-case tracking-[0.04em]",
                )}
                href={joinHref}
                data-join-link
              >
                {copy.joinWithCode}
              </a>
            </div>
            <div
              data-reveal
              className={cn(
                "mt-10.5 flex flex-wrap gap-4.5 text-[11px] uppercase tracking-[0.2em] text-(--muted)",
                revealClass,
                isFa && "text-[12px] tracking-[0.04em] normal-case",
              )}
              style={{ transitionDelay: ".24s" }}
            >
              {copy.meta.map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <i className="h-1.25 w-1.25 rounded-full bg-(--gold) shadow-[0_0_10px_rgba(227,178,90,0.7)]" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <HeroCards isFa={isFa} language={language} />
        </section>

        <section id="how" className="py-22.5">
          <div
            data-reveal
            className={cn(
              "mb-12 flex flex-wrap items-end justify-between gap-6 border-t border-(--line) pt-8.5",
              revealClass,
            )}
          >
            <h2
              className={cn(
                "section-title max-w-160 text-[clamp(24px,4.5vw,44px)] font-light leading-none tracking-[-0.01em]",
                titleFontClass,
                isFa && "leading-[1.35]",
              )}
            >
              {titleHow.before}
              <em
                className={cn(
                  "font-medium text-(--gold-soft)",
                  !isFa && "italic",
                )}
              >
                {titleHow.emphasis}
              </em>
              {titleHow.after}
            </h2>
            <div
              className={cn(
                sectionTagClass,
                isFa &&
                  "font-fa-sans text-[17px] normal-case tracking-[0.04em]",
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
                  "relative overflow-hidden px-5.5 pb-7.5 pt-6.5",
                  glassPanelClass,
                  cardHoverClass,
                  revealClass,
                )}
                style={{ transitionDelay: `${0.08 * index}s` }}
              >
                <div
                  className={cn(
                    "feature-number text-xl tracking-[0.2em] text-(--gold)",
                    isFa && "fa-number-display text-[17px] tracking-[0.04em]",
                  )}
                >
                  {step.number}
                </div>
                <div
                  className={cn(
                    "pointer-events-none absolute -bottom-5.5 text-[120px] leading-none opacity-[0.07]",
                    isFa ? "-left-2.5" : "-right-2.5",
                    titleFontClass,
                  )}
                >
                  {step.suit}
                </div>
                <h3
                  className={cn(
                    "feature-title mb-2.5 mt-7.5 text-[22px] font-medium",
                    titleFontClass,
                    isFa && "text-[26px] leading-normal",
                  )}
                >
                  {step.title}
                </h3>
                <p
                  className={cn(
                    "text-[14.5px] leading-[1.6] text-(--muted)",
                    isFa && "text-[16px] leading-[1.9] text-[#a9ada7]",
                  )}
                >
                  {step.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id="sets" className="pb-22.5">
          <article
            data-reveal
            className={cn(
              "relative grid gap-10 overflow-hidden rounded-3xl border border-(--line) bg-(--glass) p-11.5 backdrop-blur-[10px] xl:grid-cols-[1fr_auto]",
              revealClass,
            )}
          >
            <div
              className={cn(
                "pointer-events-none absolute -top-22.5 text-[300px] leading-none text-[rgba(227,178,90,0.04)]",
                isFa ? "-left-10" : "-right-10",
                titleFontClass,
              )}
            >
              ♛
            </div>
            <div>
              <h3
                className={cn(
                  "sets-title text-[clamp(28px,3.4vw,42px)] font-light leading-[1.05]",
                  titleFontClass,
                  isFa && "leading-[1.45]",
                )}
              >
                {titleSets.before}
                <em
                  className={cn(
                    "font-medium text-(--gold-soft)",
                    !isFa && "italic",
                  )}
                >
                  {titleSets.emphasis}
                </em>
                {titleSets.after}
              </h3>
              <p
                className={cn(
                  "mt-3 text-[14.5px] leading-[1.6] text-(--muted)",
                  isFa && "max-w-136 text-[16px] leading-[1.9] text-[#a9ada7]",
                )}
              >
                {copy.setsBody}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {copy.chips.map((chip) => (
                <div
                  key={chip.value}
                  className={cn(
                    "min-w-23.5 rounded-[14px] border px-5.5 py-5 text-center transition-[transform,border-color,background] duration-300 hover:-translate-y-1",
                    chip.value === initialTarget
                      ? "border-transparent bg-[linear-gradient(180deg,var(--gold-soft),var(--gold))] text-[#241a08]"
                      : "border-(--line) bg-black/20 hover:border-[rgba(227,178,90,0.5)]",
                  )}
                >
                  <span
                    className={cn(
                      "block font-mono text-[34px] font-bold leading-none",
                      isFa && "fa-number-display",
                    )}
                  >
                    {formatNumber(chip.value)}
                  </span>
                  <span
                    className={cn(
                      "length-chip-label mt-1.5 block text-[10px] uppercase tracking-[0.18em] opacity-70",
                      isFa &&
                        "font-fa-sans text-[12px] normal-case tracking-[0.04em]",
                    )}
                  >
                    {chip.label}
                  </span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section id="rules" className="py-22.5">
          <div
            data-reveal
            className={cn(
              "mb-12 flex flex-wrap items-end justify-between gap-6 border-t border-(--line) pt-8.5",
              revealClass,
            )}
          >
            <h2
              className={cn(
                "rule-title max-w-160 text-[clamp(24px,4.5vw,44px)] font-light leading-none tracking-[-0.01em]",
                titleFontClass,
                isFa && "leading-[1.35]",
              )}
            >
              {titleRules.before}
              <em
                className={cn(
                  "font-medium text-(--gold-soft)",
                  !isFa && "italic",
                )}
              >
                {titleRules.emphasis}
              </em>
              {titleRules.after}
            </h2>
            <div
              className={cn(
                sectionTagClass,
                isFa &&
                  "font-fa-sans text-[17px] normal-case tracking-[0.04em]",
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
                  "px-5.5 pb-7.5 pt-6.5",
                  glassPanelClass,
                  cardHoverClass,
                  revealClass,
                )}
                style={{ transitionDelay: `${0.06 * index}s` }}
              >
                <p
                  className={cn(
                    "rule-kicker text-xl uppercase tracking-[0.22em] text-(--muted)",
                    isFa &&
                      "font-fa-sans text-[16px] normal-case tracking-[0.04em]",
                  )}
                >
                  {rule.kicker}
                </p>
                <h3
                  className={cn(
                    "rule-title mb-2.5 mt-7.5 text-[22px] font-medium",
                    titleFontClass,
                    isFa && "text-[26px] leading-normal",
                  )}
                >
                  {rule.title}
                </h3>
                <p
                  className={cn(
                    "text-[14.5px] leading-[1.6] text-(--muted)",
                    isFa && "text-[16px] leading-[1.9] text-[#a9ada7]",
                  )}
                >
                  {rule.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="py-22.5">
          <div
            data-reveal
            className={cn(
              "flex flex-wrap items-end justify-between gap-6 border-t border-(--line) pt-8.5",
              revealClass,
            )}
          >
            <div className="max-w-170">
              <p
                className={cn(
                  "eyebrow flex items-center gap-3.5 text-(--gold) before:h-px before:w-11.5 before:bg-(--gold) before:opacity-60 before:content-['']",
                  isFa && "text-[13px] tracking-[0.04em] normal-case",
                )}
              >
                {copy.closingEyebrow}
              </p>
              <h2
                className={cn(
                  "section-title mt-4 text-[clamp(24px,4.5vw,44px)] font-light leading-none tracking-[-0.01em]",
                  titleFontClass,
                  isFa && "leading-[1.35]",
                )}
              >
                {copy.closingTitle}
              </h2>
              <p
                className={cn(
                  "mt-4.5 max-w-130 text-[14.5px] leading-[1.6] text-(--muted)",
                  isFa && "text-[16px] leading-[1.9] text-[#a9ada7]",
                )}
              >
                {copy.closingBody}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3.5">
              <a
                className={cn(
                  primaryButtonClass,
                  isFa &&
                    "font-fa-sans text-[13px] normal-case tracking-[0.04em]",
                )}
                href={createHref}
                data-create-link
              >
                {copy.createARoom}
              </a>
              <a
                className={cn(
                  secondaryButtonClass,
                  isFa &&
                    "font-fa-sans text-[13px] normal-case tracking-[0.04em]",
                )}
                href={joinHref}
                data-join-link
              >
                {copy.joinWithCode}
              </a>
            </div>
          </div>
        </section>

        <footer
          data-reveal
          className={cn(
            "mt-10 flex flex-wrap items-center justify-between gap-6 border-t border-(--line) py-11.5 pb-15",
            revealClass,
          )}
        >
          <div
            className={cn(
              "brand-mark text-[22px]",
              isFa && "gap-3 text-[24px] font-semibold",
            )}
          >
            {copy.brand}
          </div>
          <div
            className={cn(
              "footer-meta text-xl uppercase tracking-[0.22em] text-(--muted)",
              isFa && "font-fa-sans text-[16px] normal-case tracking-[0.04em]",
            )}
          >
            {copy.footerMeta}
          </div>
          <a
            className={cn(
              primaryButtonClass,
              isFa && "font-fa-sans text-[13px] normal-case tracking-[0.04em]",
            )}
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
