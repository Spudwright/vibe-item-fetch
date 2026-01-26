import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import RequestPickup from "./pages/RequestPickup";
import MyPickups from "./pages/MyPickups";
import TrackPickup from "./pages/TrackPickup";
import DriverDashboard from "./pages/DriverDashboard";
import UserProfile from "./pages/UserProfile";
import Donate from "./pages/Donate";
import Terms from "./pages/Terms";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/request" element={<RequestPickup />} />
            <Route path="/my-pickups" element={<MyPickups />} />
            <Route path="/track/:pickupId" element={<TrackPickup />} />
            <Route path="/driver" element={<DriverDashboard />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/donate" element={<Donate />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/admin" element={<Admin />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
