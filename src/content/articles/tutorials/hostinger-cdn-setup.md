---
title: '给 Hostinger 站点接上 CDN：国内访问提速的实操方案'
description: '从 Cloudflare 接入到回源配置、SSL 模式选择、缓存规则设置，一步步走完。最后用上线前后的 TTFB 对比来验证提速是否真实发生。'
excerpt: '从接入到回源配置，走完 CDN 全流程，并用上线前后的 TTFB 对比验证效果'
pubDate: 2026-09-16
author: '苏晴'
category: tutorials
tags:
  - Hostinger加速
  - CDN
  - Cloudflare
  - 国内访问优化
theme: gradient-2
affiliateNotice: true
featuredPlan: shared-business
draft: true
readingTime: 13
keywords:
  - Hostinger CDN 加速
  - Hostinger 怎么加速
  - Hostinger 国内访问慢怎么办
  - 网站接 CDN 教程
  - Cloudflare 回源配置
ctaHeadline: 'Business 套餐自带 Cloudflare CDN 集成'
ctaBody: 'Business 首购 ¥30/月，hPanel 内可一键开启 Cloudflare 集成，省去手动配置 DNS 的步骤。'
faqs:
  - question: 'Hostinger 自带 CDN 吗？'
    answer: '部分套餐包含 Cloudflare 集成，可在 hPanel 内一键开启并自动完成 DNS 接管。如果你用的是不含该功能的套餐，也可以手动注册 Cloudflare 免费版接入，效果一致。'
  - question: '接 CDN 会影响 HTTPS 吗？'
    answer: '正确配置下不会。关键是 SSL/TLS 加密模式要选"完全（严格）"，让 Cloudflare 到源站这一段也走加密；如果错选"灵活"，会出现重定向循环或源站证书被绕过的问题。'
  - question: 'CDN 对 SEO 有帮助吗？'
    answer: '间接有帮助 —— 页面加载速度是排名因素之一。但不要指望接入 CDN 后排名立刻上升，它优化的是速度这个子项，内容质量与关键词匹配才是主要变量。'
  - question: '为什么接了 CDN 国内还是很慢？'
    answer: '免费版 CDN 的节点分布不覆盖中国大陆，国内访问通常是绕道中国香港或新加坡节点。CDN 能减少回源次数从而提速，但无法消除跨境网络本身的延迟。要显著改善国内访问，需要考虑备案 + 国内 CDN。'
  - question: 'CDN 缓存会导致内容更新不生效吗？'
    answer: '会，这是最常见的新手困惑。改完内容后如果看到旧页面，先做一次强制刷新（清缓存），并检查该路径是否被缓存规则覆盖。动态页面（如 WordPress 后台、购物车）应配置为不缓存。'
---

## 开始之前你需要准备什么

- [ ] 一个正常运行的 Hostinger 站点（已绑定域名）
- [ ] 域名已启用 HTTPS（SSL 证书已签发）
- [ ] 一个 Cloudflare 账户（免费版即可）
- [ ] 能执行 `curl` 的终端，用于测量 TTFB
- **预计耗时**：约 25 分钟（含 DNS 生效等待）
- **难度**：★★☆☆☆

## 第 0 步：先测量基线

**先测基线，再动手。** 没有基线数据的优化等于盲调 ——
你不知道自己改了什么、改进了多少。

```bash
# 记录接入 CDN 前的 TTFB 基线（连续 10 次取中位数）
for i in $(seq 1 10); do
  curl -o /dev/null -s -w "%{time_starttransfer}\n" https://yourdomain.com/
  sleep 2
done | sort -n | awk '{a[NR]=$1} END {print "TTFB 中位数:", a[int(NR/2)+1], "秒"}'
```

把这个数字记下来，最后要用它和接入后的数字对比。

## 第 1 步：在 Cloudflare 添加站点

登录 Cloudflare → 「添加站点」→ 输入你的域名 → 选择 **Free 计划**。

Cloudflare 会自动扫描你现有的 DNS 记录。**这一步必须仔细核对** ——
扫描结果可能遗漏或误判，尤其是 MX 记录（配错了邮箱就不通了）。

