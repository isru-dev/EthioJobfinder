
import { useState, useCallback } from "react";
import {
  Settings2,
  LogOut,
  Menu,
  X,
  UserRound,
  Search ,
} from "lucide-react";

import TelegramLoginButton from "./TelegramLoginButton";
import PreferencesModal from "./PreferencesModal";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const buildApiUrl = (path) => `${API_BASE_URL}${path}`;

export default function Navbar({ user, setUser, dark }) {
  const [showPreferences, setShowPreferences] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTelegramAuth = useCallback(
    async (telegramUser) => {
      try {
        const res = await fetch(buildApiUrl("/api/auth/telegram"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(telegramUser),
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.error || "Login failed.");
          return;
        }

        setUser(data.user);
        localStorage.setItem(
          "ethio_job_user",
          JSON.stringify(data.user)
        );
        setShowPreferences(true);
      } catch (err) {
        console.error("Auth error:", err);
        alert("Unable to connect to the server. Please try again.");
      }
    },
    [setUser]
  );

  const handleSavePreferences = async (prefPayload) => {
    try {
      const res = await fetch(buildApiUrl("/api/user/preferences"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefPayload),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to update preferences.");
        throw new Error(data.error || "Failed to update preferences.");
      }

      setUser(data.user);
      localStorage.setItem(
        "ethio_job_user",
        JSON.stringify(data.user)
      );
      setShowPreferences(false);
    } catch (err) {
      console.error("Failed to save preferences:", err);

      if (err instanceof TypeError) {
        alert("Unable to connect to the server. Please try again.");
      }

      throw err;
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("ethio_job_user");
    setShowPreferences(false);
    setMobileMenuOpen(false);
  };

  const openPreferences = () => {
    setShowPreferences(true);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-xl ${
          dark
            ? "border-slate-800 bg-slate-950/90"
            : "border-slate-200/80 bg-white/90"
        }`}
      >
        <nav
          className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8"
          aria-label="Main navigation"
        >
          {/* Brand */}
          <a
            href="/"
            className="group flex min-w-0 items-center gap-3"
            aria-label="Ethio Job Explorer home"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200 transition group-hover:bg-indigo-700">
              <Search size={21} strokeWidth={2.2} />
            </span>

            <span className="min-w-0">
              <span className={`block truncate text-base font-bold tracking-tight sm:text-lg ${dark ? "text-slate-100" : "text-slate-900"}`}>
                Ethio Job Explorer
              </span>
              <span className={`hidden text-xs font-medium sm:block ${dark ? "text-slate-400" : "text-slate-500"}`}>
                Discover your next opportunity
              </span>
            </span>
          </a>

          {/* Desktop actions */}
          <div className="hidden items-center gap-3 sm:flex">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={openPreferences}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                    dark
                      ? "border-slate-700 bg-slate-900 text-slate-200 hover:border-indigo-800 hover:bg-indigo-950 hover:text-indigo-300"
                      : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  }`}
                >
                  <Settings2 size={17} />
                  Preferences
                </button>

                <div className={`flex items-center gap-2.5 rounded-xl px-3 py-2 ${dark ? "bg-slate-900" : "bg-slate-50"}`}>
                  {user.photo_url || user.photoUrl ? (
                    <img
                      src={user.photo_url || user.photoUrl}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                      <UserRound size={17} />
                    </span>
                  )}

                  <div className="max-w-32">
                    <p className={`truncate text-sm font-semibold ${dark ? "text-slate-200" : "text-slate-800"}`}>
                      {user.first_name ||
                        user.firstName ||
                        user.username ||
                        "User"}
                    </p>
                    <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
                      Account
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    dark
                      ? "text-slate-400 hover:bg-red-950 hover:text-red-300"
                      : "text-slate-500 hover:bg-red-50 hover:text-red-600"
                  }`}
                >
                  <LogOut size={17} />
                  <span>Log out</span>
                </button>
              </>
            ) : (
              <TelegramLoginButton
                botName="EJobExplore_bot"
                onAuth={handleTelegramAuth}
              />
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className={`flex h-10 w-10 items-center justify-center rounded-xl border transition sm:hidden ${
              dark
                ? "border-slate-700 text-slate-300 hover:bg-slate-900"
                : "border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className={`border-t px-4 py-4 sm:hidden ${
            dark ? "border-slate-800 bg-slate-950" : "border-slate-100 bg-white"
          }`}>
            {user ? (
              <div className="space-y-3">
                <div className={`flex items-center gap-3 rounded-xl p-3 ${dark ? "bg-slate-900" : "bg-slate-50"}`}>
                  {user.photo_url || user.photoUrl ? (
                    <img
                      src={user.photo_url || user.photoUrl}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                      <UserRound size={19} />
                    </span>
                  )}

                  <div className="min-w-0">
                    <p className={`truncate text-sm font-semibold ${dark ? "text-slate-100" : "text-slate-900"}`}>
                      {user.first_name ||
                        user.firstName ||
                        user.username ||
                        "User"}
                    </p>
                    <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
                      Signed in
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openPreferences}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    dark
                      ? "text-slate-300 hover:bg-indigo-950 hover:text-indigo-300"
                      : "text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                  }`}
                >
                  <Settings2 size={18} />
                  Alert preferences
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    dark
                      ? "text-slate-400 hover:bg-red-950 hover:text-red-300"
                      : "text-slate-600 hover:bg-red-50 hover:text-red-600"
                  }`}
                >
                  <LogOut size={18} />
                  Log out
                </button>
              </div>
            ) : (
              <div className="flex justify-center py-2">
                <TelegramLoginButton
                  botName="EJobExplore_bot"
                  onAuth={handleTelegramAuth}
                />
              </div>
            )}
          </div>
        )}
      </header>

      {showPreferences && user && (
        <PreferencesModal
          user={user}
          dark={dark}
          onClose={() => setShowPreferences(false)}
          onSave={handleSavePreferences}
        />
      )}
    </>
  );
}
