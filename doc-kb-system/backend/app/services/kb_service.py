"""
知识库构建服务
负责：多文档合并、LLM 摘要、结构化知识库输出
"""
import os
import json
from typing import List, Dict, Any
from datetime import datetime

from app.core.config import get_settings
from app.core.models import KnowledgeBase, KnowledgeBaseItem


class KnowledgeBaseService:
    """知识库构建服务"""
    
    def __init__(self):
        self.settings = get_settings()
    
    def build_knowledge_base(
        self,
        name: str,
        description: str,
        items: List[KnowledgeBaseItem]
    ) -> KnowledgeBase:
        """
        构建知识库
        
        Args:
            name: 知识库名称
            description: 知识库描述
            items: 知识库条目列表
            
        Returns:
            知识库对象
        """
        # 生成 Markdown 内容
        markdown_content = self._generate_markdown(name, description, items)
        
        return KnowledgeBase(
            id=name.replace(' ', '_').lower() + '_' + datetime.now().strftime('%Y%m%d%H%M%S'),
            name=name,
            description=description,
            items=items,
            markdown_content=markdown_content
        )
    
    def _generate_markdown(
        self,
        name: str,
        description: str,
        items: List[KnowledgeBaseItem]
    ) -> str:
        """生成知识库 Markdown 内容"""
        lines = [
            f"# {name}",
            "",
            f"**描述**: {description}",
            f"**创建时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            f"**文档数量**: {len(items)}",
            "",
            "---",
            "",
            "## 目录",
            "",
        ]
        
        # 生成目录
        for i, item in enumerate(items, 1):
            lines.append(f"{i}. [{item.document_name}](#doc-{i})")
        
        lines.extend(["", "---", ""])
        
        # 生成各文档内容
        for i, item in enumerate(items, 1):
            lines.extend([
                f"## {i}. {item.document_name} <a id='doc-{i}'></a>",
                "",
                f"**文档类型**: {item.document_type}",
                "",
                "### 抽取数据",
                "",
                "```json",
                json.dumps(item.extracted_data, ensure_ascii=False, indent=2),
                "```",
                "",
            ])
            
            if item.summary:
                lines.extend([
                    "### 摘要",
                    "",
                    item.summary,
                    "",
                ])
            
            lines.extend(["---", ""])
        
        return "\n".join(lines)
    
    def generate_summary(self, items: List[KnowledgeBaseItem]) -> str:
        """
        生成知识库摘要
        
        Args:
            items: 知识库条目列表
            
        Returns:
            摘要文本
        """
        # 按类型分组统计
        type_counts = {}
        for item in items:
            type_counts[item.document_type] = type_counts.get(item.document_type, 0) + 1
        
        summary_parts = ["知识库包含以下文档类型:"]
        for doc_type, count in type_counts.items():
            summary_parts.append(f"- {doc_type}: {count} 个文档")
        
        return "\n".join(summary_parts)


# 单例实例
kb_service = KnowledgeBaseService()
