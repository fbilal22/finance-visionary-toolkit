
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DataProvider } from "./context/DataContext";
import Navigation from "./components/Navigation";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Import from "./pages/Import";
import Data from "./pages/Data";
import Visualization from "./pages/Visualization";
import Cleaning from "./pages/Cleaning";
import Prediction from "./pages/Prediction";
import AutoML from "./pages/AutoML";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <DataProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col">
            <Navigation />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/import" element={<Import />} />
                <Route path="/data" element={<Data />} />
                <Route path="/visualization" element={<Visualization />} />
                <Route path="/cleaning" element={<Cleaning />} />
                <Route path="/prediction" element={<Prediction />} />
                <Route path="/automl" element={<AutoML />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
        <Toaster />
        <Sonner />
      </DataProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
