# 算法冒险之旅 · 完整学习版

这是给自己使用的 30 天算法学习网站。目标不是“把课程看完”，而是让每一天都有站内讲义、代码/推演例子、动手任务、自测和官方课程依据，最后能独立解释一个简化推荐系统从召回到重排的完整链路。

## 直接启动

Windows 双击 `start.bat`。它会优先用本机 Python 在 `http://127.0.0.1:8765/` 启动本地服务器并自动打开浏览器；如果没有 Python，会退回直接打开 `index.html`。

所有学习进度、笔记、AI 对话、等级、小人图片选择和 AI 设置都保存在浏览器 `localStorage`。

## 这一版实际改了什么

- **小人不再“同一张图换颜色”**：改成 4 张不同构图的图片，点击后替换“今日学习”和小屋预览；累计学习栏与 AI 实验室各自使用独立立绘。
- **换装改成纯图片切换**：不做配饰叠层，直接选择四张不同角色图。
- **30 天计划重新细化**：每一天都有能力目标、站内讲义、最小例子、动手任务、自测题、学习时长和外部课程依据。
- **新增站内知识库**：404 个词条，覆盖 Python、数据结构、算法、数学、机器学习、推荐系统、计算机基础、LLM 支线；支持搜索、分类和“一键问 AI”。
- **课程地图卡片可直接打开当天课程**，不再只是看标题。
- **今日主课默认打开站内课程详情**，不再一点击就把你甩到外部网站。
- **题目练习补充了提示、训练目标和 AI 陪练入口**。
- **DeepSeek 上下文更完整**：会把当天能力目标、核心概念和自测题一起交给 AI，而不是只告诉它“Day 几”。
- **平板底部按钮压缩成 4 个**：首页 / 课程 / 练习 / AI，避免底部按钮过多遮住内容。
- **学习计时改为按当天统计**，并移到顶栏“我的笔记”旁边，学习日历记录实际学习日期。

## 课程依据

这不是把几门课原样塞进 30 天，而是按零基础学习顺序重新拆解：

1. **Harvard CS50P**：Python 的函数/变量、条件、循环、异常、库、测试、文件、OOP。
2. **Harvard CS50x 2026**：补充算法思维、内存、数据结构、SQL 和计算机基础视角。
3. **MIT 6.006**：复杂度、数据结构、排序、哈希、树、堆、图搜索、动态规划。
4. **Google Machine Learning Crash Course**：回归、分类、数据、过拟合、神经网络、Embedding、公平性。
5. **PyTorch Learn the Basics**：Tensor、Dataset/DataLoader、模型、Autograd、优化循环、保存加载。
6. **Google Recommendation Systems**：候选生成、评分、重排、协同过滤、矩阵分解、Embedding 与深度推荐。

外部课程链接都在“资料收藏”以及每天课程详情的“课程依据与延伸”中。

## 30 天结构

- Day 1–7：Python 地基
- Day 8–18：数据结构与算法
- Day 19–21：线代 / 概率 / 梯度下降
- Day 22–25：机器学习 / 神经网络 / Embedding
- Day 26–29：推荐系统 / 反馈回路 / 多样性 / 公平
- Day 30：小型推荐系统结业项目

一个月的目标是**打通整条知识链并建立能继续深挖的地基**，不是一个月“学完计算机科学”。

## DeepSeek API

前端不直接保存 API Key，避免 GitHub Pages 泄露密钥。推荐继续使用包里的 Cloudflare Worker：

```bash
cd worker
npm install
npx wrangler login
npx wrangler secret put DEEPSEEK_API_KEY
npx wrangler secret put LEARN_ACCESS_TOKEN
npm run deploy
```

Cloudflare 返回 Worker 地址后，在网站“设置中心”填写 Worker 地址与同一个访问口令。

当前 Worker 使用 DeepSeek Chat Completions 接口，支持 `deepseek-v4-flash` 与 `deepseek-v4-pro`。

## GitHub Pages

把本文件夹内容上传到仓库根目录，在 GitHub 仓库 `Settings → Pages` 中从分支根目录部署即可。`worker/` 可以和前端一起放仓库，但 **DeepSeek API Key 只能放 Cloudflare Secret，不能写进 GitHub 文件**。

## 主要文件

- `index.html`：界面结构
- `styles.css`：桌面 / 平板 / 手机 UI 与弹簧动画
- `curriculum.js`：30 天详细课程、404 条知识库、题库、课程资源
- `app.js`：课程、进度、知识库、练习、等级、图片切换、DeepSeek 等逻辑
- `assets/`：头像、不同学习小人图片、背景
- `worker/`：DeepSeek 安全代理
- `start.bat`：Windows 一键启动
