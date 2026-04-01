"""
FastAPI主应用文件
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import time
from .core.config_sqlite import get_settings
from .core.database_sqlite import test_db_connection, init_db
from .api.v1 import books, recommendations, health
from .api.v1.book_details import router as book_details_router

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时执行
    logger.info("🚀 正在启动图书推荐系统API...")

    # 测试数据库连接
    if not test_db_connection():
        logger.error("❌ 数据库连接失败，应用启动终止")
        raise RuntimeError("数据库连接失败")

    logger.info("✅ 数据库连接成功")

    # 初始化数据库表
    try:
        init_db()
        logger.info("✅ 数据库初始化完成")
    except Exception as e:
        logger.error(f"❌ 数据库初始化失败: {e}")
        raise RuntimeError(f"数据库初始化失败: {e}")

    logger.info("🎉 图书推荐系统API启动完成！")

    yield

    # 关闭时执行
    logger.info("👋 正在关闭图书推荐系统API...")


# 创建FastAPI应用
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=settings.DESCRIPTION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)


# 请求处理时间中间件
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """添加请求处理时间头"""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


# 全局异常处理
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """全局异常处理器"""
    logger.error(f"全局异常: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "内部服务器错误",
            "message": "服务器遇到了一个错误，请稍后再试",
            "detail": str(exc) if settings.LOG_LEVEL == "DEBUG" else None,
            "timestamp": time.time(),
        }
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """HTTP异常处理器"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "HTTP错误",
            "message": exc.detail,
            "status_code": exc.status_code,
            "timestamp": time.time(),
        }
    )


# 注册路由
app.include_router(
    health.router,
    prefix=f"{settings.API_PREFIX}/health",
    tags=["健康检查"]
)

app.include_router(
    books.router,
    prefix=f"{settings.API_PREFIX}/books",
    tags=["图书管理"]
)

app.include_router(
    recommendations.router,
    prefix=f"{settings.API_PREFIX}/recommendations",
    tags=["推荐系统"]
)

app.include_router(
    book_details_router,
    tags=["图书详情"]
)


# 根路径
@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "欢迎使用图书推荐系统API",
        "version": settings.APP_VERSION,
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "api_prefix": settings.API_PREFIX,
        "timestamp": time.time(),
    }


# API信息
@app.get("/info")
async def api_info():
    """API信息"""
    return {
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "description": settings.DESCRIPTION,
        "api_prefix": settings.API_PREFIX,
        "cors_origins": settings.CORS_ORIGINS,
        "default_recommendation_limit": settings.DEFAULT_RECOMMENDATION_LIMIT,
        "max_recommendation_limit": settings.MAX_RECOMMENDATION_LIMIT,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.API_RELOAD,
        log_level=settings.LOG_LEVEL.lower(),
    )