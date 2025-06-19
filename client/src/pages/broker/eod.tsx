import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Truck, User, MapPin, Clock, Package, ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Link } from "wouter";

interface WorkDay {
  id: number;
  driverId: number;
  truckId: number;
  jobId: number;
  workDate: string;
  status: string;
  startTime: string | null;
  endTime: string | null;
  totalLoads: number;
  createdAt: string;
  driver: {
    id: number;
    name: string;
    email: string;
  };
  truck: {
    id: number;
    number: string;
    type: string;
  };
  job: {
    id: number;
    name: string;
  };
  totalActivities: number;
}

interface Activity {
  id: number;
  workDayId: number;
  loadNumber: number;
  activityType: string;
  timestamp: string;
  latitude: string | null;
  longitude: string | null;
  notes: string | null;
  ticketNumber: string | null;
  netWeight: string | null;
  cancelled: boolean;
}

export default function EODPage() {
  const [selectedWorkDay, setSelectedWorkDay] = useState<number | null>(null);
  const [expandedWorkDays, setExpandedWorkDays] = useState<Set<number>>(new Set());

  // Fetch completed work days
  const { data: completedWorkDays = [], isLoading: workDaysLoading } = useQuery({
    queryKey: ["/api/work-days/completed"],
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch activities for selected work day
  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/activities/work-day", selectedWorkDay],
    enabled: !!selectedWorkDay,
  });

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'arrived_at_load_site': return '📍';
      case 'loaded_with_material': return '⬆️';
      case 'arrived_at_dump_site': return '🎯';
      case 'dumped_material': return '⬇️';
      case 'break': return '☕';
      case 'breakdown': return '🔧';
      default: return '📋';
    }
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case 'arrived_at_load_site': return 'bg-blue-500';
      case 'loaded_with_material': return 'bg-green-500';
      case 'arrived_at_dump_site': return 'bg-orange-500';
      case 'dumped_material': return 'bg-red-500';
      case 'break': return 'bg-yellow-500';
      case 'breakdown': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const toggleWorkDayExpansion = (workDayId: number) => {
    const newExpanded = new Set(expandedWorkDays);
    if (newExpanded.has(workDayId)) {
      newExpanded.delete(workDayId);
    } else {
      newExpanded.add(workDayId);
      setSelectedWorkDay(workDayId);
    }
    setExpandedWorkDays(newExpanded);
  };

  const groupActivitiesByLoad = (activities: Activity[]) => {
    const grouped = activities.reduce((acc, activity) => {
      const loadNum = activity.loadNumber;
      if (!acc[loadNum]) {
        acc[loadNum] = [];
      }
      acc[loadNum].push(activity);
      return acc;
    }, {} as Record<number, Activity[]>);

    // Sort activities within each load by timestamp
    Object.keys(grouped).forEach(loadNum => {
      grouped[parseInt(loadNum)].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    });

    return grouped;
  };

  if (workDaysLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/broker/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">End of Day Reports</h1>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/broker/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">End of Day Reports</h1>
        <Badge variant="secondary">{completedWorkDays.length} Completed Work Days</Badge>
      </div>

      {completedWorkDays.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No Completed Work Days</h3>
            <p className="text-gray-600">Completed work days will appear here once drivers finish their shifts.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {completedWorkDays.map((workDay: WorkDay) => (
            <Card key={workDay.id} className="overflow-hidden">
              <Collapsible
                open={expandedWorkDays.has(workDay.id)}
                onOpenChange={() => toggleWorkDayExpansion(workDay.id)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="pb-4 cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {expandedWorkDays.has(workDay.id) ? (
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-500" />
                          )}
                          <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{formatDate(workDay.workDate)}</CardTitle>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {workDay.driver.name}
                            </div>
                            <div className="flex items-center gap-1">
                              <Truck className="h-4 w-4" />
                              {workDay.truck.number}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {workDay.job.name}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-medium">{workDay.totalActivities}</div>
                          <div className="text-gray-500">Activities</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{workDay.totalLoads}</div>
                          <div className="text-gray-500">Loads</div>
                        </div>
                        {workDay.startTime && workDay.endTime && (
                          <div className="text-center">
                            <div className="font-medium">
                              {Math.round((new Date(workDay.endTime).getTime() - new Date(workDay.startTime).getTime()) / (1000 * 60 * 60 * 10)) / 100}h
                            </div>
                            <div className="text-gray-500">Duration</div>
                          </div>
                        )}
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Completed
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {activitiesLoading && selectedWorkDay === workDay.id ? (
                      <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-600 mt-2">Loading activities...</p>
                      </div>
                    ) : selectedWorkDay === workDay.id && activities.length > 0 ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-blue-900">Shift Times</span>
                            </div>
                            <div className="text-sm text-blue-700">
                              Start: {workDay.startTime ? formatTime(workDay.startTime) : 'N/A'}<br/>
                              End: {workDay.endTime ? formatTime(workDay.endTime) : 'N/A'}
                            </div>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Package className="h-4 w-4 text-green-600" />
                              <span className="font-medium text-green-900">Load Summary</span>
                            </div>
                            <div className="text-sm text-green-700">
                              Total Loads: {Math.max(...activities.map(a => a.loadNumber)) || 0}<br/>
                              Activities: {activities.length}
                            </div>
                          </div>
                          <div className="bg-orange-50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Truck className="h-4 w-4 text-orange-600" />
                              <span className="font-medium text-orange-900">Equipment</span>
                            </div>
                            <div className="text-sm text-orange-700">
                              Truck: {workDay.truck.number}<br/>
                              Type: {workDay.truck.type}
                            </div>
                          </div>
                        </div>

                        {/* Activity Timeline by Load */}
                        <div>
                          <h4 className="font-medium mb-4">Load History</h4>
                          {Object.entries(groupActivitiesByLoad(activities))
                            .sort(([a], [b]) => parseInt(a) - parseInt(b))
                            .map(([loadNumber, loadActivities]) => (
                              <div key={loadNumber} className="mb-6 last:mb-0">
                                <div className="flex items-center gap-2 mb-3">
                                  <Badge variant="outline" className="bg-gray-50">
                                    Load #{loadNumber}
                                  </Badge>
                                  <span className="text-sm text-gray-500">
                                    {loadActivities.length} activities
                                  </span>
                                </div>
                                <div className="space-y-2 ml-4">
                                  {loadActivities.map((activity, index) => (
                                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                      <div className={`w-8 h-8 rounded-full ${getActivityColor(activity.activityType)} flex items-center justify-center text-white text-sm font-medium`}>
                                        {index + 1}
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-lg">{getActivityIcon(activity.activityType)}</span>
                                          <span className="font-medium capitalize">
                                            {activity.activityType.replace(/_/g, ' ')}
                                          </span>
                                          <span className="text-sm text-gray-500">
                                            {formatTime(activity.timestamp)}
                                          </span>
                                          {activity.cancelled && (
                                            <Badge variant="destructive" className="text-xs">Cancelled</Badge>
                                          )}
                                        </div>
                                        {activity.netWeight && (
                                          <div className="text-sm text-gray-600">
                                            Weight: {activity.netWeight} tons
                                          </div>
                                        )}
                                        {activity.ticketNumber && (
                                          <div className="text-sm text-gray-600">
                                            Ticket: {activity.ticketNumber}
                                          </div>
                                        )}
                                        {activity.notes && (
                                          <div className="text-sm text-gray-600 mt-1">
                                            Notes: {activity.notes}
                                          </div>
                                        )}
                                        {activity.latitude && activity.longitude && (
                                          <div className="text-xs text-gray-500 mt-1">
                                            Location: {parseFloat(activity.latitude).toFixed(6)}, {parseFloat(activity.longitude).toFixed(6)}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ) : selectedWorkDay === workDay.id ? (
                      <div className="p-8 text-center">
                        <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-medium mb-2">No Activities Found</h3>
                        <p className="text-gray-600">This work day has no recorded activities.</p>
                      </div>
                    ) : null}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}