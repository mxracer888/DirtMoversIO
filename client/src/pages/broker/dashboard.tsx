import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Truck, TrendingUp, Clock, DollarSign, Bell, ChevronDown,
  Menu, Users, MapPin, BarChart3, Activity, Loader2, AlertCircle,
  Play, Pause, Package, Calendar, RefreshCw, Filter, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getActivityLabel, getActivityColor, getActivityIcon } from "@/lib/activity-states";

export default function BrokerDashboard() {
  const [, setLocation] = useLocation();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string>("all");
  const { user } = useCurrentUser();

  // Get dashboard statistics with auto-refresh and job filtering
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ["/api/dashboard/stats", selectedJobId],
    queryFn: async () => {
      const params = selectedJobId !== "all" ? `?jobId=${selectedJobId}` : "";
      const response = await fetch(`/api/dashboard/stats${params}`);
      return response.json();
    },
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds
  });

  // Get recent activities with auto-refresh
  const { data: recentActivities = [], isLoading: activitiesLoading, refetch: refetchActivities } = useQuery({
    queryKey: ["/api/activities/recent"],
    refetchInterval: autoRefresh ? 15000 : false, // Refresh every 15 seconds
  });

  // Get active jobs
  const { data: activeJobs = [] } = useQuery({
    queryKey: ["/api/jobs"],
  });

  // Get truck status tracking with job filtering
  const { data: truckStatus, isLoading: truckStatusLoading } = useQuery({
    queryKey: ["/api/dashboard/truck-status", selectedJobId],
    queryFn: async () => {
      const params = selectedJobId !== "all" ? `?jobId=${selectedJobId}` : "";
      const response = await fetch(`/api/dashboard/truck-status${params}`);
      return response.json();
    },
    refetchInterval: autoRefresh ? 20000 : false, // Refresh every 20 seconds
  });

  // Get all trucks for status monitoring
  const { data: trucks = [] } = useQuery({
    queryKey: ["/api/trucks"],
  });

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now.getTime() - activityTime.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    
    if (diffMins < 1) return "Just now";
    if (diffMins === 1) return "1 min ago";
    if (diffMins < 60) return `${diffMins} mins ago`;
    
    const diffHours = Math.round(diffMins / 60);
    if (diffHours === 1) return "1 hour ago";
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return activityTime.toLocaleDateString();
  };

  const getActivityStatusColor = (activityType: string) => {
    const color = getActivityColor(activityType as any);
    switch (color) {
      case "primary": return "bg-blue-500";
      case "secondary": return "bg-green-500";
      case "accent": return "bg-orange-500";
      default: return "bg-gray-500";
    }
  };

  const getDriverStatus = (driverId: number) => {
    const driverActivities = recentActivities.filter((activity: any) => 
      activity.driver?.id === driverId && 
      new Date(activity.timestamp).toDateString() === new Date().toDateString()
    );
    
    if (driverActivities.length === 0) return { status: "Inactive", color: "bg-gray-500" };
    
    const lastActivity = driverActivities
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    
    const timeSinceLastActivity = Date.now() - new Date(lastActivity.timestamp).getTime();
    const minutesSinceLastActivity = timeSinceLastActivity / (1000 * 60);
    
    if (minutesSinceLastActivity > 120) return { status: "Inactive", color: "bg-gray-500" };
    
    if (lastActivity.activityType === "break") return { status: "On Break", color: "bg-yellow-500" };
    if (lastActivity.activityType === "breakdown") return { status: "Breakdown", color: "bg-red-500" };
    if (lastActivity.activityType === "driving") return { status: "Driving", color: "bg-blue-500" };
    
    return { status: getActivityLabel(lastActivity.activityType), color: getActivityStatusColor(lastActivity.activityType) };
  };

  const manualRefresh = () => {
    refetchStats();
    refetchActivities();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Truck className="h-8 w-8 text-primary mr-2" />
                <span className="text-xl font-bold text-gray-900">Dirt Movers</span>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                <a href="#" className="border-primary text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Dashboard
                </a>
                <a href="#" className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Dispatches
                </a>
                <a href="#" className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Reports
                </a>
                <a href="#" className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Trucks
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/")}
                className="flex items-center space-x-2"
              >
                <span>{user?.name}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fleet Operations Dashboard</h1>
            <p className="text-gray-600">{new Date().toLocaleDateString("en-US", { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Job Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by job" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobs</SelectItem>
                  {Array.isArray(activeJobs) && activeJobs.map((job: any) => (
                    <SelectItem key={job.id} value={job.id.toString()}>
                      {job.name} - {job.customer?.name || 'Unknown Customer'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={manualRefresh}
              disabled={statsLoading || activitiesLoading}
            >
              {statsLoading || activitiesLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              Auto-refresh {autoRefresh ? "ON" : "OFF"}
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Trucks</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.activeTrucks || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Package className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Loads In Transit</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.loadsInTransit || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Loads Delivered</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.loadsDelivered || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Package className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tons In Transit</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.tonsInTransit || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tons Delivered</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.tonsDelivered || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Clock className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Trucks EOD</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.eodTrucks || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Truck Status Tracking */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Truck Status Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {truckStatusLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-yellow-800">At Load Site</p>
                      <p className="text-2xl font-bold text-yellow-900">{truckStatus?.statusCounts?.at_load_site || 0}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-blue-800">Loaded in Transit</p>
                      <p className="text-2xl font-bold text-blue-900">{truckStatus?.statusCounts?.loaded_in_transit || 0}</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-orange-800">At Dump Site</p>
                      <p className="text-2xl font-bold text-orange-900">{truckStatus?.statusCounts?.at_dump_site || 0}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-green-800">Returning</p>
                      <p className="text-2xl font-bold text-green-900">{truckStatus?.statusCounts?.returning || 0}</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-red-800">End of Day</p>
                      <p className="text-2xl font-bold text-red-900">{truckStatus?.statusCounts?.end_of_day || 0}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="h-5 w-5 mr-2" />
                Individual Truck Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {truckStatusLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {truckStatus?.truckStatuses?.map((truck: any) => (
                    <div key={truck.truckId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{truck.truckNumber}</p>
                        <p className="text-sm text-gray-600">{truck.driver}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={truck.status === "end_of_day" ? "destructive" : "secondary"}>
                          {truck.status.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {truck.timestamp ? formatTime(truck.timestamp) : "No activity"}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!truckStatus?.truckStatuses || truckStatus.truckStatuses.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      No truck activity today
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Fleet Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="h-5 w-5 mr-2" />
                Fleet Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.isArray(trucks) && trucks.map((truck: any) => {
                  const lastActivity = Array.isArray(recentActivities) && recentActivities
                    .filter((activity: any) => activity.truck?.id === truck.id)
                    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
                  
                  return (
                    <div key={truck.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg mr-3">
                          <Truck className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold">{truck.truckNumber}</p>
                          <p className="text-sm text-gray-600">{truck.make} {truck.model}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {lastActivity ? (
                          <>
                            <Badge 
                              variant={getActivityColor(lastActivity.activityType) === "primary" ? "default" : "secondary"}
                            >
                              {getActivityLabel(lastActivity.activityType)}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatTimeAgo(lastActivity.timestamp)}
                            </p>
                          </>
                        ) : (
                          <Badge variant="outline">No Activity</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Recent Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Array.isArray(recentActivities) && recentActivities.map((activity: any) => {
                const Icon = getActivityIcon(activity.activityType);
                return (
                  <div key={activity.id} className="flex items-center justify-between p-3 border-l-4 border-l-blue-500 bg-gray-50 rounded-r-lg">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg mr-3">
                        <Icon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {activity.driver?.name} - {getActivityLabel(activity.activityType)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Truck {activity.truck?.truckNumber} • Load #{activity.loadNumber}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={getActivityColor(activity.activityType) === "primary" ? "default" : "secondary"}>
                        {formatTime(activity.timestamp)}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
              {(!Array.isArray(recentActivities) || recentActivities.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  No recent activities
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
                    hourStart.setHours(hour, 0, 0, 0);
                    const hourEnd = new Date();
                    hourEnd.setHours(hour + 1, 0, 0, 0);
                    
                    const loadsThisHour = recentActivities.filter((activity: any) => {
                      if (activity.activityType !== "dumped_material") return false;
                      const activityTime = new Date(activity.timestamp);
                      return activityTime >= hourStart && activityTime < hourEnd;
                    }).length;
                    
                    return { hour, loads: loadsThisHour };
                  });
                  
                  const maxLoads = Math.max(...hourlyLoads.map(h => h.loads), 1);
                  
                  return (
                    <div className="grid grid-cols-10 gap-2 text-center text-xs w-full max-w-lg">
                      {hourlyLoads.map(({ hour, loads }) => {
                        const height = Math.max((loads / maxLoads) * 120, 8);
                        return (
                          <div key={hour} className="flex flex-col items-center">
                            <div 
                              className="w-6 bg-primary rounded-t mb-1 flex items-end justify-center text-xs text-white font-medium"
                              style={{ height: `${height}px` }}
                            >
                              {loads > 0 && <span className="pb-1">{loads}</span>}
                            </div>
                            <span className="text-gray-600">{hour > 12 ? hour - 12 : hour}{hour >= 12 ? 'PM' : 'AM'}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Jobs and Real-time Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Jobs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Active Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeJobs.slice(0, 5).map((job: any) => {
                  const jobActivities = recentActivities.filter((activity: any) => 
                    activity.job?.id === job.id && 
                    new Date(activity.timestamp).toDateString() === new Date().toDateString()
                  );
                  const activeTrucksForJob = new Set(jobActivities.map((a: any) => a.truck?.id)).size;
                  const loadsForJob = jobActivities.filter((a: any) => a.activityType === "dumped_material").length;
                  
                  return (
                    <div key={job.id} className="border-l-4 border-primary pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">{job.name}</h4>
                          <p className="text-xs text-gray-600">{job.customer?.name || 'Unknown Customer'}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {activeTrucksForJob} trucks
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-green-600">{loadsForJob} loads today</span>
                        <span className="text-xs text-gray-500">{job.status || 'Active'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Real-time Activity Feed */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Live Activity Feed
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                    Real-time
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {recentActivities.slice(0, 12).map((activity: any) => {
                    const ActivityIcon = getActivityIcon(activity.activityType);
                    return (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className={`p-1.5 rounded-full ${getActivityStatusColor(activity.activityType)}`}>
                          <ActivityIcon className="h-3 w-3 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900 text-sm">
                                {activity.driver?.email?.split('@')[0] || 'Unknown'}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {activity.truck?.number || 'N/A'}
                              </Badge>
                            </div>
                            <span className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{getActivityLabel(activity.activityType)}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-gray-500">
                              {activity.job?.name || 'No job assigned'}
                            </span>
                            {activity.loadNumber && (
                              <span className="text-xs text-blue-600">Load #{activity.loadNumber}</span>
                            )}
                          </div>
                          {activity.netWeight && (
                            <div className="text-xs text-green-600 mt-1">
                              Weight: {activity.netWeight} tons
                            </div>
                          )}
                          {activity.ticketNumber && (
                            <div className="text-xs text-purple-600 mt-1">
                              Ticket: {activity.ticketNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {recentActivities.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No recent activities</p>
                      <p className="text-sm">Driver activities will appear here in real-time</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
