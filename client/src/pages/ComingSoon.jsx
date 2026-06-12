import { useNavigate } from "react-router-dom";
import { Users, FolderKanban, FileText, FileCheck, Bell, ArrowLeft } from "lucide-react";

const placeholders = {
  clients:    { icon: Users,         label: "Clients",       desc: "Manage all your agency clients",         color: "text-blue-400",   bg: "bg-blue-400/10" },
  projects:   { icon: FolderKanban,  label: "Projects",      desc: "Track project progress with Kanban",     color: "text-teal-400",   bg: "bg-teal-400/10" },
  invoices:   { icon: FileText,      label: "Invoices",      desc: "Create & track client invoices",         color: "text-amber-400",  bg: "bg-amber-400/10" },
  proposals:  { icon: FileCheck,     label: "AI Proposals",  desc: "Generate proposals with Gemini AI",      color: "text-violet-400", bg: "bg-violet-400/10" },
  notifications: { icon: Bell,       label: "Notifications", desc: "Real-time activity feed",                color: "text-teal-400",   bg: "bg-teal-400/10" },
};

export function ComingSoonPage({ page }) {
  const navigate = useNavigate();
  const info = placeholders[page] || placeholders.clients;
  const Icon = info.icon;

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 animate-fade-in">
      <div className={`w-20 h-20 rounded-2xl ${info.bg} flex items-center justify-center`}>
        <Icon size={36} className={info.color} />
      </div>
      <div className="text-center">
        <h1 className="font-syne text-3xl font-bold text-white mb-2">{info.label}</h1>
        <p className="font-dm text-slate-400">{info.desc}</p>
        <p className="font-dm text-slate-500 text-sm mt-1">Coming in Phase 2 — stay tuned!</p>
      </div>
      <button onClick={() => navigate("/dashboard")} className="btn-ghost flex items-center gap-2 text-sm">
        <ArrowLeft size={16} /> Back to Dashboard
      </button>
    </div>
  );
}
