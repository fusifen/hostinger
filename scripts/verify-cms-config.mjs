import { readFileSync } from 'node:fs';

const t = readFileSync('public/admin/config.yml', 'utf8');
const lines = t.split(/\r?\n/);

const topKeys = [...new Set(lines.filter((l) => /^[a-z_]+:/.test(l)).map((l) => l.split(':')[0]))];
const cols = [...t.matchAll(/^ {2}- name: (\w+)/gm)].map((m) => m[1]);
const backend = /name:\s*(github|gitlab|gitea|test-repo)/.exec(t);
const hasEditorial = /publish_mode:\s*editorial_workflow/.test(t);
const hasMedia = /media_folder:\s*\S+/.test(t);

console.log('顶层键       :', topKeys.join(', '));
console.log('集合数量     :', cols.length);
console.log('集合列表     :', cols.join(', '));
console.log('认证后端     :', backend ? backend[1] : '未识别');
console.log('编辑工作流   :', hasEditorial ? '已启用' : '未启用');
console.log('媒体目录     :', hasMedia ? '已配置' : '未配置');
console.log('配置总行数   :', lines.length);

// 检查价格字段的提示是否到位
const priceHint = t.includes('改这里就改全站价格');
console.log('价格可视编辑 :', priceHint ? '已配置提示文案' : '缺少提示');
