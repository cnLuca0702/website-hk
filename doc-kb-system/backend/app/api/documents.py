"""
文档 API 路由
"""
import os
import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse

from app.core.models import DocumentStatus, ProcessRequest
from app.services.document_service import document_service
from app.services.docling_service import docling_service
from app.services.extraction_service import get_extraction_service
from app.services.classification_service import classification_service

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    上传文档
    
    支持格式: PDF, DOCX, XLSX, PPTX, HTML, 图片等
    """
    # 检查文件格式
    file_ext = Path(file.filename).suffix.lower()
    if not docling_service.is_supported(file.filename):
        raise HTTPException(
            status_code=400,
            detail=f"不支持的文件格式: {file_ext}"
        )
    
    # 生成唯一文件名
    file_id = str(uuid.uuid4())
    new_filename = f"{file_id}{file_ext}"
    file_path = Path(document_service.upload_dir) / new_filename
    
    # 保存文件
    try:
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件保存失败: {str(e)}")
    
    # 创建文档记录
    document = document_service.create_document(
        filename=new_filename,
        original_name=file.filename,
        file_type=file_ext,
        file_size=len(contents)
    )
    
    return {
        "success": True,
        "data": {
            "id": document.id,
            "filename": document.original_name,
            "file_type": document.file_type,
            "file_size": document.file_size,
            "status": document.status.value,
            "created_at": document.created_at.isoformat()
        }
    }


@router.get("/")
async def list_documents():
    """获取文档列表"""
    documents = document_service.get_all_documents()
    return {
        "success": True,
        "data": [
            {
                "id": doc.id,
                "filename": doc.original_name,
                "file_type": doc.file_type,
                "file_size": doc.file_size,
                "status": doc.status.value,
                "document_type": doc.document_type,
                "created_at": doc.created_at.isoformat(),
                "updated_at": doc.updated_at.isoformat()
            }
            for doc in documents
        ]
    }


@router.get("/{doc_id}")
async def get_document(doc_id: str):
    """获取文档详情"""
    document = document_service.get_document(doc_id)
    if not document:
        raise HTTPException(status_code=404, detail="文档不存在")
    
    return {
        "success": True,
        "data": {
            "id": document.id,
            "filename": document.original_name,
            "file_type": document.file_type,
            "file_size": document.file_size,
            "status": document.status.value,
            "document_type": document.document_type,
            "extracted_data": document.extracted_data,
            "created_at": document.created_at.isoformat(),
            "updated_at": document.updated_at.isoformat()
        }
    }


@router.post("/process")
async def process_document(request: ProcessRequest, background_tasks: BackgroundTasks):
    """
    处理文档
    
    流程: 解析 -> 分类 -> 抽取
    """
    document = document_service.get_document(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="文档不存在")
    
    # 后台处理
    background_tasks.add_task(
        _process_document_task,
        request.document_id,
        request.classification_id
    )
    
    return {
        "success": True,
        "message": "文档处理已启动",
        "data": {"document_id": request.document_id}
    }


async def _process_document_task(doc_id: str, classification_id: str = None):
    """后台处理文档任务"""
    document = document_service.get_document(doc_id)
    if not document:
        return
    
    try:
        # 1. 解析文档
        document_service.update_document_status(
            doc_id, 
            DocumentStatus.PARSING
        )
        
        full_markdown, preview_markdown = docling_service.parse_document(
            document.file_path,
            preview_pages=2
        )
        
        document_service.update_document_status(
            doc_id,
            DocumentStatus.PENDING,
            markdown_content=full_markdown,
            preview_pages=preview_markdown
        )
        
        # 2. 分类文档
        document_service.update_document_status(
            doc_id,
            DocumentStatus.CLASSIFYING
        )
        
        # 注册所有分类到 extraction_service
        for classification in classification_service.get_all_classifications():
            get_extraction_service().register_classification(classification)
        
        # 自动分类或指定分类
        if classification_id:
            matched_class = classification_service.get_classification(classification_id)
        else:
            class_name = get_extraction_service().classify_document(
                document.file_path,
                preview_markdown
            )
            matched_class = None
            for c in classification_service.get_all_classifications():
                if c.name == class_name:
                    matched_class = c
                    break
        
        if not matched_class:
            document_service.update_document_status(
                doc_id,
                DocumentStatus.COMPLETED,
                document_type="unknown"
            )
            return
        
        # 3. 抽取字段
        document_service.update_document_status(
            doc_id,
            DocumentStatus.EXTRACTING,
            document_type=matched_class.name
        )
        
        result = get_extraction_service().extract_fields(
            document.file_path,
            matched_class.id
        )
        result.document_id = doc_id
        
        # 4. 完成
        document_service.update_document_status(
            doc_id,
            DocumentStatus.COMPLETED,
            extracted_data=result.extracted_fields
        )
        
    except Exception as e:
        print(f"处理文档失败: {e}")
        document_service.update_document_status(
            doc_id,
            DocumentStatus.FAILED
        )


@router.delete("/{doc_id}")
async def delete_document(doc_id: str):
    """删除文档"""
    success = document_service.delete_document(doc_id)
    if not success:
        raise HTTPException(status_code=404, detail="文档不存在")
    
    return {"success": True, "message": "文档已删除"}
