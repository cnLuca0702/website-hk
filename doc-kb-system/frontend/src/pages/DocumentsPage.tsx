import { useEffect, useState } from 'react';
import {
  DocumentIcon,
  PlayIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { documentApi, classificationApi } from '../services/api';
import { Document, DocumentClassification } from '../types';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [classifications, setClassifications] = useState<DocumentClassification[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [docsRes, classRes] = await Promise.all([
        documentApi.list(),
        classificationApi.list(),
      ]);

      if (docsRes.success) {
        setDocuments(docsRes.data || []);
      }
      if (classRes.success) {
        setClassifications(classRes.data || []);
      }
    } catch (error) {
      toast.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (docId: string, classificationId?: string) => {
    setProcessing(docId);
    try {
      const response = await documentApi.process(docId, classificationId);
      if (response.success) {
        toast.success('文档处理已启动');
        // 轮询更新状态
        pollStatus(docId);
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      toast.error(`处理失败: ${error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const pollStatus = async (docId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await documentApi.get(docId);
        if (response.success && response.data) {
          setDocuments((prev) =>
            prev.map((d) => (d.id === docId ? response.data! : d))
          );
          if (response.data.status === 'completed' || response.data.status === 'failed') {
            clearInterval(interval);
            if (response.data.status === 'completed') {
              toast.success('文档处理完成');
            }
          }
        }
      } catch (error) {
        clearInterval(interval);
      }
    }, 2000);
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('确定要删除这个文档吗？')) return;

    try {
      const response = await documentApi.delete(docId);
      if (response.success) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
        toast.success('文档已删除');
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const toggleSelection = (docId: string) => {
    setSelectedDocs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
      default:
        return (
          <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        );
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: '待处理',
      parsing: '解析中',
      classifying: '分类中',
      extracting: '抽取中',
      completed: '已完成',
      failed: '失败',
    };
    return statusMap[status] || status;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">文档管理</h2>
          <p className="mt-1 text-gray-600">查看和管理已上传的文档</p>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索文档..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* 文档列表 */}
      <div className="card overflow-hidden">
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <DocumentIcon className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-500">暂无文档</p>
            <a href="/" className="mt-2 text-primary-600 hover:underline">
              前往上传
            </a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedDocs.size === filteredDocuments.length}
                      onChange={() => {
                        if (selectedDocs.size === filteredDocuments.length) {
                          setSelectedDocs(new Set());
                        } else {
                          setSelectedDocs(new Set(filteredDocuments.map((d) => d.id)));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    文档
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    类型
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    大小
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    识别类型
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedDocs.has(doc.id)}
                        onChange={() => toggleSelection(doc.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <DocumentIcon className="w-8 h-8 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {doc.filename}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(doc.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 uppercase">
                      {doc.file_type}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatFileSize(doc.file_size)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(doc.status)}
                        <span className="text-sm text-gray-600">
                          {getStatusText(doc.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {doc.document_type ? (
                        <span className="badge badge-info">{doc.document_type}</span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {doc.status === 'pending' && (
                          <button
                            onClick={() => handleProcess(doc.id)}
                            disabled={processing === doc.id}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                            title="处理文档"
                          >
                            <PlayIcon className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="删除"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 批量操作 */}
      {selectedDocs.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white shadow-lg rounded-lg px-6 py-3 flex items-center gap-4 border">
          <span className="text-sm text-gray-600">
            已选择 {selectedDocs.size} 个文档
          </span>
          <button
            onClick={() => {
              selectedDocs.forEach((id) => handleProcess(id));
            }}
            className="btn-primary text-sm"
          >
            批量处理
          </button>
        </div>
      )}
    </div>
  );
}
