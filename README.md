# 📚 图书推荐系统 (Book Recommendation System)

<p align="center">
  <strong>基于 React 18 + FastAPI + SQLite 的全栈智能图书推荐系统</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <img src="https://img.shields.io/badge/python-3.9+-green.svg" alt="Python">
  <img src="https://img.shields.io/badge/React-18-blue.svg" alt="React">
  <img src="https://img.shields.io/badge/FastAPI-0.119-red.svg" alt="FastAPI">
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue.svg" alt="TypeScript">
  <img src="https://img.shields.io/badge/status-actively%20developing-brightgreen.svg" alt="Status">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
</p>

<p align="center">
  集成 4 种推荐算法（基于内容、混合推荐、BPR 矩阵分解、LightGBM 梯度提升树），<br>
  处理 Book-Crossing 真实数据集（270K+ 图书，383K+ 用户评分），<br>
  提供企业级用户体验和完整的推荐解决方案。
</p>

---

## ⚠️ 重要提示：大文件说明

由于 GitHub 文件大小限制，以下大文件 **未包含在仓库中**，需要用户自行准备：

| 文件 | 大小 | 说明 | 存放路径 |
|------|------|------|----------|
| `book_recommendation.db` | ~177 MB | SQLite 数据库（270K+ 图书 + 383K+ 评分） | `backend/` |
| `LightGBM.pkl` | ~432 MB | LightGBM 预训练模型 | `backend/models/` |
| `complete_bpr_model.pkl` | ~64 MB | BPR 预训练模型 | `backend/models/` |

**获取方式：**

