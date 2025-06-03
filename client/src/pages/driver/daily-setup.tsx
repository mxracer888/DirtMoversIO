import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Calendar, Truck, Building, Package, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertWorkDaySchema } from "@shared/schema";
import { z } from "zod";

const setupSchema = insertWorkDaySchema.extend({
  workDate: z.string(),
});

type SetupFormData = z.infer<typeof setupSchema>;

export default function DailySetup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      workDate: new Date().toISOString().split('T')[0],
      truckId: 0,
      jobId: 0,
      materialId: 0,
      sourceLocationId: 0,
      destinationLocationId: 0,
    },
  });

  // Fetch setup data
  const { data: trucks = [] } = useQuery({
    queryKey: ["/api/trucks"],
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["/api/jobs"],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
  });

  const { data: materials = [] } = useQuery({
    queryKey: ["/api/materials"],
  });

  const { data: sourceLocations = [] } = useQuery({
    queryKey: ["/api/locations?type=source"],
  });

  const { data: destinationLocations = [] } = useQuery({
    queryKey: ["/api/locations?type=destination"],
  });

  const startDayMutation = useMutation({
    mutationFn: async (data: SetupFormData) => {
      const workDayData = {
        ...data,
        workDate: new Date(data.workDate),
      };
      const res = await apiRequest("POST", "/api/work-days", workDayData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Day started successfully!",
        description: "You can now begin logging activities.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/work-days/active"] });
      setLocation("/main-activity");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to start day",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SetupFormData) => {
    startDayMutation.mutate(data);
  };

  const getCustomerName = (jobId: number) => {
    const job = jobs.find(j => j.id === jobId);
    const customer = customers.find(c => c.id === job?.customerId);
    return customer?.name || "";
  };

  return (
    <div className="mobile-container">
      {/* Header */}
      <div className="mobile-header">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="p-2 -ml-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Daily Setup</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="mobile-content">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Work Date */}
          <Card className="bg-primary/5">
            <CardContent className="p-4">
              <div className="form-field">
                <Label htmlFor="workDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Work Date
                </Label>
                <Input
                  id="workDate"
                  type="date"
                  className="form-input"
                  {...form.register("workDate")}
                />
                {form.formState.errors.workDate && (
                  <p className="text-sm text-red-600">{form.formState.errors.workDate.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Truck Information */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Truck Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="form-field">
                <Label htmlFor="truckId">Truck Number</Label>
                <Select onValueChange={(value) => form.setValue("truckId", parseInt(value))}>
                  <SelectTrigger className="form-select">
                    <SelectValue placeholder="Select Truck" />
                  </SelectTrigger>
                  <SelectContent>
                    {trucks.map((truck) => (
                      <SelectItem key={truck.id} value={truck.id.toString()}>
                        {truck.number} - {truck.type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.truckId && (
                  <p className="text-sm text-red-600">Please select a truck</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Job Information */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Job Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="form-field">
                <Label htmlFor="jobId">Job Name</Label>
                <Select onValueChange={(value) => form.setValue("jobId", parseInt(value))}>
                  <SelectTrigger className="form-select">
                    <SelectValue placeholder="Select Job" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.map((job) => (
                      <SelectItem key={job.id} value={job.id.toString()}>
                        <div>
                          <div className="font-medium">{job.name}</div>
                          <div className="text-sm text-gray-500">{getCustomerName(job.id)}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.jobId && (
                  <p className="text-sm text-red-600">Please select a job</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Material Information */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Material Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="form-field">
                <Label htmlFor="materialId">Material Type</Label>
                <Select onValueChange={(value) => form.setValue("materialId", parseInt(value))}>
                  <SelectTrigger className="form-select">
                    <SelectValue placeholder="Select Material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((material) => (
                      <SelectItem key={material.id} value={material.id.toString()}>
                        {material.name} ({material.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.materialId && (
                  <p className="text-sm text-red-600">Please select a material</p>
                )}
              </div>

              <div className="form-field">
                <Label htmlFor="sourceLocationId">Material Source</Label>
                <Select onValueChange={(value) => form.setValue("sourceLocationId", parseInt(value))}>
                  <SelectTrigger className="form-select">
                    <SelectValue placeholder="Select Source" />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceLocations.map((location) => (
                      <SelectItem key={location.id} value={location.id.toString()}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.sourceLocationId && (
                  <p className="text-sm text-red-600">Please select a source location</p>
                )}
              </div>

              <div className="form-field">
                <Label htmlFor="destinationLocationId">Delivery Location</Label>
                <Select onValueChange={(value) => form.setValue("destinationLocationId", parseInt(value))}>
                  <SelectTrigger className="form-select">
                    <SelectValue placeholder="Select Destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinationLocations.map((location) => (
                      <SelectItem key={location.id} value={location.id.toString()}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.destinationLocationId && (
                  <p className="text-sm text-red-600">Please select a destination location</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            className="activity-button secondary"
            disabled={startDayMutation.isPending}
          >
            {startDayMutation.isPending ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                Starting Day...
              </div>
            ) : (
              <>
                <MapPin className="h-6 w-6 mr-3" />
                START DAY
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
