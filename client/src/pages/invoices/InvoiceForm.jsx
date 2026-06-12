import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Trash2, IndianRupee } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../utils/api";
import PageHeader from "../../components/ui/PageHeader";

export default function InvoiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [saving, setSaving] = useState(false);

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      items: [{ description: "", quantity: 1, rate: 0 }],
      tax: 0,
      status: "unpaid",
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = watch("items");
  const watchedTax = watch("tax");

  const subtotal = watchedItems?.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.rate || 0)), 0) || 0;
  const taxAmount = subtotal * (Number(watchedTax) / 100);
  const total = subtotal + taxAmount;

  useEffect(() => {
    api.get("/api/clients").then(r => setClients(r.data.clients)).catch(() => {});
    api.get("/api/projects").then(r => setProjects(r.data.projects)).catch(() => {});
    if (isEditing) {
      api.get(`/api/invoices/${id}`).then(r => {
        const inv = r.data.invoice;
        reset({
          client: inv.client?._id || inv.client,
          project: inv.project?._id || inv.project || "",
          items: inv.items,
          tax: inv.tax || 0,
          status: inv.status,
          dueDate: inv.dueDate ? inv.dueDate.split("T")[0] : "",
          notes: inv.notes || "",
        });
      }).catch(() => toast.error("Invoice not found"));
    }
  }, [id]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const payload = { ...data, tax: Number(data.tax) };
      if (isEditing) {
        await api.put(`/api/invoices/${id}`, payload);
        toast.success("Invoice updated!");
      } else {
        await api.post("/api/invoices", payload);
        toast.success("Invoice created!");
      }
      navigate("/invoices");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save invoice");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-4xl">
      <PageHeader
        title={isEditing ? "Edit Invoice" : "New Invoice"}
        subtitle={isEditing ? "Update invoice details" : "Create a new client invoice"}
        backTo="/invoices"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Client & Project */}
        <div className="glass-card p-6">
          <h2 className="section-title mb-4">Invoice Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Client *</label>
              <select className={`input-field ${errors.client ? "border-red-500" : ""}`}
                {...register("client", { required: "Client is required" })}>
                <option value="">Select client...</option>
                {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              {errors.client && <p className="text-red-400 text-xs mt-1">{errors.client.message}</p>}
            </div>
            <div>
              <label className="label">Project <span className="normal-case font-normal text-slate-500">(optional)</span></label>
              <select className="input-field" {...register("project")}>
                <option value="">No project linked</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Due Date</label>
              <input type="date" className="input-field" {...register("dueDate")} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input-field" {...register("status")}>
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Line Items</h2>
            <button type="button"
              onClick={() => append({ description: "", quantity: 1, rate: 0 })}
              className="btn-ghost flex items-center gap-2 text-xs py-2 px-3">
              <Plus size={14} /> Add Item
            </button>
          </div>

          {/* Header */}
          <div className="hidden sm:grid grid-cols-12 gap-3 mb-2 px-1">
            <p className="col-span-6 label">Description</p>
            <p className="col-span-2 label text-center">Qty</p>
            <p className="col-span-2 label text-right">Rate (₹)</p>
            <p className="col-span-2 label text-right">Amount (₹)</p>
          </div>

          <div className="space-y-2">
            {fields.map((field, index) => {
              const qty = Number(watchedItems?.[index]?.quantity || 0);
              const rate = Number(watchedItems?.[index]?.rate || 0);
              const amount = qty * rate;
              return (
                <div key={field.id} className="grid grid-cols-12 gap-2 sm:gap-3 items-center
                  p-3 rounded-xl bg-bg-primary border border-bg-border group">
                  <div className="col-span-12 sm:col-span-6">
                    <input
                      placeholder="Service description..."
                      className="input-field text-sm py-2"
                      {...register(`items.${index}.description`, { required: true })}
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <input
                      type="number" min="1" placeholder="1"
                      className="input-field text-sm py-2 text-center"
                      {...register(`items.${index}.quantity`, { min: 1 })}
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <input
                      type="number" min="0" placeholder="0"
                      className="input-field text-sm py-2 text-right"
                      {...register(`items.${index}.rate`, { min: 0 })}
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-2 flex items-center justify-between gap-1">
                    <span className="font-syne font-semibold text-sm text-white text-right flex-1">
                      {amount.toLocaleString()}
                    </span>
                    {fields.length > 1 && (
                      <button type="button" onClick={() => remove(index)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600
                          hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div className="mt-5 pt-4 border-t border-bg-border">
            <div className="flex flex-col gap-2 items-end">
              <div className="flex items-center gap-8 text-sm font-dm">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-white font-medium w-28 text-right">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-4 text-sm font-dm">
                <span className="text-slate-400">Tax</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number" min="0" max="100"
                    className="w-16 bg-bg-primary border border-bg-border rounded-lg px-2 py-1
                      text-sm text-center text-white outline-none focus:border-teal-400 transition-colors"
                    {...register("tax")}
                  />
                  <span className="text-slate-500 text-sm">%</span>
                </div>
                <span className="text-white font-medium w-24 text-right">₹{taxAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-8 text-base font-syne font-bold mt-1
                pt-3 border-t border-bg-border w-full justify-end">
                <span className="text-teal-400">Total</span>
                <span className="text-teal-400 text-xl w-28 text-right">₹{total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="glass-card p-6">
          <h2 className="section-title mb-4">Notes</h2>
          <textarea
            className="input-field resize-none" rows={3}
            placeholder="Payment terms, bank details, or any other notes for the client..."
            {...register("notes")}
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pb-4">
          <button type="button" onClick={() => navigate("/invoices")} className="btn-ghost flex-1 sm:flex-none sm:w-36">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="btn-primary flex-1 sm:flex-none sm:w-48 flex items-center justify-center gap-2">
            {saving && <span className="w-4 h-4 border-2 border-bg-primary/30 border-t-bg-primary rounded-full animate-spin" />}
            {isEditing ? "Save Changes" : "Create Invoice"}
          </button>
        </div>
      </form>
    </div>
  );
}
