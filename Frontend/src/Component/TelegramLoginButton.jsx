import  { useEffect, useRef } from "react";

export default function TelegramLoginButton({ botName, onAuth }) {
  const containerRef = useRef(null);

  useEffect(() => {
    // Global callback required by Telegram widget
    window.onTelegramAuth = (user) => {
      onAuth(user);
    };

    // Dynamically insert Telegram script
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botName); // Your bot username (without @)
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
  }, [botName, onAuth]);

  return <div ref={containerRef} className="flex justify-center" />;
}