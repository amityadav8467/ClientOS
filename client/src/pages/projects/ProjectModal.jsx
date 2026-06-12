import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import api from "../../utils/api";
import Modal from "../../components/ui/Modal";

export default function ProjectModal({ isOpen, onClose, project, onSuccess }) {
  const isEditing = !!project;
  const [clients, setClients] = useState([]);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    api.get("/api/clients?status=active")
      .then(res => setClients(res.data.clients))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isOpen) {
      reset(project ? {
        title: project.title,
        description: project.description || "",
        client: project.client?._id || project.client || "",
        status: project.status,
        deadline: project.deadline ? project.deadline.split("T")[0] : "",
        budget: project.budget || 0,
        techStack: project.techStack?.join(", ") || "",
      } : { status: "planning", budget: 0 });
    }
  }, [isOpen, project, reset]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        budget: Number(data.budget),
        techStack: data.techStack ? data.techStack.split(",").map(t => t.trim()).filter(Boolean) : [],
      };
      if (isEditing) {
        await api.put(`/api/projects/${project._id}`, payload);
        toast.success("Project updated!");
      } else {
        await api.post("/api/projects", payload);
        toast.success("Project created!");
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Edit Project" : "New Project"} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Project Title *</label>
          <input
            className={`input-field ${errors.title ? "border-red-500" : ""}`}
            placeholder="E-commerce Website for ABC Shop"
            {...register("title", { required: "Title is required" })}
          />
          {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Client *</label>
            <select className={`input-field ${errors.client ? "border-red-500" : ""}`}
              {...register("client", { required: "Client is required" })}>
              <option value="">Select client...</option>
              {clients.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            {errors.client && <p className="text-red-400 text-xs mt-1">{errors.client.message}</p>}
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input-field" {...register("status")}>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="review">Review</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="label">Deadline</label>
            <input type="date" className="input-field" {...register("deadline")} />
          </div>
          <div>
            <label className="label">Budget (₹)</label>
            <input type="number" min="0" className="input-field" placeholder="50000"
              {...register("budget")} />
          </div>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input-field resize-none" rows={3}
            placeholder="Brief description of the project scope..."
            {...register("description")} />
        </div>

        <div>
          <label className="label">Tech Stack <span className="normal-case font-normal text-slate-500">(comma-separated)</span></label>
          <input className="input-field" placeholder="React, Node.js, MongoDB, Tailwind CSS"
            {...register("techStack")} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {isSubmitting && <span className="w-4 h-4 border-2 border-bg-primary/30 border-t-bg-primary rounded-full animate-spin" />}
            {isEditing ? "Save Changes" : "Create Project"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
