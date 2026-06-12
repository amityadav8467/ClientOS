import { useEffect, useState } from "react";
import { FileText, FileCheck, Download, CheckCircle2, Clock, AlertCircle, Send, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import api from "../../utils/api";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

const invoiceStatus = {
  unpaid:  { cls: "badge-unpaid",  icon: Clock,        color: "text-amber-400" },
  paid:    { cls: "badge-paid",    icon: CheckCircle2, color: "text-teal-400" },
  overdue: { cls: "badge-overdue", icon: AlertCircle,  color: "text-red-400" },
};

const proposalStatus = {
  sent:     { cls: "badge-planning", icon: Send,         color: "text-blue-400" },
  approved: { cls: "badge-active",   icon: CheckCircle2, color: "text-teal-400" },
  rejected: { cls: "badge-overdue",  icon: XCircle,      color: "text-red-400" },
};

// ── PORTAL INVOICES ─────────────────────────────────────────────────────────
export function PortalInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    api.get("/api/portal/invoices")
      .then(r => setInvoices(r.data.invoices))
      .catch(() => toast.error("Failed to load invoices"))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (invoice) => {
    setDownloadingId(invoice._id);
    try {
      const res = await api.get(`/api/invoices/${invoice._id}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("PDF downloaded!");
    } catch {
      toast.error("Download failed");
    } finally {
      setDownloadingId(null);
    }
  };

  const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.totalAmount, 0);
  const totalPending = invoices.filter(i => i.status !== "paid").reduce((s, i) => s + i.totalAmount, 0);

  return (
    <div className="animate-fade-in">
      <PageHeader title="My Invoices" subtitle={`${invoices.length} invoice${invoices.length !== 1 ? "s" : ""}`} />

      {!loading && invoices.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-teal-400/10 flex items-center justify-center">
              <CheckCircle2 size={18} className="text-teal-400" />
            </div>
            <div>
              <p className="font-dm text-xs text-slate-500 uppercase tracking-wider">Total Paid</p>
              <p className="font-syne font-bold text-xl text-teal-400">₹{totalPaid.toLocaleString()}</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center">
              <Clock size={18} className="text-amber-400" />
            </div>
            <div>
              <p className="font-dm text-xs text-slate-500 uppercase tracking-wider">Pending</p>
              <p className="font-syne font-bold text-xl text-amber-400">₹{totalPending.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => <div key={i} className="glass-card p-4 skeleton h-16" />)}
        </div>
      ) : invoices.length === 0 ? (
        <EmptyState icon={FileText} title="No invoices yet" description="Your invoices from Codexora Solutions will appear here." />
      ) : (
        <div className="glass-card overflow-hidden">
          {invoices.map((inv, idx) => {
            const { cls, icon: SIcon, color: SColor } = invoiceStatus[inv.status] || invoiceStatus.unpaid;
            return (
              <div key={inv._id}
                className={`flex items-center gap-4 px-5 py-4 hover:bg-bg-hover transition-colors
                  ${idx !== invoices.length - 1 ? "border-b border-bg-border" : ""}`}>
                <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center flex-shrink-0">
                  <FileText size={16} className="text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-syne font-semibold text-sm text-white">{inv.invoiceNumber}</p>
                  <p className="font-dm text-xs text-slate-400">
                    {inv.project?.title && `${inv.project.title} · `}
                    {inv.dueDate ? `Due ${format(new Date(inv.dueDate), "dd MMM yyyy")}` : "No due date"}
                  </p>
                </div>
                <span className={`badge ${cls} hidden sm:flex items-center gap-1`}>
                  <SIcon size={10} className={SColor} />
                  {inv.status}
                </span>
                <p className="font-syne font-bold text-sm text-white">₹{inv.totalAmount?.toLocaleString()}</p>
                <button onClick={() => handleDownload(inv)} disabled={downloadingId === inv._id}
                  className="w-9 h-9 rounded-xl border border-bg-border flex items-center justify-center
                    text-slate-400 hover:text-teal-400 hover:border-teal-400/40 transition-all disabled:opacity-50">
                  {downloadingId === inv._id
                    ? <span className="w-3.5 h-3.5 border border-slate-500 border-t-teal-400 rounded-full animate-spin" />
                    : <Download size={15} />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── PORTAL PROPOSALS ─────────────────────────────────────────────────────────
export function PortalProposals() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get("/api/portal/proposals")
      .then(r => setProposals(r.data.proposals))
      .catch(() => toast.error("Failed to load proposals"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in max-w-3xl">
      <PageHeader title="Proposals" subtitle="Proposals sent by your agency" />

      {loading ? (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => <div key={i} className="glass-card p-5 skeleton h-24" />)}
        </div>
      ) : proposals.length === 0 ? (
        <EmptyState icon={FileCheck} title="No proposals yet" description="Proposals shared with you will appear here once your agency sends them." />
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => {
            const { cls, icon: SIcon, color: SColor } = proposalStatus[proposal.status] || proposalStatus.sent;
            const isExpanded = expanded === proposal._id;

            return (
              <div key={proposal._id} className="glass-card overflow-hidden">
                <button
                  onClick={() => setExpanded(isExpanded ? null : proposal._id)}
                  className="w-full flex items-start gap-4 p-5 hover:bg-bg-hover transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-violet-400/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileCheck size={16} className="text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-syne font-semibold text-white text-sm">{proposal.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`badge ${cls} flex items-center gap-1`}>
                        <SIcon size={10} className={SColor} />
                        {proposal.status}
                      </span>
                      <span className="font-dm text-xs text-slate-500">
                        {format(new Date(proposal.createdAt), "dd MMM yyyy")}
                      </span>
                      {proposal.inputData?.budget && (
                        <span className="font-dm text-xs text-slate-500 hidden sm:block">
                          Budget: {proposal.inputData.budget}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-dm text-slate-500 flex-shrink-0">
                    {isExpanded ? "Hide ↑" : "Read ↓"}
                  </span>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-bg-border">
                    <div className="mt-4 prose-sm max-h-[500px] overflow-y-auto pr-2 space-y-2">
                      {proposal.generatedContent?.split("\n").map((line, i) => {
                        if (line.startsWith("# ")) return <h2 key={i} className="font-syne text-lg font-bold text-white mt-4 mb-2">{line.slice(2)}</h2>;
                        if (line.startsWith("## ")) return <h3 key={i} className="font-syne text-base font-semibold text-teal-400 mt-3 mb-1">{line.slice(3)}</h3>;
                        if (line.startsWith("- ")) return <p key={i} className="font-dm text-sm text-slate-300 pl-3 before:content-['•'] before:mr-2 before:text-teal-400">{line.slice(2)}</p>;
                        if (line.trim()) return <p key={i} className="font-dm text-sm text-slate-300 leading-relaxed">{line.replace(/\*\*(.*?)\*\*/g, "$1")}</p>;
                        return <div key={i} className="h-2" />;
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
