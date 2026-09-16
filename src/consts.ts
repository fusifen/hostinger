/**
 * ─────────────────────────────────────────────────────────────
 *  全局站点常量 & 联盟链接中枢
 * ─────────────────────────────────────────────────────────────
 *  ⚠️ 唯一需要修改联盟信息的地方。
 *  修改 AFFILIATE.referralCode 后，全站所有「立即抢购」按钮、
 *  优惠码卡片、文末横幅、悬浮卡片的跳转链接都会同步生效。
 */

/* ═══════════ 价格展示策略 ═══════════ */

/**
 * 续费价的展示方式 —— 转化率与信任度之间的取舍开关。
 *
 *   'always'  —— 卡片、表格、文章里都并排显示续费价（当前默认）
 *                短期点击率略低，但退款率与差评显著更少，联盟账号更健康
 *   'table'   —— 卡片上隐藏，只在 /pricing 的对比表格里完整披露
 *                点击率更高，适合冲短期转化；仍满足合规要求（信息可查）
 *   'collapse'—— 卡片上折进一个「查看续费价」的展开项
 *                折中方案，用户主动点击才看到
 *
 * ⚠️ 无论选哪种，都不建议**完全隐藏**：主机行业最大的信任危机
 *    就是「首购低价 + 续费暴涨」，隐藏会被用户在评论区当场戳穿。
 */
export const RENEWAL_DISPLAY: 'always' | 'table' | 'collapse' = 'always';

/* ═══════════ 联盟营销配置 ═══════════ */

/**
 * ⚠️ 联盟链接是深链接（deep link）形式，不是域名后缀参数。
 *
 * 真实链接形如：
 *   https://www.hostg.xyz/aff_c?offer_id=6&aff_id=109714&url_id=70
 *
 * 这是 Hostinger 联盟系统（Post Affiliate Pro）的跳转网关：
 *   1. 访客先到 hostg.xyz/aff_c，由联盟系统记录点击与 aff_id
 *   2. 系统再 302 跳转到 hostinger.com 的真实页面
 *
 * 因此 **不能** 自己在 hostinger.com 上拼 ?REFERRALCODE=xxx —— 那样不会被归因。
 * 所有出站链接必须先经过 AFFILIATE.gateway。
 */
export const AFFILIATE = {
  /** 联盟跳转网关（记录点击 + 归因用，不要改） */
  gateway: 'https://www.hostg.xyz/aff_c',
  /** 联盟账号 ID */
  affId: '109714',
  /** offer_id：标识推广的具体产品线（6 = 主机产品线） */
  offerId: '6',
  /**
   * url_id：联盟后台里预先配置好的「落地页」编号。
   * 接入多个落地页后，可按 category 映射到不同 url_id 以提升转化。
   * 当前全部指向 70（主页/通用落地页）。
   */
  urlId: '70',
  /** 品牌主推优惠码，展示在价格卡片与优惠专区 */
  couponCode: '30OFF',
  /** 优惠描述，用于徽章文案 */
  couponLabel: '额外 10% 折扣',
  /** 优惠力度数值，用于文案里的「省 X%」占位 */
  couponPercent: 10,
} as const;

/**
 * 产品类别 → url_id 映射。
 *
 * ⚠️ 注意：url_id 指向的落地页由你在联盟后台预先配置，**不能自己编**。
 *    实测（2026-09-16）你的账号下：
 *
 *      url_id=70  →  /vps-hosting?special_offer 系列（VPS 落地页）
 *      url_id=1~5 →  /web-hosting?special_offer=reach（共享主机，带特惠标记）
 *
 *    两者都带 `utm_source=aff109714`，归因正常。
 *
 *    ⚠️ 但 70 目前指向 VPS 页面！共享主机按钮跳 VPS 页会明显降低转化。
 *    建议：去联盟后台确认/新建各产品线的落地页，然后把真实 url_id 填到这里。
 *    在拿到各产品线的专属 url_id 之前，**默认走 1**（共享主机页，是主力流量）。
 */
/**
 * 各产品线对应的联盟落地页 ID（`url_id`）。
 *
 * ⚠️ 这些值是 **2026-09-16 用 `curl -L` 实测**出来的，不是猜的：
 *
 *   url_id=1~10  → /web-hosting          共享主机
 *   url_id=68    → /uk/web-hosting       共享主机（UK 站）
 *   url_id=69    → /uk/cloud-hosting     Cloud Hosting
 *   url_id=70    → /uk/vps-hosting       VPS
 *   url_id=60~67,71~75 → /ro /co /mx /id … 各国站首页（不是产品页，别用）
 *
 * 注意 hostg.xyz 的 offer_id=6 默认落的是 **UK 站**，
 * 所以 UK 页反而是最"原生"的落地页；共享主机用 1 会跳到主站（无 /uk 前缀），
 * 两者都能正常归因，按你想展示的定价币种选即可。
 *
 * 若日后联盟后台改了落地页配置，用这条命令重测：
 *   for id in 1 68 69 70; do curl -s -o /dev/null -w "$id %{url_effective}\n" -L \
 *     "https://www.hostg.xyz/aff_c?offer_id=6&aff_id=109714&url_id=$id"; done
 */
