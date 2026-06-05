import type { MatchTarget } from "@/lib/types";

export type LandingLanguage = "en" | "fa";

export const landingCopy: Record<
  LandingLanguage,
  {
    brand: string;
    navPlay: string;
    navHow: string;
    navSets: string;
    navRules: string;
    createRoom: string;
    createARoom: string;
    joinWithCode: string;
    heroEyebrow: string;
    heroTitle: string;
    heroBody: string;
    meta: string[];
    howTitle: string;
    howEmphasis: string;
    howTag: string;
    steps: Array<{ number: string; suit: string; title: string; body: string }>;
    setsTitle: string;
    setsEmphasis: string;
    setsBody: string;
    chips: Array<{ value: MatchTarget; label: string }>;
    rulesTitle: string;
    rulesEmphasis: string;
    rulesTag: string;
    rules: Array<{ kicker: string; title: string; body: string }>;
    closingEyebrow: string;
    closingTitle: string;
    closingBody: string;
    footerMeta: string;
    createModalTitle: string;
    createModalBody: string;
    joinModalTitle: string;
    joinModalBody: string;
    yourName: string;
    roomCode: string;
    matchLength: string;
    egSara: string;
    egCode: string;
    createTable: string;
    joinTable: string;
    spectateTable: string;
    creating: string;
    joining: string;
    advanced: string;
    kotBonus: string;
    invalidName: string;
    invalidCode: string;
    notFound: string;
    roomFull: string;
    roomFullSpectate: string;
    createFailed: string;
  }
