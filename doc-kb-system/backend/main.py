"""
文档知识库构建系统 - FastAPI 后端

基于三层架构：
- 解析层: docling
- 分类+抽取层: ExtractThinker
- 知识库合并层: knowledge-base-builder
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import documents, classifications, knowledge_base

# 创建 FastAPI 应用
app = FastAPI(
    title="文档知识库构建系统",
    description="基于 docling + ExtractThinker + knowledge-base-builder 的文档自动识别、分类、抽取与知识库构建系统",
    version="1.0.0"
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(documents.router)
app.include_router(classifications.router)
app.include_router(knowledge_base.router)


@app.get("/")
async def root():
    """根路径"""
    return {
        "name": "文档知识库构建系统",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "documents": "/api/documents",
            "classifications": "/api/classifications",
            "knowledge_base": "/api/knowledge-base"
        }
    }


@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    from app.core.config import get_settings
    
    settings = get_settings()
    
    # 确保上传目录存在
    os.makedirs(settings.upload_dir, exist_ok=True)
    os.makedirs(settings.data_dir, exist_ok=True)
    
    uvicorn.run(
        "main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=True
    )
