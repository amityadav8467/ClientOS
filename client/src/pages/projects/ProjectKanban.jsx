import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FolderKanban, Calendar, IndianRupee, Plus, X,
  GripVertical, Edit2, Trash2, CheckCircle2, Circle,
  AlertCircle, Clock, ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import api from "../../utils/api";
import PageHeader from "../../components/ui/PageHeader";
import ProjectModal from "./ProjectModal";

const COLUMNS = [
  { id: "planning",  label: "Planning",  color: "text-blue-400",  bg: "bg-blue-400/10",  border: "border-blue-400/20" },
  { id: "active",    label: "Active",    color: "text-teal-400",  bg: "bg-teal-400/10",  border: "border-teal-400/20" },
  { id: "review",    label: "Review",    color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
  { id: "completed", label: "Completed", color: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/20" },
];

const priorityConfig = {
  low:    { icon: Circle,       color: "text-slate-500",  label: "Low" },
  medium: { icon: Clock,        color: "text-amber-400",  label: "Medium" },
  high:   { icon: AlertCircle,  color: "text-red-400",    label: "High" },
};

function TaskCard({ task, onDelete, onEdit, dragging, onDragStart, onDragEnd }) {
  const PIcon = priorityConfig[task.priority]?.icon || Circle;
  const pColor = priorityConfig[task.priority]?.color || "text-slate-500";

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`group p-3.5 rounded-xl bg-bg-secondary border border-bg-border cursor-grab
        hover:border-teal-400/30 transition-all select-none
        ${dragging ? "opacity-40 scale-95 rotate-1" : "hover:shadow-card"}`}
    >
      <div className="flex items-start gap-2">
        <GripVertical size={14} className="text-slate-600 mt-0.5 flex-shrink-0 cursor-grab" />
        <div className="flex-1 min-w-0">
          <p className="font-dm text-sm text-slate-200 leading-snug">{task.title}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className={`flex items-center gap-1 text-xs font-dm ${pColor}`}>
              <PIcon size={11} />
              {priorityConfig[task.priority]?.label}
            </span>
            {task.dueDate && (
              <span className="flex items-center gap-1 text-xs font-dm text-slate-500">
                <Calendar size={10} />
                {format(new Date(task.dueDate), "dd MMM")}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={() => onEdit(task)}
            className="w-6 h-6 rounded-lg hover:bg-bg-hover flex items-center justify-center text-slate-500 hover:text-teal-400 transition-colors">
            <Edit2 size={11} />
          </button>
          <button onClick={() => onDelete(task)}
            className="w-6 h-6 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-slate-500 hover:text-red-400 transition-colors">
            <X size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}

function AddTaskForm({ columnId, onAdd, onCancel }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const inputRef = useRef();

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({ title: title.trim(), priority, dueDate: dueDate || undefined, status: columnId });
    setTitle("");
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 rounded-xl bg-bg-secondary border border-teal-400/30 space-y-2.5">
      <input
        ref={inputRef}
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Task title..."
        className="w-full bg-transparent text-sm font-dm text-white placeholder-slate-500
          border-none outline-none"
      />
      <div className="flex gap-2">
        <select value={priority} onChange={e => setPriority(e.target.value)}
          className="flex-1 bg-bg-primary border border-bg-border rounded-lg px-2 py-1.5 text-xs font-dm text-slate-300 outline-none">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
          className="flex-1 bg-bg-primary border border-bg-border rounded-lg px-2 py-1.5 text-xs font-dm text-slate-300 outline-none" />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-1.5 rounded-lg text-xs font-dm text-slate-400 hover:text-white
            border border-bg-border hover:border-bg-hover transition-colors">
          Cancel
        </button>
        <button type="submit"
          className="flex-1 py-1.5 rounded-lg text-xs font-dm bg-teal-400 text-bg-primary
            font-semibold hover:bg-teal-300 transition-colors">
          Add Task
        </button>
      </div>
    </form>
  );
}

export default function ProjectKanban() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addingIn, setAddingIn] = useState(null);
  const [editingTask, setEditingTask] = useState(null);

  // Drag state
  const dragTask = useRef(null);
  const dragColumn = useRef(null);
  const [dragOver, setDragOver] = useState(null);

  const fetchProject = async () => {
    try {
      const res = await api.get(`/api/projects/${id}`);
      setProject(res.data.project);
      setTasks(res.data.project.tasks || []);
    } catch {
      toast.error("Project not found");
      navigate("/projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProject(); }, [id]);

  const saveTasks = async (updatedTasks) => {
    setSaving(true);
    try {
      await api.put(`/api/projects/${id}/tasks`, { tasks: updatedTasks });
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const addTask = (task) => {
    const newTask = { ...task, _id: `temp_${Date.now()}` };
    const updated = [...tasks, newTask];
    setTasks(updated);
    saveTasks(updated);
    setAddingIn(null);
    toast.success("Task added");
  };

  const deleteTask = (task) => {
    const updated = tasks.filter(t => t._id !== task._id);
    setTasks(updated);
    saveTasks(updated);
  };

  const updateTask = (taskId, changes) => {
    const updated = tasks.map(t => t._id === taskId ? { ...t, ...changes } : t);
    setTasks(updated);
    saveTasks(updated);
    setEditingTask(null);
  };

  // Drag & Drop
  const handleDragStart = (task, columnId) => {
    dragTask.current = task;
    dragColumn.current = columnId;
  };

  const handleDrop = (targetColumn) => {
    if (!dragTask.current) return;
    if (dragColumn.current === targetColumn) { setDragOver(null); return; }
    const updated = tasks.map(t =>
      t._id === dragTask.current._id ? { ...t, status: targetColumn } : t
    );
    setTasks(updated);
    saveTasks(updated);
    dragTask.current = null;
    dragColumn.current = null;
    setDragOver(null);
    toast.success("Task moved");
  };

  const getColumnTasks = (colId) => tasks.filter(t => t.status === colId);
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === "completed").length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="skeleton h-10 w-48 rounded-xl mb-6" />
        <div className="grid grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="skeleton h-8 w-full rounded-xl" />
              {Array(3).fill(0).map((_, j) => <div key={j} className="skeleton h-20 w-full rounded-xl" />)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={project.title}
        subtitle={project.client?.name}
        backTo="/projects"
        actions={
          <div className="flex items-center gap-3">
            {saving && (
              <span className="flex items-center gap-1.5 text-xs font-dm text-slate-500">
                <span className="w-3 h-3 border border-slate-600 border-t-teal-400 rounded-full animate-spin" />
                Saving...
              </span>
            )}
            <button onClick={() => setEditOpen(true)} className="btn-ghost flex items-center gap-2 text-sm">
              <Edit2 size={15} /> Edit
            </button>
          </div>
        }
      />

      {/* Project Meta Bar */}
      <div className="glass-card p-4 mb-6 flex flex-wrap gap-5 items-center">
        <div className="flex items-center gap-2 text-sm font-dm">
          <CheckCircle2 size={14} className="text-teal-400" />
          <span className="text-slate-400">{doneTasks}/{totalTasks} tasks done</span>
        </div>
        {project.deadline && (
          <div className="flex items-center gap-2 text-sm font-dm text-slate-400">
            <Calendar size={14} className="text-slate-500" />
            <span>Due {format(new Date(project.deadline), "dd MMM yyyy")}</span>
          </div>
        )}
        {project.budget > 0 && (
          <div className="flex items-center gap-2 text-sm font-dm text-slate-400">
            <IndianRupee size={14} className="text-slate-500" />
            <span>₹{project.budget.toLocaleString()}</span>
          </div>
        )}
        {project.techStack?.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {project.techStack.map(t => (
              <span key={t} className="px-2 py-0.5 rounded-md bg-bg-hover border border-bg-border
                text-xs font-dm text-slate-400">{t}</span>
            ))}
          </div>
        )}

        {/* Progress bar */}
        <div className="ml-auto flex items-center gap-3 min-w-[160px]">
          <div className="flex-1 h-2 bg-bg-hover rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="font-syne font-bold text-sm text-teal-400 w-10 text-right">{progress}%</span>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 overflow-x-auto">
        {COLUMNS.map((col) => {
          const colTasks = getColumnTasks(col.id);
          const isOver = dragOver === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => { e.preventDefault(); setDragOver(col.id); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => handleDrop(col.id)}
              className={`flex flex-col rounded-2xl border transition-all duration-200
                ${isOver
                  ? "border-teal-400/40 bg-teal-400/5 scale-[1.01]"
                  : "border-bg-border bg-bg-secondary/50"
                }`}
            >
              {/* Column Header */}
              <div className={`flex items-center justify-between px-4 py-3 rounded-t-2xl border-b border-bg-border`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.bg} border ${col.border} flex items-center justify-center`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${col.color.replace("text-", "bg-")}`} />
                  </div>
                  <span className={`font-syne font-semibold text-sm ${col.color}`}>{col.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-dm font-medium px-2 py-0.5 rounded-full ${col.bg} ${col.color}`}>
                    {colTasks.length}
                  </span>
                  <button
                    onClick={() => setAddingIn(addingIn === col.id ? null : col.id)}
                    className="w-6 h-6 rounded-lg hover:bg-bg-hover flex items-center justify-center text-slate-500 hover:text-teal-400 transition-colors"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              {/* Tasks */}
              <div className="flex-1 p-3 space-y-2.5 min-h-[200px]">
                {addingIn === col.id && (
                  <AddTaskForm
                    columnId={col.id}
                    onAdd={addTask}
                    onCancel={() => setAddingIn(null)}
                  />
                )}

                {colTasks.length === 0 && addingIn !== col.id && (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <div className={`w-8 h-8 rounded-xl ${col.bg} flex items-center justify-center`}>
                      <FolderKanban size={14} className={col.color} />
                    </div>
                    <p className="text-xs font-dm text-slate-600">Drop tasks here</p>
                  </div>
                )}

                {colTasks.map((task) => {
                  if (editingTask?._id === task._id) {
                    return (
                      <form key={task._id}
                        onSubmit={(e) => {
                          e.preventDefault();
                          updateTask(task._id, {
                            title: editingTask.title,
                            priority: editingTask.priority,
                            dueDate: editingTask.dueDate,
                          });
                        }}
                        className="p-3 rounded-xl bg-bg-secondary border border-teal-400/30 space-y-2.5"
                      >
                        <input
                          value={editingTask.title}
                          onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
                          className="w-full bg-transparent text-sm font-dm text-white outline-none"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <select value={editingTask.priority}
                            onChange={e => setEditingTask({ ...editingTask, priority: e.target.value })}
                            className="flex-1 bg-bg-primary border border-bg-border rounded-lg px-2 py-1.5 text-xs font-dm text-slate-300 outline-none">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                          <input type="date"
                            value={editingTask.dueDate ? editingTask.dueDate.split("T")[0] : ""}
                            onChange={e => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                            className="flex-1 bg-bg-primary border border-bg-border rounded-lg px-2 py-1.5 text-xs font-dm text-slate-300 outline-none" />
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setEditingTask(null)}
                            className="flex-1 py-1.5 rounded-lg text-xs font-dm text-slate-400 border border-bg-border hover:text-white transition-colors">
                            Cancel
                          </button>
                          <button type="submit"
                            className="flex-1 py-1.5 rounded-lg text-xs font-dm bg-teal-400 text-bg-primary font-semibold hover:bg-teal-300 transition-colors">
                            Save
                          </button>
                        </div>
                      </form>
                    );
                  }

                  return (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onDelete={deleteTask}
                      onEdit={(t) => setEditingTask({ ...t })}
                      dragging={dragTask.current?._id === task._id}
                      onDragStart={() => handleDragStart(task, col.id)}
                      onDragEnd={() => { dragTask.current = null; dragColumn.current = null; setDragOver(null); }}
                    />
                  );
                })}

                {/* Drop zone indicator */}
                {isOver && dragTask.current && (
                  <div className="h-16 rounded-xl border-2 border-dashed border-teal-400/40
                    bg-teal-400/5 flex items-center justify-center">
                    <p className="text-xs font-dm text-teal-400/60">Drop here</p>
                  </div>
                )}
              </div>

              {/* Add task button at bottom */}
              {addingIn !== col.id && (
                <button
                  onClick={() => setAddingIn(col.id)}
                  className="flex items-center gap-2 px-4 py-3 rounded-b-2xl text-slate-500
                    hover:text-teal-400 hover:bg-bg-hover transition-all text-xs font-dm border-t border-bg-border"
                >
                  <Plus size={13} /> Add task
                </button>
              )}
            </div>
          );
        })}
      </div>

      <ProjectModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        project={project}
        onSuccess={fetchProject}
      />
    </div>
  );
}
