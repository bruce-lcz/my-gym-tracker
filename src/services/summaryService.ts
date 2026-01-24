import { TrainingLog, AIAnalysis, User } from "../types";

export interface SummaryMeta {
    type: "summary";
    rangeParams: string; // "YYYY-MM-DD_YYYY-MM-DD"
    rangeStart: string;
    rangeEnd: string;
    generatedAt: number;
}

export const SUMMARY_MARKER_PREFIX = "<!-- TYPE:SUMMARY";

/**
 * Parses the hidden metadata from an AI analysis content string.
 * Returns null if it's not a summary or format is invalid.
 */
export function parseSummaryMeta(content: string): SummaryMeta | null {
    if (!content.startsWith(SUMMARY_MARKER_PREFIX)) return null;

    try {
        const endIndex = content.indexOf("-->");
        if (endIndex === -1) return null;

        const metaString = content.substring(SUMMARY_MARKER_PREFIX.length, endIndex);
        // data format example: "; RANGE:2024-01-20_2024-01-26; GEN:1700000000000"

        const rangeMatch = metaString.match(/RANGE:([\d-]+)_([\d-]+)/);
        const genMatch = metaString.match(/GEN:(\d+)/);

        if (rangeMatch && genMatch) {
            return {
                type: "summary",
                rangeParams: `${rangeMatch[1]}_${rangeMatch[2]}`,
                rangeStart: rangeMatch[1],
                rangeEnd: rangeMatch[2],
                generatedAt: parseInt(genMatch[1], 10)
            };
        }
        return null;
    } catch (e) {
        return null;
    }
}

/**
 * Generates the hidden marker string to prepend to LLM output.
 */
export function generateSummaryMarker(startDate: string, endDate: string): string {
    return `${SUMMARY_MARKER_PREFIX}; RANGE:${startDate}_${endDate}; GEN:${Date.now()} -->\n\n`;
}

/**
 * Get the date range for "This Week" (Monday to Today/Sunday)
 * and "Last Week" (Last Monday to Last Sunday).
 */
export function getWeekRanges() {
    const today = new Date();
    const day = today.getDay(); // 0 is Sunday
    const diffToMon = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday

    // This Week Start (Monday)
    const thisMon = new Date(today);
    thisMon.setDate(diffToMon);
    thisMon.setHours(0, 0, 0, 0);

    // This Week End (Sunday)
    const thisSun = new Date(thisMon);
    thisSun.setDate(thisMon.getDate() + 6);
    thisSun.setHours(23, 59, 59, 999);

    // Last Week Start
    const lastMon = new Date(thisMon);
    lastMon.setDate(thisMon.getDate() - 7);

    // Last Week End
    const lastSun = new Date(thisMon);
    lastSun.setDate(thisMon.getDate() - 1);
    lastSun.setHours(23, 59, 59, 999);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    return {
        thisWeek: {
            start: formatDate(thisMon),
            end: formatDate(thisSun),
            startObj: thisMon,
            endObj: thisSun
        },
        lastWeek: {
            start: formatDate(lastMon),
            end: formatDate(lastSun),
            startObj: lastMon,
            endObj: lastSun
        }
    };
}

/**
 * Filter logs by date range (inclusive strings YYYY-MM-DD)
 */
export function filterLogsByRange(logs: TrainingLog[], start: string, end: string): TrainingLog[] {
    return logs.filter(log => {
        return log.currentDate >= start && log.currentDate <= end;
    });
}

/**
 * Determine if we need to generate/regenerate a summary.
 */
export function shouldGenerateSummary(
    targetRangeStart: string,
    targetRangeEnd: string,
    existingAnalyses: AIAnalysis[],
    latestLogDateInThisRange?: string
): { shouldRun: boolean; reason?: string } {

    // 1. Find existing summary for this specific range
    const rangeKey = `${targetRangeStart}_${targetRangeEnd}`;
    const existing = existingAnalyses.find(a => {
        const meta = parseSummaryMeta(a.content);
        return meta && meta.rangeParams === rangeKey;
    });

    // 2. If no summary exists, we validly run (assuming there are logs, which the caller should check)
    if (!existing) {
        return { shouldRun: true, reason: "No existing summary for this range" };
    }

    // 3. If summary exists, check if it's stale
    // We only care about staleness for "This Week" usually, but the logic can be generic:
    // If the latest log inside this range is NEWER than the generation time of the summary.

    const meta = parseSummaryMeta(existing.content);
    if (!meta) return { shouldRun: true, reason: "Corrupted metadata" }; // Should be caught above

    if (latestLogDateInThisRange) {
        // Since logs only have "YYYY-MM-DD", strict comparison is hard.
        // Rule: If we have logs today, and the summary was generated BEFORE today's logs were likely added...
        // Better Rule from design:
        // "Latest Log Time > Summary Time" -> Problem: Log only has date.
        // Refined Rule:
        // If `latestLogDateInThisRange` == `today` AND `meta.generatedAt` was earlier than... some threshold?
        // Actually, let's keep it simple:
        // If we have a log ID that is NOT in the previous data... (Hard to track)

        // Let's use the Design Document Logic:
        // "This Week": If Latest Log Date >= Summary Generation Date (Day comparison)

        // We will pass the full TrainingLog object or just use date.
        // If the latest log date is > the day the summary was generated?
        // No, if I trained today (2025-01-24), and summary was generated yesterday (2025-01-23), I need update.
        // If I trained today, and summary was generated today... maybe I added MORE logs today?
        // Safe bet: If summary is from *before today*, and current date is inside range, regenerate?

        // Let's assume the caller handles the "latest log" timestamp check if possible,
        // or we just compare dates.

        const genDate = new Date(meta.generatedAt).toISOString().split('T')[0];
        if (latestLogDateInThisRange > genDate) {
            return { shouldRun: true, reason: `New logs since summary (${latestLogDateInThisRange} > ${genDate})` };
        }

        // If dates are equal (summary generated today, last log is today),
        // we might want to check hours if we had CreatedAt in logs.
        // Our TrainingLog has `createdAt` string!
    }

    return { shouldRun: false };
}
