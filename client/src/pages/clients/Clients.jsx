import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Plus, Search, Mail, Phone, Globe, MoreVertical, Edit2, Trash2, Eye } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../utils/api";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import ClientModal from "./ClientModal";

const statusBadge = (status) =>
  status === "active"
    ? "badge-active"
    : "badge-inactive";

export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, client: null });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);

  const fetchClients = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get("/api/clients", { params });
      setClients(res.data.clients);
    } catch {
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, [search, statusFilter]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/api/clients/${deleteDialog.client._id}`);
      toast.success("Client deleted");
      setDeleteDialog({ open: false, client: null });
      fetchClients();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEdit = (client) => {
    setEditingClient(client);
    setModalOpen(true);
    setMenuOpen(null);
  };

  const openNew = () => {
    setEditingClient(null);
    setModalOpen(true);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Clients"
        subtitle={`${clients.length} client${clients.length !== 1 ? "s" : ""} total`}
        actions={
          <button onClick={openNew} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> Add Client
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field sm:w-40"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Clients Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="skeleton w-11 h-11 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-28" />
                  <div className="skeleton h-3 w-20" />
                </div>
              </div>
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-3 w-3/4" />
            </div>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Add your first client to start managing projects and invoices."
          action={{ label: "Add First Client", onClick: openNew }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map((client) => (
            <div key={client._id} className="glass-card glass-card-hover p-5 relative group">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-teal-400/10 border border-teal-400/20
                    flex items-center justify-center flex-shrink-0">
                    <span className="font-syne font-bold text-teal-400 text-base">
                      {client.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-syne font-semibold text-white text-sm leading-tight">
                      {client.name}
                    </h3>
                    {client.businessType && (
                      <p className="font-dm text-xs text-slate-500 mt-0.5">{client.businessType}</p>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === client._id ? null : client._id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500
                      hover:bg-bg-hover hover:text-white transition-all opacity-0 group-hover:opacity-100"
                  >
                    <MoreVertical size={15} />
                  </button>
                  {menuOpen === client._id && (
                    <div className="absolute right-0 top-9 w-44 glass-card py-1 z-20 shadow-card">
                      <button
                        onClick={() => navigate(`/clients/${client._id}`)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-dm text-slate-300
                          hover:bg-bg-hover hover:text-white transition-colors"
                      >
                        <Eye size={14} /> View Details
                      </button>
                      <button
                        onClick={() => openEdit(client)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-dm text-slate-300
                          hover:bg-bg-hover hover:text-white transition-colors"
                      >
                        <Edit2 size={14} /> Edit Client
                      </button>
                      <hr className="border-bg-border my-1" />
                      <button
                        onClick={() => { setDeleteDialog({ open: true, client }); setMenuOpen(null); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-dm text-red-400
                          hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact info */}
              <div className="space-y-2 mb-4">
                {client.email && (
                  <div className="flex items-center gap-2 text-xs font-dm text-slate-400">
                    <Mail size={12} className="text-slate-500 flex-shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-xs font-dm text-slate-400">
                    <Phone size={12} className="text-slate-500 flex-shrink-0" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.website && (
                  <div className="flex items-center gap-2 text-xs font-dm text-slate-400">
                    <Globe size={12} className="text-slate-500 flex-shrink-0" />
                    <span className="truncate">{client.website}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-bg-border">
                <span className={`badge ${statusBadge(client.status)}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${client.status === "active" ? "bg-teal-400" : "bg-slate-500"}`} />
                  {client.status}
                </span>
                <button
                  onClick={() => navigate(`/clients/${client._id}`)}
                  className="text-xs font-dm text-slate-500 hover:text-teal-400 transition-colors"
                >
                  View →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Click outside to close menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
      )}

      <ClientModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingClient(null); }}
        client={editingClient}
        onSuccess={fetchClients}
      />

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, client: null })}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Client"
        message={`Are you sure you want to delete "${deleteDialog.client?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Client"
      />
    </div>
  );
}
