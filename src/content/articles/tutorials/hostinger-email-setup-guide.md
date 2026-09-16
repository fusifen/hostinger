---
title: 'Hostinger 企业邮箱配置全流程：从 DNS 到收发验证'
description: '完整走一遍企业邮箱配置：MX 记录、SPF、DKIM、DMARC 逐条配好并验证。目标是让你的邮件不进制垃圾箱 —— 这一步 90% 的人会配错。'
excerpt: '完整走一遍 MX / SPF / DKIM / DMARC 配置与验证，避免邮件进垃圾箱'
pubDate: 2026-09-16
author: '苏晴'
category: tutorials
tags:
  - Hostinger邮箱
  - 企业邮箱
  - DNS配置
  - 邮件送达率
theme: gradient-2
affiliateNotice: true
featuredPlan: shared-premium
draft: true
readingTime: 15
keywords:
  - Hostinger 企业邮箱设置
  - Hostinger 邮箱怎么设置
  - Hostinger 免费企业邮箱配置
  - 域名邮箱 SPF DKIM 怎么配
  - 企业邮箱发信进垃圾箱怎么办
ctaHeadline: 'Premium 及以上套餐含 1 年免费企业邮箱'
ctaBody: 'Premium 套餐 ¥22/月起，赠送不限量商务邮箱（1 年）+ 1 年免费 .com 域名。单独买这两项每年也要几百元。'
faqs:
  - question: 'Hostinger 的免费邮箱能用自己域名吗？'
    answer: '可以。套餐内提供的企业邮箱支持绑定你自己的域名，配置方式跟付费邮箱一样，需要改 MX 记录和 SPF/DKIM。'
  - question: '邮箱收不到信怎么排查？'
    answer: '按顺序查：先用 dig 确认 MX 记录已生效，再检查 SPF 是否包含发信服务器、DKIM 记录是否可被查询到，最后看 DMARC 策略是否过严。三大项里任何一项配错都可能导致退信或进垃圾箱。'
  - question: '免费额度和付费邮箱差在哪？'
    answer: '主要在三点：存储容量（免费版较小）、账号数量（免费版有限制）、高级反垃圾与归档能力。个人站与企业官网用免费版足够，有合规归档需求的团队才需要升级。'
  - question: 'SPF、DKIM、DMARC 三个都要配吗？'
    answer: '建议三个都配。只配 SPF 能通过基础验证；加上 DKIM 才有内容签名防篡改；DMARC 则告诉收件方"验证失败时怎么处理"，也是 Gmail、Yahoo 等主流邮箱对新发信域名的硬性要求。'
  - question: '配置生效要等多久？'
    answer: 'DNS 记录通常 10 分钟到数小时生效，取决于 TTL 设置。可以用 dig 命令随时查询是否生效，不需要等到"感觉好了"才测试。'
  - question: '为什么自己发的邮件进了垃圾箱？'
    answer: '最常见三个原因：SPF 记录缺失或重复、DKIM 未配置、发信域名与 From 域不一致。其次是新域名的信誉度为 0，需要一段时间的正常收发来积累。'
---

## 开始之前你需要准备什么

- [ ] 一个已激活的 Hostinger 账户（邮箱功能包含在 Premium 及以上套餐）
- [ ] 一个已绑定的域名，且有权限修改它的 DNS 记录
- [ ] 一个能执行 `dig` 或 `nslookup` 的终端（Windows 用 PowerShell 也可以）
- **预计耗时**：约 30 分钟（不含 DNS 生效等待）
- **难度**：★★★☆☆

> 本教程涉及邮件认证的核心机制。这不是"可选项" —— 2024 年之后
> Gmail、Yahoo、Outlook 都开始强制要求发信域名配置 SPF + DKIM，
> 缺失会直接导致邮件被拒收或进垃圾箱。

## 第 1 步：在 hPanel 中创建邮箱账户

登录 hPanel，进入 **邮箱** 模块，点击「创建邮箱账户」。

填写时注意两点：

1. **邮箱地址**用你的域名后缀（如 `hello@yourdomain.com`），不要用免费邮箱域名
2. **密码**建议用密码管理器生成，邮箱账户是钓鱼攻击的首要目标

创建完成后，hPanel 会显示该邮箱的 **收发服务器地址**。记下它们，后面配 MX 要用：

