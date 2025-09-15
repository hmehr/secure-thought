import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import { AuthGuard } from "./components/AuthGuard";
import { Login } from "./pages/Login";
import { NotFound } from "./pages/NotFound";
import { AppDashboard } from "./pages/App";
import NewEntry from "./pages/NewEntry";
import EntryDetail from "./pages/EntryDetail";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const AppRouter = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/app" element={<AuthGuard><AppDashboard /></AuthGuard>} />
            <Route path="/app/new" element={<AuthGuard><NewEntry /></AuthGuard>} />
            <Route path="/app/:id" element={<AuthGuard><EntryDetail /></AuthGuard>} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default AppRouter;
