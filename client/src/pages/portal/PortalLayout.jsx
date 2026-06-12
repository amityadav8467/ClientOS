import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, FolderKanban, FileText,
  FileCheck, LogOut, Zap, Menu, X, Lock,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const navItems = [
  { to: "/portal",           icon: LayoutDashboard, label: "Overview",   end: true },
  { to: "/portal/projects",  icon: FolderKanban,    label: "My Projects" },
  { to: "/portal/invoices",  icon: FileText,        label: "Invoices" },
  { to: "/portal/proposals", icon: FileCheck,       label: "Proposals" },
];

export default function PortalLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    navigate("/login");
  };

  const Nav = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-5 mb-2">
        <div className="w-9 h-9 rounded-xl bg-teal-400 flex items-center justify-center shadow-glow flex-shrink-0">
          <Zap size={18} className="text-bg-primary" strokeWidth={2.5} />
        </div>
        <div>
          <span className="font-syne text-base font-bold text-white">Client Portal</span>
          <p className="text-xs font-dm text-slate-500">Codexora Solutions</p>
        </div>
      </div>

      {/* Client name badge */}
      <div className="mx-4 mb-4 px-3 py-2.5 rounded-xl bg-teal-400/5 border border-teal-400/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-400/20 flex items-center justify-center flex-shrink-0">
            <span className="font-syne font-bold text-teal-400 text-sm">
              {user?.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-dm text-xs font-medium text-white truncate">{user?.name}</p>
            <p className="font-dm text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
              ${isActive
                ? "bg-teal-400/10 text-teal-400 border border-teal-400/20"
                : "text-slate-400 hover:bg-bg-hover hover:text-white border border-transparent"}`
            }
          >
            <Icon size={18} strokeWidth={2} className="flex-shrink-0" />
            <span className="font-dm text-sm font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-bg-border mt-2 space-y-1">
        <button onClick={() => { navigate("/change-password"); setMobileOpen(false); }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl
            text-slate-400 hover:bg-bg-hover hover:text-white transition-all">
          <Lock size={18} strokeWidth={2} />
          <span className="font-dm text-sm font-medium">Change Password</span>
        </button>
        <button onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl
            text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all">
          <LogOut size={18} strokeWidth={2} />
          <span className="font-dm text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-bg-primary">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed top-0 left-0 h-full w-[240px] z-30
        bg-bg-secondary border-r border-bg-border">
        <Nav />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-[240px] z-50 lg:hidden
        bg-bg-secondary border-r border-bg-border transition-transform duration-300
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Nav />
      </aside>

      {/* Main */}
      <main className="flex-1 lg:ml-[240px]">
        <div className="lg:hidden flex items-center gap-3 px-4 py-4 border-b border-bg-border bg-bg-secondary sticky top-0 z-20">
          <button onClick={() => setMobileOpen(true)} className="text-slate-400 hover:text-teal-400 transition-colors">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-400 flex items-center justify-center">
              <Zap size={14} className="text-bg-primary" strokeWidth={2.5} />
            </div>
            <span className="font-syne font-bold text-white text-sm">Client Portal</span>
          </div>
        </div>
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
