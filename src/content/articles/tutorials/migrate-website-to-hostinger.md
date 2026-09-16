---
title: '网站迁移到 Hostinger：不停机搬迁的完整方案'
description: '从评估、备份、文件传输、数据库导入到 DNS 切换与验证的完整流程，含 WordPress 与非 WordPress 站点的不同处理方式，以及上线失败的应急回滚方案。'
excerpt: '迁移最大的风险不是技术难度，而是没有退路。这套方案的核心是让你在任何一步失败时都能原地回滚。'
pubDate: 2026-08-29
updatedDate: 2026-09-05
author: '苏晴'
category: tutorials
tags:
  - 网站迁移
  - DNS
  - 数据库
  - WordPress
heroImageAlt: '网站迁移流程与回滚节点示意'
theme: gradient-4
featured: false
affiliateNotice: true
featuredPlan: shared-business
readingTime: 14
keywords:
  - 网站迁移
  - 换主机
  - Hostinger迁移
  - WordPress搬家
ctaHeadline: 'Premium 及以上含免费迁移服务'
ctaBody: '不想自己动手？Premium 及以上套餐提供官方免费迁移，提交工单后由技术团队代为完成。'
faqs:
  - question: 迁移会导致网站下线吗？
    answer: '如果按本文的方案操作，不会。核心是把文件和数据库先在新主机上准备好，最后才切换 DNS。切换期间新旧主机同时可用，用户几乎感知不到。'
  - question: Hostinger 的免费迁移服务包含什么？
    answer: '包含文件、数据库与邮箱账户的完整迁移。你需要在 hPanel 提交工单，提供旧主机的访问信息（FTP 或面板账号），通常 24 小时内完成。'
  - question: 迁移后需要重新配置什么？
    answer: '至少三项：数据库里的站点 URL、SSL 证书、以及邮件相关的 DNS 记录（SPF/DKIM）。前两项最容易遗漏，会造成站点打不开或证书警告。'
  - question: DNS 切换后多久生效？
    answer: '取决于原 TTL 设置，从几分钟到 48 小时。建议在迁移前 24 小时先把 TTL 降到 300 秒，这样切换时生效最快。'
  - question: 迁移失败了怎么回滚？
    answer: '把 DNS 改回原主机的 IP 即可。这就是为什么我们建议不要动原主机的数据，直到新站验证完全通过。'
---

## 迁移前必须先做的三件事

多数迁移事故的根源不是技术操作失误，而是**没有准备好退路**。在开始之前，先完成这三项。

### 一、把 DNS 的 TTL 调低

TTL（Time To Live）决定了 DNS 记录在全球缓存中存活的时间。

**如果原 TTL 是 86400（24 小时）**，那你切换 DNS 后，最长可能要等 24 小时才全部生效。而在这期间，一部分访客访问新主机，一部分访问旧主机——如果新主机有问题，你无法快速回滚。

```text
操作：在原域名的 DNS 管理后台，把所有记录的 TTL 改为 300（5 分钟）
时间：迁移前 24 到 48 小时执行
```

调低 TTL 后要等至少一个原 TTL 周期，让旧的高 TTL 缓存自然过期。

### 二、完整备份原站

不是"应该备份"，而是**必须备份，并且验证备份可用**。

```bash
# 备份文件（在原主机上执行，或通过 FTP 下载）
tar -czf site-files-$(date +%Y%m%d).tar.gz public_html/

# 备份数据库
mysqldump -u 用户名 -p 数据库名 > site-db-$(date +%Y%m%d).sql

# 打包下载到本地
```

**验证备份**：确认压缩包能打开、SQL 文件不是空的（用 `wc -l site-db.sql` 看行数）、文件数量与预期一致。

这三项检查花不了一分钟，但能避免"备份了却恢复不了"这种最糟糕的情况。

### 三、记录当前配置

在切换之前，把原主机的这些信息记录下来，回滚时会用到：

| 项目 | 记录内容 |
| --- | --- |
| 原主机 IP | 用于回滚时改回 DNS |
| DNS 服务商 | 确认在哪改解析 |
| 邮件相关记录 | MX、SPF、DKIM 的当前值 |
| 当前 SSL 类型 | 自签名还是 Let's Encrypt |
| 重定向规则 | .htaccess 里的自定义规则 |

## 选择迁移方式

有三条路，按你的情况选：

| 方式 | 适用 | 耗时 | 风险 |
| --- | --- | --- | --- |
| 官方免费迁移 | Premium 及以上套餐，站点较复杂 | 24 小时（由官方操作） | 最低 |
| 插件迁移 | WordPress 站点 | 1 到 2 小时 | 低 |
| 手动迁移 | 非 WordPress，或需要完全控制 | 2 到 4 小时 | 中 |

**官方免费迁移是首选**。Premium 及以上套餐都包含这项服务，你只需要在 hPanel 提交工单，提供旧主机的 FTP 或面板信息，技术团队会代为完成。

但即使选择官方迁移，本文后面的验证步骤仍然需要你自己做——官方只负责搬数据，不负责确认你的站点功能正常。