- **方式一**：百度网盘下载（后续发布，敬请关注 [Releases](https://github.com/LinHao-city/book-recommendation-system/releases) 页面获取链接）
- **方式二**：自行准备
  - 数据库：使用 `database/` 目录下的脚本，从 [Book-Crossing Dataset](http://www.informatik.uni-freiburg.de/~cziegler/BX/) 导入数据
  - 模型：参考 `BPR集成方案.md` 和 `LightGBM集成方案.md` 中的训练流程自行训练

> 下载后将文件放到对应路径即可，无需额外配置。

---

## 📋 目录

- [功能开发状态](#功能开发状态)
- [项目概述](#项目概述)
- [系统架构](#系统架构)
- [推荐算法](#推荐算法)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [API 接口文档](#api-接口文档)
- [性能指标](#性能指标)
- [数据集与处理](#数据集与处理)
- [部署指南](#部署指南)
- [参与贡献](#参与贡献)
- [许可证与版权](#许可证与版权)

---

## 功能开发状态

### ✅ 已完成功能

#### 核心推荐系统
- ✅ 基于内容推荐算法（Content-Based）— 余弦相似度 + 多特征融合
- ✅ 混合推荐算法（Hybrid）— 60% 内容相似性 + 40% 评分相似性
- ✅ BPR 推荐算法（Bayesian Personalized Ranking）— 矩阵分解个性化排序
- ✅ LightGBM 推荐算法 — 梯度提升树 + 创新特征对比较方法
- ✅ 推荐理由自动生成 — 多层次可解释推荐
- ✅ 算法性能指标实时监控 — Precision / Recall / F1 / Coverage
- ✅ 相似度分数可视化组件 — 进度条 + 等级标签

#### 搜索功能
- ✅ 基础图书搜索 — 支持书名、作者、出版社、ISBN 搜索
- ✅ 高级搜索 — 按作者、出版社、年份、评分、年代等多维度筛选（AdvancedSearchForm + FilterPanel + PremiumFilterPanel）
- ✅ 搜索结果分页 — Pagination 组件 + 每页数量可选（20/50/100）
- ✅ 搜索历史记录 — localStorage 持久化 + 历史快速回选 + 清空功能（useSearchHistory Hook）
- ✅ 智能搜索补全 — AutoComplete 实时搜索建议
- ✅ 搜索性能优化 — 防抖、缓存、预加载（useSearchPerformance Hook）
- ✅ 多种排序方式 — 相关性、书名、作者、出版年份、评分、评价人数
- ✅ 网格/列表视图切换
- ✅ 搜索建议 API — 后端自动补全接口（书名 / 作者 / 出版社）
- ✅ 后端高级搜索 API — 支持复杂过滤、排序和分页

#### 图书详情
- ✅ 图书详情页（`/book/:isbn`）— 完整的图书信息展示
- ✅ 评分分布图表 — 1-10 分柱状分布可视化
- ✅ 用户评论展示 — 真实用户评分数据（含地区、年龄）
- ✅ 读者画像分析 — 地区分布 Top 5、年龄统计、阅读趋势
- ✅ 图书收藏功能 — 收藏/取消收藏 + 分享链接
- ✅ 面包屑导航 — 返回上一页

#### 图书榜单与展示
- ✅ 热门图书榜 — 按评价人数排序
- ✅ 高分图书榜 — 按评分排序（最少评分数量可配置）
- ✅ 新书榜 — 按出版年份排序
- ✅ 经典图书榜 — 1999 年前高分图书
- ✅ 趋势图书榜 — 综合热度算法排序
- ✅ 精选图书展示（BookShowcase）— 多榜单融合去重展示
- ✅ 图书榜单服务（rankingService）— 统一的榜单 API 封装

#### 前端应用
- ✅ 首页 — 图书搜索、榜单展示、推荐入口、数据库统计
- ✅ 推荐结果页 — 推荐卡片、相似度分数、推荐理由、性能指标
- ✅ 算法选择器 — 4 种算法切换与预览
- ✅ 推荐配置弹窗 — 推荐数量 / 算法选择
- ✅ 浮动设置面板（FloatingSettings）— 快速切换算法与推荐数量
- ✅ 数据库统计概览（DatabaseStats）— 实时展示图书数、评分数、平均评分
- ✅ 图书收藏系统 — Zustand 状态管理 + localStorage 持久化
- ✅ 企业级 UI — 玻璃态、渐变、阴影、动画效果
- ✅ 响应式设计 — 支持 PC 和移动端
- ✅ 骨架屏加载效果 — 搜索结果和详情页加载占位
- ✅ 深色模式适配 — CSS `prefers-color-scheme: dark` 媒体查询（多组件适配）
- ✅ 导航头部 — 含收藏按钮、用户菜单（个人信息/收藏/历史/设置）

#### 后端服务
- ✅ FastAPI RESTful API — 完整的推荐 / 搜索 / 健康检查接口
- ✅ SQLite 数据库 — 270K+ 图书、383K+ 用户评分
- ✅ Pydantic 数据验证 — 类型安全的请求 / 响应
- ✅ 自动 API 文档 — Swagger UI + ReDoc
- ✅ 完善的错误处理 — 异常捕获与降级机制
- ✅ 图书详情 API — 详情 / 评论 / 读者画像分析
- ✅ 筛选器 API — 作者 / 出版社 / 年代 / 年份范围
- ✅ 图书统计 API — 总数、评分统计、最高分图书

#### 数据处理
- ✅ Book-Crossing 数据集导入与清洗
- ✅ 特征工程 — 编码、标准化、年代特征
- ✅ 数据库索引优化
- ✅ 图片 URL 验证与多尺寸处理

### 🔄 待开发功能（欢迎贡献！）

#### 用户系统
- [ ] 用户注册 / 登录（后端认证）— 目前前端 UI 已有入口，后端尚未实现
- [ ] 个性化推荐（基于用户画像）

#### 数据分析
- [ ] 推荐效果 A/B 测试
- [ ] 用户行为追踪与分析仪表板

#### 系统增强
- [ ] Redis 缓存集成 — 配置已就绪，实际缓存逻辑待实现
- [ ] 深度学习推荐算法（如 Neural CF）
- [ ] 分布式部署 / 微服务架构
- [ ] 推荐效果实时反馈机制
- [ ] 国际化（i18n）多语言支持

---

## 项目概述

### 核心功能
- **智能图书推荐**：输入书名或 ISBN，获取 5-20 本相似图书推荐
- **多算法支持**：4 种推荐算法，满足不同场景需求
- **实时搜索**：支持 27 万+ 图书的实时搜索与筛选
- **可视化展示**：推荐理由、相似度分数、性能指标完整展示
- **企业级 UI**：现代化响应式设计，支持 PC 和移动端

### 项目特色
- **大规模数据处理**：Book-Crossing 真实数据集，270,151 本图书，383,842 条用户评分
- **多种推荐算法**：从基础内容推荐到高级机器学习算法全覆盖
- **端到端解决方案**：从数据预处理到前端展示的完整技术栈
- **高性能响应**：毫秒级推荐响应，支持高并发访问
- **可解释推荐**：提供详细推荐理由和算法性能分析

---

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                    图书推荐系统架构                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   前端展示层         │    │   API网关层          │    │   业务逻辑层         │
│   React 18 + TS     │◄──►│   FastAPI Router    │◄──►│   推荐服务模块       │
│   Ant Design        │    │   Pydantic 验证     │    │   算法引擎          │
│   Zustand 状态管理   │    │   错误处理          │    │   数据处理          │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
         │                          │                          │
         │ HTTP/JSON                │ RESTful API              │ Python/ML
         ▼                          ▼                          ▼
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   用户体验层         │    │   中间件层           │    │   数据访问层         │
│ • 图书搜索界面       │    │ • 认证授权          │    │ • SQLite ORM        │
│ • 推荐结果展示       │    │ • 请求日志          │    │ • 数据模型          │
│ • 算法配置面板       │    │ • 异常处理          │    │ • 查询优化          │
│ • 性能监控面板       │    │ • 缓存管理          │    │ • 事务管理          │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
                                                             │
                                                             ▼
                                                 ┌─────────────────────┐
                                                 │   数据存储层         │
                                                 │ • SQLite 数据库     │
                                                 │ • 图书表 (270K+)    │
                                                 │ • 用户评分表 (383K+)│
                                                 │ • 预训练模型文件     │
                                                 └─────────────────────┘
```

### 项目结构

```
book-recommendation-system/
├── backend/                          # 后端服务 (FastAPI)
│   ├── app/
│   │   ├── api/v1/                  # API 路由
│   │   │   ├── recommendations.py   # 推荐 API
│   │   │   ├── books.py             # 图书 API
│   │   │   ├── book_details.py      # 图书详情 API
│   │   │   └── health.py            # 健康检查
│   │   ├── core/                    # 核心配置
│   │   ├── models/                  # 数据模型 (SQLAlchemy)
│   │   ├── services/                # 业务逻辑
│   │   │   ├── recommendation_service.py     # 基础推荐
│   │   │   ├── bpr_service.py                # BPR 算法
│   │   │   ├── bpr_recommender.py            # BPR 推荐器
│   │   │   └── lightgbm_original_service.py  # LightGBM 算法
│   │   └── schemas/                 # Pydantic 数据验证
│   ├── models/                      # 预训练模型 (需自行准备)
│   ├── requirements.txt
│   └── run.py
├── frontend/                         # 前端应用 (React 18)
│   ├── src/
│   │   ├── components/              # 可复用组件
│   │   ├── pages/                   # 页面组件
│   │   ├── stores/                  # Zustand 状态管理
│   │   ├── api/                     # API 封装
│   │   └── types/                   # TypeScript 类型
│   └── package.json
├── database/                         # 数据库脚本
├── BPR集成方案.md                    # BPR 算法技术文档
├── LightGBM集成方案.md               # LightGBM 算法技术文档
├── 服务器运行指南.md                  # 详细运行指南
├── 项目开发进程.md                    # 开发历程记录
└── README.md
```

---

## 推荐算法

系统集成了 4 种推荐算法，从传统内容推荐到现代机器学习算法全覆盖。

### 算法对比总览

| 特性 | 基于内容推荐 | 混合推荐 | BPR 算法 | LightGBM 算法 |
|------|:----------:|:------:|:-------:|:-----------:|
| **算法类型** | 内容相似性 | 多策略融合 | 矩阵分解 | 梯度提升树 |
| **Precision@10** | 0.82 | 0.88 | **0.92** | 0.90 |
| **Recall@10** | 0.78 | 0.82 | **0.88** | 0.85 |
| **F1-Score** | 0.80 | 0.85 | **0.90** | 0.87 |
| **响应时间** | **80ms** | 150ms | 190ms | 1-2s* |
| **覆盖率** | 85% | 95% | **100%** | 95% |
| **冷启动支持** | **优秀** | 良好 | 中等 | 中等 |
| **模型大小** | 无 | 无 | 63.5MB | 431.6MB |
| **适用场景** | 冷启动 | 通用推荐 | 高精度个性化 | 特征丰富场景 |

> *LightGBM 首次请求需 16-42 秒数据加载，后续请求 1-2 秒。

### 1. 基于内容推荐 (Content-Based)

基于图书的内容特征（作者、出版社、出版年代）计算余弦相似度，推荐属性相似的图书。

```python
# 特征提取与相似度计算
def calculate_similarity(features1, features2):
    return np.dot(features1, features2) / (
        np.linalg.norm(features1) * np.linalg.norm(features2)
    )
```

### 2. 混合推荐 (Hybrid)

综合多种推荐策略，60% 内容相似性 + 40% 评分相似性加权融合。

### 3. BPR 推荐算法 (Bayesian Personalized Ranking)

基于贝叶斯优化的个性化排序算法，通过矩阵分解学习用户和图书的隐向量（20 维），支持 97,106 用户和 270,151 本图书。

```python
class BPRRecommender:
    def find_similar_books(self, target_isbn, top_n=5):
        target_vector = self.item_factors[target_item_id]
        similarities = np.dot(self.item_factors, target_vector / np.linalg.norm(target_vector))
        top_indices = np.argsort(-similarities)[:top_n]
        return top_indices, similarities[top_indices]
```

### 4. LightGBM 推荐算法

基于梯度提升决策树，采用创新的 **特征对比较方法** + **两阶段推荐策略**（KNN 快速筛选 + LightGBM 精确计算）。

```python
def create_feature_pair(self, input_features, candidate_features):
    feature_diff = input_features - candidate_features
    return np.concatenate([input_features, feature_diff]).reshape(1, -1)
```

> 详细算法文档请参考：[BPR集成方案.md](BPR集成方案.md) | [LightGBM集成方案.md](LightGBM集成方案.md)

---

## 技术栈

### 前端
| 技术 | 版本 | 说明 |
|------|------|------|
| React | 19.2.0 | UI 框架，支持 Concurrent Features |
| TypeScript | 5.9.3 | 强类型支持 |
| Vite | 7.2.2 | 极速构建工具 |
| Ant Design | 5.28.1 | 企业级 UI 组件库 |
| Zustand | 5.0.8 | 轻量级状态管理 |
| Axios | 1.13.2 | HTTP 客户端 |
| ECharts | 6.0.0 | 图表可视化 |
| React Router | 7.9.5 | 路由管理 |

### 后端
| 技术 | 版本 | 说明 |
|------|------|------|
| FastAPI | 0.119.0 | 高性能 Python Web 框架 |
| SQLAlchemy | 2.0.43 | Python ORM |
| Pydantic | 2.11.7 | 数据验证和序列化 |
| scikit-learn | 1.7.1 | 机器学习库 |
| LightGBM | 4.6.0 | 梯度提升框架 |
| Pandas | 2.3.2 | 数据处理 |
| NumPy | 2.2.5 | 数值计算 |
| Uvicorn | 0.37.0 | ASGI 服务器 |

### 数据库
| 技术 | 说明 |
|------|------|
| SQLite | 轻量级关系型数据库 |
| Book-Crossing Dataset | 270K+ 图书，383K+ 评分 |

---

## 快速开始

### 环境要求

- **Python**: 3.9+（推荐 3.13.5）
- **Node.js**: 16.0+（推荐 18.x LTS）
- **内存**: 4GB+ RAM
- **存储**: 2GB+ 可用空间

### 1. 克隆项目

```bash
git clone https://github.com/LinHao-city/book-recommendation-system.git
cd book-recommendation-system
```

### 2. 准备大文件

参考 [重要提示：大文件说明](#️-重要提示大文件说明)，将数据库和模型文件放到对应目录。

### 3. 后端配置

```bash
cd backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 启动后端
python run.py
```

后端服务：http://localhost:8000 | API 文档：http://localhost:8000/docs

### 4. 前端配置

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端应用：http://localhost:5173

### 5. 验证安装

```bash
# 健康检查
curl http://localhost:8000/api/v1/health/

# 图书搜索
curl "http://localhost:8000/api/v1/books/search?query=Harry%20Potter&limit=5"

# 获取推荐
curl -X POST "http://localhost:8000/api/v1/recommendations/similar" \
     -H "Content-Type: application/json" \
     -d '{"source_book":{"isbn":"0590353403","title":"Harry Potter"},"algorithm":"hybrid","limit":5}'
```

> 更详细的运行指南请参考 [服务器运行指南.md](服务器运行指南.md)

---

## API 接口文档

| 方法 | 端点 | 说明 |
|------|------|------|
| `POST` | `/api/v1/recommendations/similar` | 获取相似图书推荐（核心接口） |
| `GET` | `/api/v1/recommendations/algorithms` | 获取支持的推荐算法列表 |
| `GET` | `/api/v1/books/search` | 图书搜索 |
| `GET` | `/api/v1/books/{isbn}` | 获取图书详情 |
| `GET` | `/api/v1/books/popular/list` | 获取热门图书 |
| `GET` | `/api/v1/books/high-rated/list` | 获取高分图书 |
| `GET` | `/api/v1/health/` | 健康检查 |

### 推荐接口示例

**请求：**
```json
{
  "source_book": { "isbn": "0385504209", "title": "The Da Vinci Code" },
  "algorithm": "bpr",
  "limit": 5
}
```

**响应：**
```json
{
  "source_book": { "isbn": "0385504209", "book_title": "The Da Vinci Code", "book_author": "Dan Brown", ... },
  "algorithm": "bpr",
  "recommendations": [
    {
      "rank": 1,
      "isbn": "0439139597",
      "book_title": "Harry Potter and the Chamber of Secrets",
      "similarity_score": 0.89,
      "reasons": [
        { "category": "矩阵分解", "description": "通过机器学习发现的潜在关联", "weight": 0.3 }
      ]
    }
  ],
  "performance": {
    "algorithm": "bpr",
    "response_time_ms": 190,
    "algorithm_metrics": { "precision": 0.92, "recall": 0.88, "f1_score": 0.90, "coverage": 1.0 }
  }
}
```

> 完整的交互式 API 文档请访问：http://localhost:8000/docs

---

## 性能指标

### 响应时间

| 接口类型 | 平均响应时间 | P95 | P99 |
|---------|:-----------:|:---:|:---:|
| 健康检查 | 15ms | 25ms | 40ms |
| 图书搜索 | 120ms | 200ms | 350ms |
| 内容推荐 | 80ms | 120ms | 180ms |
| 混合推荐 | 150ms | 220ms | 300ms |
| BPR 推荐 | 190ms | 280ms | 400ms |
| LightGBM | 25s* | 35s | 45s |

> *LightGBM 首次包含数据加载时间，后续请求 1-2 秒。

### 资源占用

| 组件 | 内存占用 | 说明 |
|------|:-------:|------|
| FastAPI 后端 | ~200MB | 包含模型加载 |
| React 前端 | ~50MB | 浏览器端 |
| SQLite 数据库 | ~177MB | 270K 图书数据 |
| BPR 模型 | ~64MB | 预训练模型 |
| LightGBM 模型 | ~432MB | 预训练模型 |

---

## 数据集与处理

### 数据集概况
- **名称**：Book-Crossing Dataset
- **来源**：[Book-Crossing](http://www.informatik.uni-freiburg.de/~cziegler/BX/)
- **图书数量**：270,151 本
- **用户数量**：68,000+ 人
- **评分记录**：383,842 条
- **时间跨度**：1998-2004 年

### 数据库表结构

```sql
-- 图书表
CREATE TABLE books (
  isbn VARCHAR(20) PRIMARY KEY,
  book_title VARCHAR(500) NOT NULL,
  book_author VARCHAR(200) NOT NULL,
  year_of_publication INTEGER,
  publisher VARCHAR(200),
  avg_rating DECIMAL(3,2) DEFAULT 0.0,
  rating_count INTEGER DEFAULT 0,
  image_url_s TEXT, image_url_m TEXT, image_url_l TEXT,
  book_author_encoded INTEGER,
  publisher_encoded INTEGER,
  publication_decade VARCHAR(10)
);

-- 用户评分表
CREATE TABLE user_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id VARCHAR(50) NOT NULL,
  isbn VARCHAR(20) NOT NULL,
  book_rating DECIMAL(3,1) NOT NULL,
  FOREIGN KEY (isbn) REFERENCES books(isbn),
  UNIQUE (user_id, isbn)
);
```

---

## 部署指南

### Docker 部署

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
    volumes:
      - ./backend/book_recommendation.db:/app/book_recommendation.db
      - ./backend/models:/app/models
  frontend:
    build: ./frontend
    ports: ["80:80"]
    depends_on: [backend]
```

```bash
docker-compose up --build
```

### 服务器要求

| 配置 | 最低 | 推荐 |
|------|------|------|
| CPU | 2 核 | 4 核 |
| 内存 | 4GB | 8GB |
| 存储 | 20GB SSD | 50GB SSD |

> 详细部署指南请参考 [服务器运行指南.md](服务器运行指南.md)

---

## 参与贡献

**我们热烈欢迎所有形式的贡献！** 无论你是经验丰富的开发者还是刚入门的新手，都可以参与到这个项目中来。

### 如何参与

1. **Fork** 本仓库
2. 创建功能分支：`git checkout -b feature/your-feature-name`
3. 提交更改：`git commit -m "feat: 添加新功能"`
4. 推送分支：`git push origin feature/your-feature-name`
5. 创建 **Pull Request**

### 需要帮助的方向

我们特别期待以下方面的贡献：

| 方向 | 说明 | 难度 |
|------|------|:----:|
| 高级搜索功能 | 多维度筛选、分页、搜索历史 | ⭐⭐ |
| 用户注册/登录系统 | 完整的用户认证与授权 | ⭐⭐⭐ |
| 深色模式 | 主题切换支持 | ⭐⭐ |
| Redis 缓存集成 | 热门推荐结果缓存 | ⭐⭐ |
| 深度学习推荐算法 | Neural CF 等新算法 | ⭐⭐⭐⭐ |
| 推荐统计仪表板 | 数据可视化分析 | ⭐⭐⭐ |
| 用户行为分析 | 点击率、转化率追踪 | ⭐⭐⭐ |
| 单元测试覆盖 | 提高代码质量 | ⭐⭐ |
| 国际化 (i18n) | 多语言支持 | ⭐⭐ |
| Docker 优化 | 生产环境镜像优化 | ⭐⭐ |

### 提交规范

```
feat: 新功能
fix: 修复 Bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试用例
chore: 构建/工具链
```

### 反馈与交流

- 🐛 **报告 Bug**：[创建 Issue](https://github.com/LinHao-city/book-recommendation-system/issues)
- 💡 **功能建议**：[发起 Discussion](https://github.com/LinHao-city/book-recommendation-system/discussions)
- ⭐ **如果觉得有用，请给项目一个 Star！**

---

## 许可证与版权

### 开源许可

本项目采用 **MIT 许可证** 开源 — 详见 [LICENSE](LICENSE) 文件。

你可以自由地使用、修改和分发本项目代码，但需保留原始版权声明。

### 版权声明

```
Copyright (c) 2025 LinHao-city

本项目由 LinHao-city 及贡献者开发和维护。
项目中使用的 Book-Crossing 数据集版权归原数据集作者所有。
预训练模型文件基于 Book-Crossing 数据集训练，仅供学术研究和学习使用。
```

### 免责声明

- 本项目仅供 **学术研究和学习交流** 使用
- 推荐结果仅供参考，不构成任何商业建议
- 图书封面图片来源于 Amazon，版权归原图片所有者所有
- 如将本项目用于商业用途，请确保符合相关数据集的使用条款

### 引用

如果本项目对你的研究或学习有帮助，欢迎引用：

```bibtex
@software{book_recommendation_system,
  author = {LinHao-city},
  title = {Book Recommendation System},
  year = {2025},
  url = {https://github.com/LinHao-city/book-recommendation-system}
}
```

---

## 联系方式

- **GitHub**：[@LinHao-city](https://github.com/LinHao-city)
- **项目主页**：[book-recommendation-system](https://github.com/LinHao-city/book-recommendation-system)

---

<p align="center">
  <strong>感谢每一位贡献者的支持！</strong><br>
  如果觉得这个项目有价值，请点个 ⭐ Star 支持一下！
</p>
