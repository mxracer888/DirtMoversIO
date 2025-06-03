import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, User, FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useGeolocation } from "@/hooks/use-geolocation";
import SignaturePad from "@/components/signature-pad";
import { useState } from "react";

export default function EndOfDay() {
  const [, setLocation] = useLocation();
  const [operatorName, setOperatorName] = useState("");
  const [driverSignature, setDriverSignature] = useState("");
  const [operatorSignature, setOperatorSignature] = useState("");
  const { toast } = useToast();
  const { location } = useGeolocation();

  // Get active work day
  const { data: workDay } = useQuery({
    queryKey: ["/api/work-days/active"],
  });

  // Get activities for current work day
  const { data: activities = [] } = useQuery({
    queryKey: ["/api/activities/work-day", workDay?.id],
    enabled: !!workDay?.id,
  });

  const submitEndOfDayMutation = useMutation({
    mutationFn: async () => {
      if (!workDay) throw new Error("No active work day");
      if (!driverSignature) throw new Error("Driver signature required");
      if (!operatorSignature) throw new Error("Operator signature required");
      if (!operatorName.trim()) throw new Error("Operator name required");

      const updates = {
        endTime: new Date(),
        status: "completed",
        driverSignature,
        operatorName: operatorName.trim(),
        operatorSignature,
        totalLoads: getTotalLoads(),
      };

      const res = await apiRequest("PATCH", `/api/work-days/${workDay.id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "End of day submitted!",
        description: "Your freight ticket has been processed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/work-days/active"] });
      setLocation("/daily-setup");
    },
    onError: (error: any) => {
      toast({
        title: "Submission failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const getTotalLoads = () => {
    return activities.filter(activity => activity.activityType === "dumped_material").length;
  };

  const getTotalHours = () => {
    if (!workDay?.startTime) return 0;
    const start = new Date(workDay.startTime);
    const end = new Date();
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return Math.round(hours * 10) / 10; // Round to 1 decimal place
  };

  const getAverageCycleTime = () => {
    const completedLoads = activities.filter(a => a.activityType === "dumped_material");
    if (completedLoads.length === 0) return "--";

    // This is a simplified calculation - in practice, you'd calculate based on full cycles
    const totalTime = getTotalHours();
    const avgMinutes = Math.round((totalTime * 60) / completedLoads.length);
    return `${avgMinutes} min`;
  };

  const handleSubmit = () => {
    submitEndOfDayMutation.mutate();
  };

  if (!workDay) {
    return (
      <div className="mobile-container flex items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">No Active Work Day</h2>
            <p className="text-gray-600 mb-6">You need to start a work day first.</p>
            <Button onClick={() => setLocation("/daily-setup")}>
              Start Work Day
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mobile-container">
      {/* Header */}
      <div className="mobile-header">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/main-activity")}
            className="p-2 -ml-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">End of Day</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="mobile-content">
        {/* Day Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Day Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{getTotalLoads()}</div>
                <div className="text-sm text-gray-600">Total Loads</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary">{getTotalHours()}</div>
                <div className="text-sm text-gray-600">Total Hours</div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Start Time:</span>
                <span className="font-medium">
                  {workDay.startTime 
                    ? new Date(workDay.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : "--"
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">End Time:</span>
                <span className="font-medium">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average Cycle:</span>
                <span className="font-medium">{getAverageCycleTime()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Driver Signature */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Driver Signature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SignaturePad
              onSignatureChange={setDriverSignature}
              placeholder="Driver signature required"
            />
          </CardContent>
        </Card>

        {/* Operator Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              Operator Sign-Off
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="operatorName">Operator Name</Label>
              <Input
                id="operatorName"
                type="text"
                placeholder="Enter operator name"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                className="text-lg h-12"
              />
            </div>

            <SignaturePad
              onSignatureChange={setOperatorSignature}
              placeholder="Operator signature required"
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button 
          onClick={handleSubmit}
          className="activity-button secondary"
          disabled={submitEndOfDayMutation.isPending || !driverSignature || !operatorSignature || !operatorName.trim()}
        >
          {submitEndOfDayMutation.isPending ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
              Submitting...
            </div>
          ) : (
            <>
              <CheckCircle className="h-6 w-6 mr-3" />
              SUBMIT FREIGHT TICKET
            </>
          )}
        </Button>

        {/* Location and Time Stamp */}
        <div className="bg-gray-100 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex items-center justify-center">
              <span className="mr-1">📅</span>
              <span>{new Date().toLocaleString()}</span>
            </div>
            {location && (
              <div className="flex items-center justify-center">
                <span className="mr-1">📍</span>
                <span>
                  GPS: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
