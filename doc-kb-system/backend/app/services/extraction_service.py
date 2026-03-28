"""
文档分类与抽取服务 - 基于 ExtractThinker
支持: OpenAI / Anthropic / Ollama (本地)
"""
import os
from typing import List, Optional, Dict, Any, Type
from pydantic import BaseModel, create_model
from extract_thinker import Extractor, Classification, Contract, DocumentLoaderPyPdf

from app.core.config import get_settings
from app.core.models import (
    DocumentClassification,
    ClassificationField,
    ExtractionResult
)


class ExtractionService:
    """ExtractThinker 文档分类与抽取服务"""

    def __init__(self):
        self.settings = get_settings()
        self.extractor = Extractor()
        self.extractor.load_document_loader(DocumentLoaderPyPdf())
        self._load_llm()
        self._classifications: List[Classification] = []
        self._document_classifications: Dict[str, DocumentClassification] = {}

    def _load_llm(self):
        """根据配置加载 LLM 模型"""
        provider = self.settings.llm_provider.lower()

        if provider == "openai":
            if not self.settings.openai_api_key:
                raise ValueError("OPENAI_API_KEY is required for OpenAI provider")
            os.environ["OPENAI_API_KEY"] = self.settings.openai_api_key
            if self.settings.openai_base_url:
                os.environ["OPENAI_BASE_URL"] = self.settings.openai_base_url
            self.extractor.load_llm(self.settings.openai_model)

        elif provider == "anthropic":
            if not self.settings.anthropic_api_key:
                raise ValueError("ANTHROPIC_API_KEY is required for Anthropic provider")
            os.environ["ANTHROPIC_API_KEY"] = self.settings.anthropic_api_key
            self.extractor.load_llm(self.settings.anthropic_model)

        elif provider == "ollama":
            # Ollama 使用 litellm 兼容模式
            os.environ["OLLAMA_BASE_URL"] = self.settings.ollama_base_url
            # litellm 需要设置 API key 为任意值来标识使用本地端点
            os.environ["OLLAMA_API_KEY"] = "ollama"
            # 使用 openai compatible 格式
            model = self.settings.ollama_model
            self.extractor.load_llm(model)

        else:
            raise ValueError(f"Unknown LLM provider: {provider}")

    def register_classification(self, doc_class: DocumentClassification):
        """
        注册文档分类
        """
        classification = Classification(
            name=doc_class.name,
            description=doc_class.description
        )
        self._classifications.append(classification)
        self._document_classifications[doc_class.id] = doc_class

    def create_contract_class(self, doc_class: DocumentClassification) -> Type[Contract]:
        """
        根据字段定义动态创建 Contract 类
        """
        fields = {}
        for field in doc_class.fields:
            field_type = self._get_field_type(field.field_type)
            if field.required:
                fields[field.name] = (field_type, ...)
            else:
                fields[field.name] = (Optional[field_type], None)

        contract_class = create_model(
            f"{doc_class.name}Contract",
            __base__=Contract,
            **fields
        )
        return contract_class

    def _get_field_type(self, field_type: str) -> type:
        """获取字段类型"""
        type_mapping = {
            "string": str,
            "number": float,
            "integer": int,
            "boolean": bool,
            "date": str,
            "array": List[str],
            "object": Dict[str, Any]
        }
        return type_mapping.get(field_type, str)

    def classify_document(self, file_path: str, preview_text: str) -> Optional[str]:
        """
        对文档进行分类
        """
        if not self._classifications:
            return None

        try:
            result = self.extractor.classify(
                preview_text,
                self._classifications
            )
            return result.name if result else None
        except Exception as e:
            print(f"分类失败: {e}")
            return None

    def extract_fields(
        self,
        file_path: str,
        classification_id: str
    ) -> ExtractionResult:
        """
        从文档中抽取字段
        """
        doc_class = self._document_classifications.get(classification_id)
        if not doc_class:
            raise ValueError(f"未找到分类: {classification_id}")

        contract_class = self.create_contract_class(doc_class)

        try:
            extracted_data = self.extractor.extract(file_path, contract_class)

            return ExtractionResult(
                document_id="",
                classification_id=classification_id,
                classification_name=doc_class.name,
                confidence=1.0,
                extracted_fields=extracted_data.model_dump(),
                raw_response=str(extracted_data.model_dump())
            )
        except Exception as e:
            print(f"抽取失败: {e}")
            # 返回空结果而不是崩溃
            return ExtractionResult(
                document_id="",
                classification_id=classification_id,
                classification_name=doc_class.name,
                confidence=0.0,
                extracted_fields={},
                raw_response=f"抽取失败: {str(e)}"
            )

    def get_classifications(self) -> List[DocumentClassification]:
        """获取所有注册的分类"""
        return list(self._document_classifications.values())


# 懒加载单例
_extraction_service: Optional[ExtractionService] = None


def get_extraction_service() -> ExtractionService:
    """获取或创建 ExtractionService 实例"""
    global _extraction_service
    if _extraction_service is None:
        _extraction_service = ExtractionService()
    return _extraction_service
