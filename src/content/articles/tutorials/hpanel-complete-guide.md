---
title: 'hPanel 使用指南：Hostinger 控制面板的 12 个必备操作'
description: 'hPanel 是 Hostinger 自研的控制面板，替代 cPanel。这篇文章覆盖文件管理、数据库、邮箱、SSL、备份、DNS 等 12 项高频操作的具体路径。'
excerpt: '从 cPanel 迁移过来会觉得陌生。这份指南把最常用的 12 项操作按场景整理出来，附具体路径。'
pubDate: 2026-09-04
updatedDate: 2026-09-10
author: '苏晴'
category: tutorials
tags:
  - hPanel
  - 控制面板
  - 文件管理
  - 数据库
heroImageAlt: 'hPanel 控制面板功能分区示意'
theme: gradient-3
featured: false
affiliateNotice: true
featuredPlan: shared-business
readingTime: 12
keywords:
  - hPanel教程
  - Hostinger控制面板
  - hPanel怎么用
  - cPanel替代
ctaHeadline: 'Business 套餐含优先支持通道'
ctaBody: '如果你在面板操作上遇到卡点，Business 及以上套餐提供优先支持的工单通道，响应更快。'
faqs:
  - question: hPanel 和 cPanel 有什么区别？
    answer: 'hPanel 是 Hostinger 自研面板，界面更简洁，主要功能都有对应。少数 cPanel 的高级功能（如某些邮件过滤规则）在 hPanel 上需要提工单处理。'
  - question: hPanel 里能管理多个网站吗？
    answer: '可以。左侧「网站」模块会列出你账户下的全部站点，点击任一站点进入它的独立管理面板，配置互不影响。'
  - question: 文件管理器支持在线解压吗？
    answer: '支持 zip、tar、gz 等常见格式。上传压缩包后右键选择解压即可，比 FTP 逐个上传快很多。'
  - question: 数据库可以在线管理吗？
    answer: '可以。hPanel 集成了 phpMyAdmin，点击数据库名称旁的「管理」即可进入，无需单独登录。'
---

## hPanel 的设计思路

Hostinger 用自研的 hPanel 取代了行业通用的 cPanel，出发点是简化。cPanel 有上百个图标，多数人一辈子用不到一半。

hPanel 把功能收敛成五个模块：**网站、域名、邮箱、文件、高级**。你要找的功能基本都能在这五处找到。

下面按实际使用场景把 12 项高频操作整理出来。

## 场景一：文件与代码

### 操作 1：上传与解压文件

**路径**：文件 → 文件管理器 → public_html

`public_html` 是你网站的根目录。上传文件有两个方式：

- 直接拖拽到文件管理器窗口
- 点击右上角上传按钮，或使用 FTP 客户端

**实用技巧**：如果文件数量多，先在本地打包成 zip，上传后在文件管理器里右键选择「解压」。这比逐个上传快数倍。

```bash
# 本地打包（在终端执行）
zip -r site-backup.zip ./public_html

# 上传后在 hPanel 文件管理器中：右键 → 解压
```

### 操作 2：修改文件权限

**路径**：文件管理器 → 选中文件 → 右键 → 更改权限

权限用三位数字表示，理解这三个数字能解决 80% 的权限问题：

| 权限 | 含义 | 适用 |
| --- | --- | --- |
| 644 | 所有者可读写，其他人只读 | 普通文件，如 .html .css .js |
| 755 | 所有者可读写执行，其他人读执行 | 目录、可执行脚本 |
| 600 | 只有所有者可读写 | 配置文件，如 wp-config.php |

**常见错误**：把整个目录设为 777。这会让任何人对你的文件有完全控制权，是严重的安全漏洞。如果某个操作要求 777 才能运行，正确做法是调整文件所有者，而不是放宽权限。

### 操作 3：编辑文件内容

在文件管理器里双击文本文件（.php .css .js .htaccess），会在内置编辑器中打开。

修改 `.htaccess` 前**一定要先备份**。这个文件的语法错误会直接导致整站 500 错误，而错误信息不会告诉你哪一行有问题。

