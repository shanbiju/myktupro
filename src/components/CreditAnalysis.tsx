import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, CheckCircle2, XCircle } from "lucide-react";
import type { ParsedResult } from "@/lib/ktu-api";

const GRADE_POINTS: Record<string, number> = {
  'S': 10, 'A+': 9, 'A': 8.5, 'B+': 8, 'B': 7.5,
  'C+': 7, 'C': 6.5, 'D': 6, 'P': 5, 'F': 0, 'FE': 0, 'I': 0, 'AB': 0,
};

interface CreditAnalysisProps {
  results: ParsedResult[];
}

export function CreditAnalysis({ results }: CreditAnalysisProps) {
  if (results.length === 0) return null;

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Credit Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-2">
          {results.map((r, i) => {
            const credits = parseFloat(r.credits) || 0;
            const gp = GRADE_POINTS[r.grade.toUpperCase()] ?? 0;
            const passed = gp > 0;
            const earnedPoints = (credits * gp).toFixed(1);

            return (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className={`flex-shrink-0 ${passed ? 'text-success' : 'text-destructive'}`}>
                  {passed ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.courseName}</p>
                  <p className="text-xs text-muted-foreground">{r.code}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold">{earnedPoints}</p>
                  <p className="text-[10px] text-muted-foreground">{r.credits} cr × {gp} gp</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