## 手动迁移流程（非 WordPress / 需要自主控制）

### 步骤 1：在新主机创建站点

在 Hostinger hPanel 中：

1. 添加网站 → 选择「空网站」（如果后装 WordPress 则选 WordPress）
2. 绑定域名
3. 等待 SSL 证书签发（约 15 分钟）

**此阶段不要修改 DNS**，新站点通过临时地址访问，用户仍然访问旧主机。

### 步骤 2：上传文件

```bash
# 通过 SFTP 上传（推荐，支持断点续传）
sftp your-username@你的新IP

# 或用 rsync 直接从旧主机同步（最高效）
rsync -avz --progress \
  -e "ssh" \
  用户@旧主机IP:/path/to/public_html/ \
  用户@新主机IP:/path/to/public_html/
```

**关键细节**：如果站点包含大量小文件（如图片目录），用 rsync 会比 FTP 快得多，因为它能跳过已存在的文件。

### 步骤 3：导入数据库

**先在 hPanel 创建数据库**，然后通过 phpMyAdmin 导入：

1. hPanel → 数据库 → 找到新建的数据库 → 点击「管理」
2. 进入 phpMyAdmin 后选择该数据库
3. 点击「导入」→ 选择 SQL 文件 → 执行

**如果 SQL 文件超过 50MB**，phpMyAdmin 可能会因执行超时失败。这时用命令行导入：

```bash
# 通过 SSH（Business 及以上套餐提供）
mysql -u 用户名 -p 数据库名 < site-db.sql
```

或者分批导入：

```bash
# 把大 SQL 文件按行数拆分成多个小文件
split -l 10000 site-db.sql chunk_
```

### 步骤 4：修改配置文件

根据你的 CMS 或框架，修改对应的配置文件以指向新数据库：

```php
// WordPress: wp-config.php
define('DB_NAME', 'u123456789_newsite');
define('DB_USER', 'u123456789_newuser');
define('DB_PASSWORD', '新密码');
define('DB_HOST', 'localhost');
```

```php
// 通用 PHP 应用：config.php 或 .env
DB_HOST=localhost
DB_NAME=u123456789_newsite
DB_USER=u123456789_newuser
DB_PASS=新密码
```

### 步骤 5：更新数据库中的站点 URL（最容易遗漏）

这是迁移后"站点打不开"的最常见原因。数据库里存的还是旧域名的绝对路径。

```sql
-- 在 phpMyAdmin 中执行，把域名替换成实际的
UPDATE wp_options 
SET option_value = REPLACE(option_value, 'https://old-domain.com', 'https://new-domain.com') 
WHERE option_name IN ('siteurl', 'home');

UPDATE wp_posts 
SET guid = REPLACE(guid, 'https://old-domain.com', 'https://new-domain.com');

UPDATE wp_posts 
SET post_content = REPLACE(post_content, 'https://old-domain.com', 'https://new-domain.com');

-- 如果用了页面构建器（Elementor 等），还需清理它们的配置表
UPDATE wp_postmeta 
SET meta_value = REPLACE(meta_value, 'https://old-domain.com', 'https://new-domain.com');
```

**执行前先导出该表备份**。这类批量替换操作一旦出错很难撤销。

如果域名没有变（比如你只是换主机），这一步可以跳过。

## 在切换 DNS 之前：本地验证

这是整个流程中最关键的一步。**不要急着改 DNS**，先用 hosts 文件在本地把域名指向新主机，完整验证一遍。

### 方法一：修改本地 hosts 文件（推荐）

```bash
# Windows: C:\Windows\System32\drivers\etc\hosts
# macOS/Linux: /etc/hosts
# 需要管理员/root 权限编辑

# 添加这一行（替换成新主机 IP 和你的域名）
153.92.xx.xx    your-domain.com
153.92.xx.xx    www.your-domain.com
```

保存后清除本地 DNS 缓存：

```bash
# Windows
ipconfig /flushdns

# macOS
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Linux
sudo systemd-resolve --flush-caches
```

现在你在浏览器访问 `your-domain.com`，实际访问的是新主机，而**其他所有人的访客仍然访问旧主机**。这是完美的测试环境。

### 验证清单

```text
□ 首页正常加载，无样式丢失
□ 全站链接可点击，无 404
□ 图片全部显示（右键检查图片 URL 是否为域名而非旧 IP）
□ 登录后台成功
□ 发布一篇测试文章，确认能正常保存
□ 提交一次联系表单，确认收到邮件
□ HTTPS 正常，无证书警告
□ 手机端访问无异常
□ 如果有电商：测试加入购物车到结算的完整流程
□ 如果有会员功能：测试注册与登录
□ 检查是否有硬编码的旧 IP 地址（在源码里搜索）
```

**特别是最后一项**。有些主题或插件会把旧主机的 IP 硬编码在某些配置里，切换后会指向已经不存在的服务。

### 方法二：用 curl 直接指定 IP 测试

```bash
# 强制用指定 IP 访问，Host 头设为域名
curl -H "Host: your-domain.com" https://153.92.xx.xx/ -k -I

# 检查返回的状态码与 headers
```

