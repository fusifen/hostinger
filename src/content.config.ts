import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { PRODUCT_CATEGORIES, ARTICLE_CATEGORIES } from './consts';

/* ══════════════════════════════════════════════════════════════
   Hostinger 产品套餐集合
   数据源：src/content/hostinger-plans/*.yaml
   之所以用 YAML 单文件而非 Markdown —— 套餐是纯结构化数据，
   运营改价格时不需要面对正文编辑器，Sveltia 的可视化字段也更友好。
   ══════════════════════════════════════════════════════════════ */

const productCategoryEnum = z.enum(
  PRODUCT_CATEGORIES.map((c) => c.slug) as unknown as [string, ...string[]],
);

const articleCategoryEnum = z.enum(
  ARTICLE_CATEGORIES.map((c) => c.slug) as unknown as [string, ...string[]],
);

/** 套餐里的一条核心配置（CPU / 内存 / 硬盘…） */
const specSchema = z.object({
  /** 配置项名称，如「CPU 核心」 */
  label: z.string(),
  /** 配置值，如「2 核」 */
  value: z.string(),
  /** 可选的补充说明，如「含 8GB 专属内存」 */
  note: z.string().optional(),
});

/** 产品权益（免费域名 / SSL / 邮箱…），用于生成对勾清单 */
const featureSchema = z.object({
  label: z.string(),
  /** 是否包含；false 用于对比表里显示灰掉的项目 */
  included: z.boolean().default(true),
  note: z.string().optional(),
});

const hostingerPlans = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/hostinger-plans' }),
  schema: ({ image }) =>
    z.object({
      /* ── 基础标识 ── */
      /** 套餐展示名，如 "Premium" */
      name: z.string(),
      /** 完整产品名，如 "Hostinger Premium 共享主机" */
      fullName: z.string(),
      /** 产品大类 */
      category: productCategoryEnum,
      /** 细分系列名，如 "KVM" / "Cloud" / "Shared" */
      series: z.string(),
      /** 套餐在同系列内的排序，数字越小越靠前 */
      order: z.number().int().default(100),
      /** 一句话卖点，卡片头部展示 */
      tagline: z.string(),

      /* ── 定价（货币单位：CNY，按官方美元价 × 汇率换算展示）── */
      pricing: z.object({
        /** 促销价（月均，通常对应 48 个月一次性付款折算） */
        promoPrice: z.number(),
        /** 原价（月均） */
        regularPrice: z.number(),
        /** 续费价（月均）—— 必须诚实披露，这是建立信任的关键 */
        renewalPrice: z.number(),
        /** 结算周期文案，如 "48 个月" */
        termLabel: z.string(),
        /** 币种符号 */
        currency: z.string().default('¥'),
        /** 首期账单总价（可选，用于展示「一次性支付 ¥XXX」） */
        upfrontTotal: z.number().optional(),
      }),

      /* ── 评分与推荐 ── */
      rating: z.number().min(0).max(5).default(4.6),
      reviewCount: z.number().int().default(0),
      /** 是否标记为「最超值」爆款（每类仅一个，用于视觉高亮） */
      bestValue: z.boolean().default(false),
      /** 是否为主推位 */
      recommended: z.boolean().default(false),
      /** 受众规模标签，用于选择器匹配 */
      audience: z
        .array(
          z.enum([
            'beginner',
            'blogger',
            'business',
            'ecommerce',
            'developer',
            'agency',
            'high-traffic',
          ]),
        )
        .default([]),

      /* ── 核心配置 ── */
      /** 网站数量上限（null 表示不限） */
      websites: z.string().default('1'),
      /** 存储空间描述 */
      storage: z.string(),
      /** 带宽描述 */
      bandwidth: z.string(),
      /** 核心配置明细 */
      specs: z.array(specSchema).default([]),

      /* ── 权益清单 ── */
      features: z.array(featureSchema).default([]),

      /* ── 营销字段 ── */
      /** 折扣百分比，用于「省 X%」标签；不填则由价格自动推算 */
      discountBadge: z.string().optional(),
      /** 突出展示的赠品，如「赠送 1 年 .com 域名」 */
      freebies: z.array(z.string()).default([]),
      /** 该套餐是否支持 30 天退款 */
      moneyBackDays: z.number().int().default(30),

      /* ── 联盟与落地 ── */
      affiliate: z
        .object({
          /** 覆盖 category 推断出的落地页路径 */
          landingPath: z.string().optional(),
          /** 专属优惠码（覆盖全局） */
          couponCode: z.string().optional(),
          /** 活动标识，写入 utm_content 便于后台归因 */
          campaign: z.string().optional(),
        })
        .default({}),

      /* ── 内容关联 ── */
      /** 一句话专家点评，展示在对比表和详情抽屉里 */
      verdict: z.string(),
      /** 最适合谁 */
      bestFor: z.string(),
      /** 需要注意的短板，诚实披露提升可信度 */
      caveat: z.string().optional(),
      /** 相关评测文章 slug */
      relatedReviews: z.array(z.string()).default([]),

      /** 是否在售（下架套餐保留数据但不出现在列表） */
      active: z.boolean().default(true),
      /** 数据最后核对日期 */
      lastChecked: z.coerce.date(),
    }),
});

