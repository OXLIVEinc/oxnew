import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import {QueryClientProvider} from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/context/AuthContext";

import "./index.css";
import App from "./App.tsx";


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  </StrictMode>
);