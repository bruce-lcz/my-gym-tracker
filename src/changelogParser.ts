import { ReleaseNote } from "./types";

/**
 * 解析 CHANGELOG.md 檔案內容，轉換成 ReleaseNote 陣列
 */
export function parseChangelog(markdown: string): ReleaseNote[] {
  const releases: ReleaseNote[] = [];

  // 用 ## 分割每個版本區塊
  const sections = markdown.split(/\n## /).filter(s => s.trim());

  sections.forEach((section, index) => {
    const lines = section.split('\n').filter(line => line.trim());

    if (lines.length === 0) return;

    // 解析版本號 (第一行，例如 "v1.2.0" 或 "# 版本紀錄\n\nv1.2.0")
    let versionLine = lines[0];
    if (versionLine.startsWith('# ')) {
      // 跳過標題行
      return;
    }

    const version = versionLine.trim();

    let date = "";
    let type: ReleaseNote["type"] = "feature";
    let title = "";
    const changes: string[] = [];

    // 解析其他欄位
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('**發布日期：**')) {
        date = line.replace('**發布日期：**', '').trim();
      } else if (line.startsWith('**類型：**')) {
        const typeStr = line.replace('**類型：**', '').trim();
        if (['feature', 'fix', 'improvement', 'breaking'].includes(typeStr)) {
          type = typeStr as ReleaseNote["type"];
        }
      } else if (line.startsWith('**標題：**')) {
        title = line.replace('**標題：**', '').trim();
      } else if (line.startsWith('- ')) {
        changes.push(line.substring(2).trim());
      }
    }

    if (version && version.startsWith('v')) {
      releases.push({
        id: `changelog-${index}`,
        version,
        date,
        title,
        type,
        changes
      });
    }
  });

  return releases;
}

import changelogRaw from '../CHANGELOG.md?raw';

/**
 * 從 import 的原始內容載入版本紀錄
 * 使用 Vite 的 ?raw後綴可以將 markdown 檔案作為字串導入
 */
export async function loadChangelog(): Promise<ReleaseNote[]> {
  try {
    return parseChangelog(changelogRaw);
  } catch (error) {
    console.warn('解析 CHANGELOG.md 失敗:', error);
    return [];
  }
}
