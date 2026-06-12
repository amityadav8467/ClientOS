import { useEffect, useState } from "react";
import {
  Bell, FileText, FolderKanban, FileCheck, Users,
  CheckCheck, Trash2, X, Info,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import api from "../../utils/api";
import { useSocket } from "../../context/SocketContext";
import PageHeader from "../../components/ui/PageHeader";

const typeConfig = {
  invoice:  { icon: FileText,    color: "text-amber-400",  bg: "bg-amber-400/10" },
  project:  { icon: FolderKanban,color: "text-teal-400",   bg: "bg-teal-400/10" },
  proposal: { icon: FileCheck,   color: "text-violet-400", bg: "bg-violet-400/10" },
  client:   { icon: Users,       color: "text-blue-400",   bg: "bg-blue-400/10" },
  system:   { icon: Info,        color: "text-slate-400",  bg: "bg-slate-400/10" },
};

export default function Notifications() {
  const navigate = useNavigate();
  const { unreadCount, setUnreadCount } = useSocket() || {};
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/api/notifications");
      setNotifications(res.data.notifications);
      if (setUnreadCount) setUnreadCount(res.data.unreadCount);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      if (setUnreadCount) setUnreadCount(c => Math.max(0, c - 1));
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put("/api/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      if (setUnreadCount) setUnreadCount(0);
      toast.success("All marked as read");
    } catch {
      toast.error("Failed");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/notifications/${id}`);
      const n = notifications.find(n => n._id === id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (!n?.isRead && setUnreadCount) setUnreadCount(c => Math.max(0, c - 1));
    } catch { /* silent */ }
  };

  const handleClearAll = async () => {
    try {
      await api.delete("/api/notifications/clear-all");
      setNotifications([]);
      if (setUnreadCount) setUnreadCount(0);
      toast.success("All notifications cleared");
    } catch {
      toast.error("Failed");
    }
  };

  const unread = notifications.filter(n => !n.isRead).length;

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread` : "All caught up"}
        actions={
          notifications.length > 0 && (
            <div className="flex gap-2">
              {unread > 0 && (
                <button onClick={handleMarkAllRead} className="btn-ghost flex items-center gap-2 text-xs py-2 px-3">
                  <CheckCheck size={14} /> Mark all read
                </button>
              )}
              <button onClick={handleClearAll} className="btn-danger flex items-center gap-2 text-xs py-2 px-3">
                <Trash2 size={14} /> Clear all
              </button>
            </div>
          )
        }
      />

      {loading ? (
        <div className="space-y-3">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="glass-card p-4 flex items-start gap-4">
              <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-bg-hover flex items-center justify-center">
            <Bell size={30} className="text-slate-600" />
          </div>
          <div className="text-center">
            <h3 className="font-syne text-lg font-semibold text-slate-300 mb-1">No notifications</h3>
            <p className="font-dm text-sm text-slate-500">Activity from invoices, projects and proposals will appear here.</p>
          </div>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          {notifications.map((notif, idx) => {
            const { icon: Icon, color, bg } = typeConfig[notif.type] || typeConfig.system;
            return (
              <div
                key={notif._id}
                className={`flex items-start gap-4 px-5 py-4 transition-all group relative
                  ${!notif.isRead ? "bg-teal-400/3 border-l-2 border-teal-400/40" : "border-l-2 border-transparent"}
                  ${idx !== notifications.length - 1 ? "border-b border-bg-border" : ""}`}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Icon size={16} className={color} />
                </div>

                {/* Content */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => {
                    if (!notif.isRead) handleMarkRead(notif._id);
                    if (notif.link) navigate(notif.link);
                  }}
                >
                  <p className={`font-dm text-sm leading-snug ${notif.isRead ? "text-slate-400" : "text-white"}`}>
                    {notif.message}
                  </p>
                  <p className="font-dm text-xs text-slate-600 mt-1">
                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                  </p>
                </div>

                {/* Unread dot */}
                {!notif.isRead && (
                  <div className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0 mt-1.5" />
                )}

                {/* Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  {!notif.isRead && (
                    <button
                      onClick={() => handleMarkRead(notif._id)}
                      className="w-7 h-7 rounded-lg hover:bg-bg-hover flex items-center justify-center
                        text-slate-500 hover:text-teal-400 transition-colors"
                      title="Mark as read"
                    >
                      <CheckCheck size={13} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notif._id)}
                    className="w-7 h-7 rounded-lg hover:bg-red-500/10 flex items-center justify-center
                      text-slate-500 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
