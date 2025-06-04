import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Truck, TrendingUp, Clock, DollarSign, Bell, ChevronDown,
  Menu, Users, MapPin, BarChart3, Activity, Loader2, AlertCircle,
  Play, Pause, Package, Calendar, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getActivityLabel, getActivityColor, getActivityIcon } from "@/lib/activity-states";

export default function BrokerDashboard() {
  const [, setLocation] = useLocation();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { user } = useCurrentUser();

  // Get dashboard statistics with auto-refresh
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Loads Today</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.loadsToday || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Cycle Time</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.avgCycleTime || "--"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tons Moved</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.dirtMovedToday || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Drivers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.driversActive || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Fleet Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Live Driver Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Live Driver Status
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                  Live
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {trucks.map((truck: any) => {
                  const driverActivities = recentActivities.filter((activity: any) => 
                    activity.truck?.id === truck.id && 
                    new Date(activity.timestamp).toDateString() === new Date().toDateString()
                  );
                  
                  const lastActivity = driverActivities
                    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
                  
                  const status = lastActivity ? getDriverStatus(lastActivity.driver?.id) : { status: "Inactive", color: "bg-gray-500" };
                  
                  return (
                    <div key={truck.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${status.color}`}></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{truck.number}</p>
                          <p className="text-xs text-gray-500">{lastActivity?.driver?.email?.split('@')[0] || 'No driver'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-900">{status.status}</p>
                        {lastActivity && (
                          <p className="text-xs text-gray-500">{formatTimeAgo(lastActivity.timestamp)}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Load Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Today's Load Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                {(() => {
                  const hourlyLoads = Array.from({ length: 10 }, (_, i) => {
                    const hour = i + 7; // 7 AM to 4 PM
                    const hourStart = new Date();
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
                <CardTitle>Real-time Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.slice(0, 6).map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${getActivityStatusColor(activity.activityType)}`}></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">
                            {activity.driver?.name} ({activity.truck?.number})
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTime(activity.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {getActivityLabel(activity.activityType)} at {activity.job?.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button variant="outline" className="w-full mt-4">
                  View All Activity
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
