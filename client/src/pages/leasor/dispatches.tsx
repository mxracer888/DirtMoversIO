import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Package, Truck, User, MapPin, Calendar, CheckCircle, XCircle } from "lucide-react";

export default function LeasorDispatches() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDispatch, setSelectedDispatch] = useState<any>(null);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: pendingDispatches } = useQuery({
    queryKey: ["/api/leasor/dispatches/pending"],
    enabled: !!user && user.role === "leasor_admin",
  });

  const { data: assignedDispatches } = useQuery({
    queryKey: ["/api/leasor/dispatches/assigned"],
    enabled: !!user && user.role === "leasor_admin",
  });

  const { data: availableDrivers } = useQuery({
    queryKey: ["/api/leasor/drivers/available"],
    enabled: !!user && user.role === "leasor_admin",
  });

  const { data: availableTrucks } = useQuery({
    queryKey: ["/api/leasor/trucks/available"],
    enabled: !!user && user.role === "leasor_admin",
  });

  const assignDispatchMutation = useMutation({
    mutationFn: async (data: { dispatchId: number; driverId: number; truckId: number }) => {
      await apiRequest(`/api/leasor/dispatches/${data.dispatchId}/assign`, "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Dispatch assigned successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leasor/dispatches"] });
      setAssignmentDialogOpen(false);
      setSelectedDispatch(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign dispatch",
        variant: "destructive",
      });
    },
  });

  const rejectDispatchMutation = useMutation({
    mutationFn: async (data: { dispatchId: number; reason: string }) => {
      await apiRequest(`/api/leasor/dispatches/${data.dispatchId}/reject`, "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Dispatch rejected",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leasor/dispatches"] });
      setRejectionDialogOpen(false);
      setRejectionReason("");
      setSelectedDispatch(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject dispatch",
        variant: "destructive",
      });
    },
  });

  const handleAssignDispatch = (driverId: number, truckId: number) => {
    if (!selectedDispatch) return;
    
    assignDispatchMutation.mutate({
      dispatchId: selectedDispatch.id,
      driverId,
      truckId,
    });
  };

  const handleRejectDispatch = () => {
    if (!selectedDispatch || !rejectionReason.trim()) return;
    
    rejectDispatchMutation.mutate({
      dispatchId: selectedDispatch.id,
      reason: rejectionReason,
    });
  };

  if (!user || user.role !== "leasor_admin") {
    return <div>Access denied</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dispatch Management</h1>
      </div>

      {/* Pending Dispatches */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Pending Dispatches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {pendingDispatches?.map((dispatch: any) => (
              <div key={dispatch.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{dispatch.jobName}</h3>
                    <p className="text-muted-foreground">{dispatch.customerName}</p>
                  </div>
                  <Badge variant="secondary">Pending Assignment</Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(dispatch.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    <span>{dispatch.trucksNeeded} trucks needed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{dispatch.materialType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <span>{dispatch.loadsPerTruck} loads/truck</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm"
                        onClick={() => setSelectedDispatch(dispatch)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Assign
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Assign Dispatch</DialogTitle>
                      </DialogHeader>
                      <AssignmentForm
                        dispatch={selectedDispatch}
                        availableDrivers={availableDrivers}
                        availableTrucks={availableTrucks}
                        onAssign={handleAssignDispatch}
                        isLoading={assignDispatchMutation.isPending}
                      />
                    </DialogContent>
                  </Dialog>

                  <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedDispatch(dispatch)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reject Dispatch</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p>Please provide a reason for rejecting this dispatch:</p>
                        <Textarea
                          placeholder="e.g., Driver called out, Truck breakdown, Declined project"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleRejectDispatch}
                            disabled={!rejectionReason.trim() || rejectDispatchMutation.isPending}
                            variant="destructive"
                          >
                            Reject Dispatch
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setRejectionDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}

            {(!pendingDispatches || pendingDispatches.length === 0) && (
              <p className="text-muted-foreground text-center py-8">
                No pending dispatches
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assigned Dispatches */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Assigned Dispatches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {assignedDispatches?.map((dispatch: any) => (
              <div key={dispatch.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{dispatch.jobName}</h3>
                    <p className="text-muted-foreground">{dispatch.customerName}</p>
                  </div>
                  <Badge variant="default">Assigned</Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{dispatch.assignedDriver}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    <span>{dispatch.assignedTruck}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(dispatch.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}

            {(!assignedDispatches || assignedDispatches.length === 0) && (
              <p className="text-muted-foreground text-center py-8">
                No assigned dispatches
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AssignmentForm({ 
  dispatch, 
  availableDrivers, 
  availableTrucks, 
  onAssign, 
  isLoading 
}: {
  dispatch: any;
  availableDrivers: any[];
  availableTrucks: any[];
  onAssign: (driverId: number, truckId: number) => void;
  isLoading: boolean;
}) {
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [selectedTruck, setSelectedTruck] = useState<string>("");

  const handleSubmit = () => {
    if (!selectedDriver || !selectedTruck) return;
    onAssign(parseInt(selectedDriver), parseInt(selectedTruck));
  };

  if (!dispatch) return null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-2">{dispatch.jobName}</h3>
        <p className="text-sm text-muted-foreground">
          {dispatch.customerName} • {dispatch.materialType} • {dispatch.loadsPerTruck} loads
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Select Driver</label>
          <Select value={selectedDriver} onValueChange={setSelectedDriver}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a driver" />
            </SelectTrigger>
            <SelectContent>
              {availableDrivers?.map((driver: any) => (
                <SelectItem key={driver.id} value={driver.id.toString()}>
                  {driver.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Select Truck</label>
          <Select value={selectedTruck} onValueChange={setSelectedTruck}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a truck" />
            </SelectTrigger>
            <SelectContent>
              {availableTrucks?.map((truck: any) => (
                <SelectItem key={truck.id} value={truck.id.toString()}>
                  {truck.number} - {truck.type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2">
        <Button 
          onClick={handleSubmit}
          disabled={!selectedDriver || !selectedTruck || isLoading}
        >
          Assign Dispatch
        </Button>
        <Button variant="outline" onClick={() => {}}>
          Cancel
        </Button>
      </div>
    </div>
  );
}