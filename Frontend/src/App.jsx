import { useState, useEffect } from "react";
import Navbar from "./Component/Navbar";
import JobFeed from "./pages/JobFeed";

export default function App() {
  const [user, setUser] = useState(null);

  // Preserve authentication session across refreshes
  useEffect(() => {
    const savedUser = localStorage.getItem("ethio_job_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        localStorage.removeItem("ethio_job_user");
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <Navbar user={user} setUser={setUser} />
        <JobFeed />
      </div>
    </div>
  );
}