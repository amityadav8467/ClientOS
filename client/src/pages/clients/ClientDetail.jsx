import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Mail, Phone, Globe, MapPin, Edit2, FolderKanban, FileText, Calendar, UserPlus, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import api from "../../utils/api";
import PageHeader from "../../components/ui/PageHeader";
import ClientModal from "./ClientModal";

const statusColors = {
  planning: "badge-planning", active: "badge-active",
  review: "badge-review", completed: "badge-completed",
};

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const handleCreatePortal = async () => {
    setPortalLoading(true);
    try {
      await api.post("/api/portal/create-account", { clientId: id });
      toast.success("Portal account created! Login credentials emailed to client.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create portal account");
    } finally {
      setPortalLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [clientRes, projectsRes, invoicesRes] = await Promise.all([
        api.get(`/api/clients/${id}`),
        api.get(`/api/projects?client=${id}`),
        api.get(`/api/invoices`),
      ]);
      setClient(clientRes.data.client);
      setProjects(projectsRes.data.projects);
      setInvoices(invoicesRes.data.invoices.filter(i => i.client?._id === id));
    } catch {
      toast.error("Failed to load client");
      navigate("/clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="skeleton h-10 w-48 rounded-xl" />
        <div className="glass-card p-6 space-y-4">
          <div className="skeleton h-16 w-16 rounded-2xl" />
          <div className="skeleton h-6 w-40" />
          <div className="skeleton h-4 w-60" />
        </div>
      </div>
    );
  }

  if (!client) return null;

  const totalRevenue = invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + i.totalAmount, 0);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={client.name}
        subtitle={client.businessType || "Client"}
        backTo="/clients"
        actions={[
          <button onClick={handleCreatePortal} disabled={portalLoading}
            className="btn-ghost flex items-center gap-2 text-sm disabled:opacity-50">
            {portalLoading
              ? <span className="w-4 h-4 border border-slate-500 border-t-teal-400 rounded-full animate-spin" />
              : <UserPlus size={15} />}
            Client Portal
          </button>,
          <button onClick={() => setEditOpen(true)} className="btn-ghost flex items-center gap-2 text-sm">
            <Edit2 size={15} /> Edit
          </button>
        ]}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left — Client Info */}
        <div className="xl:col-span-1 space-y-4">
          <div className="glass-card p-6">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-2xl bg-teal-400/10 border border-teal-400/20
                flex items-center justify-center flex-shrink-0">
                <span className="font-syne font-bold text-teal-400 text-2xl">
                  {client.name.charAt(0)}
                </span>
              </div>
              <div>
                <h2 className="font-syne font-bold text-white text-lg">{client.name}</h2>
                <span className={`badge mt-1 ${client.status === "active" ? "badge-active" : "badge-inactive"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${client.status === "active" ? "bg-teal-400" : "bg-slate-500"}`} />
                  {client.status}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { icon: Mail, label: client.email },
                { icon: Phone, label: client.phone },
                { icon: Globe, label: client.website },
                { icon: MapPin, label: client.address },
                { icon: Calendar, label: client.createdAt ? `Client since ${format(new Date(client.createdAt), "MMM yyyy")}` : null },
              ].filter(i => i.label).map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-start gap-3">
                  <Icon size={14} className="text-slate-500 mt-0.5 flex-shrink-0" />
                  <span className="font-dm text-sm text-slate-300 break-all">{label}</span>
                </div>
              ))}
            </div>

            {client.notes && (
              <div className="mt-4 pt-4 border-t border-bg-border">
                <p className="text-xs font-dm text-slate-500 uppercase tracking-wider mb-2">Notes</p>
                <p className="font-dm text-sm text-slate-400">{client.notes}</p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Projects", value: projects.length, color: "text-blue-400" },
              { label: "Invoices", value: invoices.length, color: "text-amber-400" },
              { label: "Revenue", value: `₹${(totalRevenue / 1000).toFixed(0)}k`, color: "text-teal-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass-card p-3 text-center">
                <p className={`font-syne font-bold text-xl ${color}`}>{value}</p>
                <p className="font-dm text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Projects & Invoices */}
        <div className="xl:col-span-2 space-y-5">
          {/* Projects */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">Projects</h3>
              <button
                onClick={() => navigate("/projects/new")}
                className="text-xs font-dm text-teal-400 hover:text-teal-300 transition-colors"
              >
                + New Project
              </button>
            </div>
            {projects.length === 0 ? (
              <p className="font-dm text-sm text-slate-500 text-center py-8">No projects yet for this client.</p>
            ) : (
              <div className="space-y-2">
                {projects.map((p) => (
                  <button
                    key={p._id}
                    onClick={() => navigate(`/projects/${p._id}`)}
                    className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-bg-hover
                      transition-all group border border-transparent hover:border-bg-border text-left"
                  >
                    <div className="w-9 h-9 rounded-xl bg-teal-400/10 flex items-center justify-center flex-shrink-0">
                      <FolderKanban size={15} className="text-teal-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-dm text-sm text-white group-hover:text-teal-400 transition-colors truncate">{p.title}</p>
                      <p className="font-dm text-xs text-slate-500">
                        {p.deadline ? `Due ${format(new Date(p.deadline), "dd MMM yyyy")}` : "No deadline"} · ₹{p.budget?.toLocaleString()}
                      </p>
                    </div>
                    <span className={`badge ${statusColors[p.status]} flex-shrink-0`}>{p.status}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Invoices */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">Invoices</h3>
              <button
                onClick={() => navigate("/invoices/new")}
                className="text-xs font-dm text-teal-400 hover:text-teal-300 transition-colors"
              >
                + New Invoice
              </button>
            </div>
            {invoices.length === 0 ? (
              <p className="font-dm text-sm text-slate-500 text-center py-8">No invoices yet.</p>
            ) : (
              <div className="space-y-2">
                {invoices.map((inv) => (
                  <div key={inv._id}
                    className="flex items-center gap-4 p-3 rounded-xl border border-bg-border">
                    <FileText size={15} className="text-slate-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-dm text-sm text-white">{inv.invoiceNumber}</p>
                      <p className="font-dm text-xs text-slate-500">
                        {inv.dueDate ? `Due ${format(new Date(inv.dueDate), "dd MMM yyyy")}` : "No due date"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-syne font-semibold text-white text-sm">₹{inv.totalAmount?.toLocaleString()}</p>
                      <span className={`badge badge-${inv.status} text-xs`}>{inv.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ClientModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        client={client}
        onSuccess={fetchData}
      />
    </div>
  );
}
