import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText, Plus, Search, Download, MoreVertical,
  Edit2, Trash2, Eye, CheckCircle2, Clock, AlertCircle, IndianRupee,
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import api from "../../utils/api";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";
import ConfirmDialog from "../../components/ui/ConfirmDialog";

const statusConfig = {
  unpaid:  { label: "Unpaid",  cls: "badge-unpaid",  icon: Clock,        iconCls: "text-amber-400" },
  paid:    { label: "Paid",    cls: "badge-paid",    icon: CheckCircle2, iconCls: "text-teal-400" },
  overdue: { label: "Overdue", cls: "badge-overdue", icon: AlertCircle,  iconCls: "text-red-400" },
};

export default function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [menuOpen, setMenuOpen] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, invoice: null });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchInvoices = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get("/api/invoices", { params });
      let list = res.data.invoices;
      if (search) list = list.filter(i =>
        i.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
        i.client?.name?.toLowerCase().includes(search.toLowerCase())
      );
      setInvoices(list);
    } catch {
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, [search, statusFilter]);

  const handleStatusChange = async (invoice, newStatus) => {
    try {
      await api.put(`/api/invoices/${invoice._id}/status`, { status: newStatus });
      toast.success(`Marked as ${newStatus}`);
      fetchInvoices();
    } catch {
      toast.error("Failed to update status");
    }
    setMenuOpen(null);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/api/invoices/${deleteDialog.invoice._id}`);
      toast.success("Invoice deleted");
      setDeleteDialog({ open: false, invoice: null });
      fetchInvoices();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDownloadPDF = async (invoice) => {
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
      toast.error("PDF download failed");
    } finally {
      setDownloadingId(null);
    }
  };

  // Summary stats
  const totalRevenue = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.totalAmount, 0);
  const pendingAmount = invoices.filter(i => i.status === "unpaid").reduce((s, i) => s + i.totalAmount, 0);
  const overdueAmount = invoices.filter(i => i.status === "overdue").reduce((s, i) => s + i.totalAmount, 0);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Invoices"
        subtitle={`${invoices.length} invoice${invoices.length !== 1 ? "s" : ""}`}
        actions={
          <button onClick={() => navigate("/invoices/new")} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> New Invoice
          </button>
        }
      />

      {/* Summary cards */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Received", value: totalRevenue, color: "text-teal-400", bg: "bg-teal-400/10", icon: CheckCircle2 },
            { label: "Pending",        value: pendingAmount, color: "text-amber-400", bg: "bg-amber-400/10", icon: Clock },
            { label: "Overdue",        value: overdueAmount, color: "text-red-400",   bg: "bg-red-400/10",  icon: AlertCircle },
          ].map(({ label, value, color, bg, icon: Icon }) => (
            <div key={label} className="glass-card p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} className={color} />
              </div>
              <div>
                <p className="font-dm text-xs text-slate-500 uppercase tracking-wider">{label}</p>
                <p className={`font-syne font-bold text-xl ${color}`}>₹{value.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text" placeholder="Search by invoice # or client..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field sm:w-40">
          <option value="">All Status</option>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Invoice list */}
      {loading ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="glass-card p-4 flex items-center gap-4">
              <div className="skeleton w-10 h-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-28" />
                <div className="skeleton h-3 w-20" />
              </div>
              <div className="skeleton h-6 w-16 rounded-full" />
              <div className="skeleton h-5 w-20" />
            </div>
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No invoices yet"
          description="Create your first invoice and start tracking payments."
          action={{ label: "Create Invoice", onClick: () => navigate("/invoices/new") }}
        />
      ) : (
        <div className="glass-card overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-bg-border
            text-xs font-dm text-slate-500 uppercase tracking-wider">
            <div className="col-span-1">#</div>
            <div className="col-span-3">Client</div>
            <div className="col-span-2">Project</div>
            <div className="col-span-2">Due Date</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-1" />
          </div>

          {invoices.map((invoice, idx) => {
            const { cls, icon: SIcon, iconCls } = statusConfig[invoice.status] || statusConfig.unpaid;
            const isOverdue = invoice.status !== "paid" && invoice.dueDate && new Date(invoice.dueDate) < new Date();

            return (
              <div key={invoice._id}
                className={`grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-4 items-center
                  hover:bg-bg-hover transition-colors group relative
                  ${idx !== invoices.length - 1 ? "border-b border-bg-border" : ""}`}>

                {/* Invoice # */}
                <div className="col-span-1 hidden md:flex items-center">
                  <div className="w-9 h-9 rounded-xl bg-bg-hover border border-bg-border
                    flex items-center justify-center flex-shrink-0">
                    <FileText size={14} className="text-slate-500" />
                  </div>
                </div>

                {/* Client */}
                <div className="col-span-3 flex items-center gap-2 min-w-0">
                  <div className="md:hidden w-9 h-9 rounded-xl bg-bg-hover border border-bg-border
                    flex items-center justify-center flex-shrink-0">
                    <FileText size={14} className="text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-syne font-semibold text-sm text-white truncate">
                      {invoice.invoiceNumber}
                    </p>
                    <p className="font-dm text-xs text-slate-400 truncate">{invoice.client?.name}</p>
                  </div>
                </div>

                {/* Project */}
                <div className="col-span-2 hidden md:block">
                  <p className="font-dm text-xs text-slate-400 truncate">
                    {invoice.project?.title || "—"}
                  </p>
                </div>

                {/* Due date */}
                <div className="col-span-2 hidden md:block">
                  {invoice.dueDate ? (
                    <p className={`font-dm text-xs ${isOverdue ? "text-red-400" : "text-slate-400"}`}>
                      {format(new Date(invoice.dueDate), "dd MMM yyyy")}
                    </p>
                  ) : <p className="font-dm text-xs text-slate-600">—</p>}
                </div>

                {/* Status */}
                <div className="col-span-1 hidden md:flex">
                  <span className={`badge ${cls} flex items-center gap-1`}>
                    <SIcon size={10} className={iconCls} />
                    {statusConfig[invoice.status]?.label}
                  </span>
                </div>

                {/* Amount */}
                <div className="col-span-2 text-right">
                  <p className="font-syne font-bold text-sm text-white">
                    ₹{invoice.totalAmount?.toLocaleString()}
                  </p>
                  <div className="md:hidden mt-0.5">
                    <span className={`badge ${cls} text-xs`}>{statusConfig[invoice.status]?.label}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-1 flex justify-end relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === invoice._id ? null : invoice._id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500
                      hover:bg-bg-card hover:text-white transition-all opacity-0 group-hover:opacity-100"
                  >
                    <MoreVertical size={15} />
                  </button>

                  {menuOpen === invoice._id && (
                    <div className="absolute right-0 top-9 w-48 glass-card py-1 z-20 shadow-card">
                      <button onClick={() => { navigate(`/invoices/${invoice._id}`); setMenuOpen(null); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-dm text-slate-300 hover:bg-bg-hover hover:text-white transition-colors">
                        <Eye size={14} /> View Details
                      </button>
                      <button onClick={() => { navigate(`/invoices/${invoice._id}/edit`); setMenuOpen(null); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-dm text-slate-300 hover:bg-bg-hover hover:text-white transition-colors">
                        <Edit2 size={14} /> Edit Invoice
                      </button>
                      <button onClick={() => handleDownloadPDF(invoice)}
                        disabled={downloadingId === invoice._id}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-dm text-slate-300 hover:bg-bg-hover hover:text-white transition-colors disabled:opacity-50">
                        {downloadingId === invoice._id
                          ? <span className="w-3.5 h-3.5 border border-slate-500 border-t-teal-400 rounded-full animate-spin" />
                          : <Download size={14} />}
                        Download PDF
                      </button>
                      <hr className="border-bg-border my-1" />
                      {invoice.status !== "paid" && (
                        <button onClick={() => handleStatusChange(invoice, "paid")}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-dm text-teal-400 hover:bg-teal-400/10 transition-colors">
                          <CheckCircle2 size={14} /> Mark as Paid
                        </button>
                      )}
                      {invoice.status !== "overdue" && invoice.status !== "paid" && (
                        <button onClick={() => handleStatusChange(invoice, "overdue")}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-dm text-red-400 hover:bg-red-500/10 transition-colors">
                          <AlertCircle size={14} /> Mark Overdue
                        </button>
                      )}
                      <hr className="border-bg-border my-1" />
                      <button onClick={() => { setDeleteDialog({ open: true, invoice }); setMenuOpen(null); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-dm text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {menuOpen && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />}

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, invoice: null })}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Invoice"
        message={`Delete invoice "${deleteDialog.invoice?.invoiceNumber}"? This cannot be undone.`}
        confirmLabel="Delete Invoice"
      />
    </div>
  );
}
