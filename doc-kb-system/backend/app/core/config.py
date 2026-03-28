"""应用配置"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """应用配置类"""

    # LLM 提供者类型: openai / anthropic / ollama
    llm_provider: str = "openai"

    # OpenAI
    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"
    openai_model: str = "gpt-4o-mini"

    # Anthropic
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-3-sonnet-20240229"

    # Ollama (本地)
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"

    # 应用配置
    app_host: str = "0.0.0.0"
    app_port: int = 8866
    upload_dir: str = "./uploads"
    data_dir: str = "./data"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