/* ══════════════════════════════════════════════════════════════
   文章集合
 * 数据源：src/content/articles 目录下的 md / mdx 文件
   ══════════════════════════════════════════════════════════════ */

const faqSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

const articleFaqSchema = faqSchema;

const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/articles' }),
  schema: ({ image }) =>
    z.object({
      /* ── 基础 ── */
      title: z.string().max(120),
      /** SEO 描述，控制在 160 字符内 */
      description: z.string().max(220),
      /** 短摘要，列表页与卡片使用 */
      excerpt: z.string().optional(),

      /* ── 时间 ── */
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),

      /* ── 作者 ── */
      author: z.string().default('HostingerPick 编辑部'),

      /* ── 分类与标签 ── */
      category: articleCategoryEnum,
      tags: z.array(z.string()).default([]),

      /* ── 视觉 ── */
      /** 特色图（本地图片，走 astro:assets 优化） */
      heroImage: image().optional(),
      heroImageAlt: z.string().optional(),
      /** 封面渐变风格，无图时作为兜底，取值 gradient-1 ~ gradient-6 */
      theme: z
        .enum(['gradient-1', 'gradient-2', 'gradient-3', 'gradient-4', 'gradient-5', 'gradient-6'])
        .default('gradient-1'),

      /* ── 转化字段 ── */
      /** 是否显示联盟推广披露（评测/优惠类文章应为 true） */
      affiliateNotice: z.boolean().default(true),
      /** 文章内推荐的主推套餐（关联 hostingerPlans 的 id） */
      featuredPlan: z.string().optional(),
      /** 文末 CTA 文案覆盖 */
      ctaHeadline: z.string().optional(),
      ctaBody: z.string().optional(),

      /* ── 结构化数据 ── */
      faqs: z.array(articleFaqSchema).default([]),

      /* ── 站点结构 ── */
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
      /** 阅读时长（分钟），不填则自动估算 */
      readingTime: z.number().int().optional(),
      /** 文章内的关键词，用于内链推荐与「相关文章」计算 */
      keywords: z.array(z.string()).default([]),
      /** 手动指定相关文章 */
      related: z.array(z.string()).default([]),
    }),
});

/* ══════════════════════════════════════════════════════════════
   优惠码集合
   数据源：src/content/coupons.yaml
   ══════════════════════════════════════════════════════════════ */

const coupons = defineCollection({
  loader: file('./src/content/coupons.yaml'),
  schema: z.object({
    /** 优惠码字符串，无码优惠填 "AUTO" */
    code: z.string(),
    title: z.string(),
    description: z.string(),
    /** 折扣力度描述，如 "省 75%" */
    discount: z.string(),
    /** 适用的产品大类 */
    appliesTo: z.array(z.string()).default([]),
    /** 是否自动应用（无需输入优惠码） */
    autoApplied: z.boolean().default(false),
    /** 有效期截止 */
    expiresAt: z.coerce.date().optional(),
    /** 是否推荐（置顶） */
    featured: z.boolean().default(false),
    /** 使用步骤 */
    steps: z.array(z.string()).default([]),
    /** 是否仍然有效（人工核验后更新） */
    verified: z.boolean().default(true),
    lastChecked: z.coerce.date(),
  }),
});

/* ══════════════════════════════════════════════════════════════
   作者集合
   ══════════════════════════════════════════════════════════════ */

const authors = defineCollection({
  loader: file('./src/content/authors.yaml'),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    bio: z.string(),
    /** 头像字母缩写 */
    initials: z.string(),
    expertise: z.array(z.string()).default([]),
    /** 署名页 URL */
    url: z.string().optional(),
  }),
});

/* ══════════════════════════════════════════════════════════════
   主机商对比集合（用于 Hostinger vs 竞品 对比内容）
   ══════════════════════════════════════════════════════════════ */

const competitors = defineCollection({
  loader: file('./src/content/competitors.yaml'),
  schema: z.object({
    name: z.string(),
    logo: z.string().optional(),
    /** 入门价（月均） */
    startingPrice: z.number(),
    rating: z.number().min(0).max(5),
    pros: z.array(z.string()).default([]),
    cons: z.array(z.string()).default([]),
    /** 与 Hostinger 的对比结论 */
    verdict: z.string(),
    /** 在哪些场景下更值得选 */
    betterFor: z.string().optional(),
  }),
});

export const collections = {
  hostingerPlans,
  articles,
  coupons,
  authors,
  competitors,
};
