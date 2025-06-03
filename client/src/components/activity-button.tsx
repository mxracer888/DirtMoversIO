import { Button } from "@/components/ui/button";
import { getActivityIcon, getActivityLabel, getActivityColor } from "@/lib/activity-states";

interface ActivityButtonProps {
  activityType: string;
  loadNumber: number;
  onAction: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function ActivityButton({ 
  activityType, 
  loadNumber, 
  onAction, 
  isLoading = false,
  disabled = false
}: ActivityButtonProps) {
  const Icon = getActivityIcon(activityType as any);
  const label = getActivityLabel(activityType as any);
  const color = getActivityColor(activityType as any);

  const colorClass = color === "primary" ? "primary" : 
                    color === "secondary" ? "secondary" : "accent";

  return (
    <div className="relative">
      <Button
        onClick={onAction}
        disabled={disabled || isLoading}
        className={`activity-button ${colorClass}`}
      >
        <Icon className="h-8 w-8 mb-2" />
        <div className="text-center px-3">
          <div className="text-base font-bold leading-tight break-words whitespace-normal">{label}</div>
          <div className="text-sm opacity-90 mt-1">Load #{loadNumber}</div>
        </div>
      </Button>
      
      {/* Loading state overlay */}
      {isLoading && (
        <div className={`absolute inset-0 ${color === 'primary' ? 'bg-primary' : color === 'secondary' ? 'bg-secondary' : 'bg-accent'} rounded-2xl flex items-center justify-center`}>
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-lg font-medium">Logging GPS...</p>
            <p className="text-sm opacity-90">Please wait...</p>
          </div>
        </div>
      )}

      {/* GPS disabled overlay */}
      {disabled && (
        <div className="absolute inset-0 bg-gray-600 rounded-2xl flex items-center justify-center">
          <div className="text-white text-center">
            <div className="text-4xl mb-2">📍</div>
            <p className="text-lg font-medium">GPS Required</p>
            <p className="text-sm opacity-90">Enable location services</p>
          </div>
        </div>
      )}
    </div>
  );
}
