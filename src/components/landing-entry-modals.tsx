"use client";

import { useRouter } from "next/navigation";
import {
  type FormEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { getSocket } from "@/lib/client/socket";
import {
  getSessionId,
  getStoredName,
  setStoredName,
} from "@/lib/client/session";
import { landingCopy, type LandingLanguage } from "@/lib/landing-copy";
import type { MatchTarget } from "@/lib/types";
import { cn } from "@/lib/utils";

type ModalMode = "create" | "join" | null;

type Props = {
  language: LandingLanguage;
  initialModal: ModalMode;
  initialJoinCode: string;
  initialTarget: MatchTarget;
};

const codePattern = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/;

function useModalA11y(
  open: boolean,
  onClose: () => void,
  initialFocusRef: React.RefObject<HTMLElement | null>,
) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    initialFocusRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, [tabindex]:not([tabindex="-1"])',
      );
      const items = Array.from(focusables).filter(
        (item) => !item.hasAttribute("disabled"),
      );
      if (items.length === 0) {
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [initialFocusRef, onClose, open]);

  return dialogRef;
}

function ModalShell({
  open,
  onClose,
  title,
  body,
  children,
  initialFocusRef,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  body: string;
  children: React.ReactNode;
  initialFocusRef: React.RefObject<HTMLElement | null>;
}) {
  const titleId = useId();
  const dialogRef = useModalA11y(open, onClose, initialFocusRef);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-[rgba(5,6,8,0.6)] p-0 backdrop-blur-[12px] [animation:modalFade_0.25s_ease-out] sm:items-center sm:p-5"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="relative w-full rounded-t-[24px] border border-(--line) bg-[rgba(10,13,11,0.92)] p-7 shadow-[0_30px_90px_rgba(0,0,0,0.45)] [animation:modalSheet_0.3s_ease-out] sm:w-[min(100%,520px)] sm:rounded-3xl sm:[animation:modalPop_0.3s_ease-out]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="absolute right-3.5 top-3.5 flex h-9 w-9 items-center justify-center rounded-full border border-(--line) bg-transparent text-2xl leading-none text-(--ivory)"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>
        <h3 id={titleId} className="font-serif text-[26px] font-medium">
          {title}
        </h3>
        <p className="mt-2.5 text-[14.5px] leading-[1.6] text-(--muted)">
          {body}
        </p>
        {children}
      </div>
    </div>
  );
}

