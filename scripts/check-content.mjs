#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════
 *  内容发布前自检
 * ═══════════════════════════════════════════════════════════════
 *
 *  检查项：
 *    1. 骨架文件是否残留占位符（`待实测` / `待判定` / `（写完之后回来补…`）
 *    2. 含占位符的文章是否仍标记为 draft: true
 *       —— 若占位符还在但 draft 被去掉了，说明是「未完成就误发布」，报错
 *    3. 每篇文章是否都有 affiliateNotice 字段（合规要求）
 *    4. 每篇文章是否有 faqs 数组（结构化数据需要）
 *
 *  用法：
 *    npm run check:content
 *    退出码 0 = 全部通过；1 = 有阻断性问题
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ARTICLES_DIR = 'src/content/articles';

/** 会被视为「内容未完成」的占位标记 */
const PLACEHOLDERS = [
  '待实测',
  '待判定',
  '（写完之后回来补',
  '（诚实写出边界',
  '（把下面的问题按主题分组',
  '（每步都要写：做什么',
];

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(md|mdx)$/.test(e.name)) out.push(p);
  }
  return out;
}

/** 粗略解析 frontmatter（不引 YAML 依赖，够用即可） */
function parseFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!m) return { fm: '', body: text };
  return { fm: m[1], body: text.slice(m[0].length) };
}

const files = walk(ARTICLES_DIR);
const errors = [];
const warnings = [];
let draftCount = 0;
let publishedCount = 0;

for (const file of files) {
  const raw = readFileSync(file, 'utf8');
  const { fm, body } = parseFrontmatter(raw);
  const rel = file.replace(/\\/g, '/');
  const isDraft = /^draft:\s*true\s*$/m.test(fm);
  const hasPlaceholder = PLACEHOLDERS.some((p) => body.includes(p));

  if (isDraft) draftCount++;
  else publishedCount++;

  // 阻断性问题：占位符还在，却不是草稿 → 会被发布出去
  if (hasPlaceholder && !isDraft) {
    const found = PLACEHOLDERS.filter((p) => body.includes(p));
    errors.push(`${rel}\n    含占位符但未标 draft: ${found.join(' / ')}`);
  }

  // 合规：联盟披露字段
  if (!/^affiliateNotice:/m.test(fm)) {
    warnings.push(`${rel} — 缺少 affiliateNotice 字段（联盟合规要求）`);
  }

  // 结构化数据：FAQ
  if (!/^faqs:/m.test(fm)) {
    warnings.push(`${rel} — 缺少 faqs 数组（影响 FAQPage 富摘要）`);
  }
}

console.log('');
console.log('  内容发布前自检');
console.log('  ' + '─'.repeat(56));
console.log(`  文章总数    : ${files.length}`);
console.log(`  草稿        : ${draftCount}`);
console.log(`  已发布      : ${publishedCount}`);
console.log('');

if (errors.length > 0) {
  console.log(`  ✗ 阻断性问题 (${errors.length})：`);
  for (const e of errors) console.log(`    ${e}`);
  console.log('');
}

if (warnings.length > 0) {
  console.log(`  ⚠ 提示 (${warnings.length})：`);
  for (const w of warnings.slice(0, 12)) console.log(`    ${w}`);
  if (warnings.length > 12) console.log(`    …还有 ${warnings.length - 12} 条`);
  console.log('');
}

if (errors.length === 0) {
  console.log('  ✓ 无阻断性问题，可以构建');
  console.log('');
  process.exit(0);
} else {
  console.log('  ✗ 请先修复上述阻断性问题');
  console.log('');
  process.exit(1);
}