## 切换 DNS

本地验证全部通过后，可以切换到正式环境。

```text
操作：在原域名的 DNS 管理后台
1. 找到指向旧主机的 A 记录
2. 把值改为新主机的 IP
3. www 的 CNAME 如果指向根域名，不需要改
4. 保存
```

**如果 DNS 由 Hostinger 管理**（你用了它的域名服务）：在 hPanel → 域名 → DNS 中修改。

### 切换后立即做的事

```bash
# 检查全球不同位置的解析情况
dig your-domain.com +short
nslookup your-domain.com 8.8.8.8
nslookup your-domain.com 1.1.1.1

# 用在线工具看全球传播情况（推荐）
# 搜索 "DNS propagation checker" 这类工具
```

由于你已经把 TTL 调到 300 秒，多数地区会在 10 分钟内生效。

## 迁移后的收尾工作

### 1. 重新签发 SSL

如果新主机是 Hostinger，SSL 通常是自动签发的。但切换 DNS 后需要确认状态：

```text
hPanel → 网站 → 你的域名 → SSL → 确认状态为 Active
```

如果显示 Pending 超过 1 小时，检查 DNS 是否已经正确解析到新主机。

### 2. 迁移邮件相关记录

**这一步最容易被忽略，后果是收不到邮件。**

| 记录 | 操作 |
| --- | --- |
| MX | 如果继续用原邮箱服务，保持不变；如果用 Hostinger 邮箱，改为 Hostinger 的 MX |
| SPF | 在 TXT 记录中更新为包含新发信服务器 |
| DKIM | 在 Hostinger 邮箱设置中启用，把生成的 TXT 记录添加到 DNS |

验证方法：给 Gmail 地址发一封邮件，查看原始邮件里的 `SPF: PASS` 和 `DKIM: PASS`。

### 3. 配置重定向（如有 URL 结构变化）

如果迁移过程改变了 URL 结构，需要在 `.htaccess` 中配置 301 重定向，避免 SEO 权重丢失：

```apache
# 如果从带日期的固定链接改为不带日期
RewriteEngine On
RewriteRule ^([0-9]{4})/([0-9]{2})/(.*)$ /$3 [R=301,L]
```

### 4. 更新搜索引擎

```text
□ Google Search Console：提交新的 sitemap
□ Bing Webmaster Tools：同样提交 sitemap
□ 如果有 Google Analytics：确认数据仍在收集
□ 检查 Search Console 的抓取错误，及时处理 404
```

### 5. 原主机保留 2 到 4 周

**不要立刻退掉原主机。** 保留一段时间有几个作用：

- 万一发现新主机有问题，可以快速回滚
- 部分访客的 DNS 缓存可能还没过期，仍会访问旧主机
- 可以对比两边数据，确认迁移完整

确认新站稳定运行 2 周后，再退掉原主机。

## 应急回滚流程

如果切换后发现严重问题（站点打不开、数据丢失、功能异常），按这个顺序回滚：

```text
1. 立即把 DNS 改回原主机 IP
   → 由于 TTL 是 300 秒，5 到 10 分钟内大部分访客会恢复正常

2. 确认原主机的数据未被修改
   → 这就是为什么不要提前删除或改动原站

3. 在本地（hosts 文件）继续排查新主机的问题
   → 不影响线上用户

4. 问题解决后再次切换
```

整个回滚过程约 10 分钟。这是把 TTL 调到 300 秒的最大价值——它给你留了一条随时可用的退路。

## 常见问题速查

| 现象 | 原因 | 解决 |
| --- | --- | --- |
| 站点显示旧内容 | 服务器缓存未清 | 清空缓存（hPanel + WordPress 插件） |
| 样式丢失 | 数据库里仍是旧域名 | 执行 URL 替换 SQL |
| 图片不显示 | 图片路径含旧域名 | 同上，或检查图片是否完整上传 |
| 后台 404 | .htaccess 未上传或规则错误 | 检查文件是否存在与权限 |
| 证书警告 | SSL 未签发完成或未强制 HTTPS | 等待签发，然后在 hPanel 开启强制 HTTPS |
| 收不到邮件 | MX / SPF / DKIM 未更新 | 逐项核对 DNS 记录 |
| 部分访客看到旧站 | DNS 缓存未过期 | 等待，或确认 TTL 已提前调低 |

## 最后

网站迁移看起来步骤很多，但它的逻辑其实很简单：**先在新地方把一切准备好并验证，最后才引导流量过去。**

绝大多数迁移事故都源于顺序错了——先切 DNS，再去新主机上调试。这时候用户已经在访问一个未完成的站点，而你想回滚还要再等一轮 DNS 传播。

所以最重要的一条建议是：**用 hosts 文件在本地完成验证，再动 DNS，并把 TTL 提前调低。** 做到这两点，你就有了一条随时可用的退路，迁移这件事的风险会降低一个量级。

如果你不想自己处理这些细节，Premium 及以上套餐的免费迁移服务值得用——官方团队完成迁移，你只需要按上面的清单做验证。
