import React, { useEffect, useState } from "react";
import { TOAST_EVENT } from "../../utils/uiEvents";
import "./ToastHost.css";

const ToastHost = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (event) => {
      const detail = event?.detail || {};
      const message = String(detail.message || "").trim();

      if (!message) {
        return;
      }

      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const nextToast = {
        id,
        message,
        type: detail.type || "info",
      };

      setToasts((prev) => [...prev, nextToast]);

      const duration = Math.max(1200, Number(detail.duration) || 3200);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, duration);
    };

    window.addEventListener(TOAST_EVENT, handleToast);
    return () => window.removeEventListener(TOAST_EVENT, handleToast);
  }, []);

  if (!toasts.length) {
    return null;
  }

  return (
    <div className="toast-host" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <article key={toast.id} className={`toast-banner toast-${toast.type}`}>
          {toast.message}
        </article>
      ))}
    </div>
  );
};

export default ToastHost;
