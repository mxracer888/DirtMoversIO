import { useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Menu, History, LogOut, MapPin, Clock, TrendingUp, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useGeolocation } from "@/hooks/use-geolocation";
import { getActivityFlow, getActivityIcon, getActivityColor } from "@/lib/activity-states";
import ActivityButton from "@/components/activity-button";
import MenuOverlay from "@/components/menu-overlay";
import LoadDataPopup from "@/components/load-data-popup";
import BreakControls from "@/components/break-controls";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ThemeToggle } from "@/components/theme-toggle";

export default function MainActivity() {
  const [, setLocation] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState("arrived_at_load_site");
  const [loadNumber, setLoadNumber] = useState(1);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [showLoadDataPopup, setShowLoadDataPopup] = useState(false);
  const [currentBreakState, setCurrentBreakState] = useState<"break" | "breakdown" | null>(null);
  const lastClickTimeRef = useRef(0);
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const { location, error: gpsError } = useGeolocation();

  // Get active work day
  const { data: workDay, isLoading, error: workDayError } = useQuery<any>({
    queryKey: ["/api/work-days/active"],
    retry: 3,
    retryDelay: 1000,
  });

  // Get activities for current work day - but don't react to changes
  const { data: activities = [] } = useQuery<any[]>({
    queryKey: ["/api/activities/work-day", workDay?.id],
    enabled: !!workDay?.id,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const validActivities = Array.isArray(activities) ? activities.filter(a => !a.cancelled) : [];

  const logActivityMutation = useMutation({
    mutationFn: async (data: { activityType: string; loadData: { ticketNumber: string | null; netWeight: number | null } | null }) => {
      if (!workDay) throw new Error("No active work day");
      
      const activityData = {
        workDayId: workDay.id,
        activityType: data.activityType,
        timestamp: new Date(),
        loadNumber: loadNumber,
        latitude: location?.latitude?.toString() || null,
        longitude: location?.longitude?.toString() || null,
        notes: null,
        ticketNumber: data.loadData?.ticketNumber || null,
        netWeight: data.loadData?.netWeight?.toString() || null,
      };

      const res = await apiRequest("POST", "/api/activities", activityData);
      return res.json();
    },
    onSuccess: () => {
      // Manually update state instead of relying on useEffect
      const nextStep = getActivityFlow(currentStep as any);
      if (nextStep) {
        setCurrentStep(nextStep);
        if (nextStep === "arrived_at_load_site") {
          setLoadNumber(prev => prev + 1);
        }
      }
      
      setIsButtonDisabled(false);
      setShowLoadDataPopup(false);
      setCurrentBreakState(null);
      
      toast({
        title: "Activity logged!",
        description: `Successfully logged: ${currentStep.replace(/_/g, ' ')}`,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/activities/work-day"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities/recent"] });
    },
    onError: (error: any) => {
      setIsButtonDisabled(false);
      
      toast({
        title: "Failed to log activity",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleLogActivity = useCallback(() => {
    if (isButtonDisabled) return;

    const now = Date.now();
    const timeSinceLastClick = now - lastClickTimeRef.current;
    const MIN_CLICK_INTERVAL = 2000;

    if (timeSinceLastClick < MIN_CLICK_INTERVAL) {
      toast({
        title: "Please wait",
        description: `Wait ${Math.ceil((MIN_CLICK_INTERVAL - timeSinceLastClick) / 1000)} seconds before logging another activity`,
        variant: "destructive",
      });
      return;
    }

    if (gpsError) {
      toast({
        title: "GPS Error",
        description: "Please enable location services to log activities",
        variant: "destructive",
      });
      return;
    }

    // Check if this is a "loaded_with_material" activity
    if (currentStep === "loaded_with_material") {
      setShowLoadDataPopup(true);
      return;
    }

    setIsButtonDisabled(true);
    lastClickTimeRef.current = now;

    logActivityMutation.mutate({
      activityType: currentStep,
      loadData: null,
    });
  }, [currentStep, isButtonDisabled, gpsError, loadNumber, logActivityMutation, toast]);

  const handleLoadDataSubmit = useCallback((loadData: { ticketNumber: string | null; netWeight: number | null }) => {
    setIsButtonDisabled(true);
    lastClickTimeRef.current = Date.now();

    logActivityMutation.mutate({
      activityType: currentStep,
      loadData,
    });
  }, [currentStep, logActivityMutation]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="mobile-container">
        <div className="mobile-content flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-foreground">Loading work day...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (workDayError) {
    return (
      <div className="mobile-container">
        <div className="mobile-content flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-destructive mb-4">Failed to load work day</p>
            <Button onClick={() => setLocation("/driver/daily-setup")}>
              Start New Day
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show setup required state
  if (!workDay) {
    return (
      <div className="mobile-container">
        <div className="mobile-content flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-foreground mb-4">No active work day found</p>
            <Button onClick={() => setLocation("/driver/daily-setup")}>
              Start Your Day
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const completedLoads = validActivities.filter(a => a.activityType === "dumped_material").length;

  return (
    <div className="mobile-container">
      <div className="mobile-header">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMenuOpen(true)}
            className="p-2 -ml-2"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Main Activity</h1>
          <ThemeToggle />
        </div>
      </div>

      <div className="mobile-content space-y-6">
        {/* Today's Stats */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{completedLoads}</div>
                <div className="text-sm text-muted-foreground">Loads</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">Load {loadNumber}</div>
                <div className="text-sm text-muted-foreground">Current</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">45 min</div>
                <div className="text-sm text-muted-foreground">Avg Cycle</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Activity */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Current Activity</h2>
          
          <ActivityButton
            activityType={currentStep as any}
            isActive={true}
            isDisabled={isButtonDisabled || logActivityMutation.isPending}
            onClick={handleLogActivity}
            className="w-full h-20 text-lg"
          />

          {/* Break Controls */}
          <BreakControls
            currentBreakState={currentBreakState}
            onBreakStart={(type) => {
              setCurrentBreakState(type);
              logActivityMutation.mutate({
                activityType: type,
                loadData: null,
              });
            }}
            onBreakEnd={() => {
              setCurrentBreakState(null);
              logActivityMutation.mutate({
                activityType: "driving",
                loadData: null,
              });
            }}
            isDisabled={isButtonDisabled || logActivityMutation.isPending}
          />
        </div>

        {/* Load Data Popup */}
        {showLoadDataPopup && (
          <LoadDataPopup
            onSubmit={handleLoadDataSubmit}
            onCancel={() => setShowLoadDataPopup(false)}
            isLoading={logActivityMutation.isPending}
          />
        )}
      </div>

      {/* Menu Overlay */}
      <MenuOverlay
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        user={user}
      />
    </div>
  );
}