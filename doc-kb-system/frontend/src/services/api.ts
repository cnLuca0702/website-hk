import axios from 'axios';
import { ApiResponse, Document, DocumentClassification, KnowledgeBase } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 文档 API
export const documentApi = {
  // 上传文档
  upload: async (file: File): Promise<ApiResponse<Document>> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  // 获取文档列表
  list: async (): Promise<ApiResponse<Document[]>> => {
    const response = await api.get('/documents/');
    return response.data;
  },
  
  // 获取文档详情
  get: async (id: string): Promise<ApiResponse<Document>> => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },
  
  // 处理文档
  process: async (documentId: string, classificationId?: string): Promise<ApiResponse<any>> => {
    const response = await api.post('/documents/process', {
      document_id: documentId,
      classification_id: classificationId,
    });
    return response.data;
  },
  
  // 删除文档
  delete: async (id: string): Promise<ApiResponse<any>> => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },
};

// 分类 API
export const classificationApi = {
  // 创建分类
  create: async (data: {
    name: string;
    description: string;
    keywords?: string[];
    fields?: ClassificationField[];
  }): Promise<ApiResponse<DocumentClassification>> => {
    const response = await api.post('/classifications/', data);
    return response.data;
  },
  
  // 获取分类列表
  list: async (): Promise<ApiResponse<DocumentClassification[]>> => {
    const response = await api.get('/classifications/');
    return response.data;
  },
  
  // 获取分类详情
  get: async (id: string): Promise<ApiResponse<DocumentClassification>> => {
    const response = await api.get(`/classifications/${id}`);
    return response.data;
  },
  
  // 更新分类
  update: async (
    id: string,
    data: Partial<DocumentClassification>
  ): Promise<ApiResponse<DocumentClassification>> => {
    const response = await api.put(`/classifications/${id}`, data);
    return response.data;
  },
  
  // 删除分类
  delete: async (id: string): Promise<ApiResponse<any>> => {
    const response = await api.delete(`/classifications/${id}`);
    return response.data;
  },
};

// 知识库 API
export const knowledgeBaseApi = {
  // 构建知识库
  build: async (data: {
    name: string;
    description?: string;
    document_ids: string[];
  }): Promise<ApiResponse<KnowledgeBase>> => {
    const response = await api.post('/knowledge-base/build', data);
    return response.data;
  },
  
  // 获取知识库列表
  list: async (): Promise<ApiResponse<KnowledgeBase[]>> => {
    const response = await api.get('/knowledge-base/');
    return response.data;
  },
  
  // 获取知识库详情
  get: async (id: string): Promise<ApiResponse<KnowledgeBase>> => {
    const response = await api.get(`/knowledge-base/${id}`);
    return response.data;
  },
  
  // 获取知识库 Markdown
  getMarkdown: async (id: string): Promise<ApiResponse<{ markdown_content: string }>> => {
    const response = await api.get(`/knowledge-base/${id}/markdown`);
    return response.data;
  },
  
  // 删除知识库
  delete: async (id: string): Promise<ApiResponse<any>> => {
    const response = await api.delete(`/knowledge-base/${id}`);
    return response.data;
  },
};

export default api;
