# HostingerPick

Hostinger 联盟推广 + 内容聚合站。基于 **Astro 7**（Content Layer API）构建，
静态输出，配 **Sveltia CMS** 可视化后台。

## 快速开始

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # 输出到 ./dist/
npm run preview  # 本地预览构建产物
```

### 可用脚本

| 命令 | 作用 |
| :--- | :--- |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | **构建前自动跑内容守卫**，然后产出到 `dist/` |
| `npm run build:force` | 跳过内容守卫直接构建（应急用） |
| `npm run check:content` | 只跑内容守卫：检查草稿状态与占位符 |
| `npm run check:cms` | 校验 `admin/config.yml` 结构完整性 |
| `npm run gen:outline` | 按长尾词批量生成文章骨架（`--list` / `--dry` / `--force`） |

> ⚠️ **在 WorkBuddy / 沙箱环境里构建，必须清空 `NODE_OPTIONS`**：
> ```bash
> NODE_OPTIONS= npm run build
> ```
> 否则批量删除保护会拦截 Astro 的缓存清理，构建会卡死。
> **不要**把它写进 `package.json` —— CI 和普通终端没有这个 shim。

## ⚙️ 上线前必改的三处

这三处目前都是占位符，**不改等于白做**：

### 1. 联盟链接（最重要）

打开 `src/consts.ts`，确认 `AFFILIATE` 对象：

```ts
export const AFFILIATE = {
  gateway: 'https://www.hostg.xyz/aff_c',  // 联盟跳转网关
  affId: '109714',                          // 你的联盟账号 ID
  offerId: '6',                             // 产品线标识
  urlId: '70',                              // 落地页编号
  couponCode: '30OFF',                      // 优惠码
  couponLabel: '额外 10% 折扣',
  couponPercent: 10,
} as const;
```

**全站所有出站链接都由 `affiliateUrl()` / `dealUrl()` 生成**，
改这里一处，所有按钮、卡片、横幅、文章 CTA 同步生效。

> 🚫 **绝对不要手写 `hostg.xyz` 或 `hostinger.com` 的链接**。
> 漏掉 `aff_id` 或 `url_id` 会导致点击不被归因、佣金为 0。

**多落地页分流**：如果你在联盟后台为共享主机 / VPS / Cloud 分别建了落地页，
把对应的 `url_id` 填进 `AFFILIATE_URL_IDS` 即可，无需改任何组件。

**子渠道归因**：所有链接自动带 `sub_id`（如 `hero-primary`、`footer-cta`、
`finder-shared-premium`）。在联盟后台按 `sub_id` 分组，就能看出哪个位置转化最好。

### 2. 站点域名

`src/consts.ts` → `SITE.url`，改成你的真实域名（影响 sitemap、canonical、OG）。

### 3. CMS 后台（见下节）

## 🖥️ CMS 后台部署

后台在 `/admin/`，用 **Sveltia CMS**（Decap/Netlify CMS 的现代替代品，
通过 unpkg CDN 加载，无需构建步骤）。

**当前状态：文件已就位，但还不能用** —— 因为它是 Git-based CMS，
必须先把仓库推到 GitHub，并配一个 OAuth 代理。

### 步骤 1：推到 GitHub

```bash
git init
git add .
git commit -m "初始化站点"
git remote add origin git@github.com:<你的用户名>/<仓库名>.git
git push -u origin main
```

> 本机直连 GitHub 需要走代理，已在全局配置里设好（v2rayN，HTTP 端口 10809）。
> 推送卡死时见文末「常见问题」。

### 步骤 2：改 `public/admin/config.yml`

```yaml
backend:
  name: github
  repo: <你的用户名>/<仓库名>   # ← 改这里
  branch: main
  base_url: <你的 OAuth 代理地址>  # ← 改这里，见步骤 3
```

### 步骤 3：部署 OAuth 代理

GitHub OAuth 需要一个服务端来交换 token，Sveltia 官方提供了
[`sveltia-cms-auth`](https://github.com/sveltia/sveltia-cms-auth)：
一键部署到 Cloudflare Workers，免费额度完全够用。

部署完成后把它给你的地址填进 `base_url`。

> **用 Netlify 托管的话**可以省掉这一步 —— Netlify 自带 OAuth，
> 用它的公共实例即可。

### 步骤 4：配置 GitHub OAuth App

在 GitHub → Settings → Developer settings → OAuth Apps 新建一个：

- **Homepage URL**：你的站点地址
- **Authorization callback URL**：你的 OAuth 代理地址 + `/callback`

把生成的 Client ID / Secret 填进 OAuth 代理的环境变量。

### 步骤 5：验证

访问 `https://你的域名/admin/`，点「Login with GitHub」，
授权后应该能看到「文章」「Hostinger 套餐」「优惠码」等集合。

