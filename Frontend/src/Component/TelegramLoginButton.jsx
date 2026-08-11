import  { useEffect, useRef } from "react";

export default function TelegramLoginButton({ botName, onAuth }) {
  const containerRef = useRef(null);

  useEffect(() => {
    // 1. Set global callback function expected by Telegram Widget
    window.onTelegramAuth = (user) => {
      onAuth(user);
    };

    // 2. Dynamically attach Telegram script
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botName); // Bot username (without @)
    script.setAttribute("data-size", "medium");          // small | medium | large
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
  }, [botName, onAuth]);

  return <div ref={containerRef} className="flex justify-center" />;
}