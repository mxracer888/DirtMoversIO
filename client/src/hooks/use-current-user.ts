import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface CurrentUserResponse {
  user: User;
}

/**
 * Hook to get the current authenticated user
 */
export function useCurrentUser() {
  const { data, isLoading, error, refetch } = useQuery<CurrentUserResponse | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
  });

  // Prevent infinite loading states
  const safeIsLoading = isLoading && !error;

  return {
    user: data?.user || null,
    isLoading: safeIsLoading,
    error,
    isAuthenticated: !!data?.user,
    refetch,
  };
}

/**
 * Hook to check if user has a specific role
 */
export function useUserRole() {
  const { user } = useCurrentUser();
  
  return {
    isDriver: user?.role === "driver",
    isBroker: user?.role === "broker",
    isAdmin: user?.role === "admin",
    role: user?.role || null,
  };
}

/**
 * Hook to check user permissions
 */
export function useUserPermissions() {
  const { user } = useCurrentUser();
  
  const canLogActivities = user?.role === "driver";
  const canViewDashboard = user?.role === "broker" || user?.role === "admin";
  const canManageDispatches = user?.role === "broker" || user?.role === "admin";
  const canViewReports = user?.role === "broker" || user?.role === "admin";
  const canManageUsers = user?.role === "admin";
  
  return {
    canLogActivities,
    canViewDashboard,
    canManageDispatches,
    canViewReports,
    canManageUsers,
  };
}