```apache
# 常用的 .htaccess 规则示例

# 强制 HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# 限制上传文件大小（需与 php.ini 配合）
php_value upload_max_filesize 64M
php_value post_max_size 64M
```

如果改错了导致 500 错误，用文件管理器把 `.htaccess` 重命名为 `.htaccess.bak`，站点会恢复（因为文件不存在时服务器会忽略它），然后再逐步排查。

## 场景二：数据库

### 操作 4：创建数据库与用户

**路径**：网站 → 你的域名 → 数据库 → 创建数据库

需要填三项：

1. **数据库名**——会被自动加上账户前缀，如 `u123456789_site`
2. **用户名**——同样加前缀
3. **密码**——用生成器生成的强密码

创建后**立刻把这三项信息保存到密码管理器**。Hostinger 不会再显示密码，忘记了只能重置。

### 操作 5：用 phpMyAdmin 管理数据

**路径**：数据库列表 → 对应数据库右侧「管理」

hPanel 集成了 phpMyAdmin，点击后直接进入，不需要单独登录。常用操作：

- 导出数据库（导出 → 快速 → SQL 格式）
- 导入 SQL 文件（导入 → 选择文件 → 执行）
- 修改站点 URL（在 `wp_options` 表里改 `siteurl` 和 `home` 两行）

**WordPress 迁移后的必备操作**：如果迁移后站点打不开，多半是数据库里的 URL 还是旧域名。在 phpMyAdmin 里执行：

```sql
-- 把 old-domain.com 换成新域名
UPDATE wp_options SET option_value = REPLACE(option_value, 'https://old-domain.com', 'https://new-domain.com') WHERE option_name IN ('siteurl', 'home');

UPDATE wp_posts SET guid = REPLACE(guid, 'https://old-domain.com', 'https://new-domain.com');
UPDATE wp_posts SET post_content = REPLACE(post_content, 'https://old-domain.com', 'https://new-domain.com');
```

## 场景三：邮箱

### 操作 6：创建邮箱账户

**路径**：邮箱 → 邮箱账户 → 创建邮箱

Premium 及以上套餐含不限量邮箱账户（首年免费）。填写用户名、密码、可选的显示名。

创建后有两种使用方式：

- **网页端**：Hostinger 提供 Webmail 界面，登录 `webmail.你的域名` 即可
- **客户端**：用 IMAP 配置到 Outlook、Apple Mail 或手机邮件应用

IMAP 配置参数（创建后会显示，也可在邮箱设置里查到）：

| 项目 | 值 |
| --- | --- |
| 接收服务器 | imap.hostinger.com |
| 端口 | 993（SSL） |
| 发送服务器 | smtp.hostinger.com |
| 端口 | 465（SSL） |

### 操作 7：配置 SPF 与 DKIM（提高送达率）

**路径**：邮箱 → 域名 → DNS 记录

这一步很多人跳过，结果是发出的邮件进入对方垃圾箱。

Hostinger 会自动添加 SPF 记录，但 DKIM 需要手动开启。在邮箱设置里找到 DKIM 部分，点击启用，然后按提示把生成的 TXT 记录添加到 DNS。

验证方法：给一个 Gmail 地址发邮件，收到后点右上角"显示原始邮件"，检查 `SPF: PASS` 和 `DKIM: PASS`。

## 场景四：域名与 SSL

### 操作 8：管理 DNS 记录

**路径**：域名 → DNS / 名称服务器

常用记录类型：

| 类型 | 用途 | 示例 |
| --- | --- | --- |
| A | 域名指向 IP 地址 | `@` → `153.92.x.x` |
| CNAME | 域名指向另一个域名 | `www` → `example.com` |
| MX | 邮件服务器 | `@` → `mx1.hostinger.com` |
| TXT | 验证与策略记录 | SPF、DKIM、域名验证 |

**修改 DNS 后注意**：生效时间取决于原 TTL 设置，从几分钟到 24 小时不等。在修改前先把 TTL 调小（比如 300 秒），能让后续修改生效更快。

### 操作 9：安装与续期 SSL

**路径**：网站 → 你的域名 → SSL

Hostinger 的 SSL 是自动签发与自动续期的，通常不需要手动操作。但需要确认两件事：

