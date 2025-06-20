import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Truck, Plus, Edit, Trash2 } from "lucide-react";

export default function LeasorFleet() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [truckDialogOpen, setTruckDialogOpen] = useState(false);
  const [editingTruck, setEditingTruck] = useState<any>(null);

  const { data: trucks } = useQuery({
    queryKey: ["/api/leasor/trucks"],
    enabled: !!user && user.role === "leasor_admin",
  });

  const createTruckMutation = useMutation({
    mutationFn: async (truckData: any) => {
      await apiRequest("/api/leasor/trucks", "POST", truckData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Truck added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leasor/trucks"] });
      setTruckDialogOpen(false);
      setEditingTruck(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add truck",
        variant: "destructive",
      });
    },
  });

  const updateTruckMutation = useMutation({
    mutationFn: async (truckData: any) => {
      await apiRequest(`/api/leasor/trucks/${truckData.id}`, "PATCH", truckData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Truck updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leasor/trucks"] });
      setTruckDialogOpen(false);
      setEditingTruck(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update truck",
        variant: "destructive",
      });
    },
  });

  const deleteTruckMutation = useMutation({
    mutationFn: async (truckId: number) => {
      await apiRequest(`/api/leasor/trucks/${truckId}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Truck removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leasor/trucks"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove truck",
        variant: "destructive",
      });
    },
  });

  const handleEditTruck = (truck: any) => {
    setEditingTruck(truck);
    setTruckDialogOpen(true);
  };

  const handleDeleteTruck = (truckId: number) => {
    if (confirm("Are you sure you want to remove this truck?")) {
      deleteTruckMutation.mutate(truckId);
    }
  };

  if (!user || user.role !== "leasor_admin") {
    return <div>Access denied</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Fleet Management</h1>
        <Dialog open={truckDialogOpen} onOpenChange={setTruckDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTruck(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Truck
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTruck ? "Edit Truck" : "Add New Truck"}
              </DialogTitle>
            </DialogHeader>
            <TruckForm
              truck={editingTruck}
              onSubmit={(data) => {
                if (editingTruck) {
                  updateTruckMutation.mutate({ ...data, id: editingTruck.id });
                } else {
                  createTruckMutation.mutate(data);
                }
              }}
              isLoading={createTruckMutation.isPending || updateTruckMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Your Fleet ({trucks?.length || 0} trucks)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {trucks?.map((truck: any) => (
              <div key={truck.id} className="border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{truck.number}</h3>
                  <p className="text-muted-foreground">{truck.type}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={truck.isActive ? "default" : "secondary"}>
                      {truck.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {truck.currentDriver && (
                      <Badge variant="outline">
                        Assigned: {truck.currentDriver}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditTruck(truck)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTruck(truck.id)}
                    disabled={deleteTruckMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {(!trucks || trucks.length === 0) && (
              <p className="text-muted-foreground text-center py-8">
                No trucks in your fleet. Add your first truck to get started.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TruckForm({ 
  truck, 
  onSubmit, 
  isLoading 
}: {
  truck?: any;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    number: truck?.number || "",
    type: truck?.type || "",
    isActive: truck?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const truckTypes = [
    "Side Dump",
    "Super Side Dump", 
    "End Dump",
    "Tri-Axle",
    "Quad Axle",
    "Transfer",
    "Belly Dump"
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="number">Truck Number</Label>
        <Input
          id="number"
          placeholder="e.g., T-001, Truck 5"
          value={formData.number}
          onChange={(e) => setFormData({ ...formData, number: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="type">Truck Type</Label>
        <Select 
          value={formData.type} 
          onValueChange={(value) => setFormData({ ...formData, type: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select truck type" />
          </SelectTrigger>
          <SelectContent>
            {truckTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading || !formData.number || !formData.type}>
          {truck ? "Update Truck" : "Add Truck"}
        </Button>
        <Button type="button" variant="outline" onClick={() => {}}>
          Cancel
        </Button>
      </div>
    </form>
  );
}