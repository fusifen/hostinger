/**
 * Sveltia CMS 配置自检
 * ─────────────────────────────────────────────────────────────
 * 目的：在浏览器打开后台之前，就把配置错误抓出来。
 *
 * 覆盖三类最容易犯、且只有打开后台才会暴露的错误：
 *   1. view_filters 引用了集合里不存在的字段
 *      → 报 "The view_filters option refers to a field named X"
 *   2. 使用了 Sveltia 已废弃的 widget: date
 *      → 报 "The deprecated Date field type is not supported"
 *   3. sortable_fields / summary 引用了不存在的字段
 *
 * 用法：npm run check:cms
 */
import { readFileSync } from 'node:fs';

const FILE = 'public/admin/config.yml';
const t = readFileSync(FILE, 'utf8');
const lines = t.split(/\r?\n/);

let errors = 0;
let warns = 0;

function fail(msg) {
  console.log(`  ✗ ${msg}`);
  errors++;
}
function warn(msg) {
  console.log(`  ! ${msg}`);
  warns++;
}

/* ═══════════ 基础信息 ═══════════ */

const topKeys = [...new Set(lines.filter((l) => /^[a-z_]+:/.test(l)).map((l) => l.split(':')[0]))];
const cols = [...t.matchAll(/^ {2}- name: (\w+)/gm)].map((m) => m[1]);
const backend = /name:\s*(github|gitlab|gitea|test-repo)/.exec(t);
const hasEditorial = /publish_mode:\s*editorial_workflow/.test(t);
const hasMedia = /media_folder:\s*\S+/.test(t);

console.log('');
console.log('  Sveltia CMS 配置自检');
console.log('  ' + '─'.repeat(58));
console.log('  顶层键       :', topKeys.join(', '));
console.log('  集合数量     :', cols.length);
console.log('  集合列表     :', cols.join(', '));
console.log('  认证后端     :', backend ? backend[1] : '未识别');
console.log('  编辑工作流   :', hasEditorial ? '已启用' : '未启用');
console.log('  媒体目录     :', hasMedia ? '已配置' : '未配置');
console.log('  配置总行数   :', lines.length);
console.log('  价格可视编辑 :', t.includes('改这里就改全站价格') ? '已配置提示文案' : '缺少提示');

/* ═══════════ 1. 解析每个集合的字段名 ═══════════ */

/**
 * 按行扫描，维护「当前集合」和「当前嵌套层级」。
 * 只统计各集合自身的顶层字段名（嵌套 fields 也算，因为 filter 可能指向子字段）。
 */
const collectionFields = {}; // { 集合名: Set<字段名> }
let current = null;
let inFileCollection = false;

for (const line of lines) {
  // 集合定义：2 空格缩进的 `- name:`
  const colMatch = /^ {2}- name: (\w+)/.exec(line);
  if (colMatch) {
    current = colMatch[1];
    collectionFields[current] = new Set();
    inFileCollection = false;
    continue;
  }
  // 字段定义（任意缩进，>=4 空格）——两种写法：
  //   A) 单行：`- { name: xxx, ... }` 或 `- name: xxx, label: ...`
  //   B) 多行：`- name: xxx` 独占一行，后续属性各自缩进
  if (current) {
    const oneLine = /^\s{4,}- \{?\s*name:\s*(\w+)\s*,/.exec(line);
    if (oneLine) {
      collectionFields[current].add(oneLine[1]);
      continue;
    }
    const standalone = /^\s{4,}- name:\s*(\w+)\s*$/.exec(line);
    if (standalone) collectionFields[current].add(standalone[1]);
  }
}

/* ═══════════ 2. 校验 view_filters 的字段引用 ═══════════ */

console.log('');
console.log('  ── view_filters 字段引用 ──');

let filterCount = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!/^\s+view_filters:/.test(line)) continue;

  // 找到这段 view_filters 属于哪个集合（向上找最近的 `- name:`）
  let owner = null;
  for (let j = i; j >= 0; j--) {
    const m = /^ {2}- name: (\w+)/.exec(lines[j]);
    if (m) {
      owner = m[1];
      break;
    }
  }
  if (!owner) continue;

  // 往下读条目，直到缩进变浅
  for (let k = i + 1; k < lines.length; k++) {
    const l = lines[k];
    if (/^\s{0,4}\S/.test(l) && !/^\s{5,}/.test(l)) break;

    // 形式 A：- { label: x, field: y, pattern: z }
    const inline = /-\s*\{\s*label:\s*([^,}]+),\s*field:\s*(\w+)/.exec(l);
    // 形式 B：- label: x \n field: y
    const labelOnly = /^\s+-\s*label:\s*(.+?)\s*$/.exec(l);
    const fieldOnly = /^\s+field:\s*(\w+)\s*$/.exec(l);

    let label = null;
    let field = null;
    if (inline) {
      label = inline[1].trim();
      field = inline[2];
    } else if (labelOnly) {
      label = labelOnly[1];
      // 下一行找 field
      const next = /^\s+field:\s*(\w+)\s*$/.exec(lines[k + 1] ?? '');
      if (next) field = next[1];
    } else if (fieldOnly && label === null) {
      continue;
    }

    if (!label || !field) continue;
    filterCount++;
    const known = collectionFields[owner];
    if (known && !known.has(field)) {
      fail(
        `${owner} 集合的 view_filter「${label}」引用了不存在的字段 "${field}"\n` +
          `      该集合可用字段：${[...known].join(', ')}`
      );
    }
  }
}
console.log(`  已检查 ${filterCount} 个 view_filter`);