export const AFFILIATE_URL_IDS: Record<string, string> = {
  shared: '1',
  vps: '70',
  cloud: '69',
  builder: '1',
  domains: '1',
  email: '1',
  default: '1',
};

/**
 * 拼接联盟推广链接。
 *
 * ⚠️ 这是全站唯一的出站链接构造入口。任何地方都不要手写 hostg.xyz 或
 *    hostinger.com 的 URL —— 手写会漏掉 aff_id 或 url_id，导致流量不计佣金。
 *
 * @param category 产品类别，用于选择对应的落地页（url_id）
 * @param campaign 活动标识，写入 sub_id 便于在联盟后台区分流量来源
 */
export function affiliateUrl(category?: string, campaign?: string): string {
  const url = new URL(AFFILIATE.gateway);
  url.searchParams.set('offer_id', AFFILIATE.offerId);
  url.searchParams.set('aff_id', AFFILIATE.affId);
  url.searchParams.set('url_id', (category && AFFILIATE_URL_IDS[category]) || AFFILIATE_URL_IDS.default);
  /**
   * sub_id 是联盟系统自带的子渠道追踪参数（Post Affiliate Pro 标准字段）。
   * 用它可以区分「首页按钮」和「评测文末按钮」哪个带来的转化更好。
   */
  if (campaign) url.searchParams.set('sub_id', campaign);
  return url.toString();
}

/**
 * 带优惠码的推广链接。
 *
 * 部分联盟落地页支持 coupon 参数自动把优惠码应用到购物车。
 * 即使落地页不支持，这个参数也不会造成问题（会被忽略），
 * 所以统一带上，能生效就赚到。
 */
export function dealUrl(category?: string, campaign?: string): string {
  const url = new URL(affiliateUrl(category, campaign));
  url.searchParams.set('coupon', AFFILIATE.couponCode);
  return url.toString();
}

/* ═══════════ 站点元信息 ═══════════ */

export const SITE = {
  name: 'HostingerPick',
  tagline: 'Hostinger 真实评测 · 套餐对比 · 优惠追踪',
  description:
    '深度拆解 Hostinger 全部产品线：共享主机、KVM 系列 VPS、Cloud Hosting 与 Website Builder。提供价格对比矩阵、真实速度实测、建站教程与有效期优惠码，帮你在 3 分钟内选对套餐。',
  url: 'https://hostingerpick.com',
  locale: 'zh-CN',
  lang: 'zh-CN',
  author: 'HostingerPick 编辑部',
  email: 'hello@hostingerpick.com',
  /** 默认社交分享图 */
  ogImage: '/og-default.svg',
  twitter: '@hostingerpick',
} as const;

/* ═══════════ 导航结构 ═══════════ */

export interface NavItem {
  label: string;
  href: string;
  description?: string;
  children?: NavItem[];
}

export const PRIMARY_NAV: NavItem[] = [
  {
    label: '套餐与价格',
    href: '/pricing',
    children: [
      { label: '全部套餐对比', href: '/pricing', description: '横向对比 12 个在售套餐' },
      { label: '共享虚拟主机', href: '/pricing#shared', description: 'Single / Premium / Business' },
      { label: 'VPS 主机 (KVM)', href: '/pricing#vps', description: 'KVM 1 至 KVM 8 全系' },
      { label: 'Cloud Hosting', href: '/pricing#cloud', description: '独立资源，跑流量站' },
      { label: 'Website Builder', href: '/pricing#builder', description: 'AI 建站，零基础可用' },
      { label: '套餐选择器', href: '/tools/plan-finder', description: '30 秒选出合适的套餐' },
    ],
  },
  {
    label: '主机评测',
    href: '/reviews',
    children: [
      { label: '全部评测', href: '/reviews' },
      { label: 'Hostinger 总体评测', href: '/reviews/hostinger-review-2026' },
      { label: '共享主机实测', href: '/reviews/hostinger-shared-hosting-review' },
      { label: 'VPS 性能测试', href: '/reviews/hostinger-vps-review' },
      { label: '速度与正常运行时间', href: '/reviews/hostinger-speed-uptime-test' },
    ],
  },
  {
    label: '建站教程',
    href: '/tutorials',
    children: [
      { label: '全部教程', href: '/tutorials' },
      { label: '新手建站全流程', href: '/tutorials/build-wordpress-site-on-hostinger' },
      { label: 'hPanel 面板指南', href: '/tutorials/hpanel-complete-guide' },
      { label: 'CyberPanel 实战', href: '/tutorials/cyberpanel-vps-setup' },
      { label: '网站迁移教程', href: '/tutorials/migrate-website-to-hostinger' },
    ],
  },
  {
    label: '优惠专区',
    href: '/deals',
    children: [
      { label: '本月亮优惠', href: '/deals' },
      { label: '优惠码大全', href: '/coupons' },
      { label: '折扣计算方法', href: '/tutorials/how-to-get-cheapest-hostinger' },
    ],
  },
  { label: '博客', href: '/blog' },
];

