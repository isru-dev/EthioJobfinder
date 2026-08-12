import TelegramLoginButton from "../Component/TelegramLoginButton";

export default function LoginSection({ onLoginSuccess }) {
  const handleTelegramAuth = (telegramUser) => {
    authenticateWithBackend(telegramUser);
  };

  const authenticateWithBackend = async (userData) => {
    try {
      const response = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      if (response.ok) {
        // Save user to localStorage so session persists on refresh
        localStorage.setItem("ethio_job_user", JSON.stringify(data.user));

        // Pass user up to App/Parent state
        if (onLoginSuccess) {
          onLoginSuccess(data.user);
        }
      } else {
        alert(data.error || "Authentication failed");
      }
    } catch (err) {
      console.error("Authentication error:", err);
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 text-center">
      <h3 className="text-lg font-bold text-slate-800 mb-2">
        Sign in with Telegram
      </h3>
      <TelegramLoginButton
        botName="EJobExplore_bot"
        onAuth={handleTelegramAuth}
      />
    </div>
  );
}