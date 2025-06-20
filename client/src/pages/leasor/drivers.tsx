import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Users, Plus, Mail, UserCheck } from "lucide-react";

export default function LeasorDrivers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const { data: drivers } = useQuery({
    queryKey: ["/api/leasor/drivers"],
    enabled: !!user && user.role === "leasor_admin",
  });

  const { data: pendingInvitations } = useQuery({
    queryKey: ["/api/leasor/invitations/pending"],
    enabled: !!user && user.role === "leasor_admin",
  });

  const inviteDriverMutation = useMutation({
    mutationFn: async (data: { email: string; name: string }) => {
      await apiRequest("/api/leasor/drivers/invite", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Driver invitation sent successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leasor/invitations"] });
      setInviteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    },
  });

  const deactivateDriverMutation = useMutation({
    mutationFn: async (driverId: number) => {
      await apiRequest(`/api/leasor/drivers/${driverId}/deactivate`, "PATCH");
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Driver deactivated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leasor/drivers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to deactivate driver",
        variant: "destructive",
      });
    },
  });

  const handleDeactivateDriver = (driverId: number) => {
    if (confirm("Are you sure you want to deactivate this driver?")) {
      deactivateDriverMutation.mutate(driverId);
    }
  };

  if (!user || user.role !== "leasor_admin") {
    return <div>Access denied</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Driver Management</h1>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Invite Driver
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New Driver</DialogTitle>
            </DialogHeader>
            <InviteDriverForm
              onSubmit={(data) => inviteDriverMutation.mutate(data)}
              isLoading={inviteDriverMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Drivers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Active Drivers ({drivers?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {drivers?.map((driver: any) => (
              <div key={driver.id} className="border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{driver.name}</h3>
                  <p className="text-muted-foreground">{driver.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={driver.isActive ? "default" : "secondary"}>
                      {driver.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {driver.currentTruck && (
                      <Badge variant="outline">
                        Current: {driver.currentTruck}
                      </Badge>
                    )}
                    {driver.workDayStatus && (
                      <Badge variant="outline">
                        {driver.workDayStatus}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {driver.isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeactivateDriver(driver.id)}
                      disabled={deactivateDriverMutation.isPending}
                    >
                      Deactivate
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {(!drivers || drivers.length === 0) && (
              <p className="text-muted-foreground text-center py-8">
                No drivers in your team. Invite your first driver to get started.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {pendingInvitations && pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations ({pendingInvitations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {pendingInvitations.map((invitation: any) => (
                <div key={invitation.id} className="border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{invitation.email}</h3>
                    <p className="text-sm text-muted-foreground">
                      Invited {new Date(invitation.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="secondary">Pending</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InviteDriverForm({ 
  onSubmit, 
  isLoading 
}: {
  onSubmit: (data: { email: string; name: string }) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    email: "",
    name: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Driver Name</Label>
        <Input
          id="name"
          placeholder="e.g., John Smith"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="driver@email.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>

      <div className="text-sm text-muted-foreground">
        The driver will receive an email invitation with a registration link. 
        The invitation will expire in 7 days.
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading || !formData.email || !formData.name}>
          <Mail className="h-4 w-4 mr-2" />
          Send Invitation
        </Button>
        <Button type="button" variant="outline" onClick={() => {}}>
          Cancel
        </Button>
      </div>
    </form>
  );
}