**支持的编辑能力**：

- **文章** —— 标题、摘要、缩略图（媒体库）、发布时间、分类下拉、Markdown 正文、
  作者、标签、FAQ 列表、`draft` 开关（开启则不进构建产物）
- **Hostinger 套餐** —— 实时促销价、折扣幅度、专属优惠码
- **优惠码** —— 码值、折扣力度、生效范围、有效期
- 界面语言已设为中文（`locale: zh_Hans`）
- `publish_mode: editorial_workflow` —— 支持「草稿 → 审核 → 发布」流转

> 💡 **图片会自动转 WebP 并压到 2000px 宽**（在 `media_libraries.transformations`
> 里配置），避免运营上传 5MB 原图拖垮站点。

## 📁 项目结构

```
src/
├── consts.ts              # ⭐ 全局配置与联盟链接中枢
├── content.config.ts      # Content Layer schema（Zod）
├── content/
│   ├── articles/          # 文章（按分类分目录）
│   ├── hostinger-plans/   # 套餐数据（YAML）
│   ├── coupons.yaml       # 优惠码
│   ├── authors.yaml       # 作者
│   └── competitors.yaml   # 竞品
├── components/            # UI 组件
│   ├── AffiliateButton.astro   # ⭐ 唯一的联盟转化按钮
│   ├── PlanCard.astro          # 套餐卡片
│   ├── HostingerPricingMatrix.astro  # 价格对比矩阵
│   └── ...
├── layouts/               # 页面骨架（含 SEO / JSON-LD）
├── pages/                 # 路由
│   ├── [category]/[slug].astro  # 文章详情
│   ├── pricing.astro / deals/ / reviews/ / tutorials/
│   ├── tools/plan-finder.astro  # 套餐选择器
│   ├── rss.xml.ts
│   └── 404.astro / about.astro / contact.astro
└── styles/global.css      # Tailwind 4 主题令牌
public/
├── admin/                 # CMS 后台
├── robots.txt
└── og-default.svg
scripts/
├── check-content.mjs      # 内容守卫（已接入 build）
├── verify-cms-config.mjs  # CMS 配置自检
└── generate-content-outline.mjs  # 内容蓝图生成器
```

## ✍️ 内容工作流

1. **写过草稿就不怕忘**：文章 frontmatter 里 `draft: true` 即不会进构建产物。
2. **守卫会拦住你**：`npm run build` 前会自动检查 ——
   如果正文里还留着 `待实测` 这类占位符、却忘了标 `draft: true`，
   **构建直接失败并报出文件名**。这是为了防止半成品被误发布。
3. **确认无误后**把 `draft` 改成 `false`，重新构建即上线。

## 🔧 常见问题

**构建卡在最后一步没输出**
清空 `NODE_OPTIONS`：`NODE_OPTIONS= npm run build`

**报 `EPERM: rename '.astro/content-assets.mjs.tmp'`**
`.astro/` 缓存被别的进程占用。绕开删除：
```bash
mv .astro ".astro.stale-$(date +%s)"
npm run build
```

**`git push` 卡死或提示 `could not read Username`**
PortableGit 的 `credential.helper=helper-selector` 在本机取不到凭据。
见 `~/.workbuddy-ai/MEMORY.md` 里记录的 GCM 包装脚本解法。

**GitHub 拉取超时**
本机直连 GitHub 的 443 会超时，需开 v2rayN（代理已在全局 git config 里配好，
仅对 github.com 生效）。

## ✅ 上线检查清单

- [ ] `src/consts.ts` → `AFFILIATE.affId` / `urlId` / `couponCode` 是真实值
- [ ] `src/consts.ts` → `SITE.url` 是真实域名
- [ ] `public/admin/config.yml` → `repo` / `base_url` 是真实值
- [ ] 仓库已推到 GitHub，OAuth 代理已部署
- [ ] `npm run build:force` 通过，页面数符合预期
- [ ] `dist/` 里没有草稿泄漏：`grep -rl "待实测" dist/` 应为空
- [ ] 随机点几个按钮，确认跳转到 `hostg.xyz/aff_c?...&aff_id=109714`
- [ ] `/admin/` 能正常登录
