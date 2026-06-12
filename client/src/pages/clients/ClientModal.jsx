import { useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import api from "../../utils/api";
import Modal from "../../components/ui/Modal";

const businessTypes = [
  "E-commerce", "School / College", "Restaurant", "Retail Shop",
  "Healthcare", "Real Estate", "Salon / Spa", "Gym / Fitness",
  "Travel Agency", "Tech Startup", "NGO / Non-profit", "Other",
];

export default function ClientModal({ isOpen, onClose, client, onSuccess }) {
  const isEditing = !!client;

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    if (isOpen) {
      reset(client ? {
        name: client.name,
        email: client.email,
        phone: client.phone || "",
        businessType: client.businessType || "",
        address: client.address || "",
        website: client.website || "",
        notes: client.notes || "",
        status: client.status,
      } : { status: "active" });
    }
  }, [isOpen, client, reset]);

  const onSubmit = async (data) => {
    try {
      if (isEditing) {
        await api.put(`/api/clients/${client._id}`, data);
        toast.success("Client updated!");
      } else {
        await api.post("/api/clients", data);
        toast.success("Client added!");
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Edit Client" : "Add New Client"} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Client Name *</label>
            <input
              className={`input-field ${errors.name ? "border-red-500" : ""}`}
              placeholder="Rahul Sharma"
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Email *</label>
            <input
              type="email"
              className={`input-field ${errors.email ? "border-red-500" : ""}`}
              placeholder="rahul@business.com"
              {...register("email", { required: "Email is required" })}
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="label">Phone</label>
            <input
              className="input-field"
              placeholder="+91 98765 43210"
              {...register("phone")}
            />
          </div>
          <div>
            <label className="label">Business Type</label>
            <select className="input-field" {...register("businessType")}>
              <option value="">Select type...</option>
              {businessTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Website</label>
            <input
              className="input-field"
              placeholder="https://business.com"
              {...register("website")}
            />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input-field" {...register("status")}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Address</label>
          <input
            className="input-field"
            placeholder="123 Main St, City, State"
            {...register("address")}
          />
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea
            className="input-field resize-none"
            rows={3}
            placeholder="Any additional notes about this client..."
            {...register("notes")}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {isSubmitting && <span className="w-4 h-4 border-2 border-bg-primary/30 border-t-bg-primary rounded-full animate-spin" />}
            {isEditing ? "Save Changes" : "Add Client"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
