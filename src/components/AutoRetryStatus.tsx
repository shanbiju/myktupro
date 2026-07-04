import { RefreshCw, XCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";


interface AutoRetryStatusProps {
  isRetrying: boolean;
  attempt: number;
  maxAttempts: number;
  lastError: string | null;
  countdown: number;
  onStop: () => void;
  onRetryNow: () => void;
}

export function AutoRetryStatus({
  isRetrying,
  attempt,
  maxAttempts,
  lastError,
  countdown,
  onStop,
  onRetryNow,
}: AutoRetryStatusProps) {
  if (!isRetrying) return null;

  const progress = ((attempt) / maxAttempts) * 100;

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <div className="h-1 bg-muted">
        <div 
          className="h-full gradient-primary transition-all duration-300" 
          style={{ width: `${progress}%` }} 
        />
      </div>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 text-primary animate-spin-slow" />
            <div>
              <p className="font-semibold text-sm">
                Auto-retrying... Attempt {attempt}/{maxAttempts}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Next retry in {countdown}s
              </p>
              {lastError && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  {lastError}
                </p>
              )}
            </div>
          </div>
          <div className="flex w-full sm:w-auto gap-2">
            <Button size="sm" variant="outline" onClick={onRetryNow} className="text-xs flex-1 sm:flex-none">
              Try Now
            </Button>
            <Button size="sm" variant="destructive" onClick={onStop} className="text-xs flex-1 sm:flex-none">
              Stop
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
