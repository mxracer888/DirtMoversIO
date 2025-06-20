import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useCurrentUser } from "@/hooks/use-current-user";
import Login from "@/pages/login";
import DailySetup from "@/pages/driver/daily-setup";
import MainActivity from "@/pages/driver/main-activity";
import ActivityHistory from "@/pages/driver/activity-history";
import EndOfDay from "@/pages/driver/end-of-day";
import BrokerDashboard from "@/pages/broker/dashboard";
import DispatchesPage from "@/pages/broker/dispatches";
import EmployeeManagement from "@/pages/broker/employees";
import EODPage from "@/pages/broker/eod";
import LeasorDashboard from "@/pages/leasor/dashboard";
import LeasorDispatches from "@/pages/leasor/dispatches";
import LeasorFleet from "@/pages/leasor/fleet";
import LeasorDrivers from "@/pages/leasor/drivers";
import MenuOverlay from "@/components/menu-overlay";
import { useState } from "react";

function AppContent() {
  const { user, isLoading } = useCurrentUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const getDefaultRoute = () => {
    if (user.role === "driver" || user.role === "leasor_driver") return DailySetup;
    if (user.role === "leasor_admin") return LeasorDashboard;
    return BrokerDashboard;
  };

  return (
    <>
      <Switch>
        <Route path="/" component={getDefaultRoute()} />
        {/* Driver Routes */}
        <Route path="/driver/start-day" component={DailySetup} />
        <Route path="/driver/main-activity" component={MainActivity} />
        <Route path="/driver/activity-history" component={ActivityHistory} />
        <Route path="/driver/end-of-day" component={EndOfDay} />
        
        {/* Broker Routes */}
        <Route path="/broker/dashboard" component={BrokerDashboard} />
        <Route path="/broker/dispatches" component={DispatchesPage} />
        <Route path="/broker/employees">
          {() => (
            <EmployeeManagement 
              companyId={user.companyId}
              companyName="Company"
              userRole={user.role}
              userPermissions={user.permissions || "basic"}
            />
          )}
        </Route>
        <Route path="/broker/eod" component={EODPage} />
        
        {/* Leasor Routes */}
        <Route path="/leasor/dashboard" component={LeasorDashboard} />
        <Route path="/leasor/dispatches" component={LeasorDispatches} />
        <Route path="/leasor/fleet" component={LeasorFleet} />
        <Route path="/leasor/drivers" component={LeasorDrivers} />
        <Route>
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h1>
              <p className="text-gray-600">The page you're looking for doesn't exist.</p>
            </div>
          </div>
        </Route>
      </Switch>
      
      <MenuOverlay 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)}
        userRole={user.role}
      />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
