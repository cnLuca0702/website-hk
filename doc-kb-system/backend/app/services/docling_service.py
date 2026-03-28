"""
文档解析服务 - 基于 docling
负责：PDF/DOCX/XLSX/PPTX 等文档的解析和 Markdown 转换
"""
import os
from pathlib import Path
from typing import Optional, Tuple
from docling.datamodel.document import ConversionResult
from docling.datamodel.settings import PageRange
from docling.document_converter import DocumentConverter


class DoclingService:
    """docling 文档解析服务"""
    
    def __init__(self):
        self.converter = DocumentConverter()
    
    def parse_document(
        self, 
        file_path: str, 
        preview_pages: int = 2
    ) -> Tuple[str, str]:
        """
        解析文档，返回完整内容和预览内容
        
        Args:
            file_path: 文档路径
            preview_pages: 预览页数（用于分类匹配）
            
        Returns:
            (完整Markdown内容, 预览Markdown内容)
        """
        # 转换完整文档
        result = self.converter.convert(file_path)
        full_markdown = result.document.export_to_markdown()
        
        # 提取前 N 页作为预览（用于分类）
        preview_result = self.converter.convert(
            file_path,
            page_range=PageRange(from_page=1, to_page=preview_pages)
        )
        preview_markdown = preview_result.document.export_to_markdown()
        
        return full_markdown, preview_markdown
    
    def parse_to_dict(self, file_path: str) -> dict:
        """
        解析文档为字典格式
        
        Args:
            file_path: 文档路径
            
        Returns:
            文档字典数据
        """
        result = self.converter.convert(file_path)
        return result.document.export_to_dict()
    
    def get_supported_formats(self) -> list:
        """获取支持的文件格式"""
        return [
            ".pdf", ".docx", ".doc", ".pptx", ".ppt",
            ".xlsx", ".xls", ".html", ".htm",
            ".png", ".jpg", ".jpeg", ".tiff", ".bmp"
        ]
    
    def is_supported(self, file_path: str) -> bool:
        """检查文件格式是否支持"""
        ext = Path(file_path).suffix.lower()
        return ext in self.get_supported_formats()


# 单例实例
docling_service = DoclingService()
