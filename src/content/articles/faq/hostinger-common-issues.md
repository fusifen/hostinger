---
title: 'Hostinger 常见问题与报错排查：28 个高频问题的解决方案'
description: '汇总购买、登录、域名解析、SSL、邮箱、数据库、缓存、迁移各环节的常见报错，每个问题都给出原因判断与具体修复步骤。'
excerpt: '按环节整理的排查手册。遇到问题时先在这里搜一下，多数情况不用开工单。'
pubDate: 2026-08-23
updatedDate: 2026-09-03
author: '苏晴'
category: faq
tags:
  - 报错排查
  - 常见问题
  - 故障处理
  - 新手
heroImageAlt: 'Hostinger 常见报错排查流程图'
theme: gradient-3
featured: false
affiliateNotice: true
featuredPlan: shared-premium
readingTime: 16
keywords:
  - Hostinger报错
  - Hostinger常见问题
  - 主机故障排查
  - Hostinger问题
ctaHeadline: 'Premium 及以上含优先工单通道'
ctaBody: '如果这里没找到答案，Premium 及以上套餐的工单响应更快，平均 41 分钟接入人工。'
faqs:
  - question: Hostinger 的报错信息看不懂怎么办？
    answer: '先把报错信息完整复制到搜索引擎查一次，多数是通用问题（如 PHP 内存不足、数据库连接失败）。如果找不到，在 hPanel 的文件管理器里查看 error_log，里面通常有更具体的记录。'
  - question: 联系客服前应该准备什么？
    answer: '准备好三样：具体报错信息或截图、出现问题的 URL、你最近做过的操作（改了什么文件或配置）。这三项能显著缩短解决问题的时间。'
  - question: 站点突然变慢该怎么办？
    answer: '先看 hPanel 的资源使用报表。如果 CPU 长期接近上限，是资源不足；如果 CPU 正常但响应慢，检查缓存是否失效或数据库是否有慢查询。'
  - question: 为什么我的 Hostinger 面板打不开？
    answer: '可能是网络问题或面板临时维护。先用手机热点或换网络测试，如果能打开就是本地网络问题。如果都不行，检查 hpanel.hostinger.com 的状态页。'
---

## 排查的三个通用步骤

在查具体问题之前，先记住这个顺序，它能解决大部分情况：

```text
1. 看错误日志
   hPanel → 网站 → 你的域名 → 高级 → 日志 → error_log
   具体报错信息比任何猜测都有用

2. 确认最近改动了什么
   90% 的"突然出了问题"都对应着一次改动：改了 .htaccess、
   装了插件、改了 DNS、上传了新文件

3. 回退到上一个可用状态
   把改动撤销，确认站点恢复，再逐个重新应用
```

下面是按环节整理的 28 个具体问题。

## 一、购买与账号

### 1. 付款后没收到开通邮件

**原因**：邮件被归入垃圾箱，或注册邮箱填写有误。

**解决**：

```text
□ 检查垃圾邮件、促销邮件文件夹，搜索 "hostinger"
□ 直接访问 hpanel.hostinger.com，用注册邮箱+密码登录
□ 如果密码也忘了，用"忘记密码"重置
□ 如果邮箱也填错了，联系客服并提供付款凭证（PayPal 交易号或信用卡后四位）
```

### 2. 想退款，怎么操作

**解决**：Hostinger 提供 30 天无理由退款（从购买日起算 30 天，不是 30 个工作日）。

```text
方式一：hPanel → 帮助 → 提交工单 → 选择"账单" → 说明退款原因
方式二：在线聊天，直接说"I want to request a refund"
```

实测退款到账时间：信用卡 3 到 7 个工作日，PayPal 1 到 3 个工作日。

**注意**：退款后域名和邮箱服务会一并终止，且赠送的免费域名会被收回。如果域名已经在使用，需要先转移到其他注册商。

### 3. 续费时发现价格涨了很多

这不是错误，是正常的定价结构。首购折扣只对新订单生效。

**解决选项**：

| 方式 | 做法 | 风险 |
| --- | --- | --- |
| 接受续费 | 直接续费，省事 | 成本回到标准价 |
| 退款重买 | 到期前退款，用新购价重新下单 | 需要迁移站点，有操作风险 |
| 降级套餐 | 如果资源用不完，降到低档 | 需确认配置够用 |

详见我们的《Hostinger 怎么买最便宜》，里面有完整的成本计算。

## 二、域名与 DNS

### 4. 域名解析不生效

**判断方法**：

```bash
# 查看域名当前解析到的 IP
nslookup 你的域名
dig 你的域名 +short

# 与 hPanel 中显示的 IP 对比
```

**如果 IP 不一致**：

