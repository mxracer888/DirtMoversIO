import { 
  MapPin, 
  Truck, 
  Package, 
  CheckCircle,
  Coffee,
  AlertTriangle,
  Play
} from "lucide-react";
import DumpTruckLoaded from "@/components/icons/dump-truck-loaded";
import DumpTruckDumping from "@/components/icons/dump-truck-dumping";

/**
 * Activity state management for dump truck operations
 */

export type ActivityType = 
  | "arrived_at_load_site" 
  | "loaded_with_material" 
  | "arrived_at_dump_site" 
  | "dumped_material"
  | "break"
  | "breakdown" 
  | "driving";

export interface ActivityState {
  key: ActivityType;
  label: string;
  shortLabel: string;
  icon: typeof MapPin;
  color: "primary" | "secondary" | "accent";
  description: string;
  nextState?: ActivityType;
}

/**
 * Complete activity flow configuration
 */
export const ACTIVITY_STATES: Record<ActivityType, ActivityState> = {
  arrived_at_load_site: {
    key: "arrived_at_load_site",
    label: "Arrived at Load Site",
    shortLabel: "At Load Site",
    icon: MapPin,
    color: "primary",
    description: "Driver has arrived at the material loading location",
    nextState: "loaded_with_material",
  },
  loaded_with_material: {
    key: "loaded_with_material",
    label: "Loaded with Material",
    shortLabel: "Loaded",
    icon: DumpTruckLoaded,
    color: "accent",
    description: "Truck has been loaded with material and is ready to transport",
    nextState: "arrived_at_dump_site",
  },
  arrived_at_dump_site: {
    key: "arrived_at_dump_site",
    label: "Arrived at Dump Site",
    shortLabel: "At Dump Site",
    icon: MapPin,
    color: "primary",
    description: "Driver has arrived at the material dumping location",
    nextState: "dumped_material",
  },
  dumped_material: {
    key: "dumped_material",
    label: "Dumped Material",
    shortLabel: "Dumped",
    icon: DumpTruckDumping,
    color: "secondary",
    description: "Material has been successfully dumped and load is complete",
    nextState: "arrived_at_load_site",
  },
  break: {
    key: "break",
    label: "On Break",
    shortLabel: "Break",
    icon: Coffee,
    color: "accent",
    description: "Driver is taking a break",
  },
  breakdown: {
    key: "breakdown",
    label: "Breakdown",
    shortLabel: "Breakdown",
    icon: AlertTriangle,
    color: "secondary",
    description: "Vehicle breakdown or mechanical issue",
  },
  driving: {
    key: "driving",
    label: "Driving",
    shortLabel: "Driving",
    icon: Play,
    color: "primary",
    description: "Driver is back to work and driving",
  },
};

/**
 * Activity flow sequence for progress tracking
 */
export const ACTIVITY_FLOW_SEQUENCE: ActivityType[] = [
  "arrived_at_load_site",
  "loaded_with_material", 
  "arrived_at_dump_site",
  "dumped_material",
];

/**
 * Get the next activity in the flow
 */
export function getActivityFlow(currentActivity: ActivityType): ActivityType {
  const state = ACTIVITY_STATES[currentActivity];
  return state.nextState || "arrived_at_load_site";
}

/**
 * Get activity state configuration
 */
export function getActivityState(activityType: ActivityType): ActivityState {
  return ACTIVITY_STATES[activityType];
}

/**
 * Get activity icon component
 */
export function getActivityIcon(activityType: ActivityType) {
  return ACTIVITY_STATES[activityType].icon;
}

/**
 * Get activity label for display
 */
export function getActivityLabel(activityType: ActivityType): string {
  return ACTIVITY_STATES[activityType].label;
}

/**
 * Get activity short label for compact display
 */
export function getActivityShortLabel(activityType: ActivityType): string {
  return ACTIVITY_STATES[activityType].shortLabel;
}

/**
 * Get activity color theme
 */
export function getActivityColor(activityType: ActivityType): "primary" | "secondary" | "accent" {
  return ACTIVITY_STATES[activityType].color;
}

/**
 * Get activity description
 */
export function getActivityDescription(activityType: ActivityType): string {
  return ACTIVITY_STATES[activityType].description;
}

/**
 * Check if activity is a load completion event
 */
export function isLoadCompleteActivity(activityType: ActivityType): boolean {
  return activityType === "dumped_material";
}

/**
 * Check if activity is at a load site
 */
export function isLoadSiteActivity(activityType: ActivityType): boolean {
  return activityType === "arrived_at_load_site" || activityType === "loaded_with_material";
}

/**
 * Check if activity is at a dump site
 */
export function isDumpSiteActivity(activityType: ActivityType): boolean {
  return activityType === "arrived_at_dump_site" || activityType === "dumped_material";
}

/**
 * Get progress percentage for activity flow
 */
export function getActivityProgress(activityType: ActivityType): number {
  const index = ACTIVITY_FLOW_SEQUENCE.indexOf(activityType);
  return index >= 0 ? ((index + 1) / ACTIVITY_FLOW_SEQUENCE.length) * 100 : 0;
}

/**
 * Get completed activities in current cycle
 */
export function getCompletedActivities(currentActivity: ActivityType): ActivityType[] {
  const currentIndex = ACTIVITY_FLOW_SEQUENCE.indexOf(currentActivity);
  return ACTIVITY_FLOW_SEQUENCE.slice(0, currentIndex);
}

/**
 * Get remaining activities in current cycle
 */
export function getRemainingActivities(currentActivity: ActivityType): ActivityType[] {
  const currentIndex = ACTIVITY_FLOW_SEQUENCE.indexOf(currentActivity);
  return ACTIVITY_FLOW_SEQUENCE.slice(currentIndex + 1);
}

/**
 * Calculate cycle time between two activities
 */
export function calculateCycleTime(
  startActivity: { activityType: ActivityType; timestamp: string },
  endActivity: { activityType: ActivityType; timestamp: string }
): number {
  const startTime = new Date(startActivity.timestamp).getTime();
  const endTime = new Date(endActivity.timestamp).getTime();
  return Math.round((endTime - startTime) / (1000 * 60)); // Return minutes
}

/**
 * Format cycle time for display
 */
export function formatCycleTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Validate activity transition
 */
export function isValidActivityTransition(
  fromActivity: ActivityType, 
  toActivity: ActivityType
): boolean {
  const expectedNext = getActivityFlow(fromActivity);
  return toActivity === expectedNext;
}

/**
 * Get activity status for UI display
 */
export function getActivityStatus(
  activityType: ActivityType,
  currentActivity: ActivityType
): "completed" | "active" | "pending" {
  const currentIndex = ACTIVITY_FLOW_SEQUENCE.indexOf(currentActivity);
  const activityIndex = ACTIVITY_FLOW_SEQUENCE.indexOf(activityType);
  
  if (activityIndex < currentIndex) {
    return "completed";
  } else if (activityIndex === currentIndex) {
    return "active";
  } else {
    return "pending";
  }
}
