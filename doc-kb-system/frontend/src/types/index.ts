// 文档类型
export interface Document {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  status: 'pending' | 'parsing' | 'classifying' | 'extracting' | 'completed' | 'failed';
  document_type?: string;
  extracted_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// 分类字段定义
export interface ClassificationField {
  name: string;
  description: string;
  field_type: 'string' | 'number' | 'integer' | 'boolean' | 'date' | 'array' | 'object';
  required: boolean;
}

// 文档分类
export interface DocumentClassification {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  fields: ClassificationField[];
  created_at: string;
}

// 知识库条目
export interface KnowledgeBaseItem {
  document_id: string;
  document_name: string;
  document_type: string;
  extracted_data: Record<string, any>;
  summary?: string;
}

// 知识库
export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  items: KnowledgeBaseItem[];
  markdown_content?: string;
  created_at: string;
  updated_at: string;
}

// API 响应
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