**完成后应该看到**：两条分配给你的 Cloudflare 名称服务器地址，形如：

```
aria.ns.cloudflare.com
bob.ns.cloudflare.com
```

## 第 2 步：切换域名的名称服务器

回到你的域名注册商（或在 Hostinger 的 DNS 设置里），
把域名的 NS 记录改成 Cloudflare 给的那两条。

⚠️ **这是不可逆性最强的一步**。切换后所有 DNS 解析都由 Cloudflare 接管，
你在原服务商改 DNS 将不再生效。切换前请确认 Cloudflare 里的记录是完整的。

生效时间通常 10 分钟到 24 小时。查询进度：

```bash
# 查看当前生效的 NS
dig NS yourdomain.com +short

# 出现 Cloudflare 的地址即表示已生效
```

## 第 3 步：配置 DNS 记录与代理状态

在 Cloudflare 的 DNS 页面确认这两条记录存在，且**代理状态为橙色云朵**（已代理）：

| 类型 | 名称 | 内容 | 代理状态 |
| --- | --- | --- | --- |
| A | `@` | 你的 Hostinger IP | 🟠 已代理 |
| CNAME | `www` | `yourdomain.com` | 🟠 已代理 |

**橙色云朵 = 流量经过 CDN**（这是提速的关键）。
灰色云朵 = 仅 DNS 解析，流量直连源站，CDN 不起作用。

⚠️ **邮箱相关的记录必须是灰色云朵**：MX、以及 `mail` 子域名的 A 记录
不能走代理，否则邮件服务会失效。

```ini
# Cloudflare DNS 配置对照表
A      @        <Hostinger IP>          🟠 已代理   ← CDN 生效
CNAME  www      yourdomain.com          🟠 已代理   ← CDN 生效
A      mail     <Hostinger IP>          ⚪ 仅 DNS   ← 邮箱必须直连
MX     @        mx1.hostinger.com       ⚪ 仅 DNS   ← 邮箱必须直连
```

## 第 4 步：设置 SSL/TLS 加密模式

进入 **SSL/TLS** 设置，加密模式选择 **「完全（严格）」**。

| 模式 | 含义 | 是否推荐 |
| --- | --- | --- |
| 灵活 (Flexible) | Cloudflare 到源站走 HTTP | ✗ 会导致重定向循环 |
| **完全 (Full)** | Cloudflare 到源站走 HTTPS，不验证证书 | △ 可用但不严格 |
| **完全（严格）** | 到源站走 HTTPS 且验证证书有效 | ✓ **推荐** |

**为什么不能选"灵活"**：源站若已强制 HTTPS，会出现
"Cloudflare 发 HTTP 到源站 → 源站跳回 HTTPS → 又经过 Cloudflare" 的死循环，
表现为浏览器报「重定向次数过多」。

同时建议开启 **「始终使用 HTTPS」**，让 HTTP 请求自动跳转。

## 第 5 步：配置缓存规则

这一步决定了 CDN 到底能不能真正减轻源站负担。

**默认按扩展名缓存**已经能覆盖静态资源（图片、CSS、JS）。
关键是要**排除动态内容**，否则会出现"用户看到别人购物车"这类严重问题。

在「缓存规则」里为以下路径设置 **绕过缓存**：

| 路径模式 | 说明 |
| --- | --- |
| `/wp-admin/*` | WordPress 后台 |
| `/wp-login.php` | 登录页 |
| `/cart/*`, `/checkout/*` | 购物车与结算（重要） |
| `/my-account/*` | 用户账户页 |
| `*.php` | 所有 PHP 动态请求 |

```bash
# 验证缓存是否生效：重复请求同一张图片，看响应头
curl -sI https://yourdomain.com/wp-content/uploads/some-image.jpg | grep -i "cf-cache-status"

# 首次请求: cf-cache-status: MISS   （回源了）
# 二次请求: cf-cache-status: HIT    （CDN 命中，未回源）
```

看到 `HIT` 就说明缓存正常工作。

## 第 6 步：测量提速效果

回到第 0 步的方法，重新测一遍 TTFB，和基线对比：