/* ═══════════ 3. 校验废弃的 widget ═══════════ */

console.log('');
console.log('  ── 废弃 widget 检查 ──');

const deprecatedHits = [];
lines.forEach((l, i) => {
  if (/widget:\s*date\b/.test(l)) deprecatedHits.push(i + 1);
  if (/widget:\s*string\b.*\bwidget:/.test(l)) deprecatedHits.push(i + 1);
});
if (deprecatedHits.length) {
  for (const ln of deprecatedHits) {
    fail(
      `第 ${ln} 行使用了废弃的 "widget: date"\n` +
        `      Sveltia 要求改为 "widget: datetime, type: date"`
    );
  }
} else {
  console.log('  ✓ 无废弃 widget（date / string 均已规避）');
}

/* ═══════════ 4. 校验 sortable_fields / summary 引用 ═══════════ */

console.log('');
console.log('  ── sortable_fields 引用 ──');

let sortCount = 0;
lines.forEach((l, i) => {
  const m = /^\s+sortable_fields:\s*\[(.+)\]/.exec(l);
  if (!m) return;

  let owner = null;
  for (let j = i; j >= 0; j--) {
    const c = /^ {2}- name: (\w+)/.exec(lines[j]);
    if (c) {
      owner = c[1];
      break;
    }
  }
  if (!owner) return;

  const known = collectionFields[owner];
  const fields = m[1]
    .split(',')
    .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);

  for (const f of fields) {
    sortCount++;
    // pricing.promoPrice 这类点号路径，只校验第一段
    const root = f.split('.')[0];
    if (known && !known.has(root)) {
      fail(`${owner} 集合的 sortable_fields 引用了不存在的字段 "${f}"`);
    }
  }
});
console.log(`  已检查 ${sortCount} 个字段引用`);

/* ═══════════ 5. summary 模板变量 ═══════════ */

console.log('');
console.log('  ── summary 模板 ──');

let summaryCount = 0;
lines.forEach((l, i) => {
  const m = /^\s+summary:\s*['"]?(.+?)['"]?\s*$/.exec(l);
  if (!m) return;
  let owner = null;
  for (let j = i; j >= 0; j--) {
    const c = /^ {2}- name: (\w+)/.exec(lines[j]);
    if (c) {
      owner = c[1];
      break;
    }
  }
  const known = owner ? collectionFields[owner] : null;
  if (!known) return;
  // 提取 {{...}} 里的变量
  for (const v of m[1].matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)) {
    summaryCount++;
    const root = v[1].split('.')[0];
    if (root === 'fields') continue; // {{fields.xxx}} 是合法间接引用
    if (!known.has(root)) {
      warn(`${owner} 集合的 summary 引用了字段 "${v[1]}"（若确为合法模板可忽略）`);
    }
  }
});
console.log(`  已检查 ${summaryCount} 个模板变量`);

/* ═══════════ 汇总 ═══════════ */

console.log('');
console.log('  ' + '─'.repeat(58));
if (errors === 0) {
  console.log(`  ✓ 配置可用${warns ? `（${warns} 条提示）` : ''}`);
  process.exit(0);
} else {
  console.log(`  ✗ 发现 ${errors} 个会导致后台报错的问题，请先修复`);
  process.exit(1);
}
