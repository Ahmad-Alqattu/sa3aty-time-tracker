import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import ResponsiveLayout from "@/components/ResponsiveLayout";
import Index from "./pages/Index";
import Timeline from "./pages/Timeline";
import Projects from "./pages/Projects";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Get base path from environment for GitHub Pages deployment
  const basename = import.meta.env.PROD ? '/sa3aty-time-tracker' : '/';
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter basename={basename}>
              <ResponsiveLayout>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/timeline" element={<Timeline />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ResponsiveLayout>
            </BrowserRouter>
          </AppProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
