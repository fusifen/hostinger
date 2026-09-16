---
title: '在一个 Hostinger 账户里管理 10 个站点：目录规划与权限隔离'
description: 'Business 套餐给了 100 个网站额度，但"能建 100 个"不等于"都该建在同一个套餐里"。这篇讲清楚目录怎么分、权限怎么隔、哪些站必须迁走。'
excerpt: 'Business 有 100 个网站额度，但"能建"不等于"都该建"。讲清目录规划与权限隔离'
pubDate: 2026-09-16
author: '苏晴'
category: tutorials
tags:
  - Hostinger多站点
  - 建站工作室
  - 成本优化
  - 权限管理
theme: gradient-2
affiliateNotice: true
featuredPlan: shared-business
draft: true
readingTime: 14
keywords:
  - Hostinger 多站点管理
  - Hostinger 可以建几个网站
  - Hostinger 多站点怎么管理
  - 主机多站点成本优化
  - 建站工作室主机选型
ctaHeadline: 'Business 套餐 ¥30/月，含 100 个网站额度'
ctaBody: '折算下来每个站点成本不到 ¥0.3/月，但前提是你得管得过来 —— 这篇教程就是讲怎么管。'
faqs:
  - question: '一个套餐能建几个网站？'
    answer: 'Single 限 1 个，Premium 可建 25 个，Business 达 100 个。但额度只是上限，实际能跑多少取决于 CPU 与内存配额 —— 共享套餐下所有站点共用同一份资源。'
  - question: '多站点会互相拖慢吗？'
    answer: '会。共享套餐下站点的资源是共用的，一个站点的流量高峰会挤压其他站点。建议把主要流量站单独放一个套餐，测试站与冷站才做合并托管。'
  - question: '怎么给客户或同事分配权限？'
    answer: '不要共用主账户密码。在 hPanel 的用户管理里为每个人创建独立账号，按站点授予访问范围。这样既能审计操作，也能在人员变动时精确回收权限。'
  - question: '10 个站点的成本能压到多少？'
    answer: '按 Business 48 个月付计算，一次性 ¥1,440，摊到 10 个站点是每站每月约 ¥3；如果用满 100 个额度，理论上是每站每月不到 ¥0.3。但后者只有在站点都极轻量时才现实。'
  - question: '什么情况下该把站点迁到 VPS？'
    answer: '当某个站点的流量开始明显影响同账户的其他站点时，或需要自定义环境（特定 PHP 扩展、非 Web 服务）时。继续留在共享套餐会拖累所有人，加钱升级反而是最省的方案。'
---

## 开始之前你需要准备什么

- [ ] 一个 Hostinger **Business** 套餐（100 个网站额度，共享主机里的顶配）
- [ ] 一份当前所有站点的清单（域名、用途、预估月访问量）
- **预计耗时**：首次规划约 1 小时，之后维护成本极低
- **难度**：★★☆☆☆

> 这篇教程不教怎么建站，教的是**怎么组织**。
> 建站本身很简单，难的是当你手里有 10 个站之后，还能清楚地知道
> 哪个站在哪、谁能改什么、出问题时从哪查。

## 第一步：先按"资源特征"给站点分类

这是全文最重要的一步。**不要按客户或按上线时间分组**，
要按站点的资源特征分组 —— 因为它决定了该怎么分配套餐。

| 类型 | 特征 | 该放哪 |
| --- | --- | --- |
| **主力站** | 有真实流量、有交易或转化目标 | 独立套餐，或独占一个账户 |
| **展示站** | 企业官网，访问量低但要求稳定 | 可与其他展示站合并 |
| **测试站** | 开发调试用，随时可重置 | 单独放，且尽量用子域名 |
| **冷站** | 长期不更新，但要保持在线 | 可合并，但要留意资源占用 |

**判断标准很简单**：如果一个站点的流量高峰会影响到另一个站点，
它们就不该共享同一份资源配额。

## 第二步：规划目录结构

hPanel 里每个网站有独立的根目录，但你可以按自己的逻辑组织。
推荐按「站点用途」而不是「域名」来命名，方便日后批量操作：

```
~/domains/
├── yourdomain.com/              # 主力站
│   └── public_html/
├── client-a.com/                # 客户展示站
│   └── public_html/
├── client-b.com/
│   └── public_html/
├── test-staging.com/            # 测试站
│   └── public_html/
└── archive-old.com/             # 冷站
    └── public_html/
```

**为什么不按域名首字母分组**：当你需要"批量备份所有客户站"或
"暂停全部测试站"时，按用途分组能让你一条命令搞定。

```bash
# 用 WP-CLI 巡检所有站点的状态（把域名列表写进变量）
SITES="yourdomain.com client-a.com client-b.com"

for site in $SITES; do
  echo "── $site ──"
  wp core version --path=~/domains/$site/public_html --allow-root 2>/dev/null
  wp plugin list --status=active --format=count --path=~/domains/$site/public_html --allow-root 2>/dev/null | xargs echo "  活跃插件数:"
done
```

## 第三步：给每个站点建独立的数据库

**绝对不要多个站点共用一个数据库。** 这不是洁癖，是故障隔离的基本要求 ——
一个站点的插件跑飞把数据库打满，不能连带拖垮其他所有站。

命名用统一的规则，方便识别归属：

```
wp_yourdomain     → yourdomain.com
wp_clienta        → client-a.com
wp_clientb        → client-b.com
```

```sql
-- 每个站点一个独立数据库 + 独立用户（禁止跨站访问）
CREATE DATABASE wp_yourdomain CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'user_yourdomain'@'localhost' IDENTIFIED BY '<强密码>';
GRANT ALL PRIVILEGES ON wp_yourdomain.* TO 'user_yourdomain'@'localhost';
FLUSH PRIVILEGES;
```

