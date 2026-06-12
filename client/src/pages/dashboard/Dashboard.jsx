import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import {
  Users, FolderKanban, IndianRupee, FileText,
  TrendingUp, AlertCircle, Plus, ArrowRight, UserPlus
} from "lucide-react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { format } from "date-fns";

const statusColors = {
  planning: "text-blue-400 bg-blue-400/10",
  active: "text-teal-400 bg-teal-400/10",
  review: "text-amber-400 bg-amber-400/10",
  completed: "text-slate-400 bg-slate-400/10",
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card px-4 py-3 text-sm">
        <p className="font-syne font-semibold text-white mb-1">{label}</p>
        <p className="font-dm text-teal-400">₹{payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/dashboard/stats")
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statCards = data ? [
    {
      label: "Total Clients",
      value: data.stats.totalClients,
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      change: "+2 this month",
    },
    {
      label: "Active Projects",
      value: data.stats.activeProjects,
      icon: FolderKanban,
      color: "text-teal-400",
      bg: "bg-teal-400/10",
      change: "In progress",
    },
    {
      label: "Total Revenue",
      value: `₹${data.stats.totalRevenue.toLocaleString()}`,
      icon: IndianRupee,
      color: "text-accent-green",
      bg: "bg-accent-green/10",
      change: "Paid invoices",
    },
    {
      label: "Pending Invoices",
      value: data.stats.pendingInvoices,
      icon: FileText,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      change: data.stats.overdueInvoices > 0 ? `${data.stats.overdueInvoices} overdue` : "All on track",
      alert: data.stats.overdueInvoices > 0,
    },
  ] : [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title mb-1">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},{" "}
            <span className="text-teal-400">{user?.name?.split(" ")[0]}</span> 👋
          </h1>
          <p className="font-dm text-slate-400 text-sm">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate("/clients/new")}
            className="btn-ghost flex items-center gap-2 text-sm">
            <Plus size={16} /> New Client
          </button>
          <button onClick={() => navigate("/projects/new")}
            className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> New Project
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading
          ? Array(4).fill(0).map((_, i) => (
              <div key={i} className="stat-card">
                <div className="skeleton h-4 w-24" />
                <div className="skeleton h-8 w-16" />
                <div className="skeleton h-3 w-20" />
              </div>
            ))
          : statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="stat-card glass-card-hover">
                  <div className="flex items-center justify-between">
                    <p className="font-dm text-xs text-slate-400 uppercase tracking-wider">{card.label}</p>
                    <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                      <Icon size={16} className={card.color} />
                    </div>
                  </div>
                  <p className={`font-syne text-3xl font-bold ${card.color}`}>{card.value}</p>
                  <div className="flex items-center gap-1.5">
                    {card.alert
                      ? <AlertCircle size={13} className="text-red-400" />
                      : <TrendingUp size={13} className="text-slate-500" />
                    }
                    <p className={`font-dm text-xs ${card.alert ? "text-red-400" : "text-slate-500"}`}>
                      {card.change}
                    </p>
                  </div>
                </div>
              );
            })
        }
      </div>

      {/* Revenue Chart + Recent Projects */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="xl:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title">Revenue Overview</h2>
            <span className="text-xs font-dm text-slate-500">Last 6 months</span>
          </div>
          {loading ? (
            <div className="h-56 skeleton rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.monthlyRevenue || []} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2740" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12, fontFamily: "DM Sans" }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `₹${v >= 1000 ? `${v / 1000}k` : v}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,212,170,0.05)", radius: 8 }} />
                <Bar dataKey="revenue" fill="#00d4aa" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Projects */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">Recent Projects</h2>
            <button onClick={() => navigate("/projects")}
              className="text-xs font-dm text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight size={13} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="skeleton w-8 h-8 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3 w-28" />
                    <div className="skeleton h-2.5 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : data?.recentProjects?.length > 0 ? (
            <div className="space-y-3">
              {data.recentProjects.map((project) => (
                <button
                  key={project._id}
                  onClick={() => navigate(`/projects/${project._id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-bg-hover transition-all group text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-teal-400/10 flex items-center justify-center flex-shrink-0">
                    <FolderKanban size={15} className="text-teal-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-dm text-sm text-white truncate group-hover:text-teal-400 transition-colors">
                      {project.title}
                    </p>
                    <p className="font-dm text-xs text-slate-500 truncate">
                      {project.client?.name}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-dm flex-shrink-0 ${statusColors[project.status]}`}>
                    {project.status}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <div className="w-12 h-12 rounded-full bg-bg-hover flex items-center justify-center">
                <FolderKanban size={22} className="text-slate-500" />
              </div>
              <p className="font-dm text-sm text-slate-500">No projects yet</p>
              <button onClick={() => navigate("/projects/new")} className="btn-primary text-xs py-2 px-4">
                Create first project
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6">
        <h2 className="section-title mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
          {[
            { label: "Add Client", icon: Users, to: "/clients/new", color: "text-blue-400 bg-blue-400/10" },
            { label: "New Project", icon: FolderKanban, to: "/projects/new", color: "text-teal-400 bg-teal-400/10" },
            { label: "Create Invoice", icon: FileText, to: "/invoices/new", color: "text-amber-400 bg-amber-400/10" },
            { label: "AI Proposal", icon: Plus, to: "/proposals/new", color: "text-accent-purple bg-accent-purple/10" },
            { label: "Invite Admin", icon: UserPlus, to: "/invite-admin", color: "text-emerald-400 bg-emerald-400/10" },
          ].map(({ label, icon: Icon, to, color }) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              className="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-bg-border
                hover:border-teal-400/30 hover:bg-bg-hover transition-all group"
            >
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
                <Icon size={18} />
              </div>
              <span className="font-dm text-xs text-slate-400 group-hover:text-white transition-colors text-center">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
