import TelegramLoginButton from "../Component/TelegramLoginButton";

export default function LoginSection() {
  // Callback function triggered automatically when user logs in via Telegram
  const handleTelegramAuth = (telegramUser) => {
    console.log("Authenticated Telegram User:", telegramUser);
    /* 
      telegramUser object contains:
      {
        id: 123456789,
        first_name: "Israel",
        last_name: "Sima",
        username: "israelgezahegn",
        photo_url: "https://t.me/i/userpic/...",
        auth_date: 1723400000,
        hash: "a1b2c3d4..."
      }
    */

    // Send this payload to your backend for verification & login
    authenticateWithBackend(telegramUser);
  };

  const authenticateWithBackend = async (userData) => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      if (response.ok) {
        alert(`Welcome back, ${data.user.first_name}!`);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error("Authentication error:", err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
      <h3 className="text-lg font-bold text-slate-800 mb-2">
        Sign in to Get Job Alerts
      </h3>
      <p className="text-sm text-slate-500 mb-4">
        Log in with Telegram to manage your notification preferences.
      </p>

      {/* Render the Telegram Login Widget */}
      <TelegramLoginButton
        botName="EJobExplore_bot" // Replace with your BotFather username (NO @ symbol)
        onAuth={handleTelegramAuth}
      />
    </div>
  );
}