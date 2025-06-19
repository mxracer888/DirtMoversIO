import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Truck, TrendingUp, Clock, DollarSign, Bell, ChevronDown,
  Menu, Users, MapPin, BarChart3, Activity, Loader2, AlertCircle,
  Play, Pause, Package, Calendar, RefreshCw, Filter, Target, UserCog
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getActivityLabel, getActivityColor, getActivityIcon } from "@/lib/activity-states";
import { ThemeToggle } from "@/components/theme-toggle";
import TruckLocationMap from "@/components/TruckLocationMap";

export default function BrokerDashboard() {
  const [, setLocation] = useLocation();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string>("all");
  const queryClient = useQueryClient();
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
    staleTime: 25000, // Data stays fresh for 25 seconds
    retry: 3,
    retryDelay: 1000
  });

  // Get recent activities with auto-refresh
  const { data: recentActivities = [], isLoading: activitiesLoading, refetch: refetchActivities } = useQuery({
    queryKey: ["/api/activities/recent"],
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds
    staleTime: 25000, // Data stays fresh for 25 seconds
    retry: 3,
    retryDelay: 1000
  });

  // Get active jobs
  const { data: activeJobs = [] } = useQuery({
    queryKey: ["/api/jobs"],
  });

  // Get truck status tracking with job filtering
  const { data: truckStatus, isLoading: truckStatusLoading, refetch: refetchTruckStatus } = useQuery({
    queryKey: ["/api/dashboard/truck-status", selectedJobId],
    queryFn: async () => {
      const params = selectedJobId !== "all" ? `?jobId=${selectedJobId}` : "";
      const response = await fetch(`/api/dashboard/truck-status${params}`);
      return response.json();
    },
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds
    staleTime: 25000, // Data stays fresh for 25 seconds
    retry: 3,
    retryDelay: 1000
  });

  // Get trucks data
  const { data: trucks = [] } = useQuery({
    queryKey: ["/api/trucks"],
  });

  const handleManualRefresh = () => {
    refetchStats();
    refetchActivities();
    refetchTruckStatus();
  };

  // Helper functions
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const getActivityStatusColor = (activityType: string) => {
    const colorMap: Record<string, string> = {
      "arrived_at_load_site": "bg-blue-500",
      "loaded_with_material": "bg-green-500", 
      "arrived_at_dump_site": "bg-orange-500",
      "dumped_material": "bg-red-500",
      "break": "bg-yellow-500",
      "breakdown": "bg-gray-500",
      "driving": "bg-purple-500"
    };
    return colorMap[activityType] || "bg-gray-400";
  };

  const getDriverStatus = (driverId: number) => {
    const todayActivities = Array.isArray(recentActivities) ? recentActivities.filter((activity: any) => 
      activity.driver?.id === driverId && 
      new Date(activity.timestamp).toDateString() === new Date().toDateString()
    ) : [];
    
    if (todayActivities.length === 0) {
      return { status: "Inactive", color: "bg-gray-500" };
    }
    
    const lastActivity = todayActivities
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    
    const timeDiff = Date.now() - new Date(lastActivity.timestamp).getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    if (hoursDiff > 2) {
      return { status: "Inactive", color: "bg-gray-500" };
    }
    
    const statusMap: Record<string, { status: string; color: string }> = {
      "arrived_at_load_site": { status: "At Load Site", color: "bg-blue-500" },
      "loaded_with_material": { status: "Loaded", color: "bg-green-500" },
      "arrived_at_dump_site": { status: "At Dump Site", color: "bg-orange-500" },
      "dumped_material": { status: "Dumped", color: "bg-red-500" },
      "break": { status: "On Break", color: "bg-yellow-500" },
      "breakdown": { status: "Breakdown", color: "bg-gray-600" },
      "driving": { status: "Driving", color: "bg-purple-500" }
    };
    
    return statusMap[lastActivity.activityType] || { status: "Active", color: "bg-green-500" };
  };

  if (statsLoading || activitiesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-foreground mb-2">Operations Dashboard</h1>
            <p className="text-muted-foreground dark:text-muted-foreground">Real-time fleet monitoring and performance analytics</p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            {/* Navigation to Dispatches */}
            <Button
              variant="outline"
              onClick={() => setLocation("/broker/dispatches")}
              className="flex items-center space-x-2"
            >
              <Calendar className="h-4 w-4" />
              <span>Dispatches</span>
            </Button>

            {/* Navigation to Employee Management */}
            {user?.permissions?.includes("admin") && (
              <Button
                variant="outline"
                onClick={() => setLocation("/broker/employees")}
                className="flex items-center space-x-2"
              >
                <UserCog className="h-4 w-4" />
                <span>Employees</span>
              </Button>
            )}

            {/* Job Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={selectedJobId} onValueChange={(value) => {
                setSelectedJobId(value);
                // Invalidate truck status cache to ensure fresh data
                queryClient.invalidateQueries({ queryKey: ["/api/dashboard/truck-status"] });
              }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by job" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobs</SelectItem>
                  {Array.isArray(activeJobs) && activeJobs.map((job: any) => (
                    <SelectItem key={job.id} value={job.id.toString()}>
                      {job.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Auto-refresh toggle */}
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="flex items-center space-x-2"
            >
              {autoRefresh ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              <span>{autoRefresh ? "Auto" : "Manual"}</span>
            </Button>

            {/* Manual refresh */}
            <Button variant="outline" size="sm" onClick={handleManualRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>

            {/* Theme toggle */}
            <ThemeToggle />
          </div>
        </div>

        {/* Key Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <Truck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Trucks</p>
                    <p className="text-2xl font-bold text-gray-900">{
                      truckStatus ? 
                        (truckStatus.at_load_site?.count || 0) + 
                        (truckStatus.in_transit?.count || 0) + 
                        (truckStatus.at_dump_site?.count || 0) + 
                        (truckStatus.returning?.count || 0)
                        : (stats?.trucksActive || 0)
                    }</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg mr-3">
                    <Package className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Loads in Transit</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.loadsInTransit || 0}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <Target className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Loads Delivered</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.loadsDelivered || 0}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg mr-3">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tons in Transit</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.tonsInTransit || 0}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tons Delivered</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.tonsDelivered || 0}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-gray-100 rounded-lg mr-3">
                    <Clock className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">EOD Complete</p>
                    <p className="text-2xl font-bold text-gray-900">{truckStatus?.completed?.count || 0}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Truck Location Map */}
        <div className="mb-8">
          <TruckLocationMap />
        </div>

        {/* Truck Status Tracking */}
        {truckStatus && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="h-5 w-5 mr-2" />
                Truck Status Tracking
                {selectedJobId !== "all" && (
                  <Badge variant="secondary" className="ml-2">
                    Filtered by Job
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(truckStatus).map(([status, data]: [string, any]) => (
                  <div key={status} className="text-center">
                    <div className="mb-2">
                      <div className="text-2xl font-bold text-gray-900">{data.count}</div>
                      <div className="text-sm text-gray-600 capitalize">{status.replace('_', ' ')}</div>
                    </div>
                    {data.averageWaitTime && (
                      <div className="text-xs text-gray-500">
                        Avg wait: {Math.round(data.averageWaitTime)}min
                      </div>
                    )}
                    <div className="mt-2 space-y-1">
                      {data.trucks?.slice(0, 3).map((truck: any) => (
                        <div key={truck.id} className="text-xs bg-gray-100 rounded px-2 py-1">
                          Truck {truck.number}
                        </div>
                      ))}
                      {data.trucks?.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{data.trucks.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
                          {activity.driver?.name || activity.driver?.email?.split('@')[0]} - {getActivityLabel(activity.activityType)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Truck {activity.truck?.number} • Load #{activity.loadNumber}
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