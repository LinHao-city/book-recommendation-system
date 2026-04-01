# 图书推荐系统后端

基于FastAPI的智能图书推荐系统后端服务。

## 功能特性

- 🚀 **高性能**: FastAPI异步框架，支持高并发
- 📚 **智能推荐**: 三种推荐算法（基于内容、协同过滤、混合推荐）
- 🔍 **全文搜索**: 支持书名、作者、出版社多维度搜索
- 📊 **性能监控**: 实时性能指标和健康检查
- 🔒 **类型安全**: 完整的Pydantic数据验证
- 📖 **API文档**: 自动生成的OpenAPI文档

## 推荐算法

### 1. 基于内容推荐 (Content-Based)
- 基于图书的作者、出版社、年代等属性相似性
- 适合喜欢特定作者、出版社或类型的读者

### 2. 协同过滤推荐 (Collaborative Filtering)
- 基于"喜欢此书的用户也喜欢"的行为模式
- 适合喜欢探索新书的读者

### 3. 混合推荐 (Hybrid)
- 结合内容相似性和协同过滤
- 提供最全面和准确的推荐结果

## 快速开始

### 1. 环境要求

- Python 3.9+
- MySQL 8.0+
- Redis (可选，用于缓存)

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 配置环境

复制环境配置文件并修改：

```bash
cp .env.example .env
```

主要配置项：
```env
# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=book_recommendation

# API配置
API_HOST=0.0.0.0
API_PORT=8000
```

### 4. 初始化数据库

```bash
# 1. 创建数据库
mysql -u root -p < database/schema.sql

# 2. 导入数据 (可选)
python database/import_data.py
```

### 5. 启动服务

```bash
# 方式1: 使用启动脚本
python run.py

# 方式2: 直接使用uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 6. 访问API文档

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI JSON: http://localhost:8000/openapi.json

## API端点

### 健康检查
- `GET /api/v1/health/` - 基础健康检查
- `GET /api/v1/health/detailed` - 详细健康检查

### 图书管理
- `GET /api/v1/books/search` - 搜索图书
- `GET /api/v1/books/{isbn}` - 获取图书详情
- `GET /api/v1/books/popular/list` - 获取热门图书
- `GET /api/v1/books/high-rated/list` - 获取高分图书
- `GET /api/v1/books/recent/list` - 获取最新图书
- `GET /api/v1/books/classic/list` - 获取经典图书

### 推荐系统
- `GET /api/v1/recommendations/similar` - 获取相似推荐
- `POST /api/v1/recommendations/similar` - 获取相似推荐（POST方式）
- `GET /api/v1/recommendations/algorithms` - 获取推荐算法列表
- `GET /api/v1/recommendations/performance` - 获取算法性能概览
- `GET /api/v1/recommendations/stats` - 获取推荐系统统计

## 使用示例

### 搜索图书
```bash
curl "http://localhost:8000/api/v1/books/search?query=Python&limit=10"
```

### 获取推荐
```bash
curl "http://localhost:8000/api/v1/recommendations/similar?source_isbn=0134685997&algorithm=hybrid&limit=5"
```

### POST方式推荐
```bash
curl -X POST "http://localhost:8000/api/v1/recommendations/similar" \
  -H "Content-Type: application/json" \
  -d '{
    "source_book": {"isbn": "0134685997", "title": "Automate the Boring Stuff"},
    "algorithm": "collaborative",
    "limit": 10
  }'
```

## 开发指南

### 项目结构

```
backend/
├── app/
│   ├── api/v1/          # API路由
│   ├── core/            # 核心配置
│   ├── models/          # 数据库模型
│   ├── schemas/         # Pydantic模式
│   ├── services/        # 业务逻辑
│   └── utils/           # 工具函数
├── database/            # 数据库脚本
├── requirements.txt     # Python依赖
├── .env.example        # 环境配置示例
└── run.py              # 启动脚本
```

### 添加新的API端点

1. 在 `app/schemas/` 中定义数据模型
2. 在 `app/services/` 中实现业务逻辑
3. 在 `app/api/v1/` 中添加路由
4. 更新API文档

### 数据库迁移

```bash
# 生成迁移文件
alembic revision --autogenerate -m "描述"

# 执行迁移
alembic upgrade head
```

## 部署

### Docker部署

```bash
# 构建镜像
docker build -t book-recommendation-api .

# 运行容器
docker run -p 8000:8000 --env-file .env book-recommendation-api
```

### 生产环境配置

1. 设置环境变量 `API_RELOAD=false`
2. 配置反向代理（Nginx）
3. 启用HTTPS
4. 配置日志轮转
5. 设置监控和告警

## 性能优化

- 使用Redis缓存热门推荐结果
- 数据库连接池优化
- 异步数据库查询
- API响应压缩
- CDN加速静态资源

## 监控

- 健康检查端点：`/api/v1/health/`
- 性能指标：`/api/v1/recommendations/performance`
- 系统统计：`/api/v1/recommendations/stats`

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

## 支持

如有问题，请提交Issue或联系开发团队。