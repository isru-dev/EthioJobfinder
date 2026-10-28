import { useEffect, useState } from "react";
import Navbar from "./Component/Navbar";
import JobFeed from "./pages/JobFeed";

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("ethio_job_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [dark, setDark] = useState(
    () => localStorage.getItem("ethio_job_theme") !== "light"
  );

  useEffect(() => {
    localStorage.setItem("ethio_job_theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        dark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      <Navbar user={user} setUser={setUser} dark={dark} />

      <JobFeed dark={dark} setDark={setDark} />
    </div>
  );
}