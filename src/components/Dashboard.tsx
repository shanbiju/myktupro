import { SGPACircle } from "@/components/SGPACircle";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, RefreshCw, BarChart3, Calendar } from "lucide-react";
import type { ParsedResult, ExamOption } from "@/lib/ktu-api";

// KTU grade point mapping (2019 scheme)
const GRADE_POINTS: Record<string, number> = {
  'S': 10, 'A+': 9, 'A': 8.5, 'B+': 8, 'B': 7.5,
  'C+': 7, 'C': 6.5, 'D': 6, 'P': 5, 'F': 0, 'FE': 0, 'I': 0, 'AB': 0,
};

function calculateSGPA(results: ParsedResult[]): number {
  let totalCredits = 0;
  let totalGradePoints = 0;
  for (const r of results) {
    const grade = r.grade.trim().toUpperCase();
    // Only include courses with published grades in SGPA calculation
    if (!VALID_GRADES.has(grade)) continue;
    const credits = parseFloat(r.credits) || 0;
    const gp = GRADE_POINTS[grade] ?? 0;
    totalCredits += credits;
    totalGradePoints += credits * gp;
  }
  return totalCredits > 0 ? totalGradePoints / totalCredits : 0;
}

const VALID_GRADES = new Set(['S', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'P', 'F', 'FE', 'AB']);

function hasPublishedGrade(grade: string): boolean {
  return VALID_GRADES.has(grade.trim().toUpperCase());
}

function getTotalCredits(results: ParsedResult[]): { total: number; earned: number } {
  let total = 0;
  let earned = 0;
  for (const r of results) {
    const credits = parseFloat(r.credits) || 0;
    const grade = r.grade.trim().toUpperCase();
    // Only count courses with a recognized published grade
    if (!hasPublishedGrade(grade)) continue;
    total += credits;
    if (grade !== 'F' && grade !== 'FE' && grade !== 'AB') {
      earned += credits;
    }
  }
  return { total, earned };
}

interface DashboardProps {
  results: ParsedResult[];
  examList: ExamOption[];
  selectedExam: string;
  onExamChange: (val: string) => void;
  onFetch: () => void;
  isLoading: boolean;
  isRetrying: boolean;
  onLogout: () => void;
  activeTab: 'results' | 'analysis';
  onTabChange: (tab: 'results' | 'analysis') => void;
}

export function Dashboard({
  results,
  examList,
  selectedExam,
  onExamChange,
  onFetch,
  isLoading,
  isRetrying,
  activeTab,
  onTabChange,
}: DashboardProps) {
  const sgpa = calculateSGPA(results);
  const { total, earned } = getTotalCredits(results);

  return (
    <div className="space-y-4">
      {/* SGPA & Credits Display */}
      {results.length > 0 && (
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-around gap-5">
              <div className="mx-auto">
                <SGPACircle value={sgpa} maxValue={10} label="SGPA" />
              </div>
              <div className="mx-auto">
                <SGPACircle
                  value={earned}
                  maxValue={Math.max(total, 1)}
                  label={`Total Credits: ${total}`}
                  sublabel={`✅ Earned Credits: ${earned}`}
                  size={110}
                  strokeWidth={8}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Semester Selector */}
      {examList.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Select value={selectedExam} onValueChange={onExamChange}>
                <SelectTrigger className="flex-1 h-10">
                  <SelectValue placeholder="Select semester..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {examList.map(exam => (
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={onFetch}
                disabled={!selectedExam || isLoading || isRetrying}
                size="sm"
                className="font-semibold px-4"
              >
                <RefreshCw className={`mr-1.5 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Fetch
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab switcher */}
      {results.length > 0 && (
        <div className="flex flex-wrap rounded-lg bg-muted p-1 gap-1">
          <button
            onClick={() => onTabChange('results')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all min-w-[100px] ${activeTab === 'results'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <BookOpen className="h-4 w-4" />
            Results
          </button>

          <button
            onClick={() => onTabChange('analysis')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all min-w-[100px] ${activeTab === 'analysis'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <BarChart3 className="h-4 w-4" />
            Analysis
          </button>


        </div>
      )}
    </div>
  );
}
