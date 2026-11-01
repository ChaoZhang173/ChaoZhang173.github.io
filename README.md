# Chao Zhang 个人主页 · 内容编辑版

## 最方便的修改方式

1. 打开在线编辑器：https://chaozhang173.github.io/editor.html 。也可以解压编辑器导出的完整网站 ZIP，在电脑上双击 `editor.html`。
2. 左侧选择栏目，在表单里填写中文、英文，选择照片或 PDF 简历。项目、活动、生活记录可以添加、删除和调整顺序。
3. 点击“预览网站”检查四个页面和中英文效果。
4. 点击“发布到主页”。首次先按界面说明连接 GitHub；连接后，在当前编辑页面可以直接发布，不需要下载或上传 ZIP。
5. 想保留离线版本时，点击“下载网站 ZIP”。下次离线编辑请解压最新导出的 ZIP，并保留完整文件夹。

无需运行命令或安装开发环境。请保留完整文件夹，单独复制 editor.html 无法打开编辑器。

## 保存与备份

- “保存草稿”：保存到当前浏览器的本地存储，不会覆盖电脑里的文件，也不会更新线上网站。重新打开编辑器后，选择“恢复草稿”才能载入保存的修改。
- “备份草稿”：下载包含内容和照片的 JSON 文件，可通过“导入备份”恢复。换浏览器或电脑时使用这个方式。
- “下载网站 ZIP”：生成完整网站，含照片、简历和可继续使用的编辑器。浏览器开始下载后，请在下载文件夹确认文件存在。
- 浏览器可能清理本地存储；长期保留的版本请下载网站 ZIP 或草稿备份。
- 照片支持 JPG、PNG、WebP、GIF，简历支持 PDF，单个文件不超过 25 MB。

## 发布和后续更新

主页已经发布到 https://chaozhang173.github.io/ ，仓库为 https://github.com/ChaoZhang173/ChaoZhang173.github.io 。

网页编辑器支持直接发布。首次点击“发布到主页”或“GitHub 连接”，按界面说明创建 Fine-grained personal access token：只选择 `ChaoZhang173.github.io` 仓库，只授予 Contents: Read and write，并设置有效期。把授权码粘贴到编辑器即可连接。不要发送授权码给他人。

授权码只在当前页面内存中保留，不保存在浏览器存储、草稿、ZIP 或仓库中。关闭或刷新页面后需要重新连接；可自行保存到密码管理器供下次粘贴。其他访客无法仅凭打开编辑器修改你的线上内容。

后续更新：编辑内容 → 预览 → 发布到主页。发布会将文字与新增或替换的照片、简历一起提交，GitHub Pages 随后更新网站，网址不变。“保存草稿”仍只保存在当前浏览器。“已提交到 GitHub”与“已上线”会分开提示；如仍在发布，可查看 GitHub Actions，不用重复上传。

在线编辑只按需读取文件，不会在打开时下载整个离线素材包。下载完整网站 ZIP 或草稿备份时，会收齐当前引用的照片和简历。需要离线编辑时，请使用编辑器的“下载网站 ZIP”，而不是 GitHub 的源码下载包。

如提示线上内容已变化，请先备份正在编辑的内容，再点击“载入线上最新内容”并合并你的修改。发布不会强制覆盖其他设备已提交的版本。JSON 草稿备份无需上传到公开仓库。

## 内容管理范围

- 个人信息、头像、简历、联系方式、首页简介。
- 首页简介 → 默认显示语言：当前为英文；访客仍可手动切换语言。
- 栏目标题与说明：修改各栏目标题、介绍、资源说明及小标题，中英文分别填写。
- 研究与工作：项目名称、日期、说明、成果、细节、标签、链接和图片。
- 论文与专利、研究支持、计算资源及官方来源链接。
- 学术活动：年份／月份／日期、结束日期、中英内容和活动链接。
- 个人作品：名称、介绍、标签、链接和图片。
- 生活与近况：日期区间、中英内容、可选照片。
- 教育、工作经历与技能。

记录按表单里的顺序显示，可用上移／下移调整。日期可以只填年份（2025），也可以填年月（2026-10）或完整日期（2026-10-07）；不知道具体日期时留空即可，不要补猜。没有照片的生活记录不会留空框。

所有内容存放在 `content.js`；网站页面由 `script.js` 渲染。通常只需要使用编辑器，布局与配色保持原样。

## 2026-10-23 新增内容与来源

