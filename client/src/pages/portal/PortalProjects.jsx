import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FolderKanban, Calendar, IndianRupee, ArrowLeft, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import api from "../../utils/api";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

const COLUMNS = [
  { id: "planning",  label: "Planning",  color: "text-blue-400",  bg: "bg-blue-400/10" },
  { id: "active",    label: "Active",    color: "text-teal-400",  bg: "bg-teal-400/10" },
  { id: "review",    label: "Review",    color: "text-amber-400", bg: "bg-amber-400/10" },
  { id: "completed", label: "Completed", color: "text-slate-400", bg: "bg-slate-400/10" },
];

const priorityIcons = {
  low:    { icon: "●", color: "text-slate-500" },
  medium: { icon: "●", color: "text-amber-400" },
  high:   { icon: "●", color: "text-red-400" },
};

const statusColors = {
  planning: "badge-planning", active: "badge-active",
  review: "badge-review", completed: "badge-completed",
};

// Projects List
export function PortalProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/portal/projects")
      .then(r => setProjects(r.data.projects))
      .catch(() => toast.error("Failed to load projects"))
      .finally(() => setLoading(false));
  }, []);

  const progress = (p) => {
    if (!p.tasks?.length) return 0;
    return Math.round((p.tasks.filter(t => t.status === "completed").length / p.tasks.length) * 100);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="My Projects" subtitle={`${projects.length} project${projects.length !== 1 ? "s" : ""}`} />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-3">
              <div className="skeleton h-5 w-36" />
              <div className="skeleton h-2 w-full rounded-full" />
              <div className="skeleton h-3 w-24" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No projects yet" description="Your projects will appear here once your agency adds them." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p) => {
            const pct = progress(p);
            return (
              <button key={p._id} onClick={() => navigate(`/portal/projects/${p._id}`)}
                className="glass-card glass-card-hover p-5 text-left flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-syne font-semibold text-white text-sm">{p.title}</h3>
                    {p.description && <p className="font-dm text-xs text-slate-400 mt-0.5 line-clamp-2">{p.description}</p>}
                  </div>
                  <span className={`badge ${statusColors[p.status]} flex-shrink-0`}>{p.status}</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-dm text-xs text-slate-500">Progress</span>
                    <span className="font-dm text-xs text-slate-400">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-bg-hover rounded-full overflow-hidden">
                    <div className="h-full bg-teal-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 text-xs font-dm text-slate-500 pt-1 border-t border-bg-border">
                  {p.deadline && (
                    <span className="flex items-center gap-1">
                      <Calendar size={11} /> Due {format(new Date(p.deadline), "dd MMM yyyy")}
                    </span>
                  )}
                  {p.tasks?.length > 0 && (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={11} />
                      {p.tasks.filter(t => t.status === "completed").length}/{p.tasks.length} tasks
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Read-only Kanban for portal
export function PortalProjectKanban() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/portal/projects/${id}`)
      .then(r => setProject(r.data.project))
      .catch(() => { toast.error("Project not found"); navigate("/portal/projects"); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="animate-fade-in">
      <div className="skeleton h-10 w-48 rounded-xl mb-6" />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-64 rounded-2xl" />)}
      </div>
    </div>
  );

  if (!project) return null;

  const tasks = project.tasks || [];
  const done = tasks.filter(t => t.status === "completed").length;
  const progress = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={project.title}
        backTo="/portal/projects"
        subtitle={`${done}/${tasks.length} tasks completed`}
      />

      {/* Meta bar */}
      <div className="glass-card p-4 mb-6 flex flex-wrap gap-5 items-center">
        <span className={`badge ${statusColors[project.status]}`}>{project.status}</span>
        {project.deadline && (
          <span className="flex items-center gap-1.5 text-sm font-dm text-slate-400">
            <Calendar size={14} className="text-slate-500" />
            Due {format(new Date(project.deadline), "dd MMM yyyy")}
          </span>
        )}
        {project.techStack?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.techStack.map(t => (
              <span key={t} className="px-2 py-0.5 rounded-md bg-bg-hover border border-bg-border text-xs font-dm text-slate-400">{t}</span>
            ))}
          </div>
        )}
        <div className="ml-auto flex items-center gap-3 min-w-[160px]">
          <div className="flex-1 h-2 bg-bg-hover rounded-full overflow-hidden">
            <div className="h-full bg-teal-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="font-syne font-bold text-sm text-teal-400 w-10 text-right">{progress}%</span>
        </div>
      </div>

      {/* Read-only Kanban */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div key={col.id} className="rounded-2xl border border-bg-border bg-bg-secondary/50 flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-bg-border rounded-t-2xl">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.bg}`} />
                  <span className={`font-syne font-semibold text-sm ${col.color}`}>{col.label}</span>
                </div>
                <span className={`text-xs font-dm font-medium px-2 py-0.5 rounded-full ${col.bg} ${col.color}`}>
                  {colTasks.length}
                </span>
              </div>

              <div className="p-3 space-y-2.5 min-h-[180px]">
                {colTasks.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-xs font-dm text-slate-600">No tasks</p>
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const { icon: dot, color: dotColor } = priorityIcons[task.priority] || priorityIcons.medium;
                    return (
                      <div key={task._id || task.title}
                        className="p-3 rounded-xl bg-bg-card border border-bg-border">
                        <p className="font-dm text-sm text-slate-200 leading-snug mb-2">{task.title}</p>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-dm ${dotColor}`}>{dot} {task.priority}</span>
                          {task.dueDate && (
                            <span className="text-xs font-dm text-slate-500 flex items-center gap-1">
                              <Calendar size={10} />
                              {format(new Date(task.dueDate), "dd MMM")}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
