import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderKanban, Plus, Search, Calendar, IndianRupee, MoreVertical, Edit2, Trash2, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import api from "../../utils/api";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import ProjectModal from "./ProjectModal";

const statusConfig = {
  planning: { label: "Planning", cls: "badge-planning" },
  active:   { label: "Active",   cls: "badge-active" },
  review:   { label: "Review",   cls: "badge-review" },
  completed:{ label: "Completed",cls: "badge-completed" },
};

const progressColor = {
  planning: "bg-blue-400",
  active: "bg-teal-400",
  review: "bg-amber-400",
  completed: "bg-slate-400",
};

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, project: null });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);

  const fetchProjects = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get("/api/projects", { params });
      let list = res.data.projects;
      if (search) list = list.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.client?.name?.toLowerCase().includes(search.toLowerCase())
      );
      setProjects(list);
    } catch {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, [search, statusFilter]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/api/projects/${deleteDialog.project._id}`);
      toast.success("Project deleted");
      setDeleteDialog({ open: false, project: null });
      fetchProjects();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  const taskProgress = (project) => {
    if (!project.tasks?.length) return 0;
    const done = project.tasks.filter(t => t.status === "completed").length;
    return Math.round((done / project.tasks.length) * 100);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Projects"
        subtitle={`${projects.length} project${projects.length !== 1 ? "s" : ""}`}
        actions={
          <button onClick={() => { setEditingProject(null); setModalOpen(true); }}
            className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> New Project
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search projects or clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field sm:w-44">
          <option value="">All Status</option>
          {Object.entries(statusConfig).map(([v, { label }]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
      </div>

      {/* Status summary bar */}
      {!loading && projects.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {Object.entries(statusConfig).map(([status, { label, cls }]) => {
            const count = projects.filter(p => p.status === status).length;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(statusFilter === status ? "" : status)}
                className={`glass-card p-3 text-center transition-all hover:scale-105
                  ${statusFilter === status ? "border-teal-400/40" : ""}`}
              >
                <p className="font-syne font-bold text-2xl text-white">{count}</p>
                <span className={`badge ${cls} mt-1 text-xs`}>{label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Project Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-3">
              <div className="skeleton h-5 w-36" />
              <div className="skeleton h-3 w-24" />
              <div className="skeleton h-2 w-full rounded-full" />
              <div className="flex gap-2">
                <div className="skeleton h-3 w-20" />
                <div className="skeleton h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description="Create your first project and start tracking progress."
          action={{ label: "Create Project", onClick: () => { setEditingProject(null); setModalOpen(true); } }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => {
            const progress = taskProgress(project);
            const { cls } = statusConfig[project.status] || statusConfig.planning;
            return (
              <div key={project._id} className="glass-card glass-card-hover p-5 relative group flex flex-col">
                {/* Menu */}
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => setMenuOpen(menuOpen === project._id ? null : project._id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500
                      hover:bg-bg-hover hover:text-white transition-all opacity-0 group-hover:opacity-100"
                  >
                    <MoreVertical size={14} />
                  </button>
                  {menuOpen === project._id && (
                    <div className="absolute right-0 top-8 w-44 glass-card py-1 z-20 shadow-card">
                      <button onClick={() => { navigate(`/projects/${project._id}`); setMenuOpen(null); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-dm text-slate-300 hover:bg-bg-hover hover:text-white transition-colors">
                        <Eye size={14} /> View Kanban
                      </button>
                      <button onClick={() => { setEditingProject(project); setModalOpen(true); setMenuOpen(null); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-dm text-slate-300 hover:bg-bg-hover hover:text-white transition-colors">
                        <Edit2 size={14} /> Edit Project
                      </button>
                      <hr className="border-bg-border my-1" />
                      <button onClick={() => { setDeleteDialog({ open: true, project }); setMenuOpen(null); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-dm text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="mb-3">
                    <h3 className="font-syne font-semibold text-white text-sm pr-8 leading-snug mb-1">{project.title}</h3>
                    <p className="font-dm text-xs text-slate-500">{project.client?.name || "No client"}</p>
                  </div>

                  {project.description && (
                    <p className="font-dm text-xs text-slate-400 mb-3 line-clamp-2">{project.description}</p>
                  )}

                  {/* Progress */}
                  {project.tasks?.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-dm text-xs text-slate-500">Progress</span>
                        <span className="font-dm text-xs text-slate-400">{progress}%</span>
                      </div>
                      <div className="h-1.5 bg-bg-hover rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${progressColor[project.status]}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex flex-wrap gap-3 text-xs font-dm text-slate-500">
                    {project.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {format(new Date(project.deadline), "dd MMM yy")}
                      </span>
                    )}
                    {project.budget > 0 && (
                      <span className="flex items-center gap-1">
                        <IndianRupee size={11} />
                        {project.budget.toLocaleString()}
                      </span>
                    )}
                    {project.tasks?.length > 0 && (
                      <span className="flex items-center gap-1">
                        <FolderKanban size={11} />
                        {project.tasks.filter(t => t.status === "completed").length}/{project.tasks.length} tasks
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-bg-border">
                  <span className={`badge ${cls}`}>{statusConfig[project.status]?.label}</span>
                  <button
                    onClick={() => navigate(`/projects/${project._id}`)}
                    className="text-xs font-dm text-slate-500 hover:text-teal-400 transition-colors"
                  >
                    Kanban →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {menuOpen && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />}

      <ProjectModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingProject(null); }}
        project={editingProject}
        onSuccess={fetchProjects}
      />
      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, project: null })}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Project"
        message={`Delete "${deleteDialog.project?.title}"? This cannot be undone.`}
        confirmLabel="Delete Project"
      />
    </div>
  );
}
