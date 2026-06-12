import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Sparkles, Send, CheckCircle2, XCircle, FileText,
  Trash2, Calendar, ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import api from "../../utils/api";
import PageHeader from "../../components/ui/PageHeader";
import ConfirmDialog from "../../components/ui/ConfirmDialog";

const statusConfig = {
  draft:    { label: "Draft",    cls: "badge-inactive", icon: FileText,    color: "text-slate-400" },
  sent:     { label: "Sent",     cls: "badge-planning", icon: Send,         color: "text-blue-400" },
  approved: { label: "Approved", cls: "badge-active",   icon: CheckCircle2, color: "text-teal-400" },
  rejected: { label: "Rejected", cls: "badge-overdue",  icon: XCircle,      color: "text-red-400" },
};

// Simple markdown renderer (no external dep needed for this scope)
function MarkdownContent({ content }) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="font-syne text-2xl font-bold text-white mt-6 mb-3 pb-2 border-b border-bg-border">
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="font-syne text-lg font-bold text-teal-400 mt-5 mb-2">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="font-syne text-base font-semibold text-white mt-4 mb-1.5">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const items = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(
          <li key={i} className="font-dm text-sm text-slate-300 mb-1">
            {lines[i].slice(2).replace(/\*\*(.*?)\*\*/g, "$1")}
          </li>
        );
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc list-inside space-y-1 mb-3 pl-2">
          {items}
        </ul>
      );
      continue;
    } else if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(
          <li key={i} className="font-dm text-sm text-slate-300 mb-1">
            {lines[i].replace(/^\d+\.\s/, "").replace(/\*\*(.*?)\*\*/g, "$1")}
          </li>
        );
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="list-decimal list-inside space-y-1 mb-3 pl-2">
          {items}
        </ol>
      );
      continue;
    } else if (line.startsWith("|")) {
      // Table
      const rows = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        if (!lines[i].includes("---")) {
          rows.push(lines[i].split("|").filter(c => c.trim()).map(c => c.trim()));
        }
        i++;
      }
      elements.push(
        <div key={`table-${i}`} className="overflow-x-auto mb-4">
          <table className="w-full text-sm font-dm">
            <thead>
              <tr className="bg-bg-primary">
                {rows[0]?.map((cell, ci) => (
                  <th key={ci} className="px-4 py-2 text-left text-xs text-slate-400 uppercase tracking-wider border border-bg-border">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(1).map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? "bg-bg-secondary" : "bg-bg-card"}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-4 py-2 text-slate-300 border border-bg-border">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    } else if (line.startsWith("**") && line.endsWith("**")) {
      elements.push(
        <p key={i} className="font-dm font-semibold text-white text-sm mb-1">
          {line.slice(2, -2)}
        </p>
      );
    } else if (line.trim() === "" || line === "---") {
      elements.push(<div key={i} className="mb-2" />);
    } else if (line.trim()) {
      const formatted = line
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="text-slate-300 italic">$1</em>');
      elements.push(
        <p key={i} className="font-dm text-sm text-slate-300 mb-2 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatted }} />
      );
    }
    i++;
  }

  return <div className="proposal-content">{elements}</div>;
}

