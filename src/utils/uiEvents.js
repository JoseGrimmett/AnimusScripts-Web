export const AUTH_CHANGED_EVENT = "animus-auth-changed";
export const TOAST_EVENT = "animus-toast";

export function emitAuthChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function emitToast({ message, type = "info", duration = 3200 }) {
  if (typeof window === "undefined" || !message) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT, {
      detail: {
        message: String(message),
        type,
        duration,
      },
    }),
  );
}
