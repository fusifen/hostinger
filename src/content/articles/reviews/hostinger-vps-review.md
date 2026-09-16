---
title: 'Hostinger VPS 性能测试：KVM 1 到 KVM 8 全系实测数据'
description: '我们用同一套基准测试跑了 Hostinger 全部四档 KVM VPS，包含 fio 磁盘 IO、sysbench CPU、以及真实 WordPress 承载测试。附带选型建议。'
excerpt: '四档 KVM、三套基准测试、两周监测。这是我们对 Hostinger VPS 产品线的完整数据记录。'
pubDate: 2026-09-03
updatedDate: 2026-09-11
author: '林向远'
category: reviews
tags:
  - VPS
  - KVM
  - 性能测试
  - fio
heroImageAlt: 'Hostinger KVM VPS 性能测试数据'
theme: gradient-3
featured: true
affiliateNotice: true
featuredPlan: vps-kvm2
readingTime: 13
keywords:
  - Hostinger VPS
  - Hostinger KVM
  - VPS性能测试
  - VPS推荐
ctaHeadline: 'KVM 2 当前 24 个月付月均 ¥50'
ctaBody: '2 核 8GB 是所有面板类应用的舒适起点。如果你已经决定上 VPS，这是一档闭眼买不会错的选择。'
faqs:
  - question: Hostinger VPS 是独立资源吗？
    answer: '是。KVM 架构提供完整的虚拟化隔离，vCPU 与内存都是独享的，不受其他用户影响。这与共享主机的"共享资源池"有本质区别。'
  - question: 为什么 KVM 2 比 KVM 1 更值得推荐？
    answer: 'KVM 2 是唯一在价格与配置之间取得平衡的一档。1 核 vCPU 在跑面板或 Docker 时很容易成为瓶颈，而 2 核 8GB 是绝大多数应用的舒适起点，价格只多 15 元/月。'
  - question: Hostinger VPS 可以装宝塔面板吗？
    answer: '可以。KVM 系列提供完整 root 权限，支持安装宝塔、CyberPanel、aaPanel 等任意面板。我们也提供一键安装脚本的教程。'
  - question: 磁盘是 NVMe 还是 SSD？
    answer: '全系为 NVMe SSD。实测 KVM 2 的顺序读取约 3.1GB/s，随机 4K 读写约 68K/72K IOPS，属于同价位的上游水平。'
  - question: VPS 需要自己维护吗？
    answer: '需要。VPS 给你 root 权限也意味着系统更新、安全加固、备份策略都由你负责。如果不想承担这些，应选择 Cloud Hosting。'
---

## 为什么值得单独测一遍

Hostinger 的 VPS 产品线在中文评测圈里数据很少，多数内容只停留在"便宜""有 root"这种层面。但 VPS 恰好是最需要看数据的产品——因为它卖的本来就是原始性能。

我们买了 KVM 1、KVM 2、KVM 4、KVM 8 四档（KVM 8 用小时计费的方式跑测试后释放），在每台上跑了三套基准测试，并额外用 KVM 2 做了两周的真实站点承载测试。

## 测试环境与工具

| 项目 | 配置 |
| --- | --- |
| 操作系统 | Ubuntu 24.04 LTS（最小安装） |
| 内核 | 6.8.0 |
| 测试地点 | 新加坡节点 |
| 磁盘测试 | fio 3.36 |
| CPU 测试 | sysbench 1.0.20 |
| 网络测试 | iperf3 + 自定义 TTFB 脚本 |

所有测试均在系统安装完成后静默 10 分钟再开始，避免初始化任务干扰数据。

## 磁盘性能：全系 NVMe，差异小于预期

磁盘 IO 是 VPS 最容易被忽略、却最影响实际体验的指标。WordPress 的每一次页面加载背后都有几十次数据库读写。

```bash
# fio 随机读写测试
fio --name=randread --ioengine=libaio --rw=randread --bs=4k \
    --numjobs=4 --size=1G --runtime=60 --time_based \
    --group_reporting --directory=/root/fio-test
```

| 套餐 | 顺序读 | 顺序写 | 随机 4K 读 IOPS | 随机 4K 写 IOPS |
| --- | --- | --- | --- | --- |
| KVM 1 | 2,890 MB/s | 1,240 MB/s | 52K | 58K |
| KVM 2 | 3,140 MB/s | 1,385 MB/s | 68K | 72K |
| KVM 4 | 3,260 MB/s | 1,440 MB/s | 81K | 88K |
| KVM 8 | 3,380 MB/s | 1,510 MB/s | 94K | 102K |

两个观察。

**第一，全系都是真 NVMe。** 顺序读都在 2.8GB/s 以上，这个数字对应的是 PCIe 通道上的 NVMe 设备，不是 SATA SSD 伪装的。同价位很多 VPS 的读速还在 500MB/s 量级。

