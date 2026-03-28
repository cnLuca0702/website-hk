"""
文档分类管理服务
负责：文档类型的 CRUD 管理
"""
import json
import uuid
from pathlib import Path
from typing import List, Optional, Dict
from datetime import datetime

from app.core.models import DocumentClassification, ClassificationField
from app.core.config import get_settings


class ClassificationService:
    """文档分类管理服务"""
    
    def __init__(self):
        self.settings = get_settings()
        self.data_dir = Path(self.settings.data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # 内存存储
        self._classifications: Dict[str, DocumentClassification] = {}
        self._load_classifications()
        
        # 如果没有分类，创建默认分类
        if not self._classifications:
            self._create_default_classifications()
    
    def _load_classifications(self):
        """从文件加载分类列表"""
        class_file = self.data_dir / "classifications.json"
        if class_file.exists():
            try:
                with open(class_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    for class_data in data:
                        classification = DocumentClassification(**class_data)
                        self._classifications[classification.id] = classification
            except Exception as e:
                print(f"加载分类失败: {e}")
    
    def _save_classifications(self):
        """保存分类列表到文件"""
        class_file = self.data_dir / "classifications.json"
        try:
            with open(class_file, 'w', encoding='utf-8') as f:
                data = [c.model_dump() for c in self._classifications.values()]
                json.dump(data, f, ensure_ascii=False, indent=2, default=str)
        except Exception as e:
            print(f"保存分类失败: {e}")
    
    def _create_default_classifications(self):
        """创建默认文档分类"""
        defaults = [
            {
                "name": "发票",
                "description": "各类发票文档，包含增值税发票、普通发票等",
                "keywords": ["发票", "增值税", "金额", "税号"],
                "fields": [
                    {"name": "invoice_number", "description": "发票号码", "field_type": "string", "required": True},
                    {"name": "invoice_date", "description": "开票日期", "field_type": "date", "required": True},
                    {"name": "seller_name", "description": "销售方名称", "field_type": "string", "required": True},
                    {"name": "buyer_name", "description": "购买方名称", "field_type": "string", "required": True},
                    {"name": "total_amount", "description": "总金额", "field_type": "number", "required": True},
                    {"name": "tax_amount", "description": "税额", "field_type": "number", "required": False},
                ]
            },
            {
                "name": "合同",
                "description": "各类合同文档，包含采购合同、服务合同等",
                "keywords": ["合同", "协议", "甲方", "乙方", "签订日期"],
                "fields": [
                    {"name": "contract_number", "description": "合同编号", "field_type": "string", "required": True},
                    {"name": "contract_date", "description": "签订日期", "field_type": "date", "required": True},
                    {"name": "party_a", "description": "甲方", "field_type": "string", "required": True},
                    {"name": "party_b", "description": "乙方", "field_type": "string", "required": True},
                    {"name": "contract_amount", "description": "合同金额", "field_type": "number", "required": True},
                    {"name": "start_date", "description": "开始日期", "field_type": "date", "required": False},
                    {"name": "end_date", "description": "结束日期", "field_type": "date", "required": False},
                ]
            },
            {
                "name": "报告",
                "description": "各类报告文档，包含研究报告、分析报告等",
                "keywords": ["报告", "分析", "研究", "结论", "摘要"],
                "fields": [
                    {"name": "report_title", "description": "报告标题", "field_type": "string", "required": True},
                    {"name": "author", "description": "作者", "field_type": "string", "required": False},
                    {"name": "report_date", "description": "报告日期", "field_type": "date", "required": False},
                    {"name": "summary", "description": "摘要", "field_type": "string", "required": False},
                    {"name": "key_findings", "description": "主要发现", "field_type": "array", "required": False},
                ]
            },
            {
                "name": "简历",
                "description": "个人简历文档",
                "keywords": ["简历", "求职", "教育背景", "工作经验"],
                "fields": [
                    {"name": "name", "description": "姓名", "field_type": "string", "required": True},
                    {"name": "phone", "description": "电话", "field_type": "string", "required": False},
                    {"name": "email", "description": "邮箱", "field_type": "string", "required": False},
                    {"name": "education", "description": "教育背景", "field_type": "array", "required": False},
                    {"name": "experience", "description": "工作经验", "field_type": "array", "required": False},
                    {"name": "skills", "description": "技能", "field_type": "array", "required": False},
                ]
            }
        ]
        
        for default in defaults:
            self.create_classification(
                name=default["name"],
                description=default["description"],
                keywords=default["keywords"],
                fields=[ClassificationField(**f) for f in default["fields"]]
            )
    
    def create_classification(
        self,
        name: str,
        description: str,
        keywords: List[str] = None,
        fields: List[ClassificationField] = None
    ) -> DocumentClassification:
        """
        创建文档分类
        
        Args:
            name: 分类名称
            description: 分类描述
            keywords: 关键词列表
            fields: 字段定义列表
            
        Returns:
            分类对象
        """
        class_id = str(uuid.uuid4())
        classification = DocumentClassification(
            id=class_id,
            name=name,
            description=description,
            keywords=keywords or [],
            fields=fields or []
        )
        
        self._classifications[class_id] = classification
        self._save_classifications()
        return classification
    
    def get_classification(self, class_id: str) -> Optional[DocumentClassification]:
        """获取分类"""
        return self._classifications.get(class_id)
    
    def get_all_classifications(self) -> List[DocumentClassification]:
        """获取所有分类"""
        return list(self._classifications.values())
    
    def update_classification(
        self,
        class_id: str,
        **kwargs
    ) -> Optional[DocumentClassification]:
        """
        更新分类
        
        Args:
            class_id: 分类ID
            **kwargs: 要更新的字段
            
        Returns:
            更新后的分类对象
        """
        classification = self._classifications.get(class_id)
        if not classification:
            return None
        
        for key, value in kwargs.items():
            if hasattr(classification, key):
                setattr(classification, key, value)
        
        classification.updated_at = datetime.now()
        self._save_classifications()
        return classification
    
    def delete_classification(self, class_id: str) -> bool:
        """
        删除分类
        
        Args:
            class_id: 分类ID
            
        Returns:
            是否成功删除
        """
        if class_id not in self._classifications:
            return False
        
        del self._classifications[class_id]
        self._save_classifications()
        return True


# 单例实例
classification_service = ClassificationService()
