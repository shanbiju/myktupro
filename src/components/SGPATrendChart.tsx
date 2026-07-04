import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import type { SemesterData } from "@/lib/ktu-api";

interface SGPATrendChartProps {
  semesters: Record<string, SemesterData>;
}

const GRADE_POINTS: Record<string, number> = {
  'S': 10, 'A+': 9, 'A': 8.5, 'B+': 8, 'B': 7.5,
  'C+': 7, 'C': 6.5, 'D': 6, 'P': 5, 'F': 0, 'FE': 0, 'I': 0, 'AB': 0,
};

function calcSGPA(courses: { credits: string; grade: string }[]): number {
  let tc = 0, tgp = 0;
  for (const c of courses) {
    const cr = parseFloat(c.credits) || 0;
    const gp = GRADE_POINTS[c.grade.toUpperCase()] ?? 0;
    tc += cr;
    tgp += cr * gp;
  }
  return tc > 0 ? tgp / tc : 0;
}

export function SGPATrendChart({ semesters }: SGPATrendChartProps) {
  const data = Object.keys(semesters)
    .sort((a, b) => parseInt(a.replace('S', '')) - parseInt(b.replace('S', '')))
    .map(key => {
      const sem = semesters[key];
      const sgpa = sem.sgpa ? parseFloat(sem.sgpa) : calcSGPA(sem.courses);
      return { semester: key, sgpa: parseFloat(sgpa.toFixed(2)) };
    })
    .filter(d => d.sgpa > 0);

  if (data.length < 2) return null;

  const avgSgpa = data.reduce((s, d) => s + d.sgpa, 0) / data.length;

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4 text-primary" />
          SGPA Trend
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis dataKey="semester" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <ReferenceLine
              y={parseFloat(avgSgpa.toFixed(2))}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="4 4"
              label={{ value: `Avg: ${avgSgpa.toFixed(2)}`, position: 'right', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            />
            <Line
              type="monotone"
              dataKey="sgpa"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              dot={{ r: 4, fill: 'hsl(var(--primary))' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