**第二，档位之间的磁盘差距远小于配置差距。** KVM 1 到 KVM 8，随机读 IOPS 只差 1.8 倍，而 CPU 核数差了 8 倍。这说明 Hostinger 在磁盘层面没有做明显的按档限速——低档位不会因为"磁盘慢"而卡。

## CPU 性能：核数与单核质量的取舍

VPS 的 CPU 有两个维度：核数，以及单核性能。

```bash
sysbench cpu --cpu-max-prime=20000 --threads=N run
```

| 套餐 | 核数 | 单核事件/秒 | 多核事件/秒 | 多核效率 |
| --- | --- | --- | --- | --- |
| KVM 1 | 1 | 3,412 | 3,398 | — |
| KVM 2 | 2 | 3,388 | 6,521 | 96.2% |
| KVM 4 | 4 | 3,395 | 12,668 | 93.3% |
| KVM 8 | 8 | 3,381 | 24,102 | 89.1% |

**单核性能高度一致**，四档都稳定在 3,380 到 3,412 事件/秒之间。这是个好消息：说明 Hostinger 用的是同代同型号的 CPU，低档位不会拿到性能更弱的核心。

值得注意的是**多核扩展效率**。KVM 2 达到 96.2%，说明双核几乎完美并行。到 KVM 8 时效率降到 89.1%——这在虚拟化环境中属于正常范围（内存带宽与缓存争用必然导致损耗），但也意味着第 7、第 8 个核的实际产出会低于前几个。

### 实际含义

如果你的负载是**单线程密集**（比如一个重量级的 PHP 页面、一次大文件压缩），从 KVM 1 升级到 KVM 8 不会有任何提升——单核性能是一样的。

如果你的负载是**多进程并行**（多个站点、多个 PHP-FPM worker、数据库与 Web 服务并存），核数的收益是接近线性的，直到 KVM 4 左右。

## 真实承载能力：KVM 2 跑 15 个 WordPress

这是本次测试最有参考价值的部分。我们在 KVM 2 上部署了 15 个真实的 WordPress 站点（含 WooCommerce 的 3 个），统一使用 Nginx + PHP 8.3 + MariaDB，不装任何缓存插件，只依赖 Nginx 层面的 fastcgi_cache。

用 k6 模拟 60 并发持续请求，跑了 72 小时：

| 指标 | 结果 |
| --- | --- |
| 平均负载（1 分钟） | 0.62 |
| 平均负载（5 分钟） | 0.58 |
| 内存占用 | 5.8 GB / 8 GB |
| 平均 TTFB | 187ms |
| P95 TTFB | 334ms |
| 磁盘等待 | < 2% |

**负载 0.62 对应 2 核，意味着 CPU 利用率约 31%。** 这个余量相当健康——它说明 KVM 2 承载 15 个中等流量站点还有至少 3 倍的扩展空间。

内存占用 5.8GB 是更接近上限的一项。如果你要跑更多站点，需要关注的是内存而不是 CPU。

## 网络：8TB 流量到底够不够

| 套餐 | 月流量 | 换算成页面请求（约 2MB/页） |
| --- | --- | --- |
| KVM 1 | 4 TB | 约 200 万次 |
| KVM 2 | 8 TB | 约 400 万次 |
| KVM 4 | 16 TB | 约 800 万次 |
| KVM 8 | 32 TB | 约 1600 万次 |

按日均计算，KVM 2 的 8TB 对应每天约 13 万次页面请求。对绝大多数站点来说都是过剩的。

真正会吃掉流量的是**大文件分发**（视频、软件包、图片原图）。如果你的站点涉及这些，流量会消耗得快得多，这一点需要单独评估。

出口带宽方面，实测下载速度稳定在 890Mbps 到 960Mbps 之间，符合 1Gbps 端口的预期。

## 选型建议

| 你的情况 | 推荐 | 理由 |
| --- | --- | --- |
| 想摆脱共享主机限制，但预算紧 | KVM 1 | 4GB 内存足够跑 3 到 5 个 WordPress |
| 跑 CyberPanel / 宝塔 + 多站点 | KVM 2 | 2 核 8GB 是面板类应用的起点 |
| 跑数据库 + 应用 + 队列 | KVM 4 | 4 核 16GB 才有多服务共存的余量 |
| 当私有云用、需要 IP 隔离 | KVM 8 | 2 个独立 IPv4 是唯一提供隔离的档位 |

如果只让我推荐一档：**KVM 2**。它在价格、核数、内存三个维度上都踩在实用阈值之上，没有明显的短板。KVM 1 的 1 核会在你装上面板后立刻感到吃力，而 KVM 4 对多数人来说是为用不上的余量付费。

## 一个提醒

VPS 与共享主机最大的差别不是性能，而是**责任转移**。拿到 root 权限的同时，你也拿到了一整套运维工作：系统安全更新、防火墙规则、备份验证、故障排查。

如果你不想承担这些，但又被共享主机的性能限制困扰，正确的答案是 Cloud Hosting，而不是 VPS。我们另有一篇 Cloud 与 VPS 的对比分析，把两者的适用边界讲得更细。
