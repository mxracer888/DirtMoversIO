import { useCurrentUser } from "./use-current-user";

export function useAuth() {
  const { user, isLoading } = useCurrentUser();
  
  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}