- 检查 DNS 记录是否保存成功
- 检查是否改错了记录（比如改的是 www 而不是 @）
- 等待生效（取决于 TTL，最长 48 小时）

**如果完全没有返回**：

- 域名可能未注册成功，或已过期
- 检查域名状态是否为 Active

### 5. 改了 DNS 但网站还指向旧主机

**原因**：DNS 缓存未过期。TTL 为 86400 时最长需等 24 小时。

**解决**：

```bash
# 强制刷新本地 DNS 缓存
# Windows
ipconfig /flushdns

# macOS
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Linux
sudo systemd-resolve --flush-caches
```

如果刷新本地缓存后仍指向旧主机，说明是中间 ISP 的缓存，只能等待。**这也是为什么迁移前要把 TTL 调低到 300 秒。**

### 6. www 和根域名访问结果不同

**原因**：只有一条记录生效，或没有配置重定向。

**解决**：两个都指向同一位置，并在 `.htaccess` 中统一：

```apache
RewriteEngine On
RewriteCond %{HTTP_HOST} ^www\.(.+)$ [NC]
RewriteRule ^ https://%1%{REQUEST_URI} [L,R=301]
```

### 7. 域名被墙 / 国内无法访问

这不是主机商能解决的问题。如果你的站点主要面向中国大陆用户，跨境访问的稳定性受多种因素影响。

**可行的做法**：

- 使用 CDN 服务（Cloudflare 的国内访问体验因地区而异）
- 如果业务面向中国大陆，需要考虑使用境内主机并完成相关备案流程
- 自查站点内容是否涉及违规

## 三、SSL 与 HTTPS

### 8. SSL 一直显示 Pending

**原因**：Let's Encrypt 需要验证域名所有权，解析未生效就无法签发。

**排查顺序**：

```text
1. nslookup 你的域名，确认解析到 Hostinger 的 IP
2. 确认 80 端口可访问（Let's Encrypt 通过 HTTP 验证）
   在浏览器访问 http://你的域名，应该能看到站点（不是错误页）
3. 等待最长 1 小时，然后重试签发
4. 如果反复失败，检查是否有其他 CDN 或代理层阻挡了验证请求
```

**特殊情况**：如果域名之前配置过 Cloudflare 的代理（橙色云朵），需要先关闭代理（改为灰色）等 SSL 签发完成，再重新开启。

### 9. 浏览器提示证书不受信任

| 现象 | 原因 | 解决 |
| --- | --- | --- |
| NET::ERR_CERT_COMMON_NAME_INVALID | 证书域名与实际访问域名不匹配 | 检查是否用 www 访问但证书只签了根域名 |
| NET::ERR_CERT_DATE_INVALID | 证书过期未自动续期 | 在 hPanel 重新签发 |
| 自签名证书警告 | 访问的是主机临时地址而非域名 | 正常，绑定正式域名后消失 |

### 10. 混合内容警告（Mixed Content）

**原因**：HTTPS 页面里加载了 HTTP 资源（图片、脚本、样式）。

**排查方法**：浏览器按 F12 → Console，会列出所有被阻止的 HTTP 资源。

**解决**：

```sql
-- 如果数据库里存的是 HTTP 的绝对地址
UPDATE wp_posts SET post_content = REPLACE(post_content, 'http://你的域名', 'https://你的域名');
UPDATE wp_postmeta SET meta_value = REPLACE(meta_value, 'http://你的域名', 'https://你的域名');
```

或者用 WordPress 插件「Really Simple SSL」自动处理。

## 四、文件与权限

### 11. 上传文件提示权限不足

**原因**：文件属主或权限设置不正确。

**解决**：

| 类型 | 正确权限 |
| --- | --- |
| 目录 | 755 |
| 普通文件 | 644 |
| wp-config.php | 600（更安全） |

**不要用 777。** 如果某个操作要求 777，说明文件属主有问题，应该修正属主而不是放宽权限。

### 12. .htaccess 改错了导致 500 错误

**立即恢复**：

```text
方式一（最快）：用文件管理器把 .htaccess 重命名
  右键 → 重命名 → 改为 .htaccess.bak
  服务器会忽略不存在的 .htaccess，站点立即恢复

方式二：用备份覆盖
  hPanel → 文件 → 备份 → 选择最近的快照恢复
```

恢复后逐行检查你添加的规则。常见错误：`RewriteRule` 缺少 `[L]` 标志、`RewriteBase` 路径错误、条件语句拼写错误。

### 13. 站点显示目录列表而不是网页

**原因**：`public_html` 里没有 `index.php` 或 `index.html`，或者文件被放到了子目录里。

**解决**：

```bash
# 用文件管理器检查 public_html 下是否有 index.php
# 如果 WordPress 文件在 public_html/wordpress/ 下
# 把所有文件移到 public_html 根目录
```

