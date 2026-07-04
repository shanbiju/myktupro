import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertTriangle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { ParsedResult, SemesterData } from "@/lib/ktu-api";

interface ExamEntry {
  id: string;
  date: string;
  day: string;
  semester: string;
  scheme: string;
  slot: string;
  session: string;
  subject_code?: string;
}

interface UpcomingExamsProps {
  semesters: Record<string, SemesterData>;
  currentSemester?: string;
}

export function UpcomingExams({ semesters, currentSemester }: UpcomingExamsProps) {
  const [exams, setExams] = useState<ExamEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get failed subjects across all semesters
  const failedSubjects: Array<{ semester: string; code: string; courseName: string }> = [];
  for (const [semKey, semData] of Object.entries(semesters)) {
    for (const course of semData.courses) {
      const g = course.grade.trim().toUpperCase();
      if (g === 'F' || g === 'FE' || g === 'AB') {
        failedSubjects.push({ semester: semKey, code: course.code, courseName: course.courseName });
      }
    }
  }

  // Map failed subjects for quick lookup
  const failedSubjectCodes = new Set(failedSubjects.map(f => f.code.trim().toUpperCase()));
  const failedSemesters = new Set(failedSubjects.map(f => f.semester));

  useEffect(() => {
    const fetchExams = async () => {
      setIsLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('exam_timetable')
        .select('*')
        .gte('date', today)
        .order('date', { ascending: true });

      if (!error && data) {
        setExams(data as ExamEntry[]);
      }
      setIsLoading(false);
    };
    fetchExams();
  }, []);

  // Filter exams:
  // 1. If exam has subject_code, MUST match a failed subject code.
  // 2. If it matches currentSemester, include it.
  // 3. Fallback: If it matches a failed semester (legacy), include it.
  const relevantExams = exams.filter(e => {
    if (e.subject_code && e.subject_code.trim()) {
      return failedSubjectCodes.has(e.subject_code.trim().toUpperCase());
    }
    if (currentSemester && e.semester === currentSemester) {
      return true;
    }
    return failedSemesters.has(e.semester);
  });

  if (failedSubjects.length === 0 && !currentSemester) return null;
  if (isLoading) return null;
  if (relevantExams.length === 0 && exams.length === 0) return null;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getDaysUntil = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-5 w-5 text-warning" />
          Upcoming Exams
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">
          Showing exams for current semester and backlogs
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {relevantExams.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">
            No upcoming exams found for your backlog semesters. Check back later.
          </p>
        ) : (
          <div className="space-y-2">
            {relevantExams.map((exam) => {
              const daysUntil = getDaysUntil(exam.date);
              const isUrgent = daysUntil <= 7;
              return (
                <div
                  key={exam.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isUrgent ? 'bg-destructive/10' : 'bg-muted/50'
                    }`}
                >
                  <div className="flex-shrink-0">
                    {isUrgent ? (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">
                        {exam.subject_code ? exam.subject_code : exam.semester}
                      </Badge>
                      <span className="text-xs font-medium">
                        {formatDate(exam.date)}
                      </span>
                      {exam.day && (
                        <span className="text-[10px] text-muted-foreground">({exam.day})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {exam.slot && (
                        <span className="text-[10px] text-muted-foreground">Slot {exam.slot}</span>
                      )}
                      {exam.session && (
                        <span className="text-[10px] text-muted-foreground">
                          {exam.session === 'FN' ? '🌅 Forenoon' : '🌆 Afternoon'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-xs font-bold ${isUrgent ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil}d`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Show failed subjects summary */}
        <div className="mt-3 pt-3 border-t">
          <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">
            Failed Subjects ({failedSubjects.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {failedSubjects.map((f, i) => (
              <Badge key={i} variant="destructive" className="text-[10px] font-normal">
                {f.code} ({f.semester})
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
