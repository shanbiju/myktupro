import { useState, useRef, useCallback, useEffect } from "react";
import { LoginForm } from "@/components/LoginForm";
import { ResultDisplay } from "@/components/ResultDisplay";
import { CreditAnalysis } from "@/components/CreditAnalysis";
import { AutoRetryStatus } from "@/components/AutoRetryStatus";
import { Dashboard } from "@/components/Dashboard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { StudentProfileSheet } from "@/components/StudentProfileSheet";
import { ktuHealthCheck, ktuServerHealthCheck, ktuLogin, ktuGetStudentData, type ParsedResult, type SemesterData, type StudentInfo } from "@/lib/ktu-api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ToastAction } from "@/components/ui/toast";
import { LogOut, RefreshCw, Zap, CheckCircle2, AlertTriangle, User, Circle, ExternalLink, Bell, Shield, Download } from "lucide-react";
import logoImg from "@/assets/logo.png";
import { AdminPanel } from "@/components/AdminPanel";
import { AnnouncementsPanel } from "@/components/AnnouncementsPanel";
import { fetchAllAnnouncements, announcementKey, type Announcement } from "@/lib/announcements";


const MAX_RETRIES = 30;
const RETRY_DELAY = 5000;
const ANNOUNCEMENT_POLL_INTERVAL_MS = 120000;
const SEEN_ANNOUNCEMENTS_STORAGE_KEY = "myktu_seen_announcements_v1";
const NOTIFICATION_PROMPT_STORAGE_KEY = "myktu_notification_prompted_v1";

