import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, FolderKanban, FileText,
  FileCheck, Bell, LogOut, Zap, Menu, X, ChevronRight, Lock, UserPlus,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import toast from "react-hot-toast";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/clients", icon: Users, label: "Clients" },
  { to: "/projects", icon: FolderKanban, label: "Projects" },
  { to: "/invoices", icon: FileText, label: "Invoices" },
  { to: "/proposals", icon: FileCheck, label: "Proposals" },
  { to: "/invite-admin", icon: UserPlus, label: "Invite Admin" },
];

export default function Sidebar({ children }) {
  const { user, logout } = useAuth();
  const { unreadCount } = useSocket() || { unreadCount: 0 };
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    navigate("/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 p-5 mb-2 ${collapsed ? "justify-center" : ""}`}>
        <div className="w-9 h-9 rounded-xl bg-teal-400 flex items-center justify-center shadow-glow flex-shrink-0">
          <Zap size={18} className="text-bg-primary" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <span className="font-syne text-xl font-bold text-white">ClientOS</span>
        )}
      </div>

      {/* Agency label */}
      {!collapsed && (
        <div className="mx-4 mb-4 px-3 py-2 rounded-lg bg-teal-400/5 border border-teal-400/10">
          <p className="text-xs font-dm text-teal-400 font-medium truncate">
            {user?.name || "Agency"}
          </p>
          <p className="text-xs font-dm text-slate-500 truncate">{user?.email}</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
              ${collapsed ? "justify-center" : ""}
              ${isActive
                ? "bg-teal-400/10 text-teal-400 border border-teal-400/20"
                : "text-slate-400 hover:bg-bg-hover hover:text-white border border-transparent"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className="flex-shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                {!collapsed && (
                  <span className="font-dm text-sm font-medium">{label}</span>
                )}
                {!collapsed && isActive && (
                  <ChevronRight size={14} className="ml-auto opacity-60" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 space-y-1 border-t border-bg-border mt-2">
        <button
          onClick={() => navigate("/notifications")}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl
            text-slate-400 hover:bg-bg-hover hover:text-white transition-all
            ${collapsed ? "justify-center" : ""}`}
        >
          <div className="relative flex-shrink-0">
            <Bell size={18} strokeWidth={2} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-teal-400 rounded-full
                text-bg-primary text-xs font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          {!collapsed && <span className="font-dm text-sm font-medium">Notifications</span>}
        </button>

        <button
          onClick={() => navigate("/change-password")}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl
            text-slate-400 hover:bg-bg-hover hover:text-white transition-all
            ${collapsed ? "justify-center" : ""}`}
        >
          <Lock size={18} strokeWidth={2} className="flex-shrink-0" />
          {!collapsed && <span className="font-dm text-sm font-medium">Change Password</span>}
        </button>
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl
            text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all
            ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut size={18} strokeWidth={2} className="flex-shrink-0" />
          {!collapsed && <span className="font-dm text-sm font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-bg-primary">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed top-0 left-0 h-full z-30
          bg-bg-secondary border-r border-bg-border transition-all duration-300
          ${collapsed ? "w-[68px]" : "w-[240px]"}`}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-7 w-6 h-6 rounded-full bg-bg-border border border-bg-border
            flex items-center justify-center text-slate-400 hover:text-teal-400 hover:border-teal-400/50
            transition-all z-10"
        >
          {collapsed ? <ChevronRight size={12} /> : <X size={12} />}
        </button>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-[240px] z-50 lg:hidden
          bg-bg-secondary border-r border-bg-border transition-transform duration-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <SidebarContent />
      </aside>

      {/* Main content */}
      <main className={`flex-1 transition-all duration-300 ${collapsed ? "lg:ml-[68px]" : "lg:ml-[240px]"}`}>
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-4 border-b border-bg-border bg-bg-secondary sticky top-0 z-20">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-slate-400 hover:text-teal-400 transition-colors"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-400 flex items-center justify-center">
              <Zap size={14} className="text-bg-primary" strokeWidth={2.5} />
            </div>
            <span className="font-syne font-bold text-white">ClientOS</span>
          </div>
        </div>

        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
