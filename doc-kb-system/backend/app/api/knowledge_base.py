"""
知识库 API 路由
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks

from app.core.models import BuildKnowledgeBaseRequest, KnowledgeBaseItem
from app.services.kb_service import kb_service
from app.services.document_service import document_service

router = APIRouter(prefix="/api/knowledge-base", tags=["knowledge-base"])

# 内存存储知识库（实际项目应使用数据库）
_knowledge_bases = {}


@router.post("/build")
async def build_knowledge_base(
    request: BuildKnowledgeBaseRequest,
    background_tasks: BackgroundTasks
):
    """
    构建知识库
    
    将多个已处理的文档合并为一个知识库
    """
    # 验证文档
    items = []
    for doc_id in request.document_ids:
        doc = document_service.get_document(doc_id)
        if not doc:
            raise HTTPException(
                status_code=404, 
                detail=f"文档不存在: {doc_id}"
            )
        if doc.status.value != "completed":
            raise HTTPException(
                status_code=400,
                detail=f"文档未处理完成: {doc.original_name}"
            )
        
        items.append(KnowledgeBaseItem(
            document_id=doc.id,
            document_name=doc.original_name,
            document_type=doc.document_type or "unknown",
            extracted_data=doc.extracted_data or {},
            summary=doc.markdown_content[:500] if doc.markdown_content else None
        ))
    
    # 构建知识库
    kb = kb_service.build_knowledge_base(
        name=request.name,
        description=request.description,
        items=items
    )
    
    # 保存知识库
    _knowledge_bases[kb.id] = kb
    
    return {
        "success": True,
        "data": {
            "id": kb.id,
            "name": kb.name,
            "description": kb.description,
            "document_count": len(kb.items),
            "created_at": kb.created_at.isoformat()
        }
    }


@router.get("/")
async def list_knowledge_bases():
    """获取知识库列表"""
    return {
        "success": True,
        "data": [
            {
                "id": kb.id,
                "name": kb.name,
                "description": kb.description,
                "document_count": len(kb.items),
                "created_at": kb.created_at.isoformat(),
                "updated_at": kb.updated_at.isoformat()
            }
            for kb in _knowledge_bases.values()
        ]
    }


@router.get("/{kb_id}")
async def get_knowledge_base(kb_id: str):
    """获取知识库详情"""
    kb = _knowledge_bases.get(kb_id)
    if not kb:
        raise HTTPException(status_code=404, detail="知识库不存在")
    
    return {
        "success": True,
        "data": {
            "id": kb.id,
            "name": kb.name,
            "description": kb.description,
            "items": [
                {
                    "document_id": item.document_id,
                    "document_name": item.document_name,
                    "document_type": item.document_type,
                    "extracted_data": item.extracted_data,
                    "summary": item.summary
                }
                for item in kb.items
            ],
            "markdown_content": kb.markdown_content,
            "created_at": kb.created_at.isoformat(),
            "updated_at": kb.updated_at.isoformat()
        }
    }


@router.get("/{kb_id}/markdown")
async def get_knowledge_base_markdown(kb_id: str):
    """获取知识库 Markdown 内容"""
    kb = _knowledge_bases.get(kb_id)
    if not kb:
        raise HTTPException(status_code=404, detail="知识库不存在")
    
    return {
        "success": True,
        "data": {
            "id": kb.id,
            "name": kb.name,
            "markdown_content": kb.markdown_content
        }
    }


@router.delete("/{kb_id}")
async def delete_knowledge_base(kb_id: str):
    """删除知识库"""
    if kb_id not in _knowledge_bases:
        raise HTTPException(status_code=404, detail="知识库不存在")
    
    del _knowledge_bases[kb_id]
    return {"success": True, "message": "知识库已删除"}