⚠️ **`GRANT ... ON wp_yourdomain.*` 里的库名不能写成 `*`** ——
那会让一个站点被入侵时，攻击者能读到所有站的数据。

## 第四步：配置权限隔离

如果你会交给同事或外包处理部分站点，权限必须收窄。

**错误做法**：把主账户密码给出去，让对方"自己注意不要碰别的站"。
**正确做法**：在 hPanel 的用户管理里为每个人创建独立账号，按站点授权。

| 角色 | 建议权限 | 说明 |
| --- | --- | --- |
| 你（主） | 全部站点 | 保留主账户，不用于日常操作 |
| 运维同事 | 全部站点的文件与数据库 | 可处理故障，但不给支付权限 |
| 内容编辑 | 指定站点的文件访问 | 只给需要维护的那几个站 |
| 外包开发 | 单个测试站 | 项目结束后立即回收 |

**关键原则**：权限给到"刚好够用"为止。
人员变动时，回收一个子账号比换主密码影响面小得多。

```bash
# 排查权限过宽的常见问题：检查文件属主与权限
find ~/domains -type d -perm -0777 2>/dev/null | head

# 目录应为 755，文件应为 644，不要出现 777
find ~/domains -type f -perm -0777 2>/dev/null | head
```

## 第五步：算清楚成本，决定谁留下谁迁走

这是标题里"10 个站点"的真正含义 —— 我们要看摊薄后的单价。

| 方案 | 一次性支出（48 个月付） | 摊到 10 个站 | 摊到 100 个站 |
| --- | --- | --- | --- |
| Business 共享 | ¥1,440 | 每站每月约 ¥3 | 每站每月不足 ¥0.3 |

纸面上 100 个站点的单价低得诱人。**但这是理论值** ——
前提是这些站点都极轻量（静态站、几乎无访问）。

真实的约束不是网站额度，而是 **CPU 与内存配额**。
10 个正常运营的 WordPress 站在一个共享套餐里，资源竞争会开始显现；
100 个则是完全不现实的。

**理性的分配策略**：

1. 主力站 → 独立套餐或 VPS（不要和其他站抢资源）
2. 展示站与冷站 → 合并到 Business，这是它发挥价值的地方
3. 测试站 → 可以留在共享套餐，但确保不占用生产资源

## 第六步：建立统一的维护流程

多站点最怕的不是建站，是**忘记维护**。这些事要定期做：

```bash
# 巡检脚本：检查各站点的可用性与证书有效期
SITES="yourdomain.com client-a.com client-b.com"

for site in $SITES; do
  code=$(curl -o /dev/null -s -w "%{http_code}" https://$site/ --max-time 10)
  days=$(echo | openssl s_client -servername $site -connect $site:443 2>/dev/null \
    | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
  echo "$site  HTTP:$code  证书到期:$days"
done
```

建议的维护节奏：

| 频率 | 项目 |
| --- | --- |
| 每周 | 检查可用性、确认备份成功 |
| 每月 | 更新插件与主题、查证书剩余有效期 |
| 每季度 | 审查站点清单，下线不再需要的站 |
| 每年 | 核对续费成本，重新评估套餐分配 |

## 常见报错与排查

| 现象 | 原因 | 解决方式 |
| --- | --- | --- |
| 全站变慢，不只一个站 | 某个站点跑满 CPU 配额 | 用资源监控找出高占用站点，考虑迁走 |
| 某站数据库连接失败 | 连接数被其他站点占满 | 为各站限制最大连接数，隔离影响 |
| 改了一个站，另一个站也变了 | 误共用同一个目录或库 | 检查文档根路径与数据库配置 |
| 权限混乱，不知谁改的 | 多人共用主账户 | 按第四步建独立子账号 |
| 备份文件太大 | 把冷站的备份也一起打包 | 分站点备份，冷站降低频率 |
| 证书过期导致某站打不开 | 自动续期失败 | 排查 80 端口是否被防火墙挡 |

## 验收清单

- [ ] 已按资源特征给所有站点分类
- [ ] 每个站点有独立目录，命名能反映用途
- [ ] 每个站点有独立数据库与独立数据库用户
- [ ] 每个协作者有独立子账号，权限范围明确
- [ ] 已算出摊薄后的单站成本，并据此规划了套餐分配
- [ ] 已建立定期巡检脚本与维护节奏表
- [ ] 确认没有出现 777 权限的文件或目录

## 什么时候该把站点迁到 VPS

出现以下任一情况，说明共享套餐已经不适合了：

- 某个站点的流量高峰会明显拖慢同账户的其他站点
- 需要自定义 PHP 扩展或运行非 Web 服务（如 Node.js）
- 站点数量虽多，但你需要对每个站做独立的资源限制

继续挤在共享套餐上的代价是**所有站点一起变慢**，
而升级到 VPS 换来的独立资源，往往比想象中便宜。

- [Hostinger VPS 与 Cloud Hosting 怎么选：五个问题](/blog/hostinger-vps-vs-cloud)
- [Hostinger VPS 新手 18 问](/blog/hostinger-vps-beginner-faq)
- [Hostinger 与同行多站点成本对比](/blog/hostinger-agency-multisite-cost)

---

<!-- 待办清单（发布前逐项确认）：
  1. 核对 hPanel 用户管理模块的实际入口名称
  2. 确认 Business 当前网站额度（数据来自项目内 plans 数据）
  3. 把 draft 改为 false
-->
