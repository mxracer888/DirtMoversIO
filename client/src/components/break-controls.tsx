import { Button } from "@/components/ui/button";
import { Coffee, AlertTriangle, Play } from "lucide-react";

interface BreakControlsProps {
  onBreak: () => void;
  onBreakdown: () => void;
  onStartDriving: () => void;
  currentBreakState?: "break" | "breakdown" | null;
  isLoading?: boolean;
}

export default function BreakControls({ 
  onBreak, 
  onBreakdown, 
  onStartDriving, 
  currentBreakState,
  isLoading = false 
}: BreakControlsProps) {
  
  if (currentBreakState === "break" || currentBreakState === "breakdown") {
    return (
      <div className="space-y-2">
        <div className="text-center text-sm text-gray-600 mb-3">
          {currentBreakState === "break" ? "Currently on break" : "Currently broken down"}
        </div>
        
        <Button
          onClick={onStartDriving}
          disabled={isLoading}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          size="lg"
        >
          <Play className="h-5 w-5 mr-2" />
          {isLoading ? "Starting..." : "Start Driving"}
        </Button>
        
        {currentBreakState === "break" && (
          <Button
            onClick={onBreakdown}
            disabled={isLoading}
            variant="destructive"
            className="w-full"
            size="lg"
          >
            <AlertTriangle className="h-5 w-5 mr-2" />
            {isLoading ? "Reporting..." : "Report Breakdown"}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={onBreak}
        disabled={isLoading}
        variant="outline"
        className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
        size="lg"
      >
        <Coffee className="h-5 w-5 mr-2" />
        {isLoading ? "Starting..." : "Take Break"}
      </Button>
      
      <Button
        onClick={onBreakdown}
        disabled={isLoading}
        variant="destructive"
        className="w-full"
        size="lg"
      >
        <AlertTriangle className="h-5 w-5 mr-2" />
        {isLoading ? "Reporting..." : "Report Breakdown"}
      </Button>
    </div>
  );
}