import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { SGPATrendChart } from "@/components/SGPATrendChart";
import type { SemesterData, StudentInfo } from "@/lib/ktu-api";

interface StudentProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentInfo: StudentInfo;
  loggedInUsername: string;
  semesters: Record<string, SemesterData>;
  totalBacklogs: number;
  totalCreditsAll: { total: number; earned: number };
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-border/60 last:border-none">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-right">{value || "—"}</p>
    </div>
  );
}

export function StudentProfileSheet({
  open,
  onOpenChange,
  studentInfo,
  loggedInUsername,
  semesters,
  totalBacklogs,
  totalCreditsAll,
}: StudentProfileSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Student Profile</SheetTitle>
          <SheetDescription>
            {studentInfo.registerNumber || loggedInUsername} • {studentInfo.name || "KTU Student"}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-4">
              <DetailRow label="Name" value={studentInfo.name} />
              <DetailRow label="Register Number" value={studentInfo.registerNumber || loggedInUsername} />
              <DetailRow label="Program" value={studentInfo.program} />
              <DetailRow label="Branch" value={studentInfo.branch} />
              <DetailRow label="Current Semester" value={studentInfo.currentSemester} />
              <DetailRow label="Course CGPA" value={studentInfo.cgpa} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 grid grid-cols-2 gap-3">
              <div className="rounded-md bg-secondary p-3">
                <p className="text-[10px] text-muted-foreground">Earned Credits</p>
                <p className="text-base font-bold text-success">{totalCreditsAll.earned}</p>
              </div>
              <div className="rounded-md bg-secondary p-3">
                <p className="text-[10px] text-muted-foreground">Total Credits</p>
                <p className="text-base font-bold text-primary">{totalCreditsAll.total}</p>
              </div>
              <div className="rounded-md bg-secondary p-3 col-span-2">
                <p className="text-[10px] text-muted-foreground">Backlogs</p>
                {totalBacklogs > 0 ? (
                  <p className="text-base font-bold text-destructive inline-flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    {totalBacklogs}
                  </p>
                ) : (
                  <p className="text-base font-semibold text-success inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    No Backlogs
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {Object.keys(semesters).length > 1 && <SGPATrendChart semesters={semesters} />}
        </div>
      </SheetContent>
    </Sheet>
  );
}
