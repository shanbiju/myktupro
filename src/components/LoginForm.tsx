import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, LogIn, Eye, EyeOff, Shield } from "lucide-react";

interface LoginFormProps {
  onLogin: (username: string, password: string) => Promise<void>;
  isLoading: boolean;
}

export function LoginForm({ onLogin, isLoading }: LoginFormProps) {
  const [username, setUsername] = useState(() => localStorage.getItem("ktu_username") || "");
  const [password, setPassword] = useState(() => localStorage.getItem("ktu_password") || "");
  const [showPassword, setShowPassword] = useState(false);
  const [saveCredentials, setSaveCredentials] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saveCredentials) {
      localStorage.setItem("ktu_username", username);
      localStorage.setItem("ktu_password", password);
    }
    await onLogin(username, password);
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl border-0 overflow-hidden">
      <CardHeader className="gradient-primary text-primary-foreground pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary-foreground/20">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl">KTU Login</CardTitle>
            <CardDescription className="text-primary-foreground/80 text-sm">
              Enter your KTU portal credentials
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your KTU username"
              required
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="h-11 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={saveCredentials}
              onChange={(e) => setSaveCredentials(e.target.checked)}
              className="rounded border-input"
            />
            <span className="text-muted-foreground">Remember credentials</span>
          </label>
          <Button type="submit" disabled={isLoading} className="w-full h-11 text-base font-semibold">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting to KTU...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Login & Fetch Results
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