> = {
  en: {
    brand: "HOKM",
    navPlay: "Play",
    navHow: "How it works",
    navSets: "Sets",
    navRules: "Rules",
    createRoom: "Create Room",
    createARoom: "Create a Room",
    joinWithCode: "Join with a Code",
    heroEyebrow: "The Persian game of command",
    heroTitle: "HOKM.",
    heroBody:
      "Gather four. Crown the Hâkem, call the trump, and take the table one trick at a time. No sign-ups — just a room, a code, and your people.",
    meta: ["Real-time", "4 Players · 2 Teams", "Play as guest"],
    howTitle: "Four friends. One table. Sixty seconds to deal.",
    howEmphasis: "Sixty seconds",
    howTag: "/ How it works",
    steps: [
      {
        number: "01",
        suit: "♥",
        title: "Open a room",
        body: "Spin up a private table in one tap. We hand you a short code instantly.",
      },
      {
        number: "02",
        suit: "♠",
        title: "Invite three",
        body: "Share the link. Friends drop in as guests and take their seats — partners sit across.",
      },
      {
        number: "03",
        suit: "♦",
        title: "Call the trump",
        body: "The Hâkem reads the first five cards and declares the suit that rules the round.",
      },
      {
        number: "04",
        suit: "♣",
        title: "Share the win",
        body: "First to seven tricks takes the hand. Settle the match, then post the result.",
      },
    ],
    setsTitle: "Play it short, or play it to the wire.",
    setsEmphasis: "to the wire.",
    setsBody:
      "Set the length when you open the table. First team to reach the target wins — a Kot sweep can swing it in a single hand.",
    chips: [
      { value: 3, label: "Quick" },
      { value: 5, label: "Standard" },
      { value: 7, label: "Classic" },
    ],
    rulesTitle: "Know the table in two minutes.",
    rulesEmphasis: "two minutes.",
    rulesTag: "/ Rules",
    rules: [
      {
        kicker: "THE RULER",
        title: "The Hâkem",
        body: "Each hand, one player is crowned Hâkem. They see the first five cards and choose the trump — the suit that rules the round.",
      },
      {
        kicker: "THE POWER SUIT",
        title: "The Trump",
        body: "Any trump card beats any card of another suit. Within the same suit, the higher rank wins, Ace high.",
      },
      {
        kicker: "THE ONE RULE",
        title: "Follow suit",
        body: "You must play the led suit if you hold it. Out of that suit? Play anything — including a trump to steal the trick.",
      },
      {
        kicker: "WIN THE PILE",
        title: "Taking tricks",
        body: "All four lay one card. The highest trump — or the highest of the led suit — wins the trick and leads the next.",
      },
      {
        kicker: "WIN THE HAND",
        title: "Seven tricks",
        body: "First team to seven tricks wins the hand. Sweep all seven — a Kot — and you score double, or triple against the Hâkem.",
      },
      {
        kicker: "WIN IT ALL",
        title: "Reach the target",
        body: "Hands stack up until a team hits the number you set — 3, 5, or 7. That team takes the match.",
      },
    ],
    closingEyebrow: "Ready when you are",
    closingTitle: "Deal the first hand.",
    closingBody:
      "Make a room, send the code, and play Hokm with your people — wherever they are.",
    footerMeta: "A table for four · Built for the trick-takers",
    createModalTitle: "Create a table",
    createModalBody: "Pick a name and a match length. You'll get a code to share.",
    joinModalTitle: "Join a table",
    joinModalBody: "Enter the room code your friend shared.",
    yourName: "Your name",
    roomCode: "Room code",
    matchLength: "Match length",
    egSara: "e.g. Sara",
    egCode: "e.g. 7K2P",
    createTable: "Create table",
    joinTable: "Join table",
    spectateTable: "Spectate instead",
    creating: "Creating…",
    joining: "Joining…",
    advanced: "Advanced ▾",
    kotBonus: "Kot sweep bonus",
    invalidName: "Enter a name (2–20 characters)",
    invalidCode: "Enter a valid 4-character code.",
    notFound: "No table with that code.",
    roomFull: "That table is full.",
    roomFullSpectate: "That table is full. You can still spectate.",
    createFailed: "Couldn't create the table. Try again.",
  },
  fa: {
    brand: "حکم",
    navPlay: "بازی",
    navHow: "نحوهٔ بازی",
    navSets: "دست‌ها",
    navRules: "قوانین",
    createRoom: "ساختن اتاق",
    createARoom: "ساختن اتاق",
    joinWithCode: "ورود با کد",
    heroEyebrow: "بازیِ ایرانیِ فرمان",
    heroTitle: "حکم",
    heroBody:
      "چهار نفر جمع شوید. حاکم را انتخاب کنید، حکم را اعلام کنید و دست‌به‌دست میز را تصاحب کنید. بدون ثبت‌نام — فقط یک اتاق، یک کد و دوستانتان.",
    meta: ["هم‌زمان", "۴ بازیکن · ۲ تیم", "بازی به‌عنوان مهمان"],
    howTitle: "چهار دوست. یک میز. شصت ثانیه تا شروع.",
    howEmphasis: "شصت ثانیه",
    howTag: "/ نحوهٔ بازی",
    steps: [
      {
        number: "۰۱",
        suit: "♥",
        title: "اتاق بسازید",
        body: "با یک ضربه میز خصوصی بسازید. بی‌درنگ یک کد کوتاه دریافت می‌کنید.",
      },
      {
        number: "۰۲",
        suit: "♠",
        title: "سه نفر را دعوت کنید",
        body: "لینک را بفرستید. دوستان به‌عنوان مهمان وارد می‌شوند و سرِ جای خود می‌نشینند — یاران روبه‌روی هم.",
      },
      {
        number: "۰۳",
        suit: "♦",
        title: "حکم را اعلام کنید",
        body: "حاکم پنج کارت اول را می‌بیند و خالی را که در آن دست حکم است اعلام می‌کند.",
      },
      {
        number: "۰۴",
        suit: "♣",
        title: "بُرد را به اشتراک بگذارید",
        body: "هر تیم زودتر هفت دست ببرد، آن دور را می‌برد. بازی را تمام کنید و نتیجه را به اشتراک بگذارید.",
      },
    ],
    setsTitle: "کوتاه بازی کنید، یا تا آخرین نفس.",
    setsEmphasis: "تا آخرین نفس.",
    setsBody:
      "طول بازی را هنگام ساختن میز تعیین کنید. هر تیم زودتر به امتیاز هدف برسد برنده است — یک کوت (بُرد ۷ بر ۰) می‌تواند همه‌چیز را در یک دست تغییر دهد.",
    chips: [
      { value: 3, label: "سریع" },
      { value: 5, label: "استاندارد" },
      { value: 7, label: "کلاسیک" },
    ],
    rulesTitle: "میز را در دو دقیقه یاد بگیر.",
    rulesEmphasis: "دو دقیقه",
    rulesTag: "/ قوانین",
    rules: [
      {
        kicker: "حاکم",
        title: "حاکم",
        body: "در هر دست، یک بازیکن حاکم می‌شود. او پنج کارت اول را می‌بیند و حکم را انتخاب می‌کند — خالی‌ای که بر آن دست فرمان می‌راند.",
      },
      {
        kicker: "خالِ حکم",
        title: "حکم",
        body: "هر کارتِ حکم بر هر کارت از خال دیگر می‌چربد. در یک خال، کارت بالاتر برنده است؛ آس بالاترین.",
      },
      {
        kicker: "قانون اصلی",
        title: "پیروی از خال",
        body: "اگر خالِ روشده را داری، باید همان را بازی کنی. نداری؟ هر کارتی می‌توانی بزنی — حتی حکم، تا دست را بربایید.",
      },
      {
        kicker: "بردن دست",
        title: "بردن دست‌ها",
        body: "هر چهار نفر یک کارت می‌گذارند. بالاترین حکم — یا بالاترین کارتِ خالِ روشده — دست را می‌برد و بعدی را شروع می‌کند.",
      },
      {
        kicker: "بردن دور",
        title: "هفت دست",
        body: "هر تیم زودتر هفت دست ببرد، آن دور را می‌برد. هر هفت دست را ببری (کوت) امتیاز دوبرابر می‌گیری، و در برابر حاکم سه‌برابر.",
      },
      {
        kicker: "بردن بازی",
        title: "رسیدن به هدف",
        body: "دورها روی هم جمع می‌شوند تا یک تیم به عددی که تعیین کرده‌اید برسد — ۳، ۵ یا ۷. آن تیم بازی را می‌برد.",
      },
    ],
    closingEyebrow: "هر وقت آماده بودی",
    closingTitle: "اولین دست را پخش کن.",
    closingBody:
      "یک اتاق بساز، کد را بفرست و با دوستانت حکم بازی کن — هرجا که باشند.",
    footerMeta: "میزی برای چهار نفر · ساخته‌شده برای عاشقانِ بازی",
    createModalTitle: "ساختن میز",
    createModalBody: "یک نام و طول بازی انتخاب کن. یک کد برای به‌اشتراک‌گذاری می‌گیری.",
    joinModalTitle: "پیوستن به میز",
    joinModalBody: "کدی را که دوستت فرستاده وارد کن.",
    yourName: "نام شما",
    roomCode: "کد اتاق",
    matchLength: "طول بازی",
    egSara: "مثلاً سارا",
    egCode: "مثلاً 7K2P",
    createTable: "ساختن میز",
    joinTable: "پیوستن به میز",
    spectateTable: "تماشای بازی",
    creating: "در حال ساخت…",
    joining: "در حال پیوستن…",
    advanced: "پیشرفته ▾",
    kotBonus: "امتیاز کوت",
    invalidName: "یک نام وارد کن (۲ تا ۲۰ نویسه)",
    invalidCode: "یک کد ۴ کاراکتری معتبر وارد کن.",
    notFound: "میزی با این کد پیدا نشد.",
    roomFull: "این میز پر است.",
    roomFullSpectate: "این میز پر است، اما هنوز می‌توانی تماشاگر باشی.",
    createFailed: "ساخت میز ممکن نشد. دوباره تلاش کن.",
  },
};
