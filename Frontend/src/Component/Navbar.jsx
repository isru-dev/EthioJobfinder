import React, { useState } from "react";
import TelegramLoginButton from "./TelegramLoginButton";
import PreferencesModal from "./PreferencesModal";

export default function Navbar({ user, setUser }) {
  const [showPreferences, setShowPreferences] = useState(false);

  // Authenticate user with backend
  const handleTelegramAuth = async (telegramUser) => {
    try {
      const res = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(telegramUser),
      });

      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        localStorage.setItem("ethio_job_user", JSON.stringify(data.user));
        setShowPreferences(true); // Open options on login
      } else {
        alert(data.error || "Login failed");
      }
    } catch (err) {
      console.error("Auth error:", err);
    }
  };

  // Save selected categories to backend
  const handleSavePreferences = async (prefPayload) => {
    try {
      const res = await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefPayload),
      });

      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        localStorage.setItem("ethio_job_user", JSON.stringify(data.user));
      }
    } catch (err) {
      console.error("Failed to save preferences:", err);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("ethio_job_user");
  };

  return (
    <nav className="flex justify-between items-center py-4 border-b border-slate-200 mb-8 bg-white/50 backdrop-blur-md px-6 rounded-2xl shadow-sm">
      <div className="font-extrabold text-xl text-slate-900 flex items-center gap-2">
        <span>Ethio Job Explorer 💼</span>
      </div>

      <div>
        {user ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPreferences(true)}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200 transition-all flex items-center gap-1.5"
            >
              ⚙️ <span>Alert Preferences</span>
            </button>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-2 rounded-xl">
              {user.photo_url && (
                <img
                  src={user.photo_url}
                  alt="Avatar"
                  className="w-4 h-4 rounded-full"
                />
              )}
              <span>{user.first_name}</span>
            </div>

            <button
              onClick={handleLogout}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium pl-1"
            >
              Logout
            </button>
          </div>
        ) : (
          <TelegramLoginButton
            botName="YOUR_BOT_USERNAME" // Replace with your Bot's Username without @
            onAuth={handleTelegramAuth}
          />
        )}
      </div>

      {showPreferences && user && (
        <PreferencesModal
          user={user}
          onClose={() => setShowPreferences(false)}
          onSave={handleSavePreferences}
        />
      )}
    </nav>
  );
}