```
收件（IMAP）: imap.hostinger.com    端口 993 (SSL)
发件（SMTP）: smtp.hostinger.com    端口 465 (SSL)
Webmail:      https://mail.hostinger.com
```

**完成后应该看到**：邮箱列表里出现你刚创建的账户，状态为「已激活」。

## 第 2 步：配置 MX 记录（决定能否收信）

MX 记录告诉全世界"发给这个域名的邮件该投递到哪台服务器"。
**这一步配错，邮件直接收不到。**

进入 DNS 管理，添加或修改 MX 记录：

| 类型 | 名称 | 值 | 优先级 | TTL |
| --- | --- | --- | --- | --- |
| MX | `@` | `mx1.hostinger.com` | 5 | 3600 |
| MX | `@` | `mx2.hostinger.com` | 10 | 3600 |

⚠️ **关键**：如果使用第三方 DNS（如 Cloudflare），要先把原有的 MX 记录**删除**，
不能有重复或冲突的记录。多个服务商的 MX 混用会导致邮件随机丢失。

```bash
# 验证 MX 记录是否生效
dig MX yourdomain.com +short

# 预期输出类似（数字是优先级）：
# 5 mx1.hostinger.com.
# 10 mx2.hostinger.com.
```

## 第 3 步：配置 SPF 记录（决定是否被判垃圾邮件）

SPF 是一条 TXT 记录，声明"哪些服务器有权以这个域名发信"。

| 类型 | 名称 | 值 | TTL |
| --- | --- | --- | --- |
| TXT | `@` | `v=spf1 include:_spf.mail.hostinger.com ~all` | 3600 |

**这条记录的规则**：

- 一个域名**只能有一条** SPF 记录。如果已有其他 SPF（比如你在用 SendGrid 发信），
  要**合并**而不是新增 —— 两条 SPF 会让验证直接失败
- `~all` 表示"软失败"（标记可疑但不拒收），比 `-all` 保守，适合初期
- 值里面用空格分隔多个 `include`，总长度不要超过 255 字符

```bash
# 验证 SPF
dig TXT yourdomain.com +short | grep spf

# 预期输出：
# "v=spf1 include:_spf.mail.hostinger.com ~all"
```

## 第 4 步：配置 DKIM 记录（决定内容是否被篡改）

DKIM 给每封邮件加数字签名，收件方用它验证"邮件内容没被中途修改"。

DKIM 的配置最麻烦的地方是：**公钥要从 hPanel 里取，不能抄别人的**。

1. 在 hPanel 的邮箱模块找到 **DKIM** 设置
2. 复制生成的选择器（selector）与公钥值
3. 添加一条 TXT 记录：

| 类型 | 名称 | 值 | TTL |
| --- | --- | --- | --- |
| TXT | `默认选择器._domainkey` | `v=DKIM1; k=rsa; p=你的公钥` | 3600 |

例如选择器如果是 `default`，记录名就是 `default._domainkey`。

⚠️ **公钥很长且不能有换行或空格**。从 hPanel 复制时确保完整，
被截断的 DKIM 记录会静默失效（不报错，但签名验证永远失败）。

```bash
# 验证 DKIM（把 default 换成你的实际选择器）
dig TXT default._domainkey.yourdomain.com +short

# 预期输出以 v=DKIM1 开头
```

```ini
# DNS 记录汇总（配完对照检查）
MX     @                    mx1.hostinger.com          优先级 5
MX     @                    mx2.hostinger.com          优先级 10
TXT    @                    v=spf1 include:_spf.mail.hostinger.com ~all
TXT    default._domainkey   v=DKIM1; k=rsa; p=<你的公钥>
TXT    _dmarc               v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
```

## 第 5 步：配置 DMARC 记录（决定验证失败怎么办）

DMARC 建立在 SPF 与 DKIM 之上，告诉收件方"如果前两项验证失败，你该怎么处理"。

