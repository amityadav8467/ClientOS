export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-bg-hover flex items-center justify-center">
        <Icon size={30} className="text-slate-600" />
      </div>
      <div className="text-center">
        <h3 className="font-syne text-lg font-semibold text-slate-300 mb-1">{title}</h3>
        <p className="font-dm text-sm text-slate-500 max-w-xs">{description}</p>
      </div>
      {action && (
        <button onClick={action.onClick} className="btn-primary text-sm mt-1">
          {action.label}
        </button>
      )}
    </div>
  );
}
