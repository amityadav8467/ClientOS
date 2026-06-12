import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileCheck, Plus, Search, Sparkles, MoreVertical,
  Eye, Trash2, Send, CheckCircle2, XCircle, Clock, FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import api from "../../utils/api";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";
import ConfirmDialog from "../../components/ui/ConfirmDialog";

const statusConfig = {
  draft:    { label: "Draft",    cls: "badge-inactive", icon: FileText,    color: "text-slate-400" },
  sent:     { label: "Sent",     cls: "badge-planning", icon: Send,         color: "text-blue-400" },
  approved: { label: "Approved", cls: "badge-active",   icon: CheckCircle2, color: "text-teal-400" },
  rejected: { label: "Rejected", cls: "badge-overdue",  icon: XCircle,      color: "text-red-400" },
};

export default function Proposals() {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [menuOpen, setMenuOpen] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, proposal: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchProposals = async () => {
    try {
      const res = await api.get("/api/proposals");
      let list = res.data.proposals;
      if (statusFilter) list = list.filter(p => p.status === statusFilter);
      if (search) list = list.filter(p =>
        p.title?.toLowerCase().includes(search.toLowerCase()) ||
        p.client?.name?.toLowerCase().includes(search.toLowerCase())
      );
      setProposals(list);
    } catch {
      toast.error("Failed to load proposals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProposals(); }, [search, statusFilter]);

  const handleStatusChange = async (proposal, newStatus) => {
    try {
      await api.put(`/api/proposals/${proposal._id}/status`, { status: newStatus });
      toast.success(`Proposal marked as ${newStatus}`);
      fetchProposals();
    } catch {
      toast.error("Failed to update status");
    }
    setMenuOpen(null);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/api/proposals/${deleteDialog.proposal._id}`);
      toast.success("Proposal deleted");
      setDeleteDialog({ open: false, proposal: null });
      fetchProposals();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="AI Proposals"
        subtitle={`${proposals.length} proposal${proposals.length !== 1 ? "s" : ""} generated`}
        actions={
          <button onClick={() => navigate("/proposals/new")}
            className="btn-primary flex items-center gap-2 text-sm">
            <Sparkles size={15} /> Generate Proposal
          </button>
        }
      />

      {/* Status summary */}
      {!loading && proposals.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {Object.entries(statusConfig).map(([status, { label, cls, icon: Icon, color }]) => {
            const count = proposals.filter(p => p.status === status).length;
            return (
              <button key={status}
                onClick={() => setStatusFilter(statusFilter === status ? "" : status)}
                className={`glass-card p-3 text-center transition-all hover:scale-105
                  ${statusFilter === status ? "border-teal-400/40" : ""}`}>
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Icon size={13} className={color} />
                  <span className={`badge ${cls} text-xs py-0.5`}>{label}</span>
                </div>
                <p className="font-syne font-bold text-xl text-white">{count}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder="Search proposals..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field sm:w-40">
          <option value="">All Status</option>
          {Object.entries(statusConfig).map(([v, { label }]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
      </div>

      {/* Proposals grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-3">
              <div className="skeleton h-5 w-36" />
              <div className="skeleton h-3 w-24" />
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-3 w-3/4" />
            </div>
          ))}
        </div>
      ) : proposals.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title="No proposals yet"
          description="Use Gemini AI to generate professional project proposals in seconds."
          action={{ label: "Generate First Proposal", onClick: () => navigate("/proposals/new") }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {proposals.map((proposal) => {
            const { cls, icon: SIcon, color: SColor } = statusConfig[proposal.status] || statusConfig.draft;
            return (
              <div key={proposal._id} className="glass-card glass-card-hover p-5 flex flex-col relative group">
                {/* Menu */}
                <div className="absolute top-4 right-4">
                  <button onClick={() => setMenuOpen(menuOpen === proposal._id ? null : proposal._id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500
                      hover:bg-bg-hover hover:text-white transition-all opacity-0 group-hover:opacity-100">
                    <MoreVertical size={14} />
                  </button>
                  {menuOpen === proposal._id && (
                    <div className="absolute right-0 top-8 w-48 glass-card py-1 z-20 shadow-card">
                      <button onClick={() => { navigate(`/proposals/${proposal._id}`); setMenuOpen(null); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-dm text-slate-300 hover:bg-bg-hover hover:text-white transition-colors">
                        <Eye size={14} /> View Proposal
                      </button>
                      <hr className="border-bg-border my-1" />
                      {proposal.status === "draft" && (
                        <button onClick={() => handleStatusChange(proposal, "sent")}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-dm text-blue-400 hover:bg-blue-400/10 transition-colors">
                          <Send size={14} /> Mark as Sent
                        </button>
                      )}
                      {proposal.status === "sent" && (
                        <>
                          <button onClick={() => handleStatusChange(proposal, "approved")}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-dm text-teal-400 hover:bg-teal-400/10 transition-colors">
                            <CheckCircle2 size={14} /> Mark Approved
                          </button>
                          <button onClick={() => handleStatusChange(proposal, "rejected")}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-dm text-red-400 hover:bg-red-500/10 transition-colors">
                            <XCircle size={14} /> Mark Rejected
                          </button>
                        </>
                      )}
                      <hr className="border-bg-border my-1" />
                      <button onClick={() => { setDeleteDialog({ open: true, proposal }); setMenuOpen(null); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-dm text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* AI badge */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full
                    bg-violet-400/10 border border-violet-400/20">
                    <Sparkles size={11} className="text-violet-400" />
                    <span className="text-xs font-dm text-violet-400">Gemini AI</span>
                  </div>
                  <span className={`badge ${cls} flex items-center gap-1`}>
                    <SIcon size={10} className={SColor} />
                    {statusConfig[proposal.status]?.label}
                  </span>
                </div>

                <div className="flex-1">
                  <h3 className="font-syne font-semibold text-white text-sm mb-1 pr-8 leading-snug">
                    {proposal.title}
                  </h3>
                  <p className="font-dm text-xs text-slate-500 mb-3">{proposal.client?.name}</p>

                  {/* Input summary */}
                  {proposal.inputData && (
                    <div className="space-y-1 mb-3">
                      {proposal.inputData.scope && (
                        <p className="font-dm text-xs text-slate-400 line-clamp-2">{proposal.inputData.scope}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {proposal.inputData.budget && (
                          <span className="text-xs font-dm text-slate-500 bg-bg-hover px-2 py-0.5 rounded-md">
                            {proposal.inputData.budget}
                          </span>
                        )}
                        {proposal.inputData.timeline && (
                          <span className="text-xs font-dm text-slate-500 bg-bg-hover px-2 py-0.5 rounded-md">
                            {proposal.inputData.timeline}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-bg-border">
                  <p className="font-dm text-xs text-slate-600">
                    {format(new Date(proposal.createdAt), "dd MMM yyyy")}
                  </p>
                  <button onClick={() => navigate(`/proposals/${proposal._id}`)}
                    className="text-xs font-dm text-slate-500 hover:text-teal-400 transition-colors">
                    View →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {menuOpen && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />}

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, proposal: null })}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Proposal"
        message={`Delete "${deleteDialog.proposal?.title}"? This cannot be undone.`}
        confirmLabel="Delete Proposal"
      />
    </div>
  );
}
