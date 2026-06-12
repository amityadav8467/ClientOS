import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderKanban, FileText, FileCheck,
  TrendingUp, IndianRupee, CheckCircle2, Clock,
} from "lucide-react";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import toast from "react-hot-toast";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

const statusColors = {
  planning: "text-blue-400 bg-blue-400/10",
  active:   "text-teal-400 bg-teal-400/10",
  review:   "text-amber-400 bg-amber-400/10",
  completed:"text-slate-400 bg-slate-400/10",
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

export default function PortalDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/portal/dashboard")
      .then(res => setData(res.data))
      .catch(() => toast.error("Failed to load portal data"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title mb-1">
          Welcome back, <span className="text-teal-400">{user?.name?.split(" ")[0]}</span> 👋
        </h1>
        <p className="font-dm text-sm text-slate-400">Here's an overview of your projects and payments.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading
          ? Array(4).fill(0).map((_, i) => (
              <div key={i} className="glass-card p-5 space-y-3">
                <div className="skeleton h-4 w-24" />
                <div className="skeleton h-8 w-16" />
              </div>
            ))
          : [
              { label: "Active Projects",  value: data?.stats.activeProjects,         icon: FolderKanban,  color: "text-teal-400",   bg: "bg-teal-400/10" },
              { label: "Total Invoices",   value: data?.stats.totalInvoices,           icon: FileText,      color: "text-amber-400",  bg: "bg-amber-400/10" },
              { label: "Total Paid",       value: `₹${(data?.stats.totalPaid||0).toLocaleString()}`,   icon: CheckCircle2,  color: "text-teal-400",   bg: "bg-teal-400/10" },
              { label: "Pending Amount",   value: `₹${(data?.stats.totalPending||0).toLocaleString()}`, icon: Clock,         color: "text-red-400",    bg: "bg-red-400/10" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="glass-card p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="font-dm text-xs text-slate-400 uppercase tracking-wider">{label}</p>
                  <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                    <Icon size={16} className={color} />
                  </div>
                </div>
                <p className={`font-syne font-bold text-2xl ${color}`}>{value}</p>
              </div>
            ))
        }
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent projects */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">My Projects</h2>
            <button onClick={() => navigate("/portal/projects")}
              className="text-xs font-dm text-teal-400 hover:text-teal-300 transition-colors">
              View all →
            </button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-16 w-full rounded-xl" />)}
            </div>
          ) : data?.recentProjects?.length === 0 ? (
            <p className="font-dm text-sm text-slate-500 text-center py-8">No projects yet.</p>
          ) : (
            <div className="space-y-2">
              {data?.recentProjects?.map((p) => {
                const done = p.tasks?.filter(t => t.status === "completed").length || 0;
                const total = p.tasks?.length || 0;
                const progress = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <button key={p._id} onClick={() => navigate(`/portal/projects/${p._id}`)}
                    className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-bg-hover transition-all group text-left">
                    <div className="w-9 h-9 rounded-xl bg-teal-400/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FolderKanban size={15} className="text-teal-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-dm text-sm text-white truncate group-hover:text-teal-400 transition-colors">{p.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-dm flex-shrink-0 ${statusColors[p.status]}`}>
                          {p.status}
                        </span>
                      </div>
                      {total > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-bg-hover rounded-full overflow-hidden">
                            <div className="h-full bg-teal-400 rounded-full" style={{ width: `${progress}%` }} />
                          </div>
                          <span className="text-xs font-dm text-slate-500">{progress}%</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent invoices */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">Recent Invoices</h2>
            <button onClick={() => navigate("/portal/invoices")}
              className="text-xs font-dm text-teal-400 hover:text-teal-300 transition-colors">
              View all →
            </button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-14 w-full rounded-xl" />)}
            </div>
          ) : data?.recentInvoices?.length === 0 ? (
            <p className="font-dm text-sm text-slate-500 text-center py-8">No invoices yet.</p>
          ) : (
            <div className="space-y-2">
              {data?.recentInvoices?.map((inv) => (
                <div key={inv._id} className="flex items-center gap-3 p-3 rounded-xl border border-bg-border">
                  <div className="w-9 h-9 rounded-xl bg-amber-400/10 flex items-center justify-center flex-shrink-0">
                    <FileText size={15} className="text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-dm text-sm text-white">{inv.invoiceNumber}</p>
                    {inv.dueDate && (
                      <p className="font-dm text-xs text-slate-500">
                        Due {format(new Date(inv.dueDate), "dd MMM yyyy")}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-syne font-bold text-sm text-white">₹{inv.totalAmount?.toLocaleString()}</p>
                    <span className={`badge badge-${inv.status} text-xs`}>{inv.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
