"""数据模型定义"""
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum


class DocumentType(str, Enum):
    """文档类型枚举"""
    INVOICE = "invoice"
    CONTRACT = "contract"
    REPORT = "report"
    RESUME = "resume"
    UNKNOWN = "unknown"


class DocumentStatus(str, Enum):
    """文档处理状态"""
    PENDING = "pending"
    PARSING = "parsing"
    CLASSIFYING = "classifying"
    EXTRACTING = "extracting"
    COMPLETED = "completed"
    FAILED = "failed"


class Document(BaseModel):
    """文档模型"""
    id: str
    filename: str
    original_name: str
    file_path: str
    file_type: str
    file_size: int
    status: DocumentStatus = DocumentStatus.PENDING
    document_type: Optional[str] = None
    extracted_data: Optional[Dict[str, Any]] = None
    markdown_content: Optional[str] = None
    preview_pages: Optional[str] = None  # 前1-2页的Markdown内容
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class ClassificationField(BaseModel):
    """分类字段定义"""
    name: str
    description: str
    field_type: str = "string"  # string, number, date, boolean, array
    required: bool = True


class DocumentClassification(BaseModel):
    """文档分类定义"""
    id: str
    name: str
    description: str
    keywords: List[str] = []
    fields: List[ClassificationField] = []
    extraction_prompt: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)


class ExtractionResult(BaseModel):
    """抽取结果"""
    document_id: str
    classification_id: str
    classification_name: str
    confidence: float
    extracted_fields: Dict[str, Any]
    raw_response: Optional[str] = None


class KnowledgeBaseItem(BaseModel):
    """知识库条目"""
    document_id: str
    document_name: str
    document_type: str
    extracted_data: Dict[str, Any]
    summary: Optional[str] = None


class KnowledgeBase(BaseModel):
    """知识库模型"""
    id: str
    name: str
    description: str
    items: List[KnowledgeBaseItem] = []
    markdown_content: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class ProcessRequest(BaseModel):
    """文档处理请求"""
    document_id: str
    classification_id: Optional[str] = None  # 如果为None，则自动分类


class BuildKnowledgeBaseRequest(BaseModel):
    """构建知识库请求"""
    name: str
    description: str = ""
    document_ids: List[str]
