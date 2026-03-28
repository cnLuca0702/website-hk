"""
文档分类 API 路由
"""
from fastapi import APIRouter, HTTPException

from app.core.models import ClassificationField
from app.services.classification_service import classification_service

router = APIRouter(prefix="/api/classifications", tags=["classifications"])


@router.post("/")
async def create_classification(
    name: str,
    description: str,
    keywords: list = None,
    fields: list = None
):
    """
    创建文档分类
    
    Args:
        name: 分类名称
        description: 分类描述
        keywords: 关键词列表
        fields: 字段定义列表，格式: [{"name": "字段名", "description": "描述", "field_type": "string", "required": true}]
    """
    # 转换字段定义
    field_objects = []
    if fields:
        for field in fields:
            field_objects.append(ClassificationField(
                name=field.get("name"),
                description=field.get("description", ""),
                field_type=field.get("field_type", "string"),
                required=field.get("required", True)
            ))
    
    classification = classification_service.create_classification(
        name=name,
        description=description,
        keywords=keywords or [],
        fields=field_objects
    )
    
    return {
        "success": True,
        "data": {
            "id": classification.id,
            "name": classification.name,
            "description": classification.description,
            "keywords": classification.keywords,
            "fields": [
                {
                    "name": f.name,
                    "description": f.description,
                    "field_type": f.field_type,
                    "required": f.required
                }
                for f in classification.fields
            ],
            "created_at": classification.created_at.isoformat()
        }
    }


@router.get("/")
async def list_classifications():
    """获取所有文档分类"""
    classifications = classification_service.get_all_classifications()
    return {
        "success": True,
        "data": [
            {
                "id": c.id,
                "name": c.name,
                "description": c.description,
                "keywords": c.keywords,
                "fields": [
                    {
                        "name": f.name,
                        "description": f.description,
                        "field_type": f.field_type,
                        "required": f.required
                    }
                    for f in c.fields
                ],
                "created_at": c.created_at.isoformat()
            }
            for c in classifications
        ]
    }


@router.get("/{class_id}")
async def get_classification(class_id: str):
    """获取分类详情"""
    classification = classification_service.get_classification(class_id)
    if not classification:
        raise HTTPException(status_code=404, detail="分类不存在")
    
    return {
        "success": True,
        "data": {
            "id": classification.id,
            "name": classification.name,
            "description": classification.description,
            "keywords": classification.keywords,
            "fields": [
                {
                    "name": f.name,
                    "description": f.description,
                    "field_type": f.field_type,
                    "required": f.required
                }
                for f in classification.fields
            ],
            "created_at": classification.created_at.isoformat()
        }
    }


@router.put("/{class_id}")
async def update_classification(
    class_id: str,
    name: str = None,
    description: str = None,
    keywords: list = None,
    fields: list = None
):
    """更新分类"""
    kwargs = {}
    if name is not None:
        kwargs["name"] = name
    if description is not None:
        kwargs["description"] = description
    if keywords is not None:
        kwargs["keywords"] = keywords
    if fields is not None:
        kwargs["fields"] = [
            ClassificationField(
                name=f.get("name"),
                description=f.get("description", ""),
                field_type=f.get("field_type", "string"),
                required=f.get("required", True)
            )
            for f in fields
        ]
    
    classification = classification_service.update_classification(class_id, **kwargs)
    if not classification:
        raise HTTPException(status_code=404, detail="分类不存在")
    
    return {
        "success": True,
        "data": {
            "id": classification.id,
            "name": classification.name,
            "description": classification.description,
            "keywords": classification.keywords,
            "fields": [
                {
                    "name": f.name,
                    "description": f.description,
                    "field_type": f.field_type,
                    "required": f.required
                }
                for f in classification.fields
            ],
            "created_at": classification.created_at.isoformat()
        }
    }


@router.delete("/{class_id}")
async def delete_classification(class_id: str):
    """删除分类"""
    success = classification_service.delete_classification(class_id)
    if not success:
        raise HTTPException(status_code=404, detail="分类不存在")
    
    return {"success": True, "message": "分类已删除"}
