#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════
 *  内容蓝图生成器 —— 批量产出长尾关键词文章的 Markdown 骨架
 * ═══════════════════════════════════════════════════════════════
 *
 *  用法：
 *    npm run gen:outline                    # 用内置蓝图批量生成（跳过已存在的文件）
 *    npm run gen:outline -- --force          # 覆盖已存在的文件
 *    npm run gen:outline -- --dry            # 只打印将要生成什么，不写文件
 *    npm run gen:outline -- --list           # 列出蓝图计划，不写文件
 *
 *  设计意图：
 *    写"内容工厂"的风险不是产能不足，而是产出同质化的垃圾页。
 *    所以本脚本只生成 **带具体数据锚点与立场的小节骨架**，
 *    每个骨架都预留了「实测数据 / 反常识结论 / 决策建议」三种钩子，
 *    让写作变成"填空 + 补数据"而不是"从零想选题"。
 *
 *    ⚠️ 生成的是草稿：frontmatter 里 draft: true，
 *       Sveltia 后台会把它标成草稿状态，必须人工补完正文后才能发布。
 */

import { mkdir, writeFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ARTICLES_DIR = join(ROOT, 'src', 'content', 'articles');

const argv = process.argv.slice(2);
const FORCE = argv.includes('--force');
const DRY = argv.includes('--dry');
const LIST_ONLY = argv.includes('--list');

/* ═══════════════════════════════════════════════════════════════
 *  1. 关键词矩阵 —— 决定"写什么"
 *     每个主题包含：分类、主关键词、长尾变体、目标读者意图
 * ═══════════════════════════════════════════════════════════════ */

const THEMES = [
  /* ── 评测类：承接「XX怎么样 / XX值得买吗」型搜索 ── */
  {
    category: 'reviews',
    slug: 'hostinger-wordpress-hosting-review',
    title: 'Hostinger WordPress 主机评测：用它跑 WooCommerce 会不会翻车？',
    keyword: 'Hostinger WordPress主机',
    intent: 'commercial',
    audience: '准备用 WordPress 建站的个人站长与小型电商',
    angle: '不止跑博客 —— 直接上 WooCommerce 压测，看它在有订单压力时的表现',
    longtails: [
      'Hostinger WordPress 主机怎么样',
      'Hostinger 跑 WooCommerce 够用吗',
      'Hostinger WordPress 主机速度实测',
      'Hostinger 建 WordPress 站要多少钱',
    ],
    faqs: [
      ['Hostinger 支持一键安装 WordPress 吗？', '支持。hPanel 内置 WordPress 一键安装，从下单到进入后台一般 3-5 分钟。'],
      ['WordPress 站点用 Premium 还是 Business？', '纯内容站 Premium 够用；如果装 WooCommerce 且有一定订单量，建议直接上 Business，它带每日备份与对象缓存。'],
      ['迁移已有 WordPress 站要额外付费吗？', 'Hostinger 提供免费迁移服务，也可以按我们的迁移教程自助操作。'],
    ],
  },
  {
    category: 'reviews',
    slug: 'hostinger-cloud-hosting-review',
    title: 'Hostinger Cloud Hosting 值不值：多花的钱买到了什么？',
    keyword: 'Hostinger Cloud Hosting',
    intent: 'commercial',
    audience: '月访问量 5 万以上、正在考虑从共享升配的站长',
    angle: '把 Cloud 与共享主机放同一份压测脚本下对比，量化"资源隔离"到底值多少钱',
    longtails: [
      'Hostinger Cloud Hosting 值得买吗',
      'Hostinger 云主机和虚拟主机区别',
      'Hostinger Cloud 性能实测',
      'Hostinger 云主机适合什么网站',
    ],
    faqs: [
      ['Cloud Hosting 和 VPS 哪个更合适？', '要省心、不想碰命令行选 Cloud；要完整 root 权限与高度自定义选 VPS。'],
      ['Cloud Hosting 会自动扩容吗？', '会在资源池范围内动态分配，但存在上限。真正的突发流量仍建议配合 CDN。'],
      ['从共享主机升级 Cloud 要重新部署吗？', '可以通过官方迁移工具平滑迁移，站点数据不会丢失。'],
    ],
  },

  /* ── 对比类：承接「A vs B」高转化搜索 ── */
  {
    category: 'comparison',
    slug: 'hostinger-vs-cloudways',
    title: 'Hostinger vs Cloudways：预算有限时到底该选谁？',
    keyword: 'Hostinger 和 Cloudways 对比',
    intent: 'commercial',
    audience: '在"便宜够用"与"专业托管"之间纠结的中阶用户',
    angle: '不谈参数跑分，直接算三年总持有成本 + 各自的时间成本',
    longtails: [
      'Hostinger 和 Cloudways 哪个好',
      'Hostinger Cloudways 价格对比',
      'Cloudways 值不值那个价',
      '新手选 Hostinger 还是 Cloudways',
    ],
    faqs: [
      ['Cloudways 比 Hostinger 强在哪？', '主要在于云厂商底座（AWS/GCP/DO）与更细粒度的服务器控制，但价格与上手门槛也更高。'],
      ['预算有限怎么选？', '如果是首个站点或预算敏感，Hostinger 的长期付均价明显更低；等流量与收入稳定后再考虑升级。'],
    ],
  },
  {
    category: 'comparison',
    slug: 'hostinger-vs-namecheap',
    title: 'Hostinger vs Namecheap：同样便宜，差别在哪？',
    keyword: 'Hostinger Namecheap 对比',
    intent: 'commercial',
    audience: '对价格敏感、同时需要域名与主机的用户',
    angle: '同价位段的隐性成本对比 —— 续费价、免费权益缩水程度、迁移难度',
    longtails: [
      'Hostinger 和 Namecheap 哪个便宜',
      'Namecheap 主机值得买吗',
      '便宜主机怎么选不踩坑',
    ],
    faqs: [
      ['两家谁的续费涨幅更小？', '两家首购折扣都很深，续费都会回归标准价。建议购买前直接对比续费价而非促销价。'],
      ['域名在哪家买更划算？', '域名首年通常都有优惠，差异主要在续费与隐私保护是否收费。'],
    ],
  },

  /* ── 教程类：承接「怎么做」型搜索，转化意图温和但流量大 ── */
  {
    category: 'tutorials',
    slug: 'hostinger-email-setup-guide',
    title: 'Hostinger 企业邮箱配置全流程：从 DNS 到收发验证',
    keyword: 'Hostinger 企业邮箱设置',
    intent: 'informational',
    audience: '买了含免费邮箱的套餐、但不会配置的站长',
    angle: '完整走一遍 SPF / DKIM / DMARC 配置并验证，避免邮件进垃圾箱',
    longtails: [
      'Hostinger 邮箱怎么设置',
      'Hostinger 免费企业邮箱配置',
      '域名邮箱 SPF DKIM 怎么配',
      '企业邮箱发信进垃圾箱怎么办',
    ],
    faqs: [
      ['Hostinger 的免费邮箱能用自己域名吗？', '可以，套餐内提供的企业邮箱支持绑定你自己的域名。'],
      ['邮箱收不到信怎么排查？', '优先检查 MX 记录是否生效，再验证 SPF/DKIM/DMARC 三项 DNS 记录。'],
      ['免费额度和付费邮箱差在哪？', '主要在存储容量、账号数量与高级反垃圾能力上。'],
    ],
    // 注意：语言标识必须是 Shiki 内置语言；DNS 区域文件用 ini 代替
    codeBlocks: ['ini', 'bash'],
  },
  {
    category: 'tutorials',
    slug: 'hostinger-cdn-setup',
    title: '给 Hostinger 站点接上 CDN：国内访问提速的实操方案',
    keyword: 'Hostinger CDN 加速',
    intent: 'informational',
    audience: '站点面向国内用户、觉得加载慢的站长',
    angle: '上线前后各测一轮 TTFB，用数据证明 CDN 带来的真实收益',
    longtails: [
      'Hostinger 怎么加速',
      'Hostinger 国内访问慢怎么办',
      '网站接 CDN 教程',
      'Hostinger CDN 配置',
    ],
    faqs: [
      ['Hostinger 自带 CDN 吗？', '部分套餐包含 Cloudflare 集成，可在 hPanel 内一键开启。'],
      ['接 CDN 会影响 HTTPS 吗？', '正确配置下不会。注意 SSL 模式选择"完全（严格）"以避免回源异常。'],
      ['CDN 对 SEO 有帮助吗？', '间接有帮助 —— 加载速度是排名因素之一，但不要指望接完 CDN 排名立刻上升。'],
    ],
    codeBlocks: ['bash'],
  },
  {
    category: 'tutorials',
    slug: 'hostinger-multisite-management',
    title: '在一个 Hostinger 账户里管理 10 个站点：目录规划与权限隔离',
    keyword: 'Hostinger 多站点管理',
    intent: 'informational',
    audience: '接单建站的工作室、运营多个站点的站长',
    angle: '用 Business 套餐的 100 站点额度做成本拆解，并给出目录与权限的组织方案',
    longtails: [
      'Hostinger 可以建几个网站',
      'Hostinger 多站点怎么管理',
      '主机多站点成本优化',
      '建站工作室主机选型',
    ],
    faqs: [
      ['一个套餐能建几个网站？', '因套餐而异：Single 仅 1 个，Premium 25 个，Business 达 100 个。'],
      ['多站点会互相拖慢吗？', '共享套餐下资源是共用的，建议把高流量站点放在独立套餐或 VPS 上。'],
    ],
  },

  /* ── 优惠类：转化意图最强，用于承接活动期流量 ── */
  {
    category: 'deals',
    slug: 'hostinger-black-friday-deals',
    title: 'Hostinger 黑五优惠怎么买最省：套餐与时长组合测算',
    keyword: 'Hostinger 黑五优惠',
    intent: 'transactional',
    audience: '等大促下单的价格敏感型用户',
    angle: '把不同套餐 × 不同付费时长的组合全部算一遍，找出全局最优解',
    longtails: [
      'Hostinger 黑五打折吗',
      'Hostinger 黑五优惠码',
      'Hostinger 什么时候买最便宜',
      'Hostinger 大促怎么买划算',
    ],
    faqs: [
      ['黑五价格比平时低多少？', '折扣幅度因年份与套餐而异。关键不是折扣数字，而是折算后的月均价与续费价。'],
      ['大促期间能叠加优惠码吗？', '通常可以叠加，但部分活动套餐会排除优惠码，下单前请在结算页确认。'],
      ['买多久最划算？', '一般 48 个月付的月均价最低，但要考虑现金流与"万一日后想换主机"的沉没成本。'],
    ],
  },
  {
    category: 'deals',
    slug: 'hostinger-student-discount',
    title: '学生党用 Hostinger 建站：最低成本方案测算',
    keyword: 'Hostinger 学生优惠',
    intent: 'transactional',
    audience: '预算极紧的学生与个人博客作者',
    angle: '不靠特殊折扣，用"套餐 + 时长 + 免费权益"的组合把首年成本压到最低',
    longtails: [
      'Hostinger 有学生优惠吗',
      '学生建站最省钱方案',
      '个人博客主机怎么选便宜',
      'Hostinger 最便宜套餐多少钱',
    ],
    faqs: [
      ['Hostinger 有官方学生折扣吗？', '官方不定期推出学生相关活动，但更稳定的省钱方式是选对套餐与付费时长。'],
      ['最便宜的套餐够用吗？', '如果只跑一个轻量站点且流量不大，入门套餐确实够用。'],
    ],
  },

  /* ── 常见问题类：承接长尾疑问，建立站点权威度 ── */
  {
    category: 'faq',
    slug: 'hostinger-speed-optimization-faq',
    title: 'Hostinger 站点提速 20 问：从 TTFB 到图片懒加载',
    keyword: 'Hostinger 提速',
    intent: 'informational',
    audience: '站点能跑但觉得慢的用户',
    angle: '按"影响从大到小"排序，把优化项做成可勾选的清单',
    longtails: [
      'Hostinger 网站加载慢怎么办',
      '怎么优化网站速度',
      'TTFB 太高怎么解决',
      '主机性能优化清单',
    ],
    faqs: [
      ['提速最先做哪一步？', '先测基线，再动手。没有基线数据的优化等于盲调。'],
      ['换主机一定能提速吗？', '不一定。如果瓶颈在图片体积或前端资源，换主机不会有明显改善。'],
      ['缓存插件有用吗？', '有用，但前提是站点本身没有过重的查询与外部请求。'],
    ],
    codeBlocks: ['bash'],
  },
  {
    category: 'faq',
    slug: 'hostinger-vps-beginner-faq',
    title: 'Hostinger VPS 新手 18 问：会不会太难、要不要会 Linux',
    keyword: 'Hostinger VPS 新手',
    intent: 'informational',
    audience: '想升级 VPS 但被"要会命令行"劝退的用户',
    angle: '拆解"必须会"和"可以借助面板解决"的边界，降低心理门槛',
    longtails: [
      'Hostinger VPS 好用吗',
      '不懂 Linux 能用 VPS 吗',
      'Hostinger VPS 面板怎么用',
      'VPS 和虚拟主机怎么选',
    ],
    faqs: [
      ['不会 Linux 能用 VPS 吗？', '可以。可用 CyberPanel 等图形面板完成大部分操作，但遇到异常时基础命令行能力能省很多时间。'],
      ['VPS 需要自己装环境吗？', '取决于你选的系统镜像，部分镜像自带面板，开箱可用。'],
      ['VPS 被攻击了怎么办？', '先隔离、再排查。日常应配置防火墙、禁用密码登录并开启自动更新。'],
    ],
    codeBlocks: ['bash'],
  },
];

/* ═══════════════════════════════════════════════════════════════
 *  2. 骨架章节 —— 决定"每一节写什么钩子"
 *     每个主题都会套用这套结构，但小节标题按主题定制。
 * ═══════════════════════════════════════════════════════════════ */

const CATEGORY_META = {
  reviews: { prefix: 'reviews', theme: 'gradient-1', author: '林向远' },
  tutorials: { prefix: 'tutorials', theme: 'gradient-2', author: '苏晴' },
  deals: { prefix: 'deals', theme: 'gradient-3', author: '何嘉' },
  comparison: { prefix: 'blog', theme: 'gradient-4', author: '林向远' },
  faq: { prefix: 'blog', theme: 'gradient-5', author: '苏晴' },
};

/** 按分类生成不同的正文骨架 —— 评测要数据，教程要步骤 */
function bodyOutline(theme) {
  const { category, title, keyword, angle, audience, longtails } = theme;

  const common = `## 先说结论

> **一句话结论**：（写完之后回来补这句话，要让读者读完这一句就知道该不该继续往下看）

- **适合谁**：${audience}
- **不适合谁**：（诚实写出边界 —— 这一条比优点更能建立信任）
- **我们的立场**：${angle}

`;

  if (category === 'reviews') {
    return (
      common +
      `## 测试方法

（写清楚：什么时候买的、哪个套餐、怎么测的、采样频率多少。方法越具体，结论越可信）

\`\`\`bash
# 测试脚本（替换成本次实际使用的）
# 采样间隔 / 并发数 / 监测节点都要写在这里
\`\`\`

## 性能实测数据

| 指标 | 结果 | 同价位参考值 | 结论 |
| --- | --- | --- | --- |
| TTFB（亚洲节点中位数） |  |  |  |
| 在线率（30 天） |  |  |  |
| 压测 P95 响应 |  |  |  |
| 首次工单响应 |  |  |  |

## 配置与实际体验的差距

（官网参数 vs 你实际用起来的感觉。这一节最容易出反常识结论）

## 价格拆解：首购 vs 续费

（必须把续费价摆出来。这是读者最需要、而厂商最不想让你看到的信息）

## 优点

1.
2.
3.

## 缺点（我们不打算粉饰）

1.
2.

## 最终结论

（回到开头那句"一句话结论"，用数据支撑它）
`
    );
  }

  if (category === 'tutorials') {
    return (
      common +
      `## 开始之前你需要准备什么

- [ ] 一个已激活的 Hostinger 账户
- [ ] （其他前置条件）
- **预计耗时**：约 XX 分钟
- **难度**：★☆☆☆☆

## 第 1 步：

（每步都要写：做什么 → 在哪里做 → 完成后应该看到什么。截图位置用注释标出）

## 第 2 步：

## 第 3 步：

## 第 4 步：

## 常见报错与排查

| 报错信息 | 原因 | 解决方式 |
| --- | --- | --- |
|  |  |  |

## 验收清单

做完之后逐条打勾，确认没有漏项：

- [ ] 
- [ ] 
- [ ] 

## 下一步可以做什么

（把读者引向相关的进阶教程 —— 这是站内内链的关键位置）
`
    );
  }

  if (category === 'deals') {
    return (
      common +
      `## 当前优惠速览

| 套餐 | 促销价 | 折算月均价 | 续费价 | 是否值得 |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

> ⚠️ 价格有效期请以结算页为准。我们核验于：____ 年 __ 月 __ 日。

## 把钱花在刀刃上的三条原则

1. **看月均价，不看折扣百分比** —— "省 75%" 和 "月均 ¥22" 哪个更有信息量？
2. **算总持有成本，不算首年价** —— 把续费价一起算进三年账。
3. **时长换价格，但要留退路** —— 长期付最便宜，前提是你真的确定长期用。

## 不同预算下的最优组合

（按预算分档给方案，每档都要有具体数字）

## 购买流程与优惠码使用

（从选套餐到结算页应用优惠码，逐步写清楚）

## 买完之后别忘了领这些免费权益

- [ ] 免费域名（首年）
- [ ] SSL 证书
- [ ] 企业邮箱
- [ ] （其他）
`
    );
  }

  if (category === 'comparison') {
    return (
      common +
      `## 对比维度与权重

我们只看这四个维度，因为它们才是真正影响你长期体验和总花费的东西：

| 维度 | 权重 | 为什么重要 |
| --- | --- | --- |
| 三年总持有成本 | 35% | 首年便宜不代表长期便宜 |
| 性能稳定性 | 30% | 掉线一次的损失可能超过一年省下的钱 |
| 上手难度 | 20% | 省下的时间也是成本 |
| 迁移与退出成本 | 15% | 进来容易出去难，这一项常被忽略 |

## 逐项对比

### 价格：不只是数字游戏

### 性能：同一脚本下的对照

### 易用性：面板与支持响应

### 生态与扩展性

## 最终评分

| 维度 | A | B |
| --- | --- | --- |
| 总持有成本 |  |  |
| 性能稳定性 |  |  |
| 上手难度 |  |  |
| 退出成本 |  |  |
| **综合** |  |  |

## 什么情况下选谁

- **选 A 如果你**：
- **选 B 如果你**：
- **都别选，如果你**：（这种情况真实存在，写出来能极大提升可信度）
`
    );
  }

  /* faq */
  return (
    common +
    `## 快速索引

（把下面的问题按主题分组，方便读者跳转）

## 选购与价格

### Q1. 
### Q2. 

## 性能与配置

### Q3. 
### Q4. 

## 使用与运维

### Q5. 
### Q6. 

## 故障排查

### Q7. 
### Q8. 

## 还有其他问题？

（引导到套餐选择器或联系我们）
`
  );
}

/* ═══════════════════════════════════════════════════════════════
 *  3. frontmatter 生成
 * ═══════════════════════════════════════════════════════════════ */

function escapeYaml(str) {
  return `'${String(str).replace(/'/g, "''")}'`;
}

function buildFile(theme) {
  const meta = CATEGORY_META[theme.category];
  const today = new Date().toISOString().slice(0, 10);

  const faqLines = theme.faqs
    .map(([q, a]) => `  - question: ${escapeYaml(q)}\n    answer: ${escapeYaml(a)}`)
    .join('\n');

  const tagLines = theme.longtails
    .slice(0, 3)
    .map((t) => `  - ${t}`)
    .join('\n');

  const fm = `---
# ⚠️ 本文件由 scripts/generate-content-outline.mjs 生成
# 正文为骨架，必须人工补完数据与结论后才能把 draft 改为 false
title: ${escapeYaml(theme.title)}
description: ${escapeYaml(`围绕「${theme.keyword}」的深度内容。${theme.angle}。`)}
excerpt: ${escapeYaml(theme.angle)}
pubDate: ${today}
author: ${escapeYaml(meta.author)}
category: ${theme.category}
tags:
${tagLines}
theme: ${meta.theme}
affiliateNotice: true
draft: true
readingTime: 10
keywords:
  - ${theme.keyword}
${theme.longtails.map((t) => `  - ${t}`).join('\n')}
ctaHeadline: ${escapeYaml(`想直接看 ${theme.keyword} 的当前价格？`)}
ctaBody: ${escapeYaml('我们把全部套餐的促销价与续费价并排列出，方便你一眼算清总成本。')}
faqs:
${faqLines}
---
`;

  return fm + '\n' + bodyOutline(theme) + `\n---\n\n<!-- 内链建议：\n  1. 在正文中自然嵌入 /pricing 与 /tools/plan-finder\n  2. 至少在文末引用一篇相关评测\n  3. 联盟链接一律使用 AffiliateButton 生成的 URL，不要手写\n-->\n`;
}

/* ═══════════════════════════════════════════════════════════════
 *  4. 执行
 * ═══════════════════════════════════════════════════════════════ */

async function exists(p) {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log('');
  console.log('  📝  HostingerPick 内容蓝图生成器');
  console.log('  ─'.repeat(30));
  if (DRY) console.log('  🔍 DRY RUN —— 不会写入任何文件\n');
  if (LIST_ONLY) console.log('  📋 仅列出计划\n');
  console.log('');

  let created = 0;
  let skipped = 0;
  let overwritten = 0;

  for (const theme of THEMES) {
    const meta = CATEGORY_META[theme.category];
    if (!meta) {
      console.warn(`  ⚠️  未知分类 "${theme.category}"，跳过 ${theme.slug}`);
      continue;
    }

    const dir = join(ARTICLES_DIR, theme.category);
    const filepath = join(dir, `${theme.slug}.md`);
    const rel = `src/content/articles/${theme.category}/${theme.slug}.md`;
    const already = await exists(filepath);

    if (LIST_ONLY) {
      console.log(`  ${already ? '📄' : '✨'} ${rel}`);
      console.log(`     主词：${theme.keyword}　长尾：${theme.longtails.length} 个　FAQ：${theme.faqs.length} 条`);
      if (theme.codeBlocks) console.log(`     代码块：${theme.codeBlocks.join(' / ')}`);
      console.log('');
      continue;
    }

    if (already && !FORCE) {
      console.log(`  ⏭️  已存在，跳过：${rel}`);
      skipped++;
      continue;
    }

    if (DRY) {
      console.log(`  ${already ? '♻️  将覆盖' : '✨ 将创建'}：${rel}`);
      continue;
    }

    await mkdir(dir, { recursive: true });
    await writeFile(filepath, buildFile(theme), 'utf8');

    if (already) {
      console.log(`  ♻️  覆盖：${rel}`);
      overwritten++;
    } else {
      console.log(`  ✨ 创建：${rel}`);
      created++;
    }
  }

  if (!DRY && !LIST_ONLY) {
    console.log('');
    console.log('  ─'.repeat(30));
    console.log(`  完成：新建 ${created} · 覆盖 ${overwritten} · 跳过 ${skipped}`);
    console.log('');
    console.log('  下一步：');
    console.log('    1. 逐篇补完正文中的数据与结论');
    console.log('    2. 把 frontmatter 的 draft 改为 false');
    console.log('    3. 运行 npm run build 验证');
    console.log('');
  }
}

main().catch((err) => {
  console.error('生成失败：', err);
  process.exit(1);
});
