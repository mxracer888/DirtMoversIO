import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Truck, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function Login() {
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<"driver" | "broker">("driver");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      console.log("Frontend: Making login request with data:", data);
      
      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify(data),
          credentials: 'include',
        });
        
        console.log("Frontend: Response status:", response.status);
        console.log("Frontend: Response headers:", Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          let errorMessage = "Login failed";
          try {
            const error = await response.json();
            errorMessage = error.error || errorMessage;
          } catch (e) {
            if (response.status === 504) {
              errorMessage = "Server timeout - please try again";
            } else if (response.status === 0) {
              errorMessage = "Network connection failed";
            } else {
              errorMessage = response.statusText || `HTTP ${response.status}`;
            }
          }
          throw new Error(errorMessage);
        }
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Server returned non-JSON response");
        }
        
        return response.json();
      } catch (error) {
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw new Error("Network connection failed - please check your connection");
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data.user) {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        
        if (data.user.role.includes("broker") || data.user.role === "admin") {
          setLocation("/broker/dashboard");
        } else {
          setLocation("/driver/start-day");
        }
        toast({
          title: "Login successful",
          description: `Welcome back, ${data.user.email}`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const handleRoleSelect = (role: "driver" | "broker") => {
    setSelectedRole(role);
    // Set demo credentials based on role
    if (role === "driver") {
      setEmail("mike.johnson@mountaintrucking.com");
      setPassword("driver123");
    } else {
      setEmail("sarah.broker@terrafirma.com");
      setPassword("broker123");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      loginMutation.mutate({ email, password });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary flex items-center justify-center mb-4">
            <Truck className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">DirtMovers</h1>
          <p className="text-gray-600 mt-2">Dump Truck Logistics Platform</p>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant={selectedRole === "driver" ? "default" : "outline"}
            className="h-20 flex flex-col gap-2"
            onClick={() => handleRoleSelect("driver")}
          >
            <Truck className="h-6 w-6" />
            <span>Driver</span>
          </Button>
          <Button
            type="button"
            variant={selectedRole === "broker" ? "default" : "outline"}
            className="h-20 flex flex-col gap-2"
            onClick={() => handleRoleSelect("broker")}
          >
            <Building className="h-6 w-6" />
            <span>Broker</span>
          </Button>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedRole === "driver" ? "Driver Login" : "Broker Login"}
            </CardTitle>
            <CardDescription>
              Enter your credentials to access the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">Demo Credentials:</p>
              <div className="space-y-1">
                <p><strong>Driver:</strong> mike.johnson@mountaintrucking.com / driver123</p>
                <p><strong>Broker:</strong> sarah.broker@terrafirma.com / broker123</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}