/* ═══════════ 分类元数据 ═══════════ */

export const ARTICLE_CATEGORIES = [
  { slug: 'reviews', label: '主机评测', description: '基于真实开箱与压测数据的深度评测', color: 'violet', href: '/reviews' },
  { slug: 'tutorials', label: '建站教程', description: '从买主机到网站上线的完整流程拆解', color: 'sky', href: '/tutorials' },
  { slug: 'deals', label: '优惠与选购', description: '优惠码追踪与最省钱的购买策略', color: 'amber', href: '/deals' },
  { slug: 'comparison', label: '对比评测', description: 'Hostinger 与同类主机的横向较量', color: 'emerald', href: '/blog' },
  { slug: 'faq', label: '常见问题', description: '续费、退款、报错排查等高频疑问', color: 'rose', href: '/blog' },
] as const;

export type CategorySlug = (typeof ARTICLE_CATEGORIES)[number]['slug'];

export function getCategory(slug: string) {
  return ARTICLE_CATEGORIES.find((c) => c.slug === slug);
}

/* ═══════════ 产品大类元数据 ═══════════ */

export const PRODUCT_CATEGORIES = [
  {
    slug: 'shared',
    label: '共享虚拟主机',
    short: 'Shared',
    tagline: '性价比首选',
    description: '一台服务器承载多个网站，价格最低，适合个人博客、企业官网与外贸展示站。',
    highlight: '低至 ¥15/月',
    icon: 'server',
  },
  {
    slug: 'vps',
    label: 'VPS 主机 (KVM)',
    short: 'VPS',
    tagline: '性能与自由',
    description: '独享 CPU 与内存，完整 root 权限，适合高流量站点、多站点托管与自建服务。',
    highlight: 'NVMe + 独立 IP',
    icon: 'cpu',
  },
  {
    slug: 'cloud',
    label: 'Cloud Hosting',
    short: 'Cloud',
    tagline: '流量站利器',
    description: '分布式资源池 + 自动扩容，电商与广告投放站点的稳定性保障。',
    highlight: '4 倍资源隔离',
    icon: 'cloud',
  },
  {
    slug: 'builder',
    label: 'Website Builder',
    short: 'Builder',
    tagline: 'AI 零基础上手',
    description: '内置 AI 生成器，描述业务即可出稿，拖拽编辑，适合完全不懂代码的用户。',
    highlight: 'AI 一键出稿',
    icon: 'sparkles',
  },
] as const;

export type ProductCategorySlug = (typeof PRODUCT_CATEGORIES)[number]['slug'];

/* ═══════════ 信任指标 ═══════════ */

export const TRUST_STATS = [
  { value: '3.2M+', label: '全球在建站点', sub: 'Hostinger 官方数据' },
  { value: '178', label: '全球数据中心位置', sub: '含新加坡/孟买节点' },
  { value: '99.9%', label: '官方在线率承诺', sub: '实测 99.97%（90 天）' },
  { value: '24/7', label: '在线客服支持', sub: '含中文会话支持' },
] as const;

/* ═══════════ 文章路由 ═══════════ */

/**
 * 分类 → 路由前缀。
 * comparison 与 faq 没有独立的列表页，统一归入 /blog。
 */
export const CATEGORY_PREFIX: Record<string, string> = {
  reviews: 'reviews',
  tutorials: 'tutorials',
  deals: 'deals',
  faq: 'blog',
  comparison: 'blog',
};

/**
 * 由文章集合条目生成访问路径。
 * ⚠️ Content Layer 的 `id` 含子目录（如 "reviews/xxx"），
 *    必须取最后一段，否则会生成 /reviews/reviews/xxx 这类重复路径。
 */
export function articleUrl(article: { id: string; data: { category: string } }): string {
  const bare = article.id.split('/').pop() ?? article.id;
  const prefix = CATEGORY_PREFIX[article.data.category] ?? 'blog';
  return `/${prefix}/${bare}`;
}

/* ═══════════ 品牌色（与 global.css 令牌保持一致） ═══════════ */

export const BRAND = {
  /** Hostinger 品牌紫 */
  primary: '#673DE6',
  primaryDark: '#5025D1',
  accent: '#00B090',
} as const;
