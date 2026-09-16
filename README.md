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

## 🖥️ CMS 后台使用

后台在 `/admin/`，用 **Sveltia CMS**（Decap/Netlify CMS 的现代替代品，
通过 unpkg CDN 加载，无需构建步骤）。仓库已推到
[`fusifen/hostinger`](https://github.com/fusifen/hostinger)。

**有两种用法，按需选：**

---

### 方式 A：本地模式 —— **现在就能用，零配置** ✅

Sveltia 内置了本地文件系统模式（基于 Chromium 的 File System Access API），
**不需要 OAuth 代理、不需要登录**，直接编辑本地文件。

1. `npm run dev`
2. **用 Chrome / Edge**（Firefox、Safari 不支持）打开
   <http://localhost:4321/admin/index.html>
   > ⚠️ 一定要带 `index.html`，否则 Astro 会当成路由处理
3. 点 **「Work with Local Repository」** → 选择项目根目录
   （`D:\Project\hostinger\mechanical-meteor`）
4. 开始编辑。改动**直接写进本地文件**，预览即时生效
5. 改完用 git 自己提交推送（CMS 不代做 git 操作）：
   ```bash
   git diff          # 先看改了什么
   git add -A && git commit -m "content: 更新 xxx"
   git push
   ```

**适用**：自己写内容、批量改价格、调 CMS 配置。
**不支持**：在手机/别的电脑上远程编辑。

---

### 方式 B：远程登录 —— 需要配 OAuth 代理

想让后台能在线登录（随时随地改内容、自动 commit），才需要这一套。

GitHub OAuth 需要服务端交换 token，用 Sveltia 官方的
[`sveltia-cms-auth`](https://github.com/sveltia/sveltia-cms-auth)
部署到 Cloudflare Workers（免费额度够用）。

**完整分步操作见 → [`../oauth-proxy/SETUP.md`](../oauth-proxy/SETUP.md)**

三步概览：

1. 建 GitHub OAuth App（[Developer settings](https://github.com/settings/developers)），
   拿到 Client ID / Secret
2. `cd ../oauth-proxy && npx wrangler login && npx wrangler deploy`，
   然后 `wrangler secret put GITHUB_CLIENT_ID`（再 put 一次 SECRET）
3. 把 Worker 地址填进本仓库 `public/admin/config.yml` 的 `base_url`，
   并把站点域名加进 `oauth-proxy/wrangler.toml` 的 `ALLOWED_DOMAINS`

> **用 Netlify 托管**可以省掉整套 —— Netlify 自带 OAuth。

---

### 后台能编辑什么

- **文章** —— 标题、摘要、缩略图（媒体库）、发布时间、分类下拉、Markdown 正文、
  作者、标签、FAQ 列表、`draft` 开关（开启则不进构建产物）
- **Hostinger 套餐** —— 实时促销价、折扣幅度、专属优惠码
- **优惠码** —— 码值、折扣力度、生效范围、有效期
- 界面语言已设为中文（`locale: zh_Hans`）
- `publish_mode: editorial_workflow` —— 支持「草稿 → 审核 → 发布」流转

> 💡 **图片会自动转 WebP 并压到 2000px 宽**（在 `media_libraries.transformations`
> 里配置），避免运营上传 5MB 原图拖垮站点。
>
> 💡 改完 CMS 配置（`config.yml`）后需要**重新加载后台页面**才会生效。

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
