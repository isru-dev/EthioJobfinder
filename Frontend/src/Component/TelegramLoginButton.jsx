import { useEffect, useRef } from "react";

export default function TelegramLoginButton({ botName, onAuth }) {
  const containerRef = useRef(null);
  const onAuthRef = useRef(onAuth);

  // Keep the callback ref updated without triggering script re-injection
  useEffect(() => {
    onAuthRef.current = onAuth;
  }, [onAuth]);

  useEffect(() => {
    // Global callback required by Telegram widget
    window.onTelegramAuth = (user) => {
      if (onAuthRef.current) {
        onAuthRef.current(user);
      }
    };

    // Dynamically insert Telegram script
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botName);
    script.setAttribute("data-size", "medium");
    script.setAttribute("data-radius", "10");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");
    script.async = true;

    if (containerRef.current) {
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(script);
    }

    return () => {
      delete window.onTelegramAuth;
    };
  }, [botName]); // Only re-run if botName changes!

  return <div ref={containerRef} className="flex justify-center" />;
}