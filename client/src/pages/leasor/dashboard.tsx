import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Users, Package, Activity } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function LeasorDashboard() {
  const { user } = useAuth();

  const { data: dashboardData } = useQuery({
    queryKey: ["/api/leasor/dashboard"],
    enabled: !!user && (user.role === "leasor_admin" || user.role === "leasor_driver"),
  });

  const { data: activeDispatches } = useQuery({
    queryKey: ["/api/leasor/dispatches", "pending"],
    enabled: !!user && user.role === "leasor_admin",
  });

  const { data: activeDrivers } = useQuery({
    queryKey: ["/api/leasor/drivers", "active"],
    enabled: !!user && user.role === "leasor_admin",
  });

  if (!user || (user.role !== "leasor_admin" && user.role !== "leasor_driver")) {
    return <div>Access denied</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Badge variant="outline" className="text-sm">
          {user.role === "leasor_admin" ? "Admin" : "Driver"}
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trucks</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.activeTrucks || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.activeDrivers || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Dispatches</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeDispatches?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.todayActivities || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions for Admin */}
      {user.role === "leasor_admin" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Dispatches */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Dispatches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeDispatches?.slice(0, 5).map((dispatch: any) => (
                  <div key={dispatch.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{dispatch.jobName}</p>
                      <p className="text-sm text-muted-foreground">
                        {dispatch.customerName} • {dispatch.trucksNeeded} trucks
                      </p>
                    </div>
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                ))}
                {(!activeDispatches || activeDispatches.length === 0) && (
                  <p className="text-muted-foreground text-center py-4">
                    No pending dispatches
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Active Drivers Status */}
          <Card>
            <CardHeader>
              <CardTitle>Driver Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeDrivers?.slice(0, 5).map((driver: any) => (
                  <div key={driver.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{driver.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {driver.currentTruck || "No truck assigned"}
                      </p>
                    </div>
                    <Badge 
                      variant={driver.status === "active" ? "default" : "secondary"}
                    >
                      {driver.status || "Available"}
                    </Badge>
                  </div>
                ))}
                {(!activeDrivers || activeDrivers.length === 0) && (
                  <p className="text-muted-foreground text-center py-4">
                    No active drivers
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}