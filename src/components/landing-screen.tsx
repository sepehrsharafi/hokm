import { LandingEnhancer } from "@/components/landing-enhancer";
import { LandingEntryModals } from "@/components/landing-entry-modals";
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
    <div className="hero-stage reveal" style={{ transitionDelay: ".28s" }}>
      <article className="hero-card hero-card-back float-card">
        <div className="hero-card-back-mark">♛</div>
      </article>
      <article className="hero-card hero-card-front float-card delay-two">
        <span className="card-corner corner-top">
          {language === "fa" ? "ش" : "K"}
          <span>♣</span>
        </span>
        <span className="card-glyph">♣</span>
        <span className="card-corner corner-bottom">
          {language === "fa" ? "ش" : "K"}
          <span>♣</span>
        </span>
      </article>
      <article className="hero-card hero-card-front hero-card-top float-card delay-three">
        <span className="hakem-badge">♛ {language === "fa" ? "حاکم" : "HÂKEM"}</span>
        <span className="card-corner corner-top card-red">
          {language === "fa" ? "آ" : "A"}
          <span>♥</span>
        </span>
        <span className="card-glyph card-red">♥</span>
        <span className="card-corner corner-bottom card-red">
          {language === "fa" ? "آ" : "A"}
          <span>♥</span>
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
    typeof searchParams.join === "string" ? searchParams.join.toUpperCase() : "";
  const initialTarget =
    searchParams.target === "3" || searchParams.target === "5" || searchParams.target === "7"
      ? (Number(searchParams.target) as MatchTarget)
      : 7;
  const titleHow = splitTitle(copy.howTitle, copy.howEmphasis);
  const titleSets = splitTitle(copy.setsTitle, copy.setsEmphasis);
  const titleRules = splitTitle(copy.rulesTitle, copy.rulesEmphasis);
  const createHref =
    language === "en"
      ? "/?modal=create"
      : "/?lang=fa&modal=create";
  const joinHref =
    language === "en"
      ? "/?modal=join"
      : "/?lang=fa&modal=join";
  const langToggleHref =
    language === "en"
      ? "/?lang=fa"
      : "/";

  return (
    <main
      className="landing-shell"
      dir={language === "fa" ? "rtl" : "ltr"}
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
      <div className="landing-atmos" />
      <div className="landing-grain" />
      <div className="suit-watermark">♠</div>

      <div className="landing-wrap">
        <nav className="nav reveal">
          <div className="brand-mark">{copy.brand}</div>
          <div className="nav-links">
            <a href="#play">{copy.navPlay}</a>
            <a href="#how">{copy.navHow}</a>
            <a href="#sets">{copy.navSets}</a>
            <a href="#rules">{copy.navRules}</a>
          </div>
          <div className="nav-actions">
            <a className="lang-toggle" href={langToggleHref}>
              {language === "en" ? "فارسی" : "EN"}
            </a>
            <a className="button-primary" href={createHref} data-create-link>
              {copy.createRoom}
            </a>
          </div>
        </nav>

        <section className="hero" id="play">
          <div className="hero-copy">
            <p className="eyebrow reveal">{copy.heroEyebrow}</p>
            <h1 className="hero-title reveal" style={{ transitionDelay: ".05s" }}>
              {copy.heroTitle === "HOKM." ? (
                <>
                  HOKM<em>.</em>
                </>
              ) : (
                copy.heroTitle
              )}
            </h1>
            <p className="hero-body reveal" style={{ transitionDelay: ".12s" }}>
              {copy.heroBody}
            </p>
            <div className="hero-actions reveal" style={{ transitionDelay: ".18s" }}>
              <a className="button-primary" href={createHref} data-create-link>
                {copy.createARoom}
              </a>
              <a className="button-secondary" href={joinHref} data-join-link>
                {language === "fa" ? "ورود با کد ←" : "Join with a Code →"}
              </a>
            </div>
            <div className="hero-meta reveal" style={{ transitionDelay: ".24s" }}>
              {copy.meta.map((item) => (
                <span key={item}>
                  <i className="hero-dot" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <HeroCards language={language} />
        </section>

        <section className="section" id="how">
          <div className="section-head reveal">
            <h2 className="section-title">
              {titleHow.before}
              <em>{titleHow.emphasis}</em>
              {titleHow.after}
            </h2>
            <div className="section-tag">{copy.howTag}</div>
          </div>

          <div className="feature-grid">
            {copy.steps.map((step, index) => (
              <article
                key={step.title}
                className="feature-card reveal"
                style={{ transitionDelay: `${0.08 * index}s` }}
              >
                <div className="feature-number">{step.number}</div>
                <div className="feature-suit">{step.suit}</div>
                <h3 className="feature-title">{step.title}</h3>
                <p className="feature-body">{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section section-tight" id="sets">
          <article className="sets-panel reveal">
            <div className="sets-crown">♛</div>
            <div>
              <h3 className="sets-title">
                {titleSets.before}
                <em>{titleSets.emphasis}</em>
                {titleSets.after}
              </h3>
              <p className="sets-body">{copy.setsBody}</p>
            </div>
            <div className="chip-row">
              {copy.chips.map((chip) => (
                <div key={chip.value} className={chip.value === initialTarget ? "length-chip active" : "length-chip"}>
                  <span className="length-chip-number">
                    {language === "fa" ? chip.value.toLocaleString("fa-IR") : chip.value}
                  </span>
                  <span className="length-chip-label">{chip.label}</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="section" id="rules">
          <div className="section-head reveal">
            <h2 className="section-title">
              {titleRules.before}
              <em>{titleRules.emphasis}</em>
              {titleRules.after}
            </h2>
            <div className="section-tag">{copy.rulesTag}</div>
          </div>

          <div className="rules-grid">
            {copy.rules.map((rule, index) => (
              <article
                key={rule.title}
                className="rule-card reveal"
                style={{ transitionDelay: `${0.06 * index}s` }}
              >
                <p className="rule-kicker">{rule.kicker}</p>
                <h3 className="rule-title">{rule.title}</h3>
                <p className="rule-body">{rule.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section closing-section">
          <div className="section-head reveal">
            <div className="closing-copy">
              <p className="eyebrow">{copy.closingEyebrow}</p>
              <h2 className="section-title mt-4">{copy.closingTitle}</h2>
              <p className="closing-body">{copy.closingBody}</p>
            </div>
            <div className="hero-actions">
              <a className="button-primary" href={createHref} data-create-link>
                {copy.createARoom}
              </a>
              <a className="button-secondary" href={joinHref} data-join-link>
                {language === "fa" ? "ورود با کد ←" : "Join with a Code →"}
              </a>
            </div>
          </div>
        </section>

        <footer className="footer reveal">
          <div className="brand-mark">{copy.brand}</div>
          <div className="footer-meta">{copy.footerMeta}</div>
          <a className="button-primary" href={createHref} data-create-link>
            {copy.createRoom}
          </a>
        </footer>
      </div>
    </main>
  );
}
