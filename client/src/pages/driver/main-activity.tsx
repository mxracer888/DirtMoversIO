import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Menu, History, LogOut, MapPin, Clock, TrendingUp, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useGeolocation } from "@/hooks/use-geolocation";
import { getActivityFlow, getActivityIcon, getActivityColor, ACTIVITY_FLOW_SEQUENCE } from "@/lib/activity-states";
import ActivityButton from "@/components/activity-button";
import MenuOverlay from "@/components/menu-overlay";
import { useCurrentUser } from "@/hooks/use-current-user";

export default function MainActivity() {
  const [, setLocation] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState("arrived_at_load_site");
  const [loadNumber, setLoadNumber] = useState(1);
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const { location, error: gpsError } = useGeolocation();

  // Get active work day
  const { data: workDay, isLoading } = useQuery({
    queryKey: ["/api/work-days/active"],
  });

  // Get activities for current work day
  const { data: activities = [] } = useQuery({
    queryKey: ["/api/activities/work-day", workDay?.id],
    enabled: !!workDay?.id,
  });

  // Ensure activities is always an array
  const validActivities = Array.isArray(activities) ? activities.filter(a => !a.cancelled) : [];

  const logActivityMutation = useMutation({
    mutationFn: async (activityType: string) => {
      if (!workDay) throw new Error("No active work day");
      
      console.log("Logging activity - GPS location:", location);
      console.log("Logging activity - Work day:", workDay);

      const activityData = {
        workDayId: workDay.id,
        loadNumber,
        activityType,
        timestamp: new Date(),
        latitude: location ? location.latitude.toString() : "0",
        longitude: location ? location.longitude.toString() : "0",
      };

      console.log("Sending activity data:", activityData);
      const res = await apiRequest("POST", "/api/activities", activityData);
      return res.json();
    },
    onSuccess: (_, activityType) => {
      toast({
        title: "Activity logged!",
        description: `Successfully logged: ${activityType.replace(/_/g, ' ')}`,
      });

      // Update activity flow
      const nextStep = getActivityFlow(activityType);
      setCurrentStep(nextStep);

      // Increment load number when completing a cycle
      if (activityType === "dumped_material") {
        setLoadNumber(prev => prev + 1);
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/activities/work-day", workDay?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities/recent"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to log activity",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const rewindMutation = useMutation({
    mutationFn: async () => {
      console.log("Rewind attempt - Work day:", workDay);
      console.log("Rewind attempt - All activities:", activities);
      console.log("Rewind attempt - Valid activities:", validActivities);
      console.log("Rewind attempt - Valid activities length:", validActivities.length);
      
      if (!workDay || !validActivities.length) throw new Error("No activities to rewind");
      
      // Get the last valid activity
      const lastActivity = validActivities[validActivities.length - 1];
      console.log("Rewind attempt - Last activity to cancel:", lastActivity);
      
      // Mark activity as cancelled (soft delete)
      const res = await apiRequest("PATCH", `/api/activities/${lastActivity.id}`, {
        cancelled: true,
        cancelledAt: new Date(),
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Activity rewound!",
        description: "Previous activity has been cancelled",
      });

      // Get previous step in flow
      const currentIndex = ACTIVITY_FLOW_SEQUENCE.indexOf(currentStep as any);
      if (currentIndex > 0) {
        const previousStep = ACTIVITY_FLOW_SEQUENCE[currentIndex - 1];
        setCurrentStep(previousStep);
      }

      // Decrease load number if we're rewinding from dumped_material
      if (currentStep === "arrived_at_load_site" && loadNumber > 1) {
        setLoadNumber(prev => prev - 1);
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/activities/work-day", workDay?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities/recent"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to rewind",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Calculate today's stats
  const todayStats = {
    loads: validActivities.filter(a => a.activityType === "dumped_material").length,
    lastLoadTime: validActivities.find(a => a.activityType === "dumped_material")?.timestamp || null,
    avgCycleTime: "32 min", // This would be calculated from actual cycle times
  };

  // Initialize state from activities and persist state
  useEffect(() => {
    if (validActivities.length > 0) {
      const lastActivity = validActivities[validActivities.length - 1];
      const nextStep = getActivityFlow(lastActivity.activityType);
      setCurrentStep(nextStep);
      
      // Set load number based on completed loads
      const completedLoads = validActivities.filter(a => a.activityType === "dumped_material").length;
      setLoadNumber(completedLoads + 1);
    }
  }, [validActivities]);

  // Auto-redirect if no active work day
  useEffect(() => {
    if (!isLoading && !workDay) {
      setLocation("/daily-setup");
    }
  }, [workDay, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="mobile-container flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading work day...</p>
        </div>
      </div>
    );
  }

  if (!workDay) {
    return null; // Will redirect in useEffect
  }

  const handleLogActivity = () => {
    if (gpsError) {
      toast({
        title: "GPS Error",
        description: "Please enable location services to log activities",
        variant: "destructive",
      });
      return;
    }

    logActivityMutation.mutate(currentStep);
  };

  return (
    <>
      <div className="mobile-container">
        {/* Header */}
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
            <div className="text-center">
              <h1 className="text-lg font-semibold">Job Site</h1>
              <p className="text-sm text-gray-600">{user?.name}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/activity-history")}
              className="p-2 -mr-2"
            >
              <History className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="mobile-content">
          {/* Current Status */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Current Status</h2>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-1" />
                  GPS Active
                </div>
              </div>
              
              <div className="bg-primary/10 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="status-indicator status-active mr-3"></div>
                  <span className="text-primary font-medium">
                    En Route to {currentStep.includes("load") ? "Load Site" : "Dump Site"}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mt-2">Load #{loadNumber}</p>
                <p className="text-gray-600 text-sm">
                  Last Update: {new Date().toLocaleTimeString()}
                </p>
              </div>

              {/* Progress Indicator */}
              <div className="mt-6">
                <div className="flex justify-between text-xs text-gray-600 mb-2">
                  <span>Load Site</span>
                  <span>Loading</span>
                  <span>Dump Site</span>
                  <span>Dumping</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`progress-step ${currentStep === "arrived_at_load_site" ? "active" : "completed"}`}>
                    {currentStep !== "arrived_at_load_site" ? "✓" : "1"}
                  </div>
                  <div className={`progress-line ${currentStep === "loaded_with_material" || currentStep === "arrived_at_dump_site" || currentStep === "dumped_material" ? "completed" : currentStep === "arrived_at_load_site" ? "active" : "pending"}`}></div>
                  <div className={`progress-step ${currentStep === "loaded_with_material" ? "active" : currentStep === "arrived_at_dump_site" || currentStep === "dumped_material" ? "completed" : "pending"}`}>
                    {currentStep === "arrived_at_dump_site" || currentStep === "dumped_material" ? "✓" : currentStep === "loaded_with_material" ? "2" : "2"}
                  </div>
                  <div className={`progress-line ${currentStep === "arrived_at_dump_site" || currentStep === "dumped_material" ? "completed" : currentStep === "loaded_with_material" ? "active" : "pending"}`}></div>
                  <div className={`progress-step ${currentStep === "arrived_at_dump_site" ? "active" : currentStep === "dumped_material" ? "completed" : "pending"}`}>
                    {currentStep === "dumped_material" ? "✓" : currentStep === "arrived_at_dump_site" ? "3" : "3"}
                  </div>
                  <div className={`progress-line ${currentStep === "dumped_material" ? "completed" : currentStep === "arrived_at_dump_site" ? "active" : "pending"}`}></div>
                  <div className={`progress-step ${currentStep === "dumped_material" ? "active" : "pending"}`}>
                    {currentStep === "dumped_material" ? "4" : "4"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Action Button */}
          <ActivityButton
            activityType={currentStep}
            loadNumber={loadNumber}
            onAction={handleLogActivity}
            isLoading={logActivityMutation.isPending}
            disabled={false}
          />

          {/* Rewind Button - Always show for testing */}
          <Button
            variant="outline"
            onClick={() => {
              console.log("Undo button clicked");
              console.log("Activities:", activities);
              console.log("Valid activities:", validActivities);
              if (validActivities.length > 0) {
                rewindMutation.mutate();
              } else {
                toast({
                  title: "No activities to undo",
                  description: "Log an activity first to use the undo feature",
                  variant: "destructive",
                });
              }
            }}
            disabled={rewindMutation.isPending}
            className="w-full py-3 border-orange-300 text-orange-600 hover:bg-orange-50"
          >
            <Undo2 className="h-5 w-5 mr-2" />
            {rewindMutation.isPending ? "Rewinding..." : `Undo Last Activity (${validActivities.length})`}
          </Button>

          {/* Today's Summary */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-4">Today's Activity</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{todayStats.loads}</div>
                  <div className="text-sm text-gray-600">Loads</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">
                    {todayStats.lastLoadTime 
                      ? new Date(todayStats.lastLoadTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : "--"
                    }
                  </div>
                  <div className="text-sm text-gray-600">Last Load</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">{todayStats.avgCycleTime}</div>
                  <div className="text-sm text-gray-600">Avg Cycle</div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Work Day Started:</span>
                  <span className="font-medium">
                    {workDay.startTime 
                      ? new Date(workDay.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : "Not started"
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="quick-action"
              onClick={() => setLocation("/activity-history")}
            >
              <History className="h-6 w-6 text-primary mb-2" />
              <span className="text-sm font-medium">View History</span>
            </Button>
            
            <Button
              variant="outline"
              className="quick-action"
              onClick={() => setLocation("/end-of-day")}
            >
              <LogOut className="h-6 w-6 text-accent mb-2" />
              <span className="text-sm font-medium">End Day</span>
            </Button>
          </div>

          {/* GPS Status */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 text-blue-800">
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-medium">
                {location ? "GPS Active" : gpsError ? "GPS Error" : "Getting location..."}
              </span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {location 
                ? `Accuracy: ±${location.accuracy?.toFixed(0)}m`
                : gpsError 
                ? "Please enable location services"
                : "Waiting for GPS signal..."
              }
            </p>
          </div>
        </div>
      </div>

      <MenuOverlay 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)}
        userRole="driver"
      />
    </>
  );
}
