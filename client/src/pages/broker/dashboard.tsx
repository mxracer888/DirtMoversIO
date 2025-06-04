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

  const getActivityStatusColor = (activityType: string) => {
    const color = getActivityColor(activityType);
    switch (color) {
      case "primary": return "bg-blue-500";
      case "secondary": return "bg-green-500";
      case "accent": return "bg-orange-500";
      default: return "bg-gray-500";
    }
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">{new Date().toLocaleDateString("en-US", { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Revenue Today</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.revenueToday || "$0"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Real-time Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Truck Status Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Truck Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">Active: 8</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-medium">Idle: 2</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                      <span className="text-sm font-medium">Maintenance: 2</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">Real-time truck status distribution</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hourly Loads Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Loads by Hour</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="grid grid-cols-8 gap-2 text-center text-xs w-full max-w-md">
                  {[7, 8, 9, 10, 11, 12, 13, 14].map((hour, index) => {
                    const height = Math.random() * 80 + 20; // Mock data
                    return (
                      <div key={hour} className="flex flex-col items-center">
                        <div 
                          className="w-8 bg-primary rounded-t mb-1"
                          style={{ height: `${height}px` }}
                        ></div>
                        <span className="text-gray-600">{hour}AM</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Jobs and Real-time Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Jobs */}
          <Card>
            <CardHeader>
              <CardTitle>Active Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeJobs.slice(0, 3).map((job) => (
                  <div key={job.id} className="border-l-4 border-primary pl-4">
                    <h4 className="font-medium text-gray-900">{job.name}</h4>
                    <p className="text-sm text-gray-600">Multiple trucks assigned</p>
                    <p className="text-xs text-gray-500">{job.description}</p>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                View All Jobs
              </Button>
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
