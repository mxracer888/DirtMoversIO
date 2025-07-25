import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Truck, BarChart3, User, Lock, MapPin, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function Login() {
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<"driver" | "broker" | "leasor" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      console.log("=== CLIENT LOGIN START ===");
      console.log("Timestamp:", new Date().toISOString());
      console.log("Login mutation starting with data:", data);
      console.log("Request URL:", "/api/auth/login");
      console.log("Browser cookies before request:", document.cookie);
      
      const requestBody = JSON.stringify(data);
      console.log("Request body:", requestBody);
      console.log("Request headers to send:", {
        "Content-Type": "application/json",
        "credentials": "include"
      });
      
      console.log("Making fetch request...");
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: requestBody,
        credentials: 'include', // Ensure cookies/sessions are included
      });
      
      console.log("Response received!");
      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);
      console.log("Response headers:", response.headers);
      console.log("Response type:", response.type);
      console.log("Response url:", response.url);
      console.log("Browser cookies after response:", document.cookie);
      
      if (!response.ok) {
        console.log("Response not ok, parsing error...");
        const error = await response.json();
        console.error("Login error response:", error);
        throw new Error(error.error || "Login failed");
      }
      
      console.log("Response ok, parsing result...");
      const result = await response.json();
      console.log("Login success response:", result);
      console.log("=== CLIENT LOGIN SUCCESS ===");
      return result;
    },
    onSuccess: async (data) => {
      if (data.user) {
        console.log("Login success, invalidating queries and redirecting");
        
        // Wait a moment for session to propagate
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Invalidate auth queries to refresh user state
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        
        // Wait for query invalidation to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Redirect based on user role
        if (data.user.role.includes("broker") || data.user.role === "admin") {
          setLocation("/broker/dashboard");
        } else if (data.user.role.includes("leasor")) {
          setLocation("/leasor/dashboard");
        } else {
          setLocation("/driver/start-day");
        }
        toast({
          title: "Login successful",
          description: `Welcome back, ${data.user.name}`,
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

  const handleRoleSelect = (role: "driver" | "broker" | "leasor") => {
    setSelectedRole(role);
    
    // Pre-fill demo credentials based on role
    if (role === "driver") {
      setEmail("mike.johnson@mountaintrucking.com");
      setPassword("driver123");
    } else if (role === "broker") {
      setEmail("sarah.broker@terrafirma.com");
      setPassword("broker123");
    } else if (role === "leasor") {
      setEmail("admin@mountaintrucking.com");
      setPassword("leasor123");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted with:", { email, password });
    
    if (!email || !password) {
      toast({
        title: "Missing information",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Calling login mutation with:", { email, password });
    loginMutation.mutate({ email, password });
  };

  const handleDemoLogin = () => {
    console.log("Demo login clicked for role:", selectedRole);
    
    if (!selectedRole) return;
    
    if (selectedRole === "driver") {
      console.log("Starting driver demo login");
      loginMutation.mutate({ 
        email: "mike.johnson@mountaintrucking.com", 
        password: "driver123" 
      });
    } else if (selectedRole === "broker") {
      console.log("Starting broker demo login");
      loginMutation.mutate({ 
        email: "sarah.broker@terrafirma.com", 
        password: "broker123" 
      });
    } else if (selectedRole === "leasor") {
      console.log("Starting leasor demo login");
      loginMutation.mutate({ 
        email: "admin@mountaintrucking.com", 
        password: "leasor123" 
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Truck className="h-10 w-10 text-primary mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">TerraFirma</h1>
          </div>
          <p className="text-lg text-gray-600">
            Comprehensive dump truck logistics management platform
          </p>
        </div>

        {!selectedRole ? (
          /* Role Selection */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-primary"
              onClick={() => handleRoleSelect("driver")}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Truck className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Driver Portal</CardTitle>
                <p className="text-gray-600">
                  Access your daily operations, log activities, and manage loads
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 text-green-600" />
                    Activity tracking and GPS logging
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2 text-blue-600" />
                    Load management and history
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <BarChart3 className="h-4 w-4 mr-2 text-purple-600" />
                    Performance tracking
                  </div>
                </div>
                <Button className="w-full mt-6" size="lg">
                  Continue as Driver
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-primary"
              onClick={() => handleRoleSelect("broker")}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Broker Dashboard</CardTitle>
                <p className="text-gray-600">
                  Monitor fleet operations, analytics, and real-time insights
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <BarChart3 className="h-4 w-4 mr-2 text-green-600" />
                    Real-time fleet monitoring
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                    Job and location management
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2 text-purple-600" />
                    Driver performance analytics
                  </div>
                </div>
                <Button className="w-full mt-6" size="lg">
                  Continue as Broker
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-primary"
              onClick={() => handleRoleSelect("leasor")}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Lease Hauler Portal</CardTitle>
                <p className="text-gray-600">
                  Manage dispatch assignments, fleet operations, and driver coordination
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <BarChart3 className="h-4 w-4 mr-2 text-green-600" />
                    Dispatch management system
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Truck className="h-4 w-4 mr-2 text-blue-600" />
                    Fleet tracking and management
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2 text-purple-600" />
                    Driver management and assignment
                  </div>
                </div>
                <Button className="w-full mt-6" size="lg">
                  Continue as Lease Hauler
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Login Form */
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                {selectedRole === "driver" ? (
                  <Truck className="h-6 w-6 text-primary" />
                ) : selectedRole === "broker" ? (
                  <BarChart3 className="h-6 w-6 text-primary" />
                ) : (
                  <Building2 className="h-6 w-6 text-primary" />
                )}
              </div>
              <CardTitle className="text-xl">
                {selectedRole === "driver" ? "Driver Login" : selectedRole === "broker" ? "Broker Login" : "Lease Hauler Login"}
              </CardTitle>
              <div className="flex justify-center">
                <Badge variant="secondary" className="mt-2">
                  {selectedRole === "driver" ? "Driver Portal" : selectedRole === "broker" ? "Broker Dashboard" : "Lease Hauler Portal"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Signing in..." : "Sign In"}
                  </Button>
                  
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full" 
                    onClick={handleDemoLogin}
                    disabled={loginMutation.isPending}
                  >
                    Demo Login ({selectedRole === "driver" ? "Driver" : selectedRole === "broker" ? "Broker" : "Lease Hauler"})
                  </Button>
                </div>
              </form>

              <div className="mt-6 pt-4 border-t text-center">
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedRole(null)}
                  className="text-sm"
                >
                  ← Choose Different Role
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Secure logistics management for the construction industry</p>
        </div>
      </div>
    </div>
  );
}