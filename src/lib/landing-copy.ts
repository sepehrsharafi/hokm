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
    players: string;
    twoPlayers: string;
    fourPlayers: string;
    matchLength: string;
    egSara: string;
    egCode: string;
    createTable: string;
    joinTable: string;
    spectateTable: string;
    creating: string;
    joining: string;
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
    navSets: "Match length",
    navRules: "Rules",
    createRoom: "Create Room",
    createARoom: "Create a Room",
    joinWithCode: "Join with a Code",
    heroEyebrow: "The Persian trick-taking classic",
    heroTitle: "HOKM.",
    heroBody:
      "Gather four. Crown the Hakem, call the trump, and take the table one trick at a time. No sign-ups, no friction, just a room, a code, and your people.",
    meta: ["Real-time", "۴ Players · ۲ Teams", "Guest-friendly"],
    howTitle: "Four friends. One table. Dealt in under a minute.",
    howEmphasis: "under a minute.",
    howTag: "/ How it works",
    steps: [
      {
        number: "۰۱",
        suit: "♥",
        title: "Open a room",
        body: "Create a private table in a moment and get a short join code immediately.",
      },
      {
        number: "۰۲",
        suit: "♠",
        title: "Invite three",
        body: "Share the code or link. Friends join as guests and partners sit across from each other.",
      },
      {
        number: "۰۳",
        suit: "♦",
        title: "Call the trump",
        body: "The Hakem sees the first five cards and chooses the suit that rules the hand.",
      },
      {
        number: "۰۴",
        suit: "♣",
        title: "Finish the hand",
        body: "First team to seven tricks takes the round. Keep going until one side reaches the target.",
      },
    ],
    setsTitle: "Play it short, or play it all the way through.",
    setsEmphasis: "all the way through.",
    setsBody:
      "Choose the target score when you create the table. First team to reach it wins, and a Kot sweep can turn the whole match in one hand.",
    chips: [
      { value: 3, label: "Quick" },
      { value: 5, label: "Standard" },
      { value: 7, label: "Classic" },
    ],
    rulesTitle: "Learn the table in two minutes.",
    rulesEmphasis: "in two minutes.",
    rulesTag: "/ Rules",
    rules: [
      {
        kicker: "THE HAKEM",
        title: "One player calls it",
        body: "At the start of each hand, one player becomes Hakem. They see the first five cards and choose the trump suit.",
      },
      {
        kicker: "THE TRUMP",
        title: "Trump beats off-suit",
        body: "Any trump card beats any card from another suit. Within the same suit, the higher rank wins and the Ace is high.",
      },
      {
        kicker: "FOLLOW SUIT",
        title: "Play what was led",
        body: "If you have the led suit, you must play it. If you do not, you can throw anything, including trump.",
      },
      {
        kicker: "TAKE THE TRICK",
        title: "Highest card wins",
        body: "Each player lays one card. The highest trump, or otherwise the highest card of the led suit, takes the trick.",
      },
      {
        kicker: "TAKE THE ROUND",
        title: "Seven tricks decides it",
        body: "First team to seven tricks wins the hand. A full seven-trick sweep is a Kot and scores extra.",
      },
      {
        kicker: "TAKE THE MATCH",
        title: "Reach the target",
        body: "Hands keep stacking until one team reaches the score you chose: ۳, ۵, or ۷.",
      },
    ],
    closingEyebrow: "Ready when you are",
    closingTitle: "Deal the first hand.",
    closingBody:
      "Make a room, send the code, and play Hokm with your people wherever they are.",
    footerMeta: "A table for four · Built for trick-takers",
    createModalTitle: "Create a table",
    createModalBody:
      "Pick a name and a match length. You will get a room code right away.",
    joinModalTitle: "Join a table",
    joinModalBody: "Enter the room code your friend sent you.",
    yourName: "Your name",
    roomCode: "Room code",
    players: "Players",
    twoPlayers: "۲ Players",
    fourPlayers: "۴ Players",
    matchLength: "Match length",
    egSara: "e.g. Sara",
    egCode: "e.g. ۷K۲P",
    createTable: "Create table",
    joinTable: "Join table",
    spectateTable: "Spectate instead",
    creating: "Creating…",
    joining: "Joining…",
    invalidName: "Enter a name between ۲ and ۲۰ characters.",
    invalidCode: "Enter a valid ۴-character code.",
    notFound: "No table with that code.",
    roomFull: "That table is full.",
    roomFullSpectate: "That table is full. You can still spectate.",
    createFailed: "Couldn't create the table. Try again.",
  },
  fa: {
    brand: "حکم",
    navPlay: "شروع بازی",
    navHow: "روش بازی",
    navSets: "امتیاز بازی",
    navRules: "قوانین",
    createRoom: "ساختن اتاق",
    createARoom: "ساختن اتاق",
    joinWithCode: "ورود با کد",
    heroEyebrow: "بازی کارتی محبوب ایرانی",
    heroTitle: "حکم",
    heroBody:
      "چهار نفر دور یک میز. حاکم را مشخص کنید، خال حکم را اعلام کنید و دست‌به‌دست جلو بروید. نه ثبت‌نام لازم است، نه دردسر؛ فقط یک اتاق، یک کد و رفقای خودتان.",
    meta: ["بی‌درنگ", "۴ بازیکن · ۲ تیم", "ورود مهمان"],
    howTitle: "چهار نفر، یک میز، شروع بازی در کمتر از یک دقیقه.",
    howEmphasis: "کمتر از یک دقیقه",
    howTag: "/ روش بازی",
    steps: [
      {
        number: "۰۱",
        suit: "♥",
        title: "اتاق بسازید",
        body: "در چند ثانیه یک میز خصوصی بسازید و همان لحظه کد ورود را بگیرید.",
      },
      {
        number: "۰۲",
        suit: "♠",
        title: "سه نفر را دعوت کنید",
        body: "لینک یا کد را بفرستید؛ بقیه بدون ثبت‌نام وارد می‌شوند و روبه‌روی یار خود می‌نشینند.",
      },
      {
        number: "۰۳",
        suit: "♦",
        title: "حکم را اعلام کنید",
        body: "حاکم پنج کارت اول را می‌بیند و خالِ حکمِ همان دست را انتخاب می‌کند.",
      },
      {
        number: "۰۴",
        suit: "♣",
        title: "دور را تمام کنید",
        body: "هر تیمی زودتر هفت دست ببرد، آن دور را می‌گیرد. بازی ادامه دارد تا یکی به امتیاز نهایی برسد.",
      },
    ],
    setsTitle: "می‌توانید کوتاه بازی کنید یا تا آخر ادامه بدهید.",
    setsEmphasis: "تا آخر ادامه بدهید.",
    setsBody:
      "وقتی اتاق را می‌سازید، امتیاز بازی را روی ۳، ۵ یا ۷ می‌گذارید. هر تیمی زودتر به آن عدد برسد برنده است، و کوت می‌تواند همه‌چیز را در یک دست عوض کند.",
    chips: [
      { value: 3, label: "سریع" },
      { value: 5, label: "استاندارد" },
      { value: 7, label: "کلاسیک" },
    ],
    rulesTitle: "اصل بازی را در دو دقیقه یاد بگیرید.",
    rulesEmphasis: "در دو دقیقه",
    rulesTag: "/ قوانین",
    rules: [
      {
        kicker: "حاکم",
        title: "حاکم تصمیم می‌گیرد",
        body: "ابتدای هر دست، یک نفر حاکم می‌شود. او پنج کارت اول را می‌بیند و خال حکم را انتخاب می‌کند.",
      },
      {
        kicker: "خال حکم",
        title: "حکم از بقیه بالاتر است",
        body: "هر کارتِ حکم از هر کارتِ خال دیگر بالاتر است. داخل یک خال هم کارت بالاتر برنده می‌شود و آس از همه بالاتر است.",
      },
      {
        kicker: "پیروی از خال",
        title: "باید هم‌خال بازی کنید",
        body: "اگر از خالِ رو شده کارت دارید، باید همان را بازی کنید. اگر ندارید، هر کارتی از جمله حکم آزاد است.",
      },
      {
        kicker: "بردن دست",
        title: "بالاترین کارت می‌برد",
        body: "هر چهار نفر یک کارت می‌گذارند. بالاترین حکم، یا در غیر این صورت بالاترین کارتِ خالِ رو شده، دست را می‌برد.",
      },
      {
        kicker: "بردن دور",
        title: "هفت دست تعیین‌کننده است",
        body: "هر تیمی زودتر هفت دست ببرد، آن دور را می‌برد. اگر هر هفت دست را بگیرید، کوت حساب می‌شود و امتیاز اضافه می‌گیرید.",
      },
      {
        kicker: "بردن بازی",
        title: "به امتیاز هدف برسید",
        body: "دورها ادامه پیدا می‌کند تا یکی از تیم‌ها به امتیاز انتخابی شما یعنی ۳، ۵ یا ۷ برسد.",
      },
    ],
    closingEyebrow: "آماده‌اید؟",
    closingTitle: "اولین دست را پخش کنید.",
    closingBody:
      "اتاق را بسازید، کد را بفرستید و هر جا هستید با دوستانتان حکم بازی کنید.",
    footerMeta: "یک میز برای چهار نفر · برای دوستداران بازی‌های دستی",
    createModalTitle: "ساختن میز",
    createModalBody:
      "نام‌تان را بنویسید و امتیاز بازی را انتخاب کنید. کد اتاق را همان لحظه می‌گیرید.",
    joinModalTitle: "پیوستن به میز",
    joinModalBody: "کدی را که دوست‌تان فرستاده وارد کنید.",
    yourName: "نام شما",
    roomCode: "کد اتاق",
    players: "بازیکن‌ها",
    twoPlayers: "۲ نفره",
    fourPlayers: "۴ نفره",
    matchLength: "امتیاز بازی",
    egSara: "مثلاً سارا",
    egCode: "مثلاً ۷K۲P",
    createTable: "ساختن میز",
    joinTable: "پیوستن به میز",
    spectateTable: "تماشای بازی",
    creating: "در حال ساخت…",
    joining: "در حال پیوستن…",
    invalidName: "یک نام بین ۲ تا ۲۰ نویسه وارد کنید.",
    invalidCode: "یک کد ۴ کاراکتری معتبر وارد کنید.",
    notFound: "اتاقی با این کد پیدا نشد.",
    roomFull: "این میز پر است.",
    roomFullSpectate: "این میز پر است، اما هنوز می‌توانید تماشاگر باشید.",
    createFailed: "ساختن میز انجام نشد. دوباره تلاش کنید.",
  },
};
