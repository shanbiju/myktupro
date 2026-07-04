import { supabase } from "@/integrations/supabase/client";
export interface KtuLoginResult {
  success: boolean;
  sessionCookie?: string;
  error?: string;
}

export interface ParsedResult {
  courseName: string;
  code: string;
  slot?: string;
  grade: string;
  credits: string;
  earnedCredit?: string;
  examDetails?: string;
  failedMarks?: {
    obtained: string;
    total: string;
    minPercent: string;
  };
}

export interface SemesterData {
  courses: ParsedResult[];
  sgpa: string;
}

export interface StudentInfo {
  name?: string;
  registerNumber?: string;
  branch?: string;
  program?: string;
  currentSemester?: string;
  cgpa?: string;
}

export interface KtuStudentDataResult {
  success: boolean;
  studentInfo?: StudentInfo;
  semesters?: Record<string, SemesterData>;
  error?: string;
}

export interface KtuHealthResult {
  success: boolean;
  status?: "online" | "offline";
  timestamp?: string;
  error?: string;
}

async function invokeKtuProxy<T>(body: Record<string, unknown>, timeoutMs = 60000): Promise<T> {
  let timeoutId: number | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(
      () => reject(new Error("KTU request timed out. Please try again.")),
      timeoutMs
    );
  });

  try {
    // 1. Try local dev server api first
    try {
      const localPromise = fetch("/api/ktu-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(async (res) => {
        if (!res.ok) throw new Error(`Local API error ${res.status}`);
        return res.json();
      });

      const localResult = await Promise.race([localPromise, timeoutPromise]);
      return localResult as T;
    } catch (localErr) {
      console.warn("Local API proxy failed, falling back to Supabase function:", localErr);
    }

    // 2. Fallback to Supabase Function
    const invokePromise = supabase.functions.invoke<T>("ktu-proxy", { body });
    const result = await Promise.race([invokePromise, timeoutPromise]);

    if (result.error) {
      throw result.error;
    }

    return result.data as T;
  } catch (error) {
    if (error instanceof TypeError && /failed to fetch/i.test(error.message)) {
      throw new Error('Cannot reach backend. Try changing DNS to 1.1.1.1 or 8.8.8.8.');
    }
    throw error;
  } finally {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
  }
}

export async function ktuLogin(username: string, password: string): Promise<KtuLoginResult> {
  try {
    const { data: enabledData } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'restrict_login_enabled')
      .maybeSingle();

    if (enabledData?.value === 'true') {
      const { data: allowedData } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'allowed_register_numbers')
        .maybeSingle();

      if (allowedData?.value) {
        const allowedList = allowedData.value
          .split(',')
          .map((s: string) => s.trim().toUpperCase())
          .filter(Boolean);

        if (allowedList.length > 0 && !allowedList.includes(username.trim().toUpperCase())) {
          return {
            success: false,
            error: "Your register number is not allowed to login. Please contact admin."
          };
        }
      }
    }

    return await invokeKtuProxy<KtuLoginResult>({ action: 'login', username, password });
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Network error' };
  }
}

export async function ktuGetStudentData(sessionCookie: string): Promise<KtuStudentDataResult> {
  try {
    return await invokeKtuProxy<KtuStudentDataResult>({ action: 'getStudentData', sessionCookie });
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Network error' };
  }
}

export async function ktuHealthCheck(): Promise<KtuHealthResult> {
  try {
    return await invokeKtuProxy<KtuHealthResult>({ action: 'health' }, 8000);
  } catch (error) {
    return {
      success: false,
      status: 'offline',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export async function ktuServerHealthCheck(): Promise<KtuHealthResult> {
  try {
    return await invokeKtuProxy<KtuHealthResult>({ action: 'ktu_health' }, 12000);
  } catch (error) {
    return {
      success: false,
      status: 'offline',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// Legacy exports for backward compatibility
export type ExamOption = { id: string; name: string };
export type ParsedExamInfo = {
  name: string; registerNumber: string; college: string;
  branch: string; semester: string; examName: string;
  examType: string; monthYear: string;
};

export function parseResultsFromHtml(_html: string): { info: Partial<ParsedExamInfo>; results: ParsedResult[] } {
  return { info: {}, results: [] };
}
