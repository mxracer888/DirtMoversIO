import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, RefreshCw, MapPin, Clock, CheckCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getActivityIcon, getActivityLabel, getActivityColor } from "@/lib/activity-states";

export default function ActivityHistory() {
  const [, setLocation] = useLocation();

  // Get active work day
  const { data: workDay } = useQuery({
    queryKey: ["/api/work-days/active"],
  });

  // Get activities for current work day
  const { data: activities = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/activities/work-day", workDay?.id],
    enabled: !!workDay?.id,
  });

  // Filter out cancelled activities and group by load number
  const validActivities = Array.isArray(activities) ? activities.filter(a => !a.cancelled) : [];
  const groupedActivities = validActivities.reduce((acc, activity) => {
    const loadNum = activity.loadNumber;
    if (!acc[loadNum]) {
      acc[loadNum] = [];
    }
    acc[loadNum].push(activity);
    return acc;
  }, {} as Record<number, typeof validActivities>);

  // Sort load numbers in descending order (newest first)
  const sortedLoadNumbers = Object.keys(groupedActivities)
    .map(Number)
    .sort((a, b) => b - a);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDuration = (start: string, end: string) => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const diffMinutes = Math.round((endTime - startTime) / (1000 * 60));
    return `${diffMinutes} min`;
  };

  const getLoadCycleTime = (loadActivities: typeof activities) => {
    const sorted = loadActivities.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    if (sorted.length >= 2) {
      const firstActivity = sorted[0];
      const lastActivity = sorted[sorted.length - 1];
      return formatDuration(firstActivity.timestamp, lastActivity.timestamp);
    }
    
    return "--";
  };

  const isLoadComplete = (loadActivities: typeof activities) => {
    return loadActivities.some(activity => activity.activityType === "dumped_material");
  };

  if (isLoading) {
    return (
      <div className="mobile-container flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading activity history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container">
      {/* Header */}
      <div className="mobile-header">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/main-activity")}
            className="p-2 -ml-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Activity History</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="p-2 -mr-2"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="mobile-content">
        {validActivities.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activities Yet</h3>
              <p className="text-gray-600">Start logging activities to see them here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedLoadNumbers.map((loadNumber) => {
              const loadActivities = groupedActivities[loadNumber];
              const sortedActivities = loadActivities.sort((a, b) => 
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
              );
              const isComplete = isLoadComplete(loadActivities);
              const cycleTime = getLoadCycleTime(loadActivities);
              
              // Get ticket number and weight from "loaded_with_material" activity
              const loadedActivity = loadActivities.find(a => a.activityType === "loaded_with_material");
              const ticketNumber = loadedActivity?.ticketNumber;
              const netWeight = loadedActivity?.netWeight;

              return (
                <Card key={loadNumber}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="font-semibold text-gray-900">Load #{loadNumber}</span>
                        {ticketNumber && (
                          <>
                            <span className="text-gray-400">|</span>
                            <span className="text-gray-600">Ticket # {ticketNumber}</span>
                          </>
                        )}
                        {netWeight && (
                          <>
                            <span className="text-gray-400">|</span>
                            <span className="text-gray-600">Weight: {netWeight} tons</span>
                          </>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        isComplete 
                          ? "bg-secondary/10 text-secondary" 
                          : "bg-accent/10 text-accent"
                      }`}>
                        {isComplete ? "Completed" : "In Progress"}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      {sortedActivities.map((activity) => {
                        const Icon = getActivityIcon(activity.activityType);
                        const color = getActivityColor(activity.activityType);
                        
                        return (
                          <div key={activity.id} className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              color === "primary" ? "bg-primary/10" :
                              color === "secondary" ? "bg-secondary/10" :
                              color === "accent" ? "bg-accent/10" :
                              "bg-gray-100"
                            }`}>
                              <Icon className={`h-5 w-5 ${
                                color === "primary" ? "text-primary" :
                                color === "secondary" ? "text-secondary" :
                                color === "accent" ? "text-accent" :
                                "text-gray-600"
                              }`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900">
                                  {getActivityLabel(activity.activityType)}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {formatTime(activity.timestamp)}
                                </span>
                              </div>
                              {activity.latitude && activity.longitude && (
                                <div className="flex items-center text-xs text-gray-500 mt-1">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  GPS: {parseFloat(activity.latitude).toFixed(4)}, {parseFloat(activity.longitude).toFixed(4)}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {isComplete && (
                      <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between text-xs">
                        <span className="text-gray-500">
                          Cycle Time: <strong>{cycleTime}</strong>
                        </span>
                        <span className="text-gray-500">
                          Activities: <strong>{loadActivities.length}</strong>
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Summary Stats */}
        {activities.length > 0 && (
          <Card className="mt-6">
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Today's Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {Object.keys(groupedActivities).length}
                  </div>
                  <div className="text-sm text-gray-600">Total Loads</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-secondary">
                    {sortedLoadNumbers.filter(loadNum => 
                      isLoadComplete(groupedActivities[loadNum])
                    ).length}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent">
                    {activities.length}
                  </div>
                  <div className="text-sm text-gray-600">Activities</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
