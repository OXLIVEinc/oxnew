import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { Routes, Route, Navigate } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import Index from "./pages/Index";
import Discover from "./pages/Discover";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import MyEvents from "./pages/MyEvents";
import CreateEvent from "./pages/CreateEvent";
import EditEvent from "./pages/EditEvent";
import Dashboard from "./pages/Dashboard";
import OrganizerProfile from "./pages/OrganizerProfile";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";
import CheckoutPage from "./pages/review/CheckoutPage";
import HotelOrderPage from "./pages/review/HotelOrderPage"
import TransferClaimPage from "./pages/review/TransferClaimPage";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <ScrollToTop />
    <Routes>
      <Route path="/" element={<Discover />} />
      <Route path="/event/:id" element={<Index />} />
      <Route path="/events/:id" element={<Index />} />
      <Route path="/event/:id/edit" element={<EditEvent />} />
      <Route path="/my-events" element={<MyEvents />} />
      <Route path="/create-event" element={<CreateEvent />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/ox-internal-dashboard" element={<Admin />} />
      <Route path="/dashboard" element={<Dashboard />} />
      {/* Legacy role-specific links still resolve, just via the unified dashboard */}
      <Route path="/organizer-dashboard" element={<Navigate to="/dashboard" replace />} />
      <Route path="/guest-dashboard" element={<Navigate to="/dashboard" replace />} />
      <Route path="/hotel-partner-dashboard" element={<Navigate to="/dashboard" replace />} />
      <Route path="/organizer/:id" element={<OrganizerProfile />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/admin" element={<Admin />} />
      {/* https://ticketox.live/w/cart?sessionId=abc123test456 */}
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}

      <Route path="/checkout/:orderId" element={<CheckoutPage />} />
      <Route path="/hotel-order/:orderId" element={<HotelOrderPage />} />
      <Route path="/transfer/claim/:code" element={<TransferClaimPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </TooltipProvider>
);

export default App;