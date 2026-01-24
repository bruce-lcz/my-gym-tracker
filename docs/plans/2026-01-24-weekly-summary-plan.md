# Implementation Plan: Automated Weekly Training Summaries

## Todo

- [ ] **Infrastructure & Types** <!-- id: 0 -->
  - [ ] Update `src/types.ts`: Check if `AIAnalysis` needs explicit type field (we decided to use marker in content, so maybe just strict typing for the marker logic). <!-- id: 1 -->
  - [ ] Update `src/AICoach.tsx`: Import necessary icons (`Copy`, etc.) and `Tabs` logic triggers. <!-- id: 2 -->
- [ ] **Logic Implementation (SummaryManager)** <!-- id: 3 -->
  - [ ] Create `src/services/summaryService.ts` to encapsulate the "Should I run?" logic. <!-- id: 4 -->
  - [ ] Implement `getWeekRange(date)` helper. <!-- id: 5 -->
  - [ ] Implement `checkSummaryNeeded(user, logs, type)` logic. <!-- id: 6 -->
- [ ] **LLM Integration update** <!-- id: 7 -->
  - [ ] Update `src/AICoach.tsx` `analyzeWithAI` to support a mode/type argument (`"advice" | "summary"`). <!-- id: 8 -->
  - [ ] Implement the specific prompt for "Compact Summary" in `AICoach.tsx` (or extracted service). <!-- id: 9 -->
- [ ] **UI Implementation** <!-- id: 10 -->
  - [ ] Refactor `src/AICoach.tsx` to add Tabs (`Coach Advice` | `Weekly Summaries`). <!-- id: 11 -->
  - [ ] Build the `WeeklySummaries` view component (Cards for Last Week / This Week). <!-- id: 12 -->
  - [ ] Implement `CopyToClipboard` functionality. <!-- id: 13 -->
- [ ] **Integration & Testing** <!-- id: 14 -->
  - [ ] Wire up the "Auto-run" effect on tab mount. <!-- id: 15 -->
  - [ ] Verify "Last Week" generates once. <!-- id: 16 -->
  - [ ] Verify "This Week" updates only on new data. <!-- id: 17 -->
