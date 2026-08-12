import  { useState } from "react";
import Navbar from "./Component/Navbar";
import JobFeed from "./pages/JobFeed";

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("ethio_job_user");
    return saved ? JSON.parse(saved) : null;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 1. Only use Navbar here */}
      <Navbar user={user} setUser={setUser} />

      {/* 2. Main content */}
      <main className="max-w-7xl mx-auto px-4">
        <JobFeed user={user} />
      </main>
    </div>
  );
}