1. **状态为 Active**——在 SSL 页面查看
2. **已开启强制 HTTPS**——同一页面的开关

如果 SSL 状态长时间（超过 1 小时）显示为 Pending，通常是域名解析还没生效。SSL 签发需要验证域名所有权，解析没生效就无法验证。

## 场景五：备份与性能

### 操作 10：创建与恢复备份

**路径**：文件 → 备份

Hostinger 提供两套备份机制：

| 类型 | 频率 | 保留期 | 适用套餐 |
| --- | --- | --- | --- |
| 自动备份（快照） | 每周 | 4 周 | 全部 |
| 自动备份（每日） | 每日 | 7 天 | Business 及以上 |
| 手动备份 | 按需 | 按需 | 全部 |

**每天备份只在 Business 及以上提供。** 这是我们建议商业站点选 Business 的核心原因之一——每周备份意味着最坏情况下损失 6 天的数据。

恢复操作：在备份列表里找到时间点，点击「恢复」。**这会覆盖当前站点全部内容**，恢复前先手动做一次当前备份，万一恢复到的是错误的时间点还能回退。

### 操作 11：配置缓存

**路径**：网站 → 你的域名 → 高级 → LiteSpeed 缓存

如果你是 WordPress 用户，更推荐在 WordPress 后台装 LiteSpeed Cache 插件（管理界面更完整）。但 hPanel 层面的这几项建议保持开启：

- **浏览器缓存**——让访客浏览器缓存静态资源（开启）
- **LiteSpeed 缓存**——服务端页面缓存（开启）
- **Gzip 压缩**——压缩传输内容（开启）

配置完成后用 PageSpeed Insights 验证。

### 操作 12：查看访问日志与资源占用

**路径**：网站 → 你的域名 → 高级 → 统计 / 日志

两个最有用的报表：

**访问日志**——显示每一个请求的 IP、时间、URL、状态码。排查 404 错误、异常抓取、爬虫压力时必看。

**资源使用**——显示 CPU、内存、I/O 的占用曲线。如果你的站点突然变慢，先看这个：如果 CPU 长期接近上限，说明共享资源不够用了，需要考虑升级到 Cloud 或 VPS。

```bash
# 在文件管理器的终端（Business 及以上提供 SSH）里排查高 CPU 请求
# 找出访问量最高的 URL
awk '{print $7}' access.log | sort | uniq -c | sort -rn | head -20

# 找出访问最频繁的 IP
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -10
```

## 从 cPanel 迁移的对照表

如果你习惯了 cPanel，这张表能帮你快速定位：

| cPanel 功能 | hPanel 位置 |
| --- | --- |
| File Manager | 文件 → 文件管理器 |
| MySQL Databases | 网站 → 域名 → 数据库 |
| phpMyAdmin | 数据库 → 管理 |
| Email Accounts | 邮箱 → 邮箱账户 |
| Zone Editor | 域名 → DNS |
| SSL/TLS | 网站 → 域名 → SSL |
| Backup Wizard | 文件 → 备份 |
| Cron Jobs | 高级 → Cron 任务 |
| SSH Access | 高级 → SSH（Business 及以上） |
| Error Log | 网站 → 域名 → 高级 → 日志 |

## 三个容易踩的坑

### 一、改 .htaccess 前没备份

这是最常见的严重错误。`.htaccess` 的语法错误会让整站返回 500，而且错误日志不会指明具体行号。改之前先下载一份，或者先重命名备份。

### 二、public_html 里放错目录

WordPress 文件必须直接在 `public_html` 下，而不是 `public_html/wordpress/` 下。如果放错了，访问域名会显示目录列表或空页面。解决方法是把内层文件全部移动到 `public_html`。

### 三、忘记数据库前缀

hPanel 创建的数据库和用户都会加上账户前缀。在 `wp-config.php` 里填写时必须用完整名称（含前缀），而不是你在创建时输入的短名。这也是 WordPress 报"建立数据库连接时出错"的最常见原因。

排查方法：看 `wp-config.php` 里的 `DB_NAME`、`DB_USER`，与 hPanel 数据库页面显示的名称逐字比对。
