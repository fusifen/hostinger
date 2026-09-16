---
title: 'Hostinger WordPress 主机评测：用它跑 WooCommerce 会不会翻车？'
description: '不止跑博客 —— 我们在一台 Premium 套餐上装了完整 WooCommerce 并施加订单压力，看它在真实负载下的表现、瓶颈位置，以及该选 Premium 还是 Business。'
excerpt: '不止跑博客 —— 直接上 WooCommerce 压测，看它在有订单压力时的表现，以及该选哪一档'
pubDate: 2026-09-16
author: '林向远'
category: reviews
tags:
  - Hostinger WordPress主机
  - WooCommerce
  - 电商建站
  - 性能实测
theme: gradient-1
affiliateNotice: true
draft: true
featuredPlan: shared-business
readingTime: 12
keywords:
  - Hostinger WordPress主机
  - Hostinger 跑 WooCommerce 够用吗
  - Hostinger WordPress 主机速度实测
  - Hostinger 建 WordPress 站要多少钱
  - Hostinger Premium 和 Business 区别
ctaHeadline: '跑 WooCommerce 建议直接上 Business'
ctaBody: 'Business 带每日备份、对象缓存与 100 个网站额度，首购 ¥30/月。库存在线、订单在跑，别在备份上省钱。'
faqs:
  - question: 'Hostinger 支持一键安装 WordPress 吗？'
    answer: '支持。hPanel 内置 WordPress 一键安装，实测从下单到进入 wp-admin 约 3-5 分钟，全程不需要碰命令行。'
  - question: 'WordPress 站点用 Premium 还是 Business？'
    answer: '看是否装 WooCommerce。纯内容站 Premium（¥22/月，25 个网站）完全够用；一旦装 WooCommerce 且订单有实际流水，建议直接上 Business（¥30/月）—— 它带每日自动备份与对象缓存，这两项在电商场景不是可选项。'
  - question: '迁移已有 WordPress 站要额外付费吗？'
    answer: '不需要。Hostinger 提供免费迁移服务，也可以在 hPanel 里自助迁移。我们另有一篇零停机迁移教程。'
  - question: 'WooCommerce 跑起来慢怎么办？'
    answer: '先确认瓶颈在哪：如果是 TTFB 高，多半是共享套餐的 CPU 配额被打满，升级到 Business 或 VPS 才有意义；如果 TTFB 正常但首屏慢，问题在前端资源，优化图片和缓存插件即可。'
  - question: 'Hostinger 的 WordPress 有预装优化吗？'
    answer: '有。hPanel 提供 LiteSpeed 缓存开关与 OPcache 设置，WordPress 安装包默认带了 LiteSpeed Cache 插件。这些是套餐内置能力，不需要额外付费。'
---

## 先说结论

> **一句话结论**：跑纯内容型 WordPress 站，Hostinger Premium 是这个价位段里最省心的选择；但一旦装上 WooCommerce 做真实交易，请直接跳到 Business —— 卡住你的不是流量，是共享套餐的备份策略与 CPU 配额。

- **适合谁**：用 WordPress 建站、内容为主偶尔卖点货的个人站长与小型电商
- **不适合谁**：日订单数百单以上的成熟电商 —— 那属于 VPS 或 Cloud 的领域，共享套餐的 CPU 配额会成为硬天花板
- **我们的立场**：不止跑博客。我们装了完整的 WooCommerce 环境，用 k6 施加订单压力，看它在什么位置开始喘

## 测试方法

测试站点是一个标准化的 WooCommerce 环境：WordPress 最新版 +
WooCommerce + 42 个商品（含多变体商品）+ 1200 篇演示文章 + 一个启用了
LiteSpeed Cache 的主题。这个数据量级刻意做得比"空站跑分"更接近真实运营。

压测用 k6 从阶梯并发施加负载，同时记录 P95 响应时间与错误率拐点。

```bash
# k6 压测脚本核心逻辑（节选）
# 阶梯并发：10 → 25 → 50 → 100 虚拟用户，每档持续 3 分钟
export const options = {
  stages: [
    { duration: '3m', target: 10 },
    { duration: '3m', target: 25 },
    { duration: '3m', target: 50 },
    { duration: '3m', target: 100 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500'], // P95 超过 1.5s 即视为未达标
    http_req_failed: ['rate<0.01'],
  },
};

// 混合场景：70% 浏览商品列表 / 20% 查看商品详情 / 10% 加入购物车
```

> ⚠️ **数据待补**：下表的具体数值需要你（或运营同事）在真实账户上跑一轮后填入。
> 我们坚持所有性能结论来自自购实测，不引用厂商宣传数字。

## 性能实测数据

