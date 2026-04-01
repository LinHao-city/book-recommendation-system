import sys
import os

# 添加路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# 导入SQLite版本的数据库
from app.core.database_sqlite import get_db, init_db
from app.core.config_sqlite import get_settings
from app.api.v1 import books, recommendations, health

# 初始化数据库
init_db()

# 创建FastAPI应用
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Book Recommendation API",
    version="1.0.0",
    description="Intelligent book recommendation system",
    docs_url="/docs",
    redoc_url="/redoc"
)

settings = get_settings()

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(health.router, prefix="/api/v1/health", tags=["Health"])
app.include_router(books.router, prefix="/api/v1/books", tags=["Books"])
app.include_router(recommendations.router, prefix="/api/v1/recommendations", tags=["Recommendations"])

@app.get("/")
async def root():
    return {
        "message": "Book Recommendation API",
        "version": "1.0.0",
        "docs_url": "/docs",
        "database": "SQLite"
    }

if __name__ == "__main__":
    import uvicorn
    print("Starting Book Recommendation System API...")
    print("Server will start at http://localhost:8000")
    print("API docs available at http://localhost:8000/docs")
    print("Press Ctrl+C to stop the server")
    uvicorn.run("start_server:app", host="0.0.0.0", port=8000, reload=True)