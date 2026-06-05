const SESSION_KEY = "hokm:session-id";
const NAME_KEY = "hokm:display-name";
const LANGUAGE_KEY = "hokm:language";

export const getSessionId = () => {
  const existing = localStorage.getItem(SESSION_KEY);
  if (existing) {
    return existing;
  }

  const created = crypto.randomUUID();
  localStorage.setItem(SESSION_KEY, created);
  return created;
};

export const getStoredName = () => localStorage.getItem(NAME_KEY) ?? "";
export const setStoredName = (value: string) => localStorage.setItem(NAME_KEY, value);

export const getStoredLanguage = () => (localStorage.getItem(LANGUAGE_KEY) === "fa" ? "fa" : "en");
export const setStoredLanguage = (value: "en" | "fa") => localStorage.setItem(LANGUAGE_KEY, value);
