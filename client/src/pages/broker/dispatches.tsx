import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Calendar, Clock, Truck, MapPin, Users, Plus, UserPlus, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "wouter";

// Form validation schema
const dispatchFormSchema = z.object({
  jobName: z.string().min(1, "Job name is required"),
  invoiceJobName: z.string().optional(),
  customerId: z.number().min(1, "Customer is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  truckType: z.string().min(1, "Truck type is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  materialType: z.string().min(1, "Material type is required"),
  materialFrom: z.string().min(1, "Material from location is required"),
  deliveredTo: z.string().min(1, "Delivered to location is required"),
  account: z.string().optional(),
  travelTime: z.number().min(0, "Travel time must be 0 or greater"),
  materialFromGpsPin: z.string().optional(),
  deliveredToGpsPin: z.string().optional(),
});

type DispatchFormData = z.infer<typeof dispatchFormSchema>;

interface Dispatch {
  id: number;
  jobName: string;
  invoiceJobName?: string;
  customerId: number;
  date: string;
  startTime: string;
  truckType: string;
  quantity: number;
  materialType: string;
  materialFrom: string;
  deliveredTo: string;
  account?: string;
  travelTime: number;
  materialFromGpsPin?: string;
  deliveredToGpsPin?: string;
  status: string;
  createdAt: string;
}

interface Customer {
  id: number;
  name: string;
  contactEmail?: string;
  contactPhone?: string;
}

interface Truck {
  id: number;
  number: string;
  type: string;
  company: {
    id: number;
    name: string;
    type: string;
  };
}

interface ReusableData {
  id: number;
  type: string;
  value: string;
  usageCount: number;
}

export default function DispatchesPage() {
  const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(null);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [truckAssignments, setTruckAssignments] = useState<Record<number, number>>({});
  const [isNewCustomerDialogOpen, setIsNewCustomerDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: dispatches = [], isLoading: dispatchesLoading } = useQuery({
    queryKey: ["/api/dispatches"],
    retry: false,
  });

  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ["/api/broker/customers"],
  });

  const { data: trucks = [], isLoading: trucksLoading } = useQuery({
    queryKey: ["/api/broker/trucks"],
  });

  const { data: jobNames = [] } = useQuery({
    queryKey: ["/api/reusable-data/job_name"],
  });

  const { data: materialTypes = [] } = useQuery({
    queryKey: ["/api/reusable-data/material_type"],
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["/api/reusable-data/location"],
  });

  // Form setup
  const form = useForm<DispatchFormData>({
    resolver: zodResolver(dispatchFormSchema),
    defaultValues: {
      jobName: "",
      invoiceJobName: "",
      customerId: 0,
      date: new Date().toISOString().split('T')[0],
      startTime: "07:00",
      truckType: "",
      quantity: 1,
      materialType: "",
      materialFrom: "",
      deliveredTo: "",
      account: "",
      travelTime: 45,
      materialFromGpsPin: "",
      deliveredToGpsPin: "",
    },
  });

  // Mutations
  const createDispatchMutation = useMutation({
    mutationFn: async (data: DispatchFormData) => {
      const response = await fetch("/api/dispatches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create dispatch");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dispatches"] });
      form.reset();
      toast({
        title: "Success",
        description: "Dispatch created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create dispatch",
        variant: "destructive",
      });
    },
  });

  const assignDispatchMutation = useMutation({
    mutationFn: async ({ dispatchId, assignments }: { 
      dispatchId: number; 
      assignments: Array<{ truckId: number; driverId?: number }> 
    }) => {
      const response = await fetch(`/api/dispatches/${dispatchId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ truckAssignments: assignments }),
      });
      if (!response.ok) throw new Error("Failed to assign dispatch");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dispatches"] });
      setShowAssignmentForm(false);
      setTruckAssignments({});
      setSelectedDispatch(null);
      toast({
        title: "Success",
        description: "Dispatch assigned successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to assign dispatch",
        variant: "destructive",
      });
    },
  });

  // Customer creation mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: { name: string; contactEmail: string; contactPhone: string; address: string }) => {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      });
      if (!response.ok) throw new Error("Failed to create customer");
      return response.json();
    },
    onSuccess: (newCustomer) => {
      queryClient.invalidateQueries({ queryKey: ["/api/broker/customers"] });
      form.setValue("customerId", newCustomer.id);
      setIsNewCustomerDialogOpen(false);
      toast({
        title: "Success",
        description: "Customer created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create customer",
        variant: "destructive",
      });
    },
  });

  // Customer creation form
  const customerForm = useForm({
    defaultValues: {
      name: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
    },
  });

  const onSubmit = (data: DispatchFormData) => {
    createDispatchMutation.mutate(data);
  };

  const onCreateCustomer = (data: { name: string; contactEmail: string; contactPhone: string; address: string }) => {
    createCustomerMutation.mutate(data);
  };

  const handleAssignDispatch = (dispatch: Dispatch) => {
    setSelectedDispatch(dispatch);
    setShowAssignmentForm(true);
  };

  const handleTruckAssignment = (truckId: number, quantity: number) => {
    setTruckAssignments(prev => ({
      ...prev,
      [truckId]: quantity
    }));
  };

  const submitAssignments = () => {
    if (!selectedDispatch) return;

    const assignments = Object.entries(truckAssignments)
      .filter(([_, quantity]) => quantity > 0)
      .flatMap(([truckId, quantity]) => 
        Array(quantity).fill(null).map(() => ({ truckId: parseInt(truckId) }))
      );

    if (assignments.length !== selectedDispatch.quantity) {
      toast({
        title: "Error",
        description: `Must assign exactly ${selectedDispatch.quantity} trucks`,
        variant: "destructive",
      });
      return;
    }

    assignDispatchMutation.mutate({
      dispatchId: selectedDispatch.id,
      assignments
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      created: "bg-blue-100 text-blue-800",
      assigned: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-orange-100 text-orange-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800";
  };

  const trucksByType = (trucks as Truck[]).filter((truck: Truck) => 
    !form.watch("truckType") || truck.type === form.watch("truckType")
  );

  const assignedCount = Object.values(truckAssignments).reduce((sum, count) => sum + count, 0);

  if (dispatchesLoading || customersLoading || trucksLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading dispatches...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/broker/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Dispatches</h1>
            <p className="text-muted-foreground">Create and manage dispatch assignments</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList>
          <TabsTrigger value="create">Create Dispatch</TabsTrigger>
          <TabsTrigger value="manage">Manage Dispatches</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Dispatch
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="jobName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Smith Quarry Job" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="invoiceJobName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Invoice Job Name (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Customer-facing job name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer</FormLabel>
                          <Select onValueChange={(value) => {
                            if (value === "add_new") {
                              setIsNewCustomerDialogOpen(true);
                            } else {
                              field.onChange(parseInt(value));
                            }
                          }} value={field.value.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select customer" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {customers.map((customer: Customer) => (
                                <SelectItem key={customer.id} value={customer.id.toString()}>
                                  {customer.name}
                                </SelectItem>
                              ))}
                              <SelectItem value="add_new" className="text-blue-600 font-medium">
                                <div className="flex items-center gap-2">
                                  <UserPlus className="h-4 w-4" />
                                  + Add New Customer
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="account"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Account reference" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="truckType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Truck Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select truck type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Side Dump">Side Dump</SelectItem>
                              <SelectItem value="Super Side Dump">Super Side Dump</SelectItem>
                              <SelectItem value="Flatbed">Flatbed</SelectItem>
                              <SelectItem value="End Dump">End Dump</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity Required</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="materialType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Material Type</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Gravel, Sand, Road Base" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="travelTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Travel Time (minutes)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Locations</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="materialFrom"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Material From</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., North Quarry" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="deliveredTo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Delivered To</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Construction Site A" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="materialFromGpsPin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Material From GPS Pin (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Google Maps link" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="deliveredToGpsPin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Delivered To GPS Pin (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Google Maps link" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={createDispatchMutation.isPending}
                      className="min-w-[120px]"
                    >
                      {createDispatchMutation.isPending ? "Creating..." : "Create Dispatch"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Dispatches</CardTitle>
              </CardHeader>
              <CardContent>
                {dispatches.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No dispatches created yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dispatches.map((dispatch: Dispatch) => (
                      <Card key={dispatch.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <h3 className="font-semibold">{dispatch.jobName}</h3>
                                <Badge className={getStatusBadge(dispatch.status)}>
                                  {dispatch.status.replace('_', ' ').toUpperCase()}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(dispatch.date).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {new Date(dispatch.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Truck className="h-4 w-4" />
                                  {dispatch.quantity} {dispatch.truckType}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {dispatch.materialType}
                                </div>
                              </div>
                              <div className="text-sm">
                                <span className="font-medium">From:</span> {dispatch.materialFrom} → 
                                <span className="font-medium"> To:</span> {dispatch.deliveredTo}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {dispatch.status === 'created' && (
                                <Button
                                  onClick={() => handleAssignDispatch(dispatch)}
                                  size="sm"
                                  variant="outline"
                                >
                                  <Users className="h-4 w-4 mr-1" />
                                  Assign Trucks
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {showAssignmentForm && selectedDispatch && (
              <Card>
                <CardHeader>
                  <CardTitle>Assign Trucks to {selectedDispatch.jobName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Required: {selectedDispatch.quantity} {selectedDispatch.truckType} trucks
                        {assignedCount > 0 && ` | Selected: ${assignedCount}`}
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-3">
                      {trucksByType.length === 0 ? (
                        <p className="text-muted-foreground">
                          No {selectedDispatch.truckType} trucks available
                        </p>
                      ) : (
                        trucksByType.map((truck: Truck) => (
                          <div key={truck.id} className="flex items-center justify-between p-3 border rounded">
                            <div>
                              <span className="font-medium">Truck {truck.number}</span>
                              <span className="text-sm text-muted-foreground ml-2">
                                ({truck.company.name})
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`truck-${truck.id}`}>Assign:</Label>
                              <Select
                                value={(truckAssignments[truck.id] || 0).toString()}
                                onValueChange={(value) => handleTruckAssignment(truck.id, parseInt(value))}
                              >
                                <SelectTrigger className="w-20">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: selectedDispatch.quantity + 1 }, (_, i) => (
                                    <SelectItem key={i} value={i.toString()}>
                                      {i}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={submitAssignments}
                        disabled={assignedCount !== selectedDispatch.quantity || assignDispatchMutation.isPending}
                      >
                        {assignDispatchMutation.isPending ? "Assigning..." : "Confirm Assignment"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAssignmentForm(false);
                          setTruckAssignments({});
                          setSelectedDispatch(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Customer Creation Dialog */}
      <Dialog open={isNewCustomerDialogOpen} onOpenChange={setIsNewCustomerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <Form {...customerForm}>
            <form onSubmit={customerForm.handleSubmit(onCreateCustomer)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={customerForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., ABC Construction" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={customerForm.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contact@company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={customerForm.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={customerForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St, City, State 12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsNewCustomerDialogOpen(false);
                    customerForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createCustomerMutation.isPending}
                >
                  {createCustomerMutation.isPending ? "Creating..." : "Create Customer"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}