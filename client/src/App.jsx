import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Sidebar from "./components/layout/Sidebar";

// Auth
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ChangePassword from "./pages/auth/ChangePassword";
import ForgotPassword from "./pages/auth/ForgotPassword";
import InviteAdmin from "./pages/auth/InviteAdmin";

// Admin pages
import Dashboard from "./pages/dashboard/Dashboard";
import Clients from "./pages/clients/Clients";
import ClientDetail from "./pages/clients/ClientDetail";
import Projects from "./pages/projects/Projects";
import ProjectKanban from "./pages/projects/ProjectKanban";
import Invoices from "./pages/invoices/Invoices";
import InvoiceForm from "./pages/invoices/InvoiceForm";
import InvoiceDetail from "./pages/invoices/InvoiceDetail";
import Proposals from "./pages/proposals/Proposals";
import ProposalGenerator from "./pages/proposals/ProposalGenerator";
import ProposalDetail from "./pages/proposals/ProposalDetail";
import Notifications from "./pages/notifications/Notifications";

// Client portal
import PortalLayout from "./pages/portal/PortalLayout";
import PortalDashboard from "./pages/portal/PortalDashboard";
import { PortalProjects, PortalProjectKanban } from "./pages/portal/PortalProjects";
import { PortalInvoices, PortalProposals } from "./pages/portal/PortalInvoicesProposals";

function AdminLayout({ children }) {
  return (
    <ProtectedRoute role="admin">
      <Sidebar>{children}</Sidebar>
    </ProtectedRoute>
  );
}

function ClientPortalRoute({ children }) {
  return (
    <ProtectedRoute role="client">
      <PortalLayout>{children}</PortalLayout>
    </ProtectedRoute>
  );
}

// Smart change-password route — picks the right layout based on role
function ChangePasswordRoute() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "client") {
    return (
      <ProtectedRoute role="client">
        <PortalLayout><ChangePassword /></PortalLayout>
      </ProtectedRoute>
    );
  }
  return (
    <ProtectedRoute role="admin">
      <Sidebar><ChangePassword /></Sidebar>
    </ProtectedRoute>
  );
}

const toastStyle = {
  style: {
    background: "#141928",
    color: "#e2e8f0",
    border: "1px solid #1e2740",
    fontFamily: "DM Sans, sans-serif",
    fontSize: "14px",
    borderRadius: "12px",
  },
  success: { iconTheme: { primary: "#00d4aa", secondary: "#141928" } },
  error:   { iconTheme: { primary: "#ef4444", secondary: "#141928" } },
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Toaster position="top-right" toastOptions={toastStyle} />
          <Routes>
            {/* ── Public ── */}
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* ── Admin ── */}
            <Route path="/dashboard"          element={<AdminLayout><Dashboard /></AdminLayout>} />
            <Route path="/clients"            element={<AdminLayout><Clients /></AdminLayout>} />
            <Route path="/clients/:id"        element={<AdminLayout><ClientDetail /></AdminLayout>} />
            <Route path="/projects"           element={<AdminLayout><Projects /></AdminLayout>} />
            <Route path="/projects/:id"       element={<AdminLayout><ProjectKanban /></AdminLayout>} />
            <Route path="/invoices"           element={<AdminLayout><Invoices /></AdminLayout>} />
            <Route path="/invoices/new"       element={<AdminLayout><InvoiceForm /></AdminLayout>} />
            <Route path="/invoices/:id"       element={<AdminLayout><InvoiceDetail /></AdminLayout>} />
            <Route path="/invoices/:id/edit"  element={<AdminLayout><InvoiceForm /></AdminLayout>} />
            <Route path="/proposals"          element={<AdminLayout><Proposals /></AdminLayout>} />
            <Route path="/proposals/new"      element={<AdminLayout><ProposalGenerator /></AdminLayout>} />
            <Route path="/proposals/:id"      element={<AdminLayout><ProposalDetail /></AdminLayout>} />
            <Route path="/notifications"      element={<AdminLayout><Notifications /></AdminLayout>} />
            <Route path="/invite-admin"       element={<AdminLayout><InviteAdmin /></AdminLayout>} />

            {/* ── Client Portal ── */}
            <Route path="/portal"              element={<ClientPortalRoute><PortalDashboard /></ClientPortalRoute>} />
            <Route path="/portal/projects"     element={<ClientPortalRoute><PortalProjects /></ClientPortalRoute>} />
            <Route path="/portal/projects/:id" element={<ClientPortalRoute><PortalProjectKanban /></ClientPortalRoute>} />
            <Route path="/portal/invoices"     element={<ClientPortalRoute><PortalInvoices /></ClientPortalRoute>} />
            <Route path="/portal/proposals"    element={<ClientPortalRoute><PortalProposals /></ClientPortalRoute>} />

            {/* ── Change Password (smart — works for admin + client) ── */}
            <Route path="/change-password" element={<ChangePasswordRoute />} />

            {/* ── Redirects ── */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