export default function ProposalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusDropdown, setStatusDropdown] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchProposal = async () => {
    try {
      const res = await api.get(`/api/proposals/${id}`);
      setProposal(res.data.proposal);
    } catch {
      toast.error("Proposal not found");
      navigate("/proposals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProposal(); }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      await api.put(`/api/proposals/${id}/status`, { status: newStatus });
      toast.success(`Marked as ${newStatus}`);
      fetchProposal();
    } catch {
      toast.error("Failed to update");
    }
    setStatusDropdown(false);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/api/proposals/${id}`);
      toast.success("Proposal deleted");
      navigate("/proposals");
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return (
    <div className="animate-fade-in space-y-4 max-w-3xl">
      <div className="skeleton h-10 w-64 rounded-xl" />
      <div className="glass-card p-8 space-y-4">
        <div className="skeleton h-8 w-80" />
        {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton h-4 w-full" />)}
      </div>
    </div>
  );

  if (!proposal) return null;

  const { cls, icon: SIcon, color: SColor } = statusConfig[proposal.status] || statusConfig.draft;
  const nextStatuses = {
    draft: [{ value: "sent", label: "Mark as Sent", icon: Send, color: "text-blue-400" }],
    sent: [
      { value: "approved", label: "Mark Approved", icon: CheckCircle2, color: "text-teal-400" },
      { value: "rejected", label: "Mark Rejected", icon: XCircle, color: "text-red-400" },
    ],
    approved: [],
    rejected: [{ value: "draft", label: "Reset to Draft", icon: FileText, color: "text-slate-400" }],
  };

  return (
    <div className="animate-fade-in max-w-3xl">
      <PageHeader
        title={proposal.title}
        subtitle={proposal.client?.name}
        backTo="/proposals"
        actions={
          <div className="flex items-center gap-3">
            {/* Status changer */}
            {nextStatuses[proposal.status]?.length > 0 && (
              <div className="relative">
                <button onClick={() => setStatusDropdown(!statusDropdown)}
                  className="btn-ghost flex items-center gap-2 text-sm">
                  <SIcon size={14} className={SColor} />
                  {statusConfig[proposal.status]?.label}
                  <ChevronDown size={13} />
                </button>
                {statusDropdown && (
                  <div className="absolute right-0 top-11 w-48 glass-card py-1 z-20 shadow-card">
                    {nextStatuses[proposal.status].map(({ value, label, icon: Icon, color }) => (
                      <button key={value} onClick={() => handleStatusChange(value)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-dm ${color}
                          hover:bg-bg-hover transition-colors`}>
                        <Icon size={14} /> {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button onClick={() => setDeleteDialog(true)}
              className="w-9 h-9 rounded-xl border border-bg-border flex items-center justify-center
                text-slate-500 hover:text-red-400 hover:border-red-500/30 transition-all">
              <Trash2 size={15} />
            </button>
          </div>
        }
      />

      {statusDropdown && <div className="fixed inset-0 z-10" onClick={() => setStatusDropdown(false)} />}

      {/* Meta card */}
      <div className="glass-card p-5 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-400/10 flex items-center justify-center">
              <Sparkles size={14} className="text-violet-400" />
            </div>
            <div>
              <p className="font-dm text-xs text-slate-500">Generated by</p>
              <p className="font-dm text-sm text-white font-medium">Gemini 1.5 Flash</p>
            </div>
          </div>
          <div className="w-px h-8 bg-bg-border hidden sm:block" />
          <div>
            <p className="font-dm text-xs text-slate-500">Client</p>
            <p className="font-dm text-sm text-white">{proposal.client?.name}</p>
          </div>
          {proposal.inputData?.budget && (
            <>
              <div className="w-px h-8 bg-bg-border hidden sm:block" />
              <div>
                <p className="font-dm text-xs text-slate-500">Budget</p>
                <p className="font-dm text-sm text-white">{proposal.inputData.budget}</p>
              </div>
            </>
          )}
          {proposal.inputData?.timeline && (
            <>
              <div className="w-px h-8 bg-bg-border hidden sm:block" />
              <div>
                <p className="font-dm text-xs text-slate-500">Timeline</p>
                <p className="font-dm text-sm text-white">{proposal.inputData.timeline}</p>
              </div>
            </>
          )}
          <div className="ml-auto flex items-center gap-2">
            <span className={`badge ${cls} flex items-center gap-1`}>
              <SIcon size={10} className={SColor} />
              {statusConfig[proposal.status]?.label}
            </span>
            <span className="font-dm text-xs text-slate-600">
              {format(new Date(proposal.createdAt), "dd MMM yyyy")}
            </span>
          </div>
        </div>
      </div>

      {/* Generated content */}
      <div className="glass-card p-8">
        <MarkdownContent content={proposal.generatedContent} />
      </div>

      <ConfirmDialog
        isOpen={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Proposal"
        message={`Delete "${proposal.title}"? This cannot be undone.`}
        confirmLabel="Delete Proposal"
      />
    </div>
  );
}
