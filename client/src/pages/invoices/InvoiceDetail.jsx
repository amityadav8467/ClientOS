import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Download, Edit2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import api from "../../utils/api";
import PageHeader from "../../components/ui/PageHeader";

const statusConfig = {
  unpaid:  { cls: "badge-unpaid",  icon: Clock,        color: "text-amber-400" },
  paid:    { cls: "badge-paid",    icon: CheckCircle2, color: "text-teal-400" },
  overdue: { cls: "badge-overdue", icon: AlertCircle,  color: "text-red-400" },
};

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.get(`/api/invoices/${id}`)
      .then(r => setInvoice(r.data.invoice))
      .catch(() => { toast.error("Invoice not found"); navigate("/invoices"); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await api.get(`/api/invoices/${id}/pdf`, { responseType: "blob" });
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
      setDownloading(false);
    }
  };

  if (loading) return (
    <div className="animate-fade-in space-y-4">
      <div className="skeleton h-10 w-48 rounded-xl" />
      <div className="glass-card p-8 space-y-4">
        <div className="skeleton h-6 w-40" />
        <div className="skeleton h-4 w-56" />
        <div className="skeleton h-32 w-full" />
      </div>
    </div>
  );

  if (!invoice) return null;

  const { cls, icon: SIcon, color: SColor } = statusConfig[invoice.status] || statusConfig.unpaid;

  return (
    <div className="animate-fade-in max-w-3xl">
      <PageHeader
        title={invoice.invoiceNumber}
        subtitle={`Invoice for ${invoice.client?.name}`}
        backTo="/invoices"
        actions={
          <div className="flex gap-3">
            <button onClick={() => navigate(`/invoices/${id}/edit`)} className="btn-ghost flex items-center gap-2 text-sm">
              <Edit2 size={15} /> Edit
            </button>
            <button onClick={handleDownload} disabled={downloading} className="btn-primary flex items-center gap-2 text-sm">
              {downloading
                ? <span className="w-4 h-4 border-2 border-bg-primary/30 border-t-bg-primary rounded-full animate-spin" />
                : <Download size={15} />}
              Download PDF
            </button>
          </div>
        }
      />

      <div className="glass-card p-8">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-syne text-2xl font-bold text-teal-400">CODEXORA</span>
              <span className="font-dm text-xs text-slate-500 mt-1">SOLUTIONS</span>
            </div>
            <p className="font-dm text-sm text-slate-400">Professional Web Development Agency</p>
          </div>
          <div className="text-right">
            <p className="font-syne text-3xl font-bold text-white">{invoice.invoiceNumber}</p>
            <span className={`badge ${cls} mt-2 inline-flex items-center gap-1`}>
              <SIcon size={11} className={SColor} />
              {invoice.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8 p-4 rounded-xl bg-bg-primary border border-bg-border">
          <div>
            <p className="text-xs font-dm text-slate-500 uppercase tracking-wider mb-1">Issue Date</p>
            <p className="font-dm text-sm text-white">
              {format(new Date(invoice.createdAt), "dd MMM yyyy")}
            </p>
          </div>
          {invoice.dueDate && (
            <div>
              <p className="text-xs font-dm text-slate-500 uppercase tracking-wider mb-1">Due Date</p>
              <p className="font-dm text-sm text-white">
                {format(new Date(invoice.dueDate), "dd MMM yyyy")}
              </p>
            </div>
          )}
          {invoice.paidDate && (
            <div>
              <p className="text-xs font-dm text-slate-500 uppercase tracking-wider mb-1">Paid On</p>
              <p className="font-dm text-sm text-teal-400">
                {format(new Date(invoice.paidDate), "dd MMM yyyy")}
              </p>
            </div>
          )}
        </div>

        {/* Bill to */}
        <div className="mb-8">
          <p className="text-xs font-dm text-slate-500 uppercase tracking-wider mb-2">Bill To</p>
          <p className="font-syne font-bold text-white text-lg">{invoice.client?.name}</p>
          {invoice.client?.email && <p className="font-dm text-sm text-slate-400">{invoice.client.email}</p>}
          {invoice.client?.phone && <p className="font-dm text-sm text-slate-400">{invoice.client.phone}</p>}
          {invoice.client?.address && <p className="font-dm text-sm text-slate-400">{invoice.client.address}</p>}
          {invoice.project && (
            <p className="font-dm text-sm text-slate-500 mt-1">Project: {invoice.project.title}</p>
          )}
        </div>

        {/* Items table */}
        <div className="rounded-xl overflow-hidden border border-bg-border mb-6">
          <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-bg-primary text-xs font-dm text-slate-500 uppercase tracking-wider">
            <div className="col-span-6">Description</div>
            <div className="col-span-2 text-center">Qty</div>
            <div className="col-span-2 text-right">Rate</div>
            <div className="col-span-2 text-right">Amount</div>
          </div>
          {invoice.items.map((item, i) => (
            <div key={i} className={`grid grid-cols-12 gap-3 px-4 py-3 items-center font-dm text-sm
              ${i % 2 === 0 ? "bg-bg-secondary" : "bg-bg-card"}`}>
              <div className="col-span-6 text-slate-200">{item.description}</div>
              <div className="col-span-2 text-center text-slate-400">{item.quantity}</div>
              <div className="col-span-2 text-right text-slate-400">₹{item.rate.toLocaleString()}</div>
              <div className="col-span-2 text-right text-white font-medium">₹{item.amount.toLocaleString()}</div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="flex flex-col gap-2 items-end">
          <div className="flex items-center gap-12 text-sm font-dm">
            <span className="text-slate-400">Subtotal</span>
            <span className="text-white w-28 text-right">₹{invoice.subtotal?.toLocaleString()}</span>
          </div>
          {invoice.tax > 0 && (
            <div className="flex items-center gap-12 text-sm font-dm">
              <span className="text-slate-400">Tax ({invoice.tax}%)</span>
              <span className="text-white w-28 text-right">₹{(invoice.subtotal * invoice.tax / 100).toLocaleString()}</span>
            </div>
          )}
          <div className="flex items-center gap-12 font-syne font-bold text-xl mt-2 pt-3 border-t border-bg-border w-full justify-end">
            <span className="text-teal-400">Total</span>
            <span className="text-teal-400 w-28 text-right">₹{invoice.totalAmount?.toLocaleString()}</span>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-6 pt-6 border-t border-bg-border">
            <p className="text-xs font-dm text-slate-500 uppercase tracking-wider mb-2">Notes</p>
            <p className="font-dm text-sm text-slate-400">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
