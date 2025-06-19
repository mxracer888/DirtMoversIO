import { useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { User, Bell, Moon, Globe, Shield } from "lucide-react";

export default function Settings() {
  const { user } = useCurrentUser();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("en");

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4 mb-8">
          <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Manage your account preferences</p>
          </div>
        </div>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Profile Information</span>
            </CardTitle>
            <CardDescription>
              Your account details and role information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Name</Label>
                <p className="text-lg font-medium text-gray-900">{user.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Email</Label>
                <p className="text-lg font-medium text-gray-900">{user.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Role</Label>
                <p className="text-lg font-medium text-gray-900 capitalize">{user.role}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Company ID</Label>
                <p className="text-lg font-medium text-gray-900">{user.companyId}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
            </CardTitle>
            <CardDescription>
              Configure how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Push Notifications</Label>
                <p className="text-sm text-gray-600">
                  Receive notifications about job updates and system alerts
                </p>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Email Notifications</Label>
                <p className="text-sm text-gray-600">
                  Receive daily summaries and important updates via email
                </p>
              </div>
              <Switch
                checked={true}
                onCheckedChange={() => {}}
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Moon className="h-5 w-5" />
              <span>Appearance</span>
            </CardTitle>
            <CardDescription>
              Customize the look and feel of the application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Dark Mode</Label>
                <p className="text-sm text-gray-600">
                  Switch to dark theme for better visibility in low light
                </p>
              </div>
              <Switch
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
            </div>
          </CardContent>
        </Card>

        {/* Language & Region */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>Language & Region</span>
            </CardTitle>
            <CardDescription>
              Set your preferred language and regional settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Security (Driver-specific) */}
        {user.role === "driver" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Security</span>
              </CardTitle>
              <CardDescription>
                Security settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base">GPS Tracking</Label>
                <p className="text-sm text-gray-600">
                  GPS tracking is enabled for accurate activity logging and location verification
                </p>
                <div className="flex items-center space-x-2 text-green-600">
                  <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                  <span className="text-sm font-medium">Active</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save Changes */}
        <div className="flex justify-end space-x-4">
          <Button variant="outline">
            Cancel
          </Button>
          <Button>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}