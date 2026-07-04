import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Mail, Key, Info, X, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
}

export function AdminPanel({ open, onClose }: AdminPanelProps) {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [allowedRegisterNumbers, setAllowedRegisterNumbers] = useState("");
  const [restrictLoginEnabled, setRestrictLoginEnabled] = useState(false);

  // Lockout States
  const [attemptsCount, setAttemptsCount] = useState(() => {
    return Number(localStorage.getItem("admin_login_attempts") || "0");
  });
  const [lockoutUntil, setLockoutUntil] = useState<number>(() => {
    return Number(localStorage.getItem("admin_login_lockout") || "0");
  });
  const [lockoutCountdown, setLockoutCountdown] = useState(0);

  // Custom Announcements State
  const [customAnnouncements, setCustomAnnouncements] = useState<any[]>([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newLink, setNewLink] = useState("");
  const [newDate, setNewDate] = useState("");

  const fetchCustomAnnouncements = async () => {
    setIsLoadingAnnouncements(true);
    const { data, error } = await supabase
      .from("admin_announcements")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setCustomAnnouncements(data);
    }
    setIsLoadingAnnouncements(false);
  };

  const handleAddAnnouncement = async () => {
    if (!newTitle) return toast({ title: "Title is required", variant: "destructive" });
    setIsLoadingAnnouncements(true);
    const { data, error } = await supabase.functions.invoke("admin-api", {
      body: { action: "add_announcement", password, title: newTitle, link: newLink, published_date: newDate },
    });
    if (!error && data?.success) {
      toast({ title: "Announcement added" });
      setNewTitle(""); setNewLink(""); setNewDate("");
      fetchCustomAnnouncements();
    } else {
      toast({ title: "Failed to add", variant: "destructive" });
    }
    setIsLoadingAnnouncements(false);
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    setIsLoadingAnnouncements(true);
    const { data, error } = await supabase.functions.invoke("admin-api", {
      body: { action: "delete_announcement", password, id },
    });
    if (!error && data?.success) {
      toast({ title: "Announcement deleted" });
      fetchCustomAnnouncements();
    } else {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
    setIsLoadingAnnouncements(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCustomAnnouncements();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const now = Date.now();
    if (lockoutUntil <= now) return;
    
    setLockoutCountdown(Math.ceil((lockoutUntil - now) / 1000));
    
    const interval = setInterval(() => {
      const currentNow = Date.now();
      if (currentNow >= lockoutUntil) {
        setLockoutUntil(0);
        setAttemptsCount(0);
        setLockoutCountdown(0);
        localStorage.removeItem("admin_login_attempts");
        localStorage.removeItem("admin_login_lockout");
        clearInterval(interval);
      } else {
        setLockoutCountdown(Math.ceil((lockoutUntil - currentNow) / 1000));
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const verifyPassword = async () => {
    const now = Date.now();
    if (lockoutUntil > now) {
      toast({ title: `Locked out. Try again in ${Math.ceil((lockoutUntil - now) / 1000)}s`, variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-api', {
        body: { action: 'verify', password },
      });
      if (error) throw error;
      if (data.success) {
        setIsAuthenticated(true);
        setAttemptsCount(0);
        localStorage.removeItem("admin_login_attempts");
        localStorage.removeItem("admin_login_lockout");
        
        // Load settings
        const { data: settingsData } = await supabase.functions.invoke('admin-api', {
          body: { action: 'get_settings', password },
        });
        if (settingsData?.settings) {
          setAdminEmail(settingsData.settings.admin_email || '');
          setAllowedRegisterNumbers(settingsData.settings.allowed_register_numbers || '');
          setRestrictLoginEnabled(settingsData.settings.restrict_login_enabled === 'true');
        }
        
        toast({ title: "Admin access granted" });
      } else {
        const nextAttempts = attemptsCount + 1;
        setAttemptsCount(nextAttempts);
        localStorage.setItem("admin_login_attempts", String(nextAttempts));
        
        if (nextAttempts >= 5) {
          const lockTime = Date.now() + 5 * 60 * 1000; // 5 minutes lockout
          setLockoutUntil(lockTime);
          setLockoutCountdown(300);
          localStorage.setItem("admin_login_lockout", String(lockTime));
          toast({ title: "Too many failed attempts. Locked out for 5 minutes.", variant: "destructive" });
        } else {
          toast({ title: `Wrong password. ${5 - nextAttempts} attempts remaining.`, variant: "destructive" });
        }
      }
    } catch {
      toast({ title: "Error verifying password", variant: "destructive" });
    }
    setIsLoading(false);
  };

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-api', {
        body: { 
          action: 'update_settings', 
          password, 
          email: adminEmail, 
          newPassword: newPassword || undefined,
          settings: {
            allowed_register_numbers: allowedRegisterNumbers,
            restrict_login_enabled: String(restrictLoginEnabled)
          }
        },
      });
      if (error) throw error;
      if (data.success) {
        if (newPassword) setPassword(newPassword);
        setNewPassword("");
        toast({ title: "Settings saved" });
      }
    } catch {
      toast({ title: "Failed to save settings", variant: "destructive" });
    }
    setIsLoading(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto border-0 shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-primary" />
              Admin Panel
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isAuthenticated ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {lockoutCountdown > 0 
                  ? `Too many failed attempts. Locked out.` 
                  : "Enter admin password to continue"}
              </p>
              {lockoutCountdown > 0 && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-2.5 rounded-lg text-center font-medium">
                  Locked out! Please try again in {lockoutCountdown} seconds.
                </div>
              )}
              <Input
                type="password"
                placeholder="Admin password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && lockoutCountdown === 0 && verifyPassword()}
                disabled={lockoutCountdown > 0 || isLoading}
              />
              <Button 
                onClick={verifyPassword} 
                disabled={isLoading || !password || lockoutCountdown > 0} 
                className="w-full"
              >
                {isLoading ? "Verifying..." : "Login"}
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Manage Custom Announcements */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Custom Announcements ({customAnnouncements.length})
                  </h3>
                </div>

                <div className="space-y-2 mb-3 bg-muted/30 p-2 rounded-md border border-border/50">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Deploy New Announcement</p>
                  <Input
                    placeholder="Announcement Title"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="text-xs h-8"
                  />
                  <Input
                    placeholder="Optional Link (ex: https://ktu.edu.in/...)"
                    value={newLink}
                    onChange={e => setNewLink(e.target.value)}
                    className="text-xs h-8"
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Optional Date (ex: 2026-03-08)"
                      value={newDate}
                      onChange={e => setNewDate(e.target.value)}
                      className="text-xs h-8"
                    />
                    <Button
                      size="sm"
                      className="h-8 whitespace-nowrap"
                      onClick={handleAddAnnouncement}
                      disabled={isLoadingAnnouncements}
                    >
                      Publish
                    </Button>
                  </div>
                </div>

                {isLoadingAnnouncements ? (
                  <p className="text-xs text-muted-foreground">Loading announcements...</p>
                ) : customAnnouncements.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No custom announcements deployed.</p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {customAnnouncements.map(a => (
                      <div key={a.id} className="flex flex-col gap-1 p-2 rounded-md bg-muted/50 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium break-all">{a.title}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:bg-destructive/10 flex-shrink-0"
                            onClick={() => handleDeleteAnnouncement(a.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        {(a.link || a.published_date) && (
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            {a.published_date && <span>{a.published_date}</span>}
                            {a.link && <a href={a.link} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate max-w-[200px]">{a.link}</a>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Email Settings */}
              <div className="space-y-3 pt-2 border-t">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Notification Email
                </h3>
                <p className="text-xs text-muted-foreground">
                  Results will be sent to this email when published (admin only).
                </p>
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                />
              </div>

              {/* Allowed Register Numbers */}
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Allowed Register Numbers
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="restrict-login"
                      checked={restrictLoginEnabled}
                      onCheckedChange={setRestrictLoginEnabled}
                    />
                    <Label htmlFor="restrict-login" className="text-xs cursor-pointer">
                      Enable
                    </Label>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Comma-separated list of register numbers allowed to login (e.g., SHR22EE026, SHR22EE027).
                </p>
                <textarea
                  placeholder="SHR22EE026, SHR22EE027"
                  disabled={!restrictLoginEnabled}
                  value={allowedRegisterNumbers}
                  onChange={e => setAllowedRegisterNumbers(e.target.value)}
                  className="w-full min-h-[60px] p-2 text-xs border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                />
              </div>

              {/* Change Password */}
              <div className="space-y-3 pt-2 border-t">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Change Admin Password
                </h3>
                <Input
                  type="password"
                  placeholder="New password (leave blank to keep)"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>

              <Button onClick={saveSettings} disabled={isLoading} className="w-full">
                {isLoading ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