export function LandingEntryModals({
  language,
  initialModal,
  initialJoinCode,
  initialTarget,
}: Props) {
  const copy = landingCopy[language];
  const router = useRouter();
  const sessionId = useMemo(() => getSessionId(), []);
  const [modal, setModal] = useState<ModalMode>(initialModal);
  const [createName, setCreateName] = useState(() =>
    typeof window === "undefined" ? "" : getStoredName(),
  );
  const [joinName, setJoinName] = useState(() =>
    typeof window === "undefined" ? "" : getStoredName(),
  );
  const [joinCode, setJoinCode] = useState(initialJoinCode);
  const [target, setTarget] = useState<MatchTarget>(initialTarget);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [kotBonus, setKotBonus] = useState(true);
  const [createError, setCreateError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinCanSpectate, setJoinCanSpectate] = useState(false);
  const createInputRef = useRef<HTMLInputElement | null>(null);
  const joinCodeRef = useRef<HTMLInputElement | null>(null);
  const joinNameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) {
      socket.connect();
    }
  }, []);

  const closeModal = () => {
    setModal(null);
    setCreateError(null);
    setJoinError(null);
    setCreateLoading(false);
    setJoinLoading(false);
    setJoinCanSpectate(false);
    router.replace(language === "en" ? "/" : "/?lang=fa", { scroll: false });
  };

  const createHref =
    language === "en" ? "/?modal=create" : "/?lang=fa&modal=create";
  const joinHref = language === "en" ? "/?modal=join" : "/?lang=fa&modal=join";

  useEffect(() => {
    document
      .querySelectorAll<HTMLElement>("[data-create-link]")
      .forEach((element) => {
        element.onclick = (event) => {
          event.preventDefault();
          router.replace(createHref, { scroll: false });
        };
      });
    document
      .querySelectorAll<HTMLElement>("[data-join-link]")
      .forEach((element) => {
        element.onclick = (event) => {
          event.preventDefault();
          router.replace(joinHref, { scroll: false });
        };
      });
  }, [createHref, joinHref, router]);

  const submitCreate = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = createName.trim();
    if (trimmed.length < 2 || trimmed.length > 20) {
      setCreateError(copy.invalidName);
      return;
    }

    setCreateLoading(true);
    setCreateError(null);
    setStoredName(trimmed);

    const socket = getSocket();
    const onState = (snapshot: { game: { roomCode: string } }) => {
      socket.off("toast", onToast);
      setCreateLoading(false);
      router.push(`/room/${snapshot.game.roomCode}`);
    };
    const onToast = ({ message }: { message: string }) => {
      socket.off("state", onState);
      setCreateLoading(false);
      setCreateError(message || copy.createFailed);
    };

    socket.once("state", onState);
    socket.once("toast", onToast);
    socket.emit("create_room", {
      displayName: trimmed,
      sessionId,
      pointTarget: target,
      kotBonus,
    });
  };

  const attemptJoin = (spectate: boolean) => {
    const trimmedName = joinName.trim();
    const trimmedCode = joinCode.trim().toUpperCase();

    setJoinLoading(true);
    setJoinError(null);
    setStoredName(trimmedName);

    const socket = getSocket();
    const onState = (snapshot: { game: { roomCode: string } }) => {
      socket.off("toast", onToast);
      setJoinLoading(false);
      router.push(`/room/${snapshot.game.roomCode}`);
    };
    const onToast = ({ message }: { message: string }) => {
      socket.off("state", onState);
      setJoinLoading(false);
      if (/full/i.test(message)) {
        setJoinCanSpectate(true);
        setJoinError(copy.roomFullSpectate);
      } else if (/not found|expired/i.test(message)) {
        setJoinError(copy.notFound);
      } else {
        setJoinError(message);
      }
    };

    socket.once("state", onState);
    socket.once("toast", onToast);
    socket.emit("join_room", {
      roomCode: trimmedCode,
      displayName: trimmedName,
      sessionId,
      spectate,
    });
  };

  const submitJoin = (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = joinName.trim();
    const trimmedCode = joinCode.trim().toUpperCase();
    if (!codePattern.test(trimmedCode)) {
      setJoinError(copy.invalidCode);
      return;
    }
    if (trimmedName.length < 2 || trimmedName.length > 20) {
      setJoinError(copy.invalidName);
      return;
    }

    setJoinCanSpectate(false);
    attemptJoin(false);
  };

  return (
    <>
      <ModalShell
        open={modal === "create"}
        onClose={closeModal}
        title={copy.createModalTitle}
        body={copy.createModalBody}
        initialFocusRef={createInputRef}
      >
        <form onSubmit={submitCreate}>
          <label className="mt-6 flex flex-col gap-2.5 text-(--muted)">
            <span>{copy.yourName}</span>
            <input
              ref={createInputRef}
              className="w-full rounded-2xl border border-(--line) bg-black/30 px-4 py-3.5 text-(--ivory)"
              value={createName}
              placeholder={copy.egSara}
              onChange={(event) => setCreateName(event.target.value)}
              maxLength={20}
            />
          </label>
          <div className="mt-5">
            <p
              className={cn(
                "font-mono text-[12px] uppercase tracking-[0.32em]",
                language === "fa" &&
                  "font-fa-sans normal-case tracking-[0.04em]",
              )}
            >
              {copy.matchLength}
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {copy.chips.map((chip) => (
                <button
                  key={chip.value}
                  type="button"
                  className={cn(
                    "min-w-[94px] rounded-[14px] border px-5.5 py-5 text-center transition-[transform,border-color,background] duration-300 hover:-translate-y-1",
                    chip.value === target
                      ? "border-transparent bg-[linear-gradient(180deg,var(--gold-soft),var(--gold))] text-[#241a08]"
                      : "border-(--line) bg-black/20 hover:border-[rgba(227,178,90,0.5)]",
                  )}
                  onClick={() => setTarget(chip.value)}
                >
                  <span className="block font-mono text-[34px] font-bold leading-none">
                    {language === "fa"
                      ? chip.value.toLocaleString("fa-IR")
                      : chip.value}
                  </span>
                  <span
                    className={cn(
                      "mt-1.5 block text-[10px] uppercase tracking-[0.18em] opacity-70",
                      language === "fa" &&
                        "font-fa-sans normal-case tracking-[0.04em]",
                    )}
                  >
                    {chip.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            className={cn(
              "mt-5 bg-transparent p-0 font-mono text-[12px] uppercase tracking-[0.32em] text-(--muted)",
              language === "fa" && "font-fa-sans normal-case tracking-[0.04em]",
            )}
            onClick={() => setAdvancedOpen((current) => !current)}
          >
            {copy.advanced}
          </button>
          {advancedOpen ? (
            <label className="mt-3 flex items-center justify-between text-(--ivory)">
              <span>{copy.kotBonus}</span>
              <input
                type="checkbox"
                checked={kotBonus}
                onChange={(event) => setKotBonus(event.target.checked)}
              />
            </label>
          ) : null}
          {createError ? (
            <p className="mt-3 text-sm text-(--crimson)">{createError}</p>
          ) : null}
          <button
            type="submit"
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(180deg,var(--gold-soft),var(--gold))] px-5.5 py-3.25 text-[12px] font-bold uppercase tracking-[0.08em] text-[#241a08] shadow-[0_8px_30px_rgba(227,178,90,0.2)] transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
            disabled={createLoading}
          >
            {createLoading ? copy.creating : copy.createTable}
          </button>
        </form>
      </ModalShell>

      <ModalShell
        open={modal === "join"}
        onClose={closeModal}
        title={copy.joinModalTitle}
        body={copy.joinModalBody}
        initialFocusRef={joinCode.trim() ? joinNameRef : joinCodeRef}
      >
        <form onSubmit={submitJoin}>
          <label className="mt-6 flex flex-col gap-2.5 text-(--muted)">
            <span>{copy.roomCode}</span>
            <input
              ref={joinCodeRef}
              className="w-full rounded-2xl border border-(--line) bg-black/30 px-4 py-3.5 text-(--ivory)"
              value={joinCode}
              placeholder={copy.egCode}
              onChange={(event) =>
                setJoinCode(
                  event.target.value
                    .toUpperCase()
                    .replace(/[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g, "")
                    .slice(0, 4),
                )
              }
              maxLength={4}
            />
          </label>
          <label className="mt-4 flex flex-col gap-2.5 text-(--muted)">
            <span>{copy.yourName}</span>
            <input
              ref={joinNameRef}
              className="w-full rounded-2xl border border-(--line) bg-black/30 px-4 py-3.5 text-(--ivory)"
              value={joinName}
              placeholder={copy.egSara}
              onChange={(event) => setJoinName(event.target.value)}
              maxLength={20}
            />
          </label>
          {joinError ? (
            <p className="mt-3 text-sm text-(--crimson)">{joinError}</p>
          ) : null}
          <button
            type="submit"
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(180deg,var(--gold-soft),var(--gold))] px-5.5 py-3.25 text-[12px] font-bold uppercase tracking-[0.08em] text-[#241a08] shadow-[0_8px_30px_rgba(227,178,90,0.2)] transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
            disabled={joinLoading}
          >
            {joinLoading ? copy.joining : copy.joinTable}
          </button>
          {joinCanSpectate ? (
            <button
              type="button"
              className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-(--line) bg-(--glass) px-5.5 py-3.25 text-(--ivory) backdrop-blur-[10px] transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
              disabled={joinLoading}
              onClick={() => attemptJoin(true)}
            >
              {copy.spectateTable}
            </button>
          ) : null}
        </form>
      </ModalShell>
    </>
  );
}
