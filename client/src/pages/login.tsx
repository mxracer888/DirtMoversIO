import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Truck, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { loginSchema, type LoginRequest } from "@shared/schema";

export default function Login() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginRequest) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Welcome back!",
        description: `Logged in as ${data.user.name}`,
      });
      
      // Redirect based on user role
      if (data.user.role === "driver") {
        setLocation("/daily-setup");
      } else {
        setLocation("/broker/dashboard");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginRequest) => {
    loginMutation.mutate(data);
  };

  const handleDemoLogin = (role: "driver" | "broker") => {
    const demoCredentials = {
      driver: { email: "mike.johnson@company.com", password: "password123" },
      broker: { email: "john.smith@terrafirma.com", password: "password123" },
    };
    
    form.setValue("email", demoCredentials[role].email);
    form.setValue("password", demoCredentials[role].password);
    onSubmit(demoCredentials[role]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardContent className="p-8">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-4">
              <Truck className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">TerraFirma</h1>
            <p className="text-gray-600 mt-1">Dump Truck Logistics</p>
          </div>

          {/* Login Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="driver@company.com"
                  className="pl-10 text-lg h-12"
                  {...form.register("email")}
                />
                <Mail className="absolute left-3 top-3 h-6 w-6 text-gray-400" />
              </div>
              {form.formState.errors.email && (
                <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10 text-lg h-12"
                  {...form.register("password")}
                />
                <Lock className="absolute left-3 top-3 h-6 w-6 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 h-6 w-6 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-semibold"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Logging in...
                </div>
              ) : (
                "LOG IN"
              )}
            </Button>
          </form>

          <div className="text-center mt-6">
            <a href="#" className="text-primary hover:text-primary/80 text-sm font-medium">
              Forgot your password?
            </a>
          </div>

          {/* Demo Mode */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center mb-4">Demo Mode</p>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => handleDemoLogin("driver")}
                disabled={loginMutation.isPending}
              >
                Driver View
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => handleDemoLogin("broker")}
                disabled={loginMutation.isPending}
              >
                Broker View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