- 研究支持：ITER、DOE、NIH、IACS，关系依据本人确认。不填写个人项目负责人身份、金额、资助编号或期限。
- 计算资源：描述平台官方硬件概览，不代表个人拥有全部设备或固定配额。硬件资料核对于 2026-10-23；更新 `computingResources` 即可修改卡片。
  - NVwulf：https://rci.stonybrook.edu/hpc/clusters/nvwulf
  - DeltaAI：https://docs.ncsa.illinois.edu/systems/deltaai/en/latest/user-guide/architecture.html
  - GCP：https://docs.cloud.google.com/compute/docs/accelerator-optimized-machines
  - SUNY AI：https://www.suny.edu/Google/ai-partnerships/ （基于 Google Cloud，无统一 GPU 配置）
  - Empire AI：https://empireai.freshdesk.com/support/solutions/articles/157000363466-alpha-beta-hardware-mid-spring-2026-
  - SeaWulf：https://rci.stonybrook.edu/hpc/clusters/seawulf
- IACS Research Day：2025-04-17，海报参与依据本人陈述，日期依据 https://iacs.stonybrook.edu/events/index.php 。
- AMS Research Day：海报与报告分别记为 2025 年；参与及年份依据本人陈述，具体月日尚未确认。
- Brown ICERM：Modeling and Simulations in Fluids，2024-09-07 至 2024-09-08，致敬 James Glimm。活动：https://icerm.brown.edu/program/hot_topics_workshop/htw-24-msf ；年报第 58–59 页：https://icerm.brown.edu/about/nsf/reports/2024-2025-Annual-Report.pdf 。
- 旅行时间依据本人行程和住宿材料：巴黎 2026-09-25 至 09-26；斯特拉斯堡 09-26 至 10-01；慕尼黑 10-01 至 10-03；罗马 10-03 至 10-06；阿拉木图 10-07 转机。这里只记录城市及行程日期，未加入票据、订单或证件信息。照片路径留空时不占位。

## 2026-11-01 更新

以本人下载并修改后的 `chao-homepage-20261101-110400.zip` 为基础，保留所有已有文字、图片、项目顺序和简历。

- 新增 Microsoft Azure 计算资源；补充 GCP 的 H100、H200 配置。以下资料于 2026-11-01 核对，其他硬件来源保留原核对日期。
  - Azure ND H100 v5（每 VM 8 × H100 80 GB）：https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/gpu-accelerated/ndh100v5-series
  - Azure ND H200 v5（每 VM 8 × H200 141 GB）：https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/gpu-accelerated/nd-h200-v5-series
  - GCP A2 / A3（A100 / H100 / H200）：https://docs.cloud.google.com/compute/docs/accelerator-optimized-machines
- 新增研究支持机构 ICERM（布朗大学计算与实验数学研究所）。机构名依据 https://icerm.brown.edu/about ，支持关系依据本人指示。
- 默认英文，编辑器保持中文；预览使用设定的默认语言。
- 关闭预览、按 Esc、切换预览页面后重新创建预览窗口。
- 教育、工作经历、技能独立分组；放大并加深首页博士身份说明。
- 新增“栏目标题与说明”。你提到的两句话在其中的“研究支持与计算资源”分组；可以修改或清空对应的中英文字段。

继续编辑时，打开本次新版文件夹中的 `editor.html`。如果浏览器提示发现旧草稿，先选择“继续网站版本”，避免旧草稿覆盖本次新增的 Azure、GCP 和 ICERM 内容。旧草稿仍可导入，但只会自动补充缺少的栏目标题和默认语言设置，不会自动合并机构或项目列表。

## 猫咪纪念与完整页面

- 以本人提供的 `chao-homepage-20261101-134931.zip` 为基础，保留已有文字、条目顺序和照片。
- 首页学术活动、个人作品、生活与近况各显示前 3 条；完整内容分别在 `academic.html`、`projects.html`、`life.html`。
- 首页顺序跟随编辑器中的上移、下移顺序。调整前 3 条即可改变首页展示。
- 左侧个人信息下新增两只猫的纪念区。编辑器 → 个人资料 → 纪念两只猫：可以修改双语纪念文字、替换合成照片或关闭显示。
- 纪念文字是网页文字，随网站中英文切换；照片文件为 `assets/cats-in-memory.png`。照片合成使用内置图像编辑工具，基于本人提供的两张原照，采取并排构图。
- 编辑器预览支持全部 4 个页面，下载的网站 ZIP 也包含这 4 个页面。
- 导航跳转统一留白；生活照片会预留实际尺寸，避免图片加载后改变跳转位置。新上传照片也会自动记录尺寸。

打开本次新版文件夹里的 `editor.html` 继续编辑。新版已包含本次上传的内容；若发现较旧浏览器草稿，先选“继续网站版本”，确认内容后再保存。

个人作品也支持多个相关链接。边境防线已分开显示 GitHub 源码和在线试玩；在编辑器的个人作品条目中可修改或新增这些链接。