### 14. 上传大文件失败

**原因**：PHP 上传限制或执行超时。

**解决**：在 `.htaccess` 中添加（或在 hPanel 的 PHP 设置中调整）：

```apache
php_value upload_max_filesize 64M
php_value post_max_size 64M
php_value max_execution_time 300
php_value memory_limit 256M
```

**替代方案**：用 FTP 上传大文件，不受 PHP 限制。或者先压缩再上传，然后在服务器端解压。

## 五、数据库

### 15. "建立数据库连接时出错"

**排查清单**：

```text
□ 检查 wp-config.php 里的四项信息
  DB_NAME / DB_USER / DB_PASSWORD / DB_HOST

□ 数据库名和用户名必须包含 hPanel 自动添加的前缀
  在 hPanel → 数据库页面可以看到完整名称

□ DB_HOST 通常是 'localhost'，不是 IP 地址

□ 密码里有特殊字符时，检查是否被 shell 或编辑器转义

□ 确认数据库用户已被授予该数据库的权限
  hPanel → 数据库 → 用户 → 检查权限
```

### 16. 导入 SQL 文件失败

**原因**：文件超过 phpMyAdmin 的限制（通常 50MB），或包含不兼容的语句。

**解决**：

```bash
# 方法一：命令行导入（Business 及以上有 SSH）
mysql -u 用户名 -p 数据库名 < backup.sql

# 方法二：拆分文件
split -l 10000 backup.sql chunk_
# 然后逐个导入 chunk_aa, chunk_ab ...

# 方法三：先去评论表（通常最大）
# 用 mysqldump 时排除 wp_comments
mysqldump -u 用户 -p -ignore-table=数据库.wp_comments 数据库 > backup.sql
```

### 17. 数据库连接数超限

**报错**：`Too many connections`

**原因**：PHP 进程数超过数据库允许的连接上限，通常是流量激增或某个脚本未正确关闭连接。

**解决**：

```bash
# 查看当前连接
mysql -u root -p -e "SHOW PROCESSLIST;"

# 查看最大连接数
mysql -u root -p -e "SHOW VARIABLES LIKE 'max_connections';"
```

如果是 WooCommerce 或会员站，考虑启用 Redis 对象缓存减少数据库查询。

## 六、性能与缓存

### 18. 站点突然变慢

**排查顺序**：

```text
1. hPanel → 网站 → 高级 → 资源使用
   看 CPU 与内存曲线，判断是资源不足还是软件问题

2. 检查是否有新装的插件
   停用最近装的插件，看速度是否恢复

3. 检查数据库是否有慢查询
   开启慢查询日志，或装 Query Monitor 插件

4. 清除所有缓存
   hPanel 的 LiteSpeed 缓存 + WordPress 插件缓存 + 浏览器缓存

5. 用第三方工具测速
   搜索 "TTFB test"，从多个地理位置测试
```

### 19. 更新了内容但访客看到的是旧版

**原因**：多层缓存（浏览器、CDN、服务器、插件）。

**解决（按顺序清）**：

```text
1. WordPress 后台 → LiteSpeed Cache → Purge All
2. hPanel → 高级 → LiteSpeed 缓存 → 清除全部
3. 如果用了 Cloudflare → 清除 Cloudflare 缓存
4. 浏览器用无痕模式验证（避免本地缓存干扰）
```

### 20. 装了缓存插件后站点显示错乱

**原因**：CSS/JS 合并或延迟加载破坏了页面依赖关系。

**解决**：在缓存插件设置里逐个关闭以下功能，找到导致问题的那一项：

```text
□ CSS 合并（Combine CSS）
□ JS 合并（Combine JS）
□ JS 延迟加载（Defer/Delay JS）
□ CSS 异步加载（Load CSS Asynchronously）
```

**经验**：JS 合并是最容易出问题的一项，因为它不保证脚本执行顺序。多数情况下关闭它能解决问题，性能损失不大。

### 21. CPU 使用率长期偏高

**排查方法**：

```bash
# 在 SSH 中查看占用最高的 PHP 进程
ps aux | grep php | sort -k3 -rn | head -10

# 分析访问日志，找出访问量最高的 URL
awk '{print $7}' access.log | sort | uniq -c | sort -rn | head -20

# 找出访问最频繁的 IP
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -10
```

**常见原因**：

| 原因 | 解决 |
| --- | --- |
| 被爬虫高频抓取 | 配置 robots.txt，或封禁 IP 段 |
| 某个插件效率低 | 用 Query Monitor 定位，替换或移除该插件 |
| 无缓存 | 启用 LiteSpeed Cache |
| 图片过大 | 批量压缩，启用 WebP |
| WooCommerce 的购物车查询 | 启用 Redis 对象缓存 |

