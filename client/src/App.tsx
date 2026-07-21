import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { Routes, Route } from "react-router-dom";
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
import HotelOrderPage from "./pages/review/HotelOrderPage";
import TransferClaimPage from "./pages/review/TransferClaimPage";
// import About from "./pages/About";
import Help from "./pages/Help";

// Define route configuration
interface RouteConfig {
  path: string;
  element: React.ReactNode;
  exact?: boolean;
}

const routes: RouteConfig[] = [
  { path: "/", element: <Discover /> },
  { path: "/event/:id", element: <Index /> },
  { path: "/events/:id", element: <Index /> },
  { path: "/event/:id/edit", element: <EditEvent /> },
  { path: "/my-events", element: <MyEvents /> },
  { path: "/create-event", element: <CreateEvent /> },
  { path: "/auth", element: <Auth /> },
  { path: "/ox-internal-dashboard", element: <Admin /> },
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/organizer/:id", element: <OrganizerProfile /> },
  { path: "/pricing", element: <Pricing /> },
  { path: "/admin", element: <Admin /> },
  // { path: "/about", element: <About /> },
  { path: "/help", element: <Help /> },
  { path: "/checkout/:orderId", element: <CheckoutPage /> },
  { path: "/hotel-order/:orderId", element: <HotelOrderPage /> },
  { path: "/transfer/claim/:code", element: <TransferClaimPage /> },
  { path: "*", element: <NotFound /> },
];

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <ScrollToTop />
    <Routes>
      {routes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}
    </Routes>
  </TooltipProvider>
);

export default App;