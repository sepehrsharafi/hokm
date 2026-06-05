"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useId, useMemo, useRef, useState } from "react";

import { getSocket } from "@/lib/client/socket";
import { getSessionId, getStoredName, setStoredName } from "@/lib/client/session";
import { landingCopy, type LandingLanguage } from "@/lib/landing-copy";
import type { MatchTarget } from "@/lib/types";

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
      const items = Array.from(focusables).filter((item) => !item.hasAttribute("disabled"));
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
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        className="modal-shell"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
          ×
        </button>
        <h3 id={titleId} className="modal-title">
          {title}
        </h3>
        <p className="modal-copy">{body}</p>
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

  const createHref = language === "en" ? "/?modal=create" : "/?lang=fa&modal=create";
  const joinHref = language === "en" ? "/?modal=join" : "/?lang=fa&modal=join";

  useEffect(() => {
    document.querySelectorAll<HTMLElement>("[data-create-link]").forEach((element) => {
      element.onclick = (event) => {
        event.preventDefault();
        router.replace(createHref, { scroll: false });
      };
    });
    document.querySelectorAll<HTMLElement>("[data-join-link]").forEach((element) => {
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
          <label className="field mt-6">
            <span>{copy.yourName}</span>
            <input
              ref={createInputRef}
              value={createName}
              placeholder={copy.egSara}
              onChange={(event) => setCreateName(event.target.value)}
              maxLength={20}
            />
          </label>
          <div className="mt-5">
            <p className="mono-label">{copy.matchLength}</p>
            <div className="mt-3 chip-row">
              {copy.chips.map((chip) => (
                <button
                  key={chip.value}
                  type="button"
                  className={chip.value === target ? "length-chip active" : "length-chip"}
                  onClick={() => setTarget(chip.value)}
                >
                  <span className="length-chip-number">
                    {language === "fa" ? chip.value.toLocaleString("fa-IR") : chip.value}
                  </span>
                  <span className="length-chip-label">{chip.label}</span>
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="advanced-toggle mt-5"
            onClick={() => setAdvancedOpen((current) => !current)}
          >
            {copy.advanced}
          </button>
          {advancedOpen ? (
            <label className="advanced-row">
              <span>{copy.kotBonus}</span>
              <input
                type="checkbox"
                checked={kotBonus}
                onChange={(event) => setKotBonus(event.target.checked)}
              />
            </label>
          ) : null}
          {createError ? <p className="error-copy mt-3">{createError}</p> : null}
          <button
            type="submit"
            className="button-primary mt-6 w-full justify-center"
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
          <label className="field mt-6">
            <span>{copy.roomCode}</span>
            <input
              ref={joinCodeRef}
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
          <label className="field mt-4">
            <span>{copy.yourName}</span>
            <input
              ref={joinNameRef}
              value={joinName}
              placeholder={copy.egSara}
              onChange={(event) => setJoinName(event.target.value)}
              maxLength={20}
            />
          </label>
          {joinError ? <p className="error-copy mt-3">{joinError}</p> : null}
          <button
            type="submit"
            className="button-primary mt-6 w-full justify-center"
            disabled={joinLoading}
          >
            {joinLoading ? copy.joining : copy.joinTable}
          </button>
          {joinCanSpectate ? (
            <button
              type="button"
              className="button-secondary mt-3 w-full justify-center"
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