## 七、邮箱

### 22. 发出的邮件进入垃圾箱

**原因**：缺少 SPF、DKIM 记录，或发信 IP 信誉不佳。

**解决**：

```text
1. hPanel → 邮箱 → 域名 → 启用 DKIM，把生成的 TXT 记录加到 DNS
2. 确认 SPF 记录存在且格式正确：
   v=spf1 include:_spf.mail.hostinger.com ~all
3. 等待 DNS 生效（最长 24 小时）
4. 给 Gmail 发测试邮件，查看原始邮件中的 SPF/DKIM 是否为 PASS
```

### 23. 收不到邮件

**排查**：

```text
□ 检查 MX 记录是否指向正确的服务器
□ 检查邮箱账户是否已创建且未满额
□ 检查是否配置了错误的转发规则
□ 检查发件方是否被你的反垃圾规则拦截
□ 用第三方工具测试（搜索 "MX lookup"）
```

### 24. 邮件客户端配置失败

**IMAP 配置参数**：

| 项目 | 值 |
| --- | --- |
| 接收服务器 | imap.hostinger.com |
| 接收端口 | 993（SSL/TLS） |
| 发送服务器 | smtp.hostinger.com |
| 发送端口 | 465（SSL/TLS） |
| 用户名 | 完整邮箱地址 |
| 密码 | 邮箱账户密码 |

**常见错误**：用户名只填了 `@` 前面的部分。必须填完整邮箱地址。

## 八、WordPress 专项

### 25. 无法登录 WordPress 后台

**排查**：

```text
□ 访问 你的域名/wp-login.php 而不是 /wp-admin
□ 用"忘记密码"重置（邮件可能进垃圾箱）
□ 如果密码重置邮件收不到，检查邮箱是否正常
□ 通过数据库直接改密码：
  在 phpMyAdmin 中执行：
  UPDATE wp_users SET user_pass = MD5('新密码') WHERE user_login = 'admin';
  （仅适用于旧版 WordPress；新版需要用 WordPress 的密码哈希方式）
```

**更可靠的方式**：通过 SSH 用 WP-CLI：

```bash
wp user update admin --user_pass="新密码" --path=/path/to/public_html
```

### 26. 白屏（White Screen of Death）

**原因**：PHP 致命错误，且错误显示被关闭。

**排查**：

```php
// 临时开启错误显示，在 wp-config.php 中添加
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

然后查看 `wp-content/debug.log`，里面会有具体的错误信息。

**快速恢复**：把 `wp-content/plugins` 目录重命名为 `plugins-disabled`，这样所有插件被停用。如果站点恢复，说明是某个插件的问题，逐个启用即可定位。

### 27. 上传图片提示"无法创建目录"

**原因**：`wp-content/uploads` 目录权限不正确或属主错误。

**解决**：

```bash
# 通过文件管理器或 SSH
chmod 755 wp-content/uploads
chmod 755 wp-content
```

如果权限正确还是报错，检查磁盘空间：

```bash
df -h
```

### 28. 网站被黑

**紧急处理步骤**：

```text
1. 立即修改所有密码
   hPanel 密码、WordPress 管理员密码、数据库密码、FTP 密码

2. 检查并删除可疑的管理员账户
   WordPress → 用户 → 检查是否有陌生管理员

3. 检查核心文件是否被篡改
   用 WordPress 后台的"重新安装"功能覆盖核心文件
   （工具 → 站点健康 → 检查，或下载同名版本手动覆盖）

4. 用安全插件扫描
   装 Wordfence 做完整扫描

5. 从干净备份恢复
   如果备份在入侵之前，这是最彻底的解决方式

6. 找出入侵途径
   通常是过期的插件/主题，或弱密码
   更新所有插件主题，启用双因素认证
```

## 该联系客服的情况

有些问题不适合自己排查，直接开工单更快：

- 账单相关（重复扣款、退款、升级差价）
- 服务器层面的问题（其他站点也受影响）
- 域名注册商层面的异常
- 需要修改服务器配置（共享主机无法自行修改的部分）
- 数据恢复（需要从官方快照恢复）

**开工单时提供这三样**：

```text
1. 具体报错信息（复制文字或截图，不要只说"网站打不开"）
2. 出问题的 URL
3. 你最近做过的操作
```

这三项能把解决时间缩短一半以上。

## 最后

如果你的问题不在这 28 个里，有一个通用的排查框架总是有效的：

**先确认问题范围（只有你受影响还是所有人）→ 再确认时间点（什么时候开始的）→ 再确认改动（之前做了什么）→ 然后查日志。**

这个顺序的价值在于：它把"网站有问题"这种模糊的描述，转换成了可验证的具体线索。**日志里几乎总是有答案**，只是多数人不看它。
