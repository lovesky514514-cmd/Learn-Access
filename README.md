# 算法冒险之旅

这是给自己使用的 30 天算法学习网站。

## 直接启动

Windows 双击 `start.bat`。它会优先用本机 Python 在 `http://127.0.0.1:8765/` 启动本地服务器并自动打开浏览器；如果没有 Python，会退回直接打开 `index.html`。

所有学习进度、笔记、AI 对话、等级、小人图片选择和 AI 设置都保存在浏览器 `localStorage`。

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
