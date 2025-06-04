import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { X, Home, History, LogOut, Settings, BarChart3, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface MenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
}

export default function MenuOverlay({ isOpen, onClose, userRole }: MenuOverlayProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      toast({
        title: "Logged out successfully",
        description: "See you next time!",
      });
      window.location.reload(); // Simple way to reset the app state
    },
    onError: () => {
      // Even if logout fails on server, we'll still redirect
      window.location.reload();
    },
  });

  const handleNavigation = (path: string) => {
    setLocation(path);
    onClose();
  };

  const handleLogout = () => {
    logoutMutation.mutate();
    onClose();
  };

  if (!isOpen) return null;

  const driverMenuItems = [
    {
      icon: Home,
      label: "Main Activity",
      path: "/driver/main-activity",
    },
    {
      icon: History,
      label: "Activity History",
      path: "/driver/activity-history",
    },
    {
      icon: FileText,
      label: "End of Day",
      path: "/driver/end-of-day",
    },
    {
      icon: Settings,
      label: "Settings",
      path: "/settings",
    },
  ];

  const brokerMenuItems = [
    {
      icon: BarChart3,
      label: "Dashboard",
      path: "/broker/dashboard",
    },
    {
      icon: Users,
      label: "Dispatches",
      path: "/broker/dispatches",
    },
    {
      icon: FileText,
      label: "Reports",
      path: "/broker/reports",
    },
    {
      icon: Settings,
      label: "Settings",
      path: "/settings",
    },
  ];

  const menuItems = userRole === "driver" ? driverMenuItems : brokerMenuItems;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose}>
      <div 
        className="bg-white w-80 h-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Menu</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="p-4">
          <div className="space-y-2">
            {menuItems.map((item, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start p-3 h-auto"
                onClick={() => handleNavigation(item.path)}
              >
                <item.icon className="h-5 w-5 mr-3 text-gray-600" />
                <span className="text-left">{item.label}</span>
              </Button>
            ))}
            
            <div className="border-t border-gray-200 my-4"></div>
            
            <Button
              variant="ghost"
              className="w-full justify-start p-3 h-auto text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-5 w-5 mr-3" />
              <span className="text-left">
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