```bash
# 接入 CDN 后的 TTFB
for i in $(seq 1 10); do
  curl -o /dev/null -s -w "%{time_starttransfer}\n" https://yourdomain.com/
  sleep 2
done | sort -n | awk '{a[NR]=$1} END {print "接入后 TTFB 中位数:", a[int(NR/2)+1], "秒"}'
```

**预期结果**：静态资源密集的页面提升明显（图片、CSS 由 CDN 就近返回）；
纯动态页面（如后台）提升有限，因为内容每次都要回源生成。

衡量收益要分开看这两个维度，别把"CDN 没用"和"这个页面本来是动态的"混为一谈。

## 第 7 步：开启推荐的附加优化

Cloudflare 免费版里有几个开关值得打开：

| 功能 | 位置 | 作用 |
| --- | --- | --- |
| Auto Minify | Speed → Optimization | 压缩 HTML/CSS/JS 体积 |
| Brotli | Speed → Optimization | 比 gzip 更好的压缩率 |
| Early Hints | Speed → Optimization | 提前推送关键资源 |
| HTTP/3 | Network | 更快的连接建立 |
| Bot Fight Mode | Security | 拦截基础爬虫与扫描 |

⚠️ **不要开启 Rocket Loader**（Speed 里）。它会延迟 JS 执行，
常导致 WordPress 主题或 WooCommerce 交互功能失效，是新手踩坑重灾区。

## 常见报错与排查

| 现象 | 原因 | 解决方式 |
| --- | --- | --- |
| 浏览器报「重定向次数过多」 | SSL 模式选了"灵活" | 改为「完全（严格）」 |
| 网站打不开，显示 522 | Cloudflare 连不上源站 | 确认源站 IP 正确、服务器在线 |
| 改了内容但页面不变 | CDN 缓存未刷新 | 强制清缓存；检查是否命中缓存规则 |
| 购物车内容错乱 | 动态页面被缓存 | 按第 5 步排除 `/cart/*` 等路径 |
| 邮箱突然收不到信 | MX 记录被误设为已代理 | 改为灰色云朵（仅 DNS） |
| 后台登录后跳回登录页 | Cookie 被缓存策略影响 | 排除 `/wp-admin/*`，关闭 Rocket Loader |
| 图片上传后显示不出来 | 缓存了 404 响应 | 清除该路径缓存 |

## 验收清单

- [ ] NS 已切换到 Cloudflare 并生效
- [ ] 主域名与 www 的记录均为橙色云朵
- [ ] 邮箱相关记录（MX、mail）为灰色云朵
- [ ] SSL 模式为「完全（严格）」，已开启始终使用 HTTPS
- [ ] 已为动态路径配置绕过缓存规则
- [ ] `cf-cache-status` 在二次请求时显示 HIT
- [ ] 已测得接入后的 TTFB，并与基线做了对比
- [ ] 购物车、登录等交互功能实测正常

## 关于国内访问的诚实说明

免费版 CDN 的价值在于**减少回源、就近返回静态资源**，
它能显著降低源站压力并提升重复访问速度。

但它**不解决跨境网络本身的延迟**。如果你的站点主要面向中国大陆用户，
免费 CDN 通常会把请求路由到中国香港或新加坡节点，
延迟会比直连源站好，但达不到国内节点的水平。

要真正解决国内访问速度，备案 + 国内 CDN 是绕不过去的路。
如果你的业务在国内，建议把这个问题作为独立项目来规划，
而不是指望免费 CDN 一次解决。

## 相关内容

- [Hostinger 企业邮箱配置全流程](/tutorials/hostinger-email-setup-guide)
- [Hostinger 站点提速 20 问：从 TTFB 到图片懒加载](/blog/hostinger-speed-optimization-faq)
- [Hostinger 速度与正常运行时间 90 天实测](/reviews/hostinger-speed-uptime-test)

---

<!-- 待办清单（发布前逐项确认）：
  1. 核对 Cloudflare 当前界面路径（产品 UI 更新频繁）
  2. 如你的套餐有 hPanel 内一键 Cloudflare 集成，补充截图位置说明
  3. 把 draft 改为 false
-->
