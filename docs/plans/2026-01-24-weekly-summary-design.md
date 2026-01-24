# Training Record - Automated Weekly Summaries Design

## Overview

- **Location**: The "Weekly Summary" section is integrated at the top of the **Training Record (History)** tab.
- **Summary Cards**:
  - **Last Week Card**: Shows the completed summary for the previous Mon-Sun. Static once generated.
  - **This Week Card**: Shows the up-to-date summary for the current week. Updates automatically if new logs are detected.
  - **Action Button**: A prominent "Copy to Clipboard" button for each summary.

## 1. Logic & Automation

- **Detection Strategy**:
  - The system separates "Last Week" (fixed range) and "This Week" (current range).
  - **Last Week**: Checks if a summary exists for `[Last Monday] - [Last Sunday]`. If missing, auto-generate.
  - **This Week**: Checks the timestamp of the latest log vs. the timestamp of the existing "This Week" summary.
    - If `Latest Log Time > Summary Generation Time`: Auto-regenerate.
    - Else: Show cached summary.
- **Storage Strategy**:
  - Reuse the existing `AIAnalysis` table in Google Sheets.
  - Mark summaries using a hidden header in the content: `<!-- TYPE:SUMMARY; RANGE:2024-01-20_2024-01-26 -->`.
  - This allows the frontend to filter "Advice" vs "Summaries".

## 2. LLM Prompt Engineering

- **Input**: Raw training logs filtered by the specific date range.
- **Output Constraint**:
  - Strict instruction to output **Compact Text**.
  - Format: `[Date Range] Action Weight(Sets), Action...`
  - Example: `[01/20-01/26] 臥推 100kg(3組), 深蹲 120kg(5組), 滑輪下拉 60kg(4組)`
- **No Fluff**: Pure data summary, no "Hello" or "Good job".

## 3. Implementation Status

- [x] Create `WeeklySummary` component.
- [x] Integrate into `App.tsx` History Tab.
- [x] Logic moved from `AICoach` to `WeeklySummary`.
- [x] Auto-generation and Clipboard support.