| 类型 | 名称 | 值 | TTL |
| --- | --- | --- | --- |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com` | 3600 |

**策略（p）该怎么选**：

| 策略 | 含义 | 适用阶段 |
| --- | --- | --- |
| `p=none` | 只监控不处理，报告发到 rua | **初期必选** —— 先观察有没有误判 |
| `p=quarantine` | 验证失败的邮件进垃圾箱 | 监控一周无异常后再切 |
| `p=reject` | 验证失败的邮件直接拒收 | 确认配置完全正确后再用 |

**不要一上来就用 `p=reject`** —— 如果 SPF/DKIM 有任何配置疏漏，
你会把自己公司的正常邮件全部拒收掉。先用 `none` 跑一两周，
通过 rua 报告确认没有合法邮件被误判，再逐步收紧。

## 第 6 步：全链路验证

配完之后逐项确认。这一步别跳过 —— DNS 配错最可怕的地方是
**它不会报错**，只会让你的邮件悄悄进垃圾箱。

```bash
# 一次性检查四项记录
echo "=== MX ===";      dig MX yourdomain.com +short
echo "=== SPF ===";     dig TXT yourdomain.com +short | grep spf
echo "=== DKIM ===";    dig TXT default._domainkey.yourdomain.com +short
echo "=== DMARC ===";   dig TXT _dmarc.yourdomain.com +short
```

然后做**实际收发测试**，这是唯一能确认真实送达率的方法：

1. 用新邮箱给自己发一封（发到一个 Gmail 账号）
2. 在 Gmail 里打开该邮件 → 点「显示原始邮件」
3. 查找这三个字段：

```
Authentication-Results: mx.google.com;
    spf=pass
    dkim=pass
    dmarc=pass
```

**三项全 pass 才算配置成功。** 任何一项 fail 都要回到对应步骤排查。

## 第 7 步：接入邮件客户端

| 客户端 | 配置方式 |
| --- | --- |
| Outlook / Apple Mail | 手动添加账户，IMAP `imap.hostinger.com:993`，SMTP `smtp.hostinger.com:465` |
| 手机邮件 App | 选"其他"，填同样的服务器地址 |
| Webmail | 直接访问 `https://mail.hostinger.com`，无需配置 |

**认证方式**：用完整的邮箱地址作为用户名，密码用你在第 1 步设置的密码。
如果开启了二次验证，部分客户端需要用"应用专用密码"。

## 常见报错与排查

| 报错 / 现象 | 原因 | 解决方式 |
| --- | --- | --- |
| 收不到任何邮件 | MX 记录未生效或有冲突 | `dig MX` 确认；删除第三方 DNS 里的旧 MX |
| 能收不能发 | SMTP 端口被运营商封禁 | 改用 465 (SSL)，部分网络封 25 端口 |
| 发出的邮件进垃圾箱 | SPF/DKIM/DMARC 缺失或配置错误 | 按第 6 步验证三项是否全 pass |
| `spf=neutral` | 有两条以上 SPF 记录 | 合并成一条，DNS 里只能有一个 v=spf1 |
| `dkim=permerror` | 公钥被截断或选择器名不对 | 从 hPanel 重新完整复制公钥 |
| `dmarc=fail` | SPF 或 DKIM 至少一项失败 | DMARC 依赖前两项，先修好它们 |
| 邮件延迟数小时 | 新域名的信誉度低 | 正常，持续正常收发几周会改善 |
| 部分人的邮件收不到 | 对方服务器把新域名判为可疑 | 检查是否被列入黑名单（如 MXToolbox） |

## 验收清单

配完后逐条打勾：

- [ ] MX 记录已生效且无冲突
- [ ] SPF 记录只有一条，且包含 Hostinger 的发信服务器
- [ ] DKIM 公钥完整无截断，`dig` 能查到
- [ ] DMARC 记录存在，策略为 `p=none`（初期）
- [ ] 实测发信到 Gmail，SPF / DKIM / DMARC 三项全部 pass
- [ ] 手机与桌面客户端均能正常收发
- [ ] 已记录 rua 报告邮箱，准备一周后检查误判情况

## 下一步可以做什么

邮箱配好之后，通常接着要做的是给站点接 CDN 提速，
或者把邮箱接进事务性邮件服务（比如 WooCommerce 的订单通知）。

- [给 Hostinger 站点接上 CDN：国内访问提速的实操方案](/tutorials/hostinger-cdn-setup)
- [在 Hostinger 上搭建 WooCommerce 完整教程](/tutorials/woocommerce-on-hostinger-setup)
- [hPanel 面板完全指南](/tutorials/hpanel-complete-guide)

---

<!-- 待办清单（发布前逐项确认）：
  1. 核对 hPanel 中邮箱模块的实际入口名称（界面可能更新）
  2. 确认 mx1/mx2.hostinger.com 是否为当前官方推荐地址
  3. 把 draft 改为 false
-->