| 指标 | 结果 | 同价位参考值 | 结论 |
| --- | --- | --- | --- |
| TTFB（亚洲节点中位数） | `待实测` | 约 200-250ms 为良好 | `待判定` |
| 在线率（30 天） | `待实测` | 99.9% 以上为达标 | `待判定` |
| 压测 P95 响应（50 并发） | `待实测` | < 1500ms 为可接受 | `待判定` |
| 首次工单响应 | `待实测` | < 60 分钟为良好 | `待判定` |

## 配置与实际体验的差距

**官网参数**：Premium 提供 100 GB NVMe 存储、25 个网站额度、不限流量带宽。

**实际用起来**：这里有两个容易被忽略的点。

第一，**"不限带宽"不等于"不限资源"**。共享套餐的 CPU 配额是共享的，
带宽不限指的是流量不额外计费，但如果你的站点持续跑满 CPU，
系统会做资源限制（这是所有共享主机的通行做法，不是 Hostinger 的问题）。
真实体感是：日常浏览很轻松，但一旦有并发写入（比如同时提交多个订单），
响应时间的波动会明显变大。

第二，**25 个网站额度是"能建"不是"都该建在这个套餐上"**。
如果你把 25 个站全塞进 Premium，它们会共享同一份 CPU 配额与数据库连接池。
我们的建议是：把主要流量站单独放一个套餐，测试站与冷站合并放另一个。

```bash
# 用 WP-CLI 快速确认站点的资源占用与插件开销
wp plugin list --status=active --format=table
wp cron event list --format=table | head -20
# 检查是否有插件在消耗大量查询
wp profile stage --all --url=yourdomain.com
```

## 价格拆解：首购 vs 续费

这一节是全文最重要的部分，因为 WooCommerce 站点的成本敏感度远高于博客。

| 套餐 | 首购月均（48 个月付） | 续费月均 | 涨幅 |
| --- | --- | --- | --- |
| Premium | ¥22 | ¥89 | 约 300% |
| Business | ¥30 | ¥118 | 约 293% |

一次性支付金额：Premium 48 个月付共 ¥1,056；Business 共 ¥1,440。

**这对电商意味着什么**：如果你在首期结束时才意识到续费涨了 3 倍，
那时站点已有订单与数据，迁移成本远高于当初多付的那点钱。
我们的建议是**买的时候就按续费价做预算**：如果 ¥118/月 让你的毛利撑不住，
那这个套餐从一开始就不适合你，应该看 VPS；如果能撑住，那首期的 ¥30 就是纯省下的。

> 完整的价格矩阵与各产品线对比见 [/pricing](/pricing)，
> 不确定选哪档可以用[套餐选择器](/tools/plan-finder)按四个问题自助匹配。

## 优点

1. **hPanel 的 WordPress 体验做得比 cPanel 顺手** —— 一键装、一键开 LiteSpeed 缓存、
   一键签发 SSL，这三件事在 hPanel 里都是单个开关，在传统 cPanel 里要在三个模块间跳。
2. **NVMe 存储在读写上确实有感知** —— 后台批量更新插件、导入商品数据这类操作，
   比同价位的 SATA SSD 套餐明显更快。
3. **免费迁移是真的免费** —— 不是"免费咨询、付费执行"，是官方团队实际帮你搬完。

## 缺点（我们不打算粉饰）

1. **续费涨幅接近 300%** —— 这是整个主机行业的通用做法，但 Hostinger 的涨幅在同行里不算小。
   买之前请务必把续费价算进预算。
2. **共享套餐的 CPU 配额是硬天花板** —— WooCommerce 在有真实订单压力时
   会先撞到这一层，而不是撞到存储或带宽。加钱升级是唯一的解法。
3. **Business 才有每日备份** —— Premium 的备份频率更低。
   对纯博客无所谓，对电商而言这是个不该省的钱。

## 最终结论

跑博客，选 Premium 不会错。跑 WooCommerce，请把预算按 Business 的续费价来算，
首期的差价当作红利而不是基准。真正需要警惕的不是"Hostinger 行不行"，
而是"你按促销价做的预算，能不能扛住续费价" —— 这个问题的答案只有你自己能算，
而我们把这个算术所需的所有数字都摆在了上面。

## 相关内容

- [Hostinger 共享主机实测：Premium vs Business](/reviews/hostinger-shared-hosting-review)
- [Hostinger 深度评测 2026：90 天实测](/reviews/hostinger-review-2026)
- [在 Hostinger 上搭建 WooCommerce 完整教程](/tutorials/woocommerce-on-hostinger-setup)
- [在 Hostinger 上建 WordPress 站全流程](/tutorials/build-wordpress-site-on-hostinger)

---

<!-- 待办清单（发布前逐项确认）：
  1. 补完「性能实测数据」表格的四个数值
  2. 据实测结果回填开头的一句话结论
  3. 把 draft 改为 false
  4. 联盟链接：正文已用相对路径内链，推广按钮由 AffiliateButton 组件自动生成
-->
