"""
文档管理服务
负责：文档的上传、存储、状态管理
"""
import os
import uuid
import json
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.core.models import Document, DocumentStatus
from app.core.config import get_settings


class DocumentService:
    """文档管理服务"""
    
    def __init__(self):
        self.settings = get_settings()
        self.upload_dir = Path(self.settings.upload_dir)
        self.data_dir = Path(self.settings.data_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # 内存存储（实际项目应使用数据库）
        self._documents: Dict[str, Document] = {}
        self._load_documents()
    
    def _load_documents(self):
        """从文件加载文档列表"""
        docs_file = self.data_dir / "documents.json"
        if docs_file.exists():
            try:
                with open(docs_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    for doc_data in data:
                        doc = Document(**doc_data)
                        self._documents[doc.id] = doc
            except Exception as e:
                print(f"加载文档失败: {e}")
    
    def _save_documents(self):
        """保存文档列表到文件"""
        docs_file = self.data_dir / "documents.json"
        try:
            with open(docs_file, 'w', encoding='utf-8') as f:
                data = [doc.model_dump() for doc in self._documents.values()]
                json.dump(data, f, ensure_ascii=False, indent=2, default=str)
        except Exception as e:
            print(f"保存文档失败: {e}")
    
    def create_document(
        self,
        filename: str,
        original_name: str,
        file_type: str,
        file_size: int
    ) -> Document:
        """
        创建文档记录
        
        Args:
            filename: 存储的文件名
            original_name: 原始文件名
            file_type: 文件类型
            file_size: 文件大小
            
        Returns:
            文档对象
        """
        doc_id = str(uuid.uuid4())
        file_path = str(self.upload_dir / filename)
        
        document = Document(
            id=doc_id,
            filename=filename,
            original_name=original_name,
            file_path=file_path,
            file_type=file_type,
            file_size=file_size,
            status=DocumentStatus.PENDING
        )
        
        self._documents[doc_id] = document
        self._save_documents()
        return document
    
    def get_document(self, doc_id: str) -> Optional[Document]:
        """获取文档"""
        return self._documents.get(doc_id)
    
    def get_all_documents(self) -> List[Document]:
        """获取所有文档"""
        return list(self._documents.values())
    
    def update_document_status(
        self,
        doc_id: str,
        status: DocumentStatus,
        **kwargs
    ) -> Optional[Document]:
        """
        更新文档状态
        
        Args:
            doc_id: 文档ID
            status: 新状态
            **kwargs: 其他要更新的字段
            
        Returns:
            更新后的文档对象
        """
        doc = self._documents.get(doc_id)
        if not doc:
            return None
        
        doc.status = status
        doc.updated_at = datetime.now()
        
        for key, value in kwargs.items():
            if hasattr(doc, key):
                setattr(doc, key, value)
        
        self._save_documents()
        return doc
    
    def delete_document(self, doc_id: str) -> bool:
        """
        删除文档
        
        Args:
            doc_id: 文档ID
            
        Returns:
            是否成功删除
        """
        doc = self._documents.get(doc_id)
        if not doc:
            return False
        
        # 删除文件
        try:
            if os.path.exists(doc.file_path):
                os.remove(doc.file_path)
        except Exception as e:
            print(f"删除文件失败: {e}")
        
        # 删除记录
        del self._documents[doc_id]
        self._save_documents()
        return True


# 单例实例
document_service = DocumentService()
