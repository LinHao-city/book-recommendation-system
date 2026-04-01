# 图书推荐系统快速安装指南

## 系统要求
- Python 3.9+ (推荐 3.13.5)
- Node.js 16.0+ (推荐 18.x LTS)

## 快速安装

### 1. 克隆项目
```bash
git clone <repository-url>
cd 图书推荐系统
```

### 2. 后端安装
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

# 验证安装
python -c "import fastapi, uvicorn, sqlalchemy, pandas, sklearn, lightgbm; print('✅ 后端依赖安装成功')"
```

### 3. 前端安装
```bash
cd frontend

# 安装依赖
npm install

# 验证安装
npm run type-check
```

### 4. 启动服务

#### 启动后端
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
后端将在 http://localhost:8000 运行

#### 启动前端
```bash
cd frontend
npm run dev
```
前端将在 http://localhost:5173 运行

## 验证安装

1. 访问后端API文档: http://localhost:8000/docs
2. 访问前端应用: http://localhost:5173
3. 检查算法列表是否包含LightGBM

## 常见问题

### LightGBM安装失败
```bash
# Windows用户
conda install lightgbm

# macOS用户
brew install libomp
pip install lightgbm

# Linux用户
sudo apt-get install build-essential cmake
pip install lightgbm
```

### 依赖冲突
```bash
# 清理并重新安装
pip uninstall -y -r requirements.txt
pip install -r requirements.txt
```

### 前端问题
```bash
# 清理缓存重新安装
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## 详细文档

完整的依赖文档请查看: [DEPENDENCIES.md](./DEPENDENCIES.md)