const Index = () => {
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionCookie, setSessionCookie] = useState<string | null>(null);
  const [results, setResults] = useState<ParsedResult[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [semesters, setSemesters] = useState<Record<string, SemesterData>>({});
  const [studentInfo, setStudentInfo] = useState<StudentInfo>({});
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'results' | 'analysis'>('results');
  const [loggedInUsername, setLoggedInUsername] = useState<string>("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAnnouncementsOpen, setIsAnnouncementsOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
  const [apiStatusMessage, setApiStatusMessage] = useState("Checking My KTU Pro...");
  const [ktuServerStatus, setKtuServerStatus] = useState<"checking" | "online" | "offline">("checking");
  const [ktuServerStatusMessage, setKtuServerStatusMessage] = useState("Checking KTU Server...");

  // Auto-login retry state
  const [isLoginRetrying, setIsLoginRetrying] = useState(false);
  const [loginAttempt, setLoginAttempt] = useState(0);
  const [loginCountdown, setLoginCountdown] = useState(0);
  const loginRetryRef = useRef<number | null>(null);
  const loginCountdownRef = useRef<number | null>(null);

  // Prevent multiple concurrent logins
  const loginInProgress = useRef(false);
  const apiFailureCount = useRef(0);

  // Auto-retry state
  const [isRetrying, setIsRetrying] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const retryRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);
  const announcementPollRef = useRef<number | null>(null);
  const seenAnnouncementKeysRef = useRef<Set<string>>(new Set());
  const announcementsInitializedRef = useRef(false);

  const clearTimers = () => {
    if (retryRef.current) clearTimeout(retryRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (loginRetryRef.current) clearTimeout(loginRetryRef.current);
    if (loginCountdownRef.current) clearInterval(loginCountdownRef.current);
  };

  const stopRetrying = useCallback(() => {
    clearTimers();
    setIsRetrying(false);
    setAttempt(0);
    setCountdown(0);
    setLastError(null);
  }, []);

  const checkApiStatus = useCallback(async () => {
    const [health, ktuHealth] = await Promise.all([
      ktuHealthCheck(),
      ktuServerHealthCheck()
    ]);

    if (health.success) {
      apiFailureCount.current = 0;
      setApiStatus("online");
      setApiStatusMessage("My KTU Pro: Online");
    } else {
      apiFailureCount.current += 1;
      const errorText = (health.error || "").toLowerCase();

      if (apiFailureCount.current < 2) {
        setApiStatus("checking");
        setApiStatusMessage("Checking My KTU Pro...");
      } else {
        setApiStatus("offline");
        if (errorText.includes("cannot reach backend") || errorText.includes("failed to fetch")) {
          setApiStatusMessage("My KTU Pro: Network issue");
        } else if (errorText.includes("timed out")) {
          setApiStatusMessage("My KTU Pro: Slow");
        } else {
          setApiStatusMessage("My KTU Pro: Offline");
        }
      }
    }

    if (ktuHealth.success && ktuHealth.status === 'online') {
      setKtuServerStatus("online");
      setKtuServerStatusMessage("KTU Server: Online");
    } else {
      setKtuServerStatus("offline");
      setKtuServerStatusMessage("KTU Server: Offline / Busy");
    }
  }, []);

  const stopLoginRetrying = useCallback(() => {
    if (loginRetryRef.current) clearTimeout(loginRetryRef.current);
    if (loginCountdownRef.current) clearInterval(loginCountdownRef.current);
    setIsLoginRetrying(false);
    setLoginAttempt(0);
    setLoginCountdown(0);
    loginInProgress.current = false;
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "denied" as NotificationPermission;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        toast({
          title: "Notifications enabled",
          description: "You will receive alerts for new announcements.",
        });
      } else if (permission === "denied") {
        toast({
          title: "Notifications blocked",
          description: "Enable notifications from browser settings to receive alerts.",
          variant: "destructive",
        });
      }
      return permission;
    } catch (error) {
      console.error("Failed to request notification permission:", error);
      return "denied" as NotificationPermission;
    }
  }, [toast]);

  const showAnnouncementNotifications = useCallback((items: Announcement[]) => {
    if (items.length === 0 || typeof window === "undefined") return;

    if (!("Notification" in window) || Notification.permission !== "granted") {
      toast({
        title: `${items.length} new announcement${items.length > 1 ? "s" : ""}`,
        description: "Open the bell icon to view updates.",
      });
      return;
    }

    const latestItems = [...items].reverse();
    const preview = latestItems.slice(0, 3);

    for (const announcement of preview) {
      const targetUrl = announcement.link || announcement.attachment_url || "https://ktu.edu.in/Menu/announcements";
      const notification = new Notification("My KTU Pro", {
        body: announcement.title,
        tag: `announcement-${announcementKey(announcement)}`,
      });

      notification.onclick = () => {
        window.open(targetUrl, "_blank", "noopener,noreferrer");
        notification.close();
      };
    }

    if (latestItems.length > preview.length) {
      new Notification("My KTU Pro", {
        body: `+${latestItems.length - preview.length} more announcement(s)`,
        tag: "announcement-summary",
      });
    }
  }, [toast]);

  const pollAnnouncements = useCallback(async (isInitialLoad = false) => {
    try {
      const items = await fetchAllAnnouncements();
      if (items.length === 0) return;

      const newItems: Announcement[] = [];
      for (const item of items) {
        const key = announcementKey(item);
        if (!seenAnnouncementKeysRef.current.has(key)) {
          if (!isInitialLoad && announcementsInitializedRef.current) {
            newItems.push(item);
          }
          seenAnnouncementKeysRef.current.add(key);
        }
      }

      if (newItems.length > 0) {
        showAnnouncementNotifications(newItems);
      }

      announcementsInitializedRef.current = true;
      const storedKeys = Array.from(seenAnnouncementKeysRef.current).slice(-500);
      localStorage.setItem(SEEN_ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(storedKeys));
    } catch (error) {
      console.error("Announcement polling failed:", error);
    }
  }, [showAnnouncementNotifications]);

  useEffect(() => {
    checkApiStatus();
    const healthInterval = window.setInterval(checkApiStatus, 30000);
    return () => clearInterval(healthInterval);
  }, [checkApiStatus]);



  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "default") return;

    const alreadyPrompted = localStorage.getItem(NOTIFICATION_PROMPT_STORAGE_KEY) === "1";
    if (alreadyPrompted) return;

    localStorage.setItem(NOTIFICATION_PROMPT_STORAGE_KEY, "1");
    toast({
      title: "Enable announcement alerts",
      description: "Allow notifications to get new announcements automatically.",
      action: (
        <ToastAction
          altText="Enable notifications"
          onClick={() => {
            void requestNotificationPermission();
          }}
        >
          Enable
        </ToastAction>
      ),
    });
  }, [requestNotificationPermission, toast]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SEEN_ANNOUNCEMENTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          seenAnnouncementKeysRef.current = new Set(parsed.filter((v) => typeof v === "string"));
        }
      }
    } catch (error) {
      console.error("Failed to restore seen announcements:", error);
    }

    void pollAnnouncements(true);
    announcementPollRef.current = window.setInterval(() => {
      void pollAnnouncements(false);
    }, ANNOUNCEMENT_POLL_INTERVAL_MS);

    return () => {
      if (announcementPollRef.current) {
        clearInterval(announcementPollRef.current);
      }
    };
  }, [pollAnnouncements]);

  // Build exam list from semesters
  const examList = Object.keys(semesters)
    .sort((a, b) => {
      const na = parseInt(a.replace('S', ''));
      const nb = parseInt(b.replace('S', ''));
      return na - nb;
    })
    .map(key => ({ id: key, name: key }));

  // Update results when selected exam changes
  useEffect(() => {
    if (selectedExam && semesters[selectedExam]) {
      setResults(semesters[selectedExam].courses);
    }
  }, [selectedExam, semesters]);

  const fetchStudentData = useCallback(async (cookie: string): Promise<boolean> => {
    try {
      const data = await ktuGetStudentData(cookie);
      if (data.success && data.semesters && Object.keys(data.semesters).length > 0) {
        setSemesters(data.semesters);
        if (data.studentInfo) setStudentInfo(data.studentInfo);

        // Auto-select highest semester
        const semKeys = Object.keys(data.semesters).sort((a, b) => {
          return parseInt(b.replace('S', '')) - parseInt(a.replace('S', ''));
        });
        const topSem = semKeys[0];
        setSelectedExam(topSem);
        setResults(data.semesters[topSem].courses);
        setStatusMessage("✅ Results fetched successfully!");
        return true;
      } else {
        setLastError(data.error || "No results found");
        return false;
      }
    } catch {
      setLastError("Network error. Server may be overloaded.");
      return false;
    }
  }, []);

  const startAutoRetry = useCallback((cookie: string) => {
    setIsRetrying(true);
    setAttempt(0);
    setLastError(null);

    const tryFetch = async (currentAttempt: number) => {
      if (currentAttempt >= MAX_RETRIES) {
        stopRetrying();
        toast({ title: "Max retries reached", description: "Please try again later.", variant: "destructive" });
        return;
      }
      setAttempt(currentAttempt + 1);
      const success = await fetchStudentData(cookie);
      if (success) {
        stopRetrying();
        toast({ title: "Results loaded! 🎉" });
        return;
      }
      let remaining = RETRY_DELAY / 1000;
      setCountdown(remaining);
      countdownRef.current = window.setInterval(() => {
        remaining--;
        setCountdown(remaining);
        if (remaining <= 0 && countdownRef.current) clearInterval(countdownRef.current);
      }, 1000);
      retryRef.current = window.setTimeout(() => tryFetch(currentAttempt + 1), RETRY_DELAY);
    };
    tryFetch(0);
  }, [fetchStudentData, stopRetrying, toast]);

  const handleLogin = async (username: string, password: string, isAutoRetry = false) => {
    if (!isAutoRetry && loginInProgress.current) return;
    if (!isAutoRetry) {
      stopLoginRetrying();
      loginInProgress.current = true;
    }

    setIsLoading(true);
    setStatusMessage(isAutoRetry ? `🔄 Login retry attempt ${loginAttempt + 1}...` : "🔗 Connecting to KTU server...");
    let willRetry = false;

    try {
      if (!isAutoRetry) setStatusMessage("🔐 Authenticating credentials...");
      const result = await ktuLogin(username, password);

      if (result.success && result.sessionCookie) {
        stopLoginRetrying();
        setSessionCookie(result.sessionCookie);
        setIsLoggedIn(true);
        setLoggedInUsername(username);
        setApiStatus("online");
        setApiStatusMessage("My KTU Pro: Online");
        setStatusMessage("📥 Fetching your results...");
        toast({ title: "Login successful!" });

        const success = await fetchStudentData(result.sessionCookie);
        if (!success) startAutoRetry(result.sessionCookie);
      } else {
        const errText = (result.error || "").toLowerCase();
        const isTransient = errText.includes("timeout") || errText.includes("network") || errText.includes("fetch") || errText.includes("504") || errText.includes("failed to fetch");

        if (isTransient && (loginAttempt < MAX_RETRIES)) {
          willRetry = true;
          setIsLoginRetrying(true);
          setLoginAttempt(prev => prev + 1);
          let remaining = RETRY_DELAY / 1000;
          setLoginCountdown(remaining);
          setStatusMessage(`Login server busy. Retrying in ${remaining}s...`);

          if (loginCountdownRef.current) clearInterval(loginCountdownRef.current);
          loginCountdownRef.current = window.setInterval(() => {
            remaining--;
            setLoginCountdown(remaining);
            if (remaining > 0) {
              setStatusMessage(`Login server busy. Retrying in ${remaining}s...`);
            } else {
              if (loginCountdownRef.current) clearInterval(loginCountdownRef.current);
            }
          }, 1000);

          if (loginRetryRef.current) clearTimeout(loginRetryRef.current);
          loginRetryRef.current = window.setTimeout(() => handleLogin(username, password, true), RETRY_DELAY);
        } else {
          stopLoginRetrying();
          if (errText.includes("cannot reach backend")) {
            setApiStatus("offline");
            setApiStatusMessage("My KTU Pro: Network issue");
          }
          toast({ title: "Login failed", description: result.error || "Check your credentials", variant: "destructive" });
          setStatusMessage("");
        }
      }
    } catch {
      if (loginAttempt < MAX_RETRIES) {
        willRetry = true;
        setIsLoginRetrying(true);
        setLoginAttempt(prev => prev + 1);
        let remaining = RETRY_DELAY / 1000;
        setLoginCountdown(remaining);
        setStatusMessage(`Network error. Retrying in ${remaining}s...`);

        if (loginCountdownRef.current) clearInterval(loginCountdownRef.current);
        loginCountdownRef.current = window.setInterval(() => {
          remaining--;
          setLoginCountdown(remaining);
          if (remaining <= 0 && loginCountdownRef.current) clearInterval(loginCountdownRef.current);
        }, 1000);

        if (loginRetryRef.current) clearTimeout(loginRetryRef.current);
        loginRetryRef.current = window.setTimeout(() => handleLogin(username, password, true), RETRY_DELAY);
      } else {
        stopLoginRetrying();
        setApiStatus("offline");
        setApiStatusMessage("My KTU Pro: Network issue");
        toast({ title: "Connection error", description: "KTU server may be down", variant: "destructive" });
        setStatusMessage("");
      }
    } finally {
      if (!willRetry) {
        setIsLoading(false);
        loginInProgress.current = false;
      }
    }
  };

  const handleFetchSelectedExam = async () => {
    if (selectedExam && semesters[selectedExam]) {
      setResults(semesters[selectedExam].courses);
      toast({ title: "Results loaded! 🎉" });
    } else if (sessionCookie) {
      setIsLoading(true);
      setStatusMessage("Fetching results...");
      const success = await fetchStudentData(sessionCookie);
      if (success) {
        toast({ title: "Results loaded! 🎉" });
      } else {
        startAutoRetry(sessionCookie);
      }
      setIsLoading(false);
    }
  };

  const handleRetryNow = () => {
    clearTimers();
    if (sessionCookie) {
      const tryFetch = async () => {
        setAttempt(prev => prev + 1);
        const success = await fetchStudentData(sessionCookie);
        if (success) {
          stopRetrying();
          toast({ title: "Results loaded! 🎉" });
        } else {
          let remaining = RETRY_DELAY / 1000;
          setCountdown(remaining);
          countdownRef.current = window.setInterval(() => {
            remaining--;
            setCountdown(remaining);
            if (remaining <= 0 && countdownRef.current) clearInterval(countdownRef.current);
          }, 1000);
          retryRef.current = window.setTimeout(() => handleRetryNow(), RETRY_DELAY);
        }
      };
      tryFetch();
    }
  };

  const handleLogout = () => {
    stopRetrying();
    setIsLoggedIn(false);
    setSessionCookie(null);
    setResults([]);
    setSemesters({});
    setStudentInfo({});
    setStatusMessage("");
    setSelectedExam("");
    setActiveTab('results');
    setLoggedInUsername("");
  };

  // Auto-login if credentials are saved
  const hasAutoLoggedIn = useRef(false);
  useEffect(() => {
    if (hasAutoLoggedIn.current) return;
    const savedUser = localStorage.getItem("ktu_username");
    const savedPass = localStorage.getItem("ktu_password");
    if (savedUser && savedPass) {
      hasAutoLoggedIn.current = true;
      handleLogin(savedUser, savedPass);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => clearTimers();
  }, []);

  // Calculate total backlogs across all semesters (only explicit failures)
  const totalBacklogs = Object.values(semesters).reduce((count, sem) => {
    return count + sem.courses.filter(c => {
      const g = c.grade.trim().toUpperCase();
      return g === 'F' || g === 'FE' || g === 'AB';
    }).length;
  }, 0);

  // Only these grades count as "published result"
  const VALID_GRADES = new Set(['S', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'P', 'F', 'FE', 'AB']);

  // Calculate total credits across all semesters (only courses with published results)
  const totalCreditsAll = Object.values(semesters).reduce((acc, sem) => {
    for (const c of sem.courses) {
      const cr = parseFloat(c.credits) || 0;
      const g = c.grade.trim().toUpperCase();
      // Only count courses with a recognized published grade
      if (!VALID_GRADES.has(g)) continue;
      acc.total += cr;
      if (g !== 'F' && g !== 'FE' && g !== 'AB') {
        acc.earned += cr;
      }
    }
    return acc;
  }, { total: 0, earned: 0 });

  const apiStatusCard = (
    <Card className="border-0 shadow-sm bg-card/65 backdrop-blur-sm border-t border-white/5">
      <CardContent className="p-3 flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Circle
              className={`h-2.5 w-2.5 flex-shrink-0 ${apiStatus === "online" ? "text-success animate-pulse-slow" : apiStatus === "offline" ? "text-destructive" : "text-warning animate-pulse"}`}
              fill="currentColor"
            />
            <p className="text-xs font-medium truncate text-muted-foreground">{apiStatusMessage}</p>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <Circle
              className={`h-2.5 w-2.5 flex-shrink-0 ${ktuServerStatus === "online" ? "text-success animate-pulse-slow" : ktuServerStatus === "offline" ? "text-destructive" : "text-warning animate-pulse"}`}
              fill="currentColor"
            />
            <p className="text-xs font-medium truncate text-muted-foreground">{ktuServerStatusMessage}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-muted-foreground hover:bg-background/80" onClick={checkApiStatus}>
          Recheck
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="gradient-header shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <img src={logoImg} alt="My KTU Pro" className="h-7 w-7 sm:h-9 sm:w-9 rounded-md sm:rounded-lg" />
            <div>
              <h1 className="text-base sm:text-lg font-bold text-primary-foreground leading-tight">My KTU Pro</h1>
              <p className="text-[9px] sm:text-[10px] text-primary-foreground/70">Student Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
              asChild
            >
              <a href="https://github.com/shanbiju/score-sneak-app/releases/latest/download/app-debug.apk" target="_blank" rel="noopener noreferrer">
                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => setIsAnnouncementsOpen(true)}
            >
              <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => setIsAdminOpen(true)}
            >
              <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            {isLoggedIn && loggedInUsername && (
              <button
                type="button"
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center gap-1 sm:gap-1.5 px-1.5 py-1 sm:px-2 sm:py-1 rounded-md sm:rounded-lg bg-primary-foreground/10 mr-0.5 sm:mr-1 hover:bg-primary-foreground/20 transition-colors"
              >
                <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary-foreground/80" />
                <span className="text-[10px] sm:text-xs font-medium text-primary-foreground/90 max-w-[100px] sm:max-w-[140px] truncate">
                  {studentInfo.name || studentInfo.registerNumber || loggedInUsername}
                </span>
              </button>
            )}
            <ThemeToggle />
            {isLoggedIn && (
              <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 sm:h-9 sm:w-9 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10">
                <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 space-y-4 flex-1">
        {!isLoggedIn ? (
          <div className="max-w-md mx-auto w-full space-y-4">
            {apiStatusCard}
            {apiStatus === "offline" && (
              <Card className="border-0 shadow-md bg-destructive/10 border-destructive/20">
                <CardContent className="p-4">
                  <p className="font-semibold text-sm text-destructive">Can't connect to backend?</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    In India, supabase.co may be DNS-blocked. Fix it by changing your device DNS to:
                  </p>
                  <div className="flex gap-3 mt-2">
                    <code className="text-xs bg-background px-2 py-1 rounded font-mono">1.1.1.1</code>
                    <code className="text-xs bg-background px-2 py-1 rounded font-mono">8.8.8.8</code>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Settings → Wi-Fi → your network → DNS → set manually, or use the 1.1.1.1 app from Cloudflare.
                  </p>
                </CardContent>
              </Card>
            )}
            <Card className="border-0 shadow-md bg-secondary/60 backdrop-blur-sm">
              <CardContent className="p-4 flex items-start gap-3">
                <Zap className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-secondary-foreground">Auto-retry when server is busy</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Login once and we'll keep trying automatically during peak traffic. Keep this page open for auto-retry.
                  </p>
                </div>
              </CardContent>
            </Card>
            {(isLoading || isLoginRetrying) && statusMessage && (
              <Card className="border-0 shadow-sm mt-4">
                <CardContent className="p-3 flex items-center gap-2.5">
                  <RefreshCw className="h-4 w-4 text-primary animate-spin flex-shrink-0" />
                  <span className="text-sm font-medium">{statusMessage}</span>
                </CardContent>
              </Card>
            )}
            <LoginForm onLogin={(u, p) => handleLogin(u, p, false)} isLoading={isLoading || isLoginRetrying} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Sidebar Column (Quick Summary & Status Info) */}
            <div className="space-y-4 lg:col-span-4">
              {(studentInfo.name || studentInfo.registerNumber || loggedInUsername) && (
                <Card className="border-0 shadow-sm bg-gradient-to-br from-secondary/80 to-secondary/30 backdrop-blur-sm border border-secondary/20">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-base text-secondary-foreground">{studentInfo.name || "KTU Student"}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          {studentInfo.registerNumber || loggedInUsername}
                        </p>
                        {studentInfo.branch && (
                          <p className="text-xs text-muted-foreground mt-1 bg-background/50 inline-block px-1.5 py-0.5 rounded">
                            {studentInfo.branch}
                          </p>
                        )}
                      </div>
                      <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-background/80 hover:bg-background" onClick={() => setIsProfileOpen(true)}>
                        View Details
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 mt-4">
                      <div className="rounded-lg bg-background/70 p-2.5 border border-border/40">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Course CGPA</p>
                        <p className="text-base font-extrabold text-primary mt-0.5">{studentInfo.cgpa || 'N/A'}</p>
                      </div>
                      <div className="rounded-lg bg-background/70 p-2.5 border border-border/40">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Earned Credits</p>
                        <p className="text-base font-extrabold text-success mt-0.5">{totalCreditsAll.earned} / {totalCreditsAll.total}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {apiStatusCard}

              <AutoRetryStatus
                isRetrying={isRetrying}
                attempt={attempt}
                maxAttempts={MAX_RETRIES}
                lastError={lastError}
                countdown={countdown}
                onStop={stopRetrying}
                onRetryNow={handleRetryNow}
              />
            </div>

            {/* Main Content Column (Dashboard & Results) */}
            <div className="space-y-4 lg:col-span-8">
              {statusMessage && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-3 flex items-center gap-2.5">
                    {results.length > 0 ? (
                      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                    ) : (isLoading || isRetrying) ? (
                      <RefreshCw className="h-4 w-4 text-primary animate-spin flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium">{statusMessage}</span>
                  </CardContent>
                </Card>
              )}

              <Dashboard
                results={results}
                examList={examList}
                selectedExam={selectedExam}
                onExamChange={(val) => {
                  setSelectedExam(val);
                  if (semesters[val]) setResults(semesters[val].courses);
                }}
                onFetch={handleFetchSelectedExam}
                isLoading={isLoading}
                isRetrying={isRetrying}
                onLogout={handleLogout}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />

              {activeTab === 'results' && (
                <ResultDisplay results={results} rawHtml="" studentInfo={studentInfo} selectedSemester={selectedExam} />
              )}

              {activeTab === 'analysis' && (
                <CreditAnalysis results={results} />
              )}

              {!isLoading && !isRetrying && results.length === 0 && (
                <div className="text-center pt-2">
                  <Button onClick={() => sessionCookie && startAutoRetry(sessionCookie)} className="font-semibold shadow-sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Start Auto-Retry
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <StudentProfileSheet
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
        studentInfo={studentInfo}
        loggedInUsername={loggedInUsername}
        semesters={semesters}
        totalBacklogs={totalBacklogs}
        totalCreditsAll={totalCreditsAll}
      />

      <AdminPanel open={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
      <AnnouncementsPanel open={isAnnouncementsOpen} onClose={() => setIsAnnouncementsOpen(false)} />

      <footer className="text-center py-4">
        <p className="text-xs text-muted-foreground">Not affiliated with KTU. Use at your own risk.</p>
      </footer>
    </div>
  );
};

export default Index;
