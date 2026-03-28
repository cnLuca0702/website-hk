import { useEffect, useState } from 'react';
import {
  PlusIcon,
  TrashIcon,
  EyeIcon,
  DocumentTextIcon,
  FolderIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { knowledgeBaseApi, documentApi } from '../services/api';
import { KnowledgeBase, Document } from '../types';

export default function KnowledgeBasePage() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedKB, setSelectedKB] = useState<KnowledgeBase | null>(null);

  // 创建表单
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    selectedDocs: [] as string[],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [kbRes, docRes] = await Promise.all([
        knowledgeBaseApi.list(),
        documentApi.list(),
      ]);

      if (kbRes.success) {
        setKnowledgeBases(kbRes.data || []);
      }
      if (docRes.success) {
        // 只显示已处理完成的文档
        setDocuments((docRes.data || []).filter((d) => d.status === 'completed'));
      }
    } catch (error) {
      toast.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.selectedDocs.length === 0) {
      toast.error('请至少选择一个文档');
      return;
    }

    try {
      const response = await knowledgeBaseApi.build({
        name: formData.name,
        description: formData.description,
        document_ids: formData.selectedDocs,
      });

      if (response.success) {
        toast.success('知识库创建成功');
        setShowCreateModal(false);
        setFormData({ name: '', description: '', selectedDocs: [] });
        fetchData();
      }
    } catch (error: any) {
      toast.error('创建失败: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个知识库吗？')) return;

    try {
      const response = await knowledgeBaseApi.delete(id);
      if (response.success) {
        toast.success('知识库已删除');
        fetchData();
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const handleViewDetail = async (kb: KnowledgeBase) => {
    try {
      const response = await knowledgeBaseApi.get(kb.id);
      if (response.success && response.data) {
        setSelectedKB(response.data);
        setShowDetailModal(true);
      }
    } catch (error) {
      toast.error('获取详情失败');
    }
  };

  const handleDownloadMarkdown = (kb: KnowledgeBase) => {
    if (!kb.markdown_content) {
      toast.error('知识库内容为空');
      return;
    }

    const blob = new Blob([kb.markdown_content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${kb.name}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('下载成功');
  };

  const toggleDocSelection = (docId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedDocs: prev.selectedDocs.includes(docId)
        ? prev.selectedDocs.filter((id) => id !== docId)
        : [...prev.selectedDocs, docId],
    }));
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
          <h2 className="text-2xl font-bold text-gray-900">知识库</h2>
          <p className="mt-1 text-gray-600">管理和查看构建的知识库</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          新建知识库
        </button>
      </div>

      {/* 知识库列表 */}
      {knowledgeBases.length === 0 ? (
        <div className="card text-center py-12">
          <FolderIcon className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">暂无知识库</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 text-primary-600 hover:underline"
          >
            创建第一个知识库
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {knowledgeBases.map((kb) => (
            <div key={kb.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <FolderIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{kb.name}</h3>
                    <p className="text-xs text-gray-500">
                      {new Date(kb.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                {kb.description || '无描述'}
              </p>

              <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <DocumentTextIcon className="w-4 h-4" />
                  {kb.items?.length || 0} 个文档
                </span>
              </div>

              <div className="mt-4 pt-4 border-t flex gap-2">
                <button
                  onClick={() => handleViewDetail(kb)}
                  className="flex-1 btn-secondary text-sm flex items-center justify-center gap-1"
                >
                  <EyeIcon className="w-4 h-4" />
                  查看
                </button>
                <button
                  onClick={() => handleDownloadMarkdown(kb)}
                  className="flex-1 btn-secondary text-sm flex items-center justify-center gap-1"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  下载
                </button>
                <button
                  onClick={() => handleDelete(kb.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 创建知识库模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">新建知识库</h3>
            </div>

            <form onSubmit={handleCreate} className="flex-1 overflow-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="label">知识库名称 *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="input"
                    placeholder="如：项目文档知识库"
                  />
                </div>

                <div>
                  <label className="label">描述</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="input min-h-[80px]"
                    placeholder="描述这个知识库的用途..."
                  />
                </div>

                <div>
                  <label className="label">
                    选择文档 ({formData.selectedDocs.length} 已选)
                  </label>
                  <div className="border rounded-lg max-h-64 overflow-auto">
                    {documents.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        没有可用的已处理文档
                      </div>
                    ) : (
                      <div className="divide-y">
                        {documents.map((doc) => (
                          <label
                            key={doc.id}
                            className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.selectedDocs.includes(doc.id)}
                              onChange={() => toggleDocSelection(doc.id)}
                              className="rounded"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {doc.filename}
                              </p>
                              <p className="text-xs text-gray-500">
                                类型: {doc.document_type || '未知'}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </form>

            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={formData.selectedDocs.length === 0}
                className="btn-primary disabled:opacity-50"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 知识库详情模态框 */}
      {showDetailModal && selectedKB && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">{selectedKB.name}</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {selectedKB.description && (
                <p className="text-gray-600 mb-4">{selectedKB.description}</p>
              )}

              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">
                  包含文档 ({selectedKB.items?.length || 0})
                </h4>
                <div className="space-y-2">
                  {selectedKB.items?.map((item) => (
                    <div
                      key={item.document_id}
                      className="p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">
                          {item.document_name}
                        </span>
                        <span className="badge badge-info text-xs">
                          {item.document_type}
                        </span>
                      </div>
                      {item.summary && (
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                          {item.summary}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedKB.markdown_content && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">知识库内容</h4>
                  <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-96">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedKB.markdown_content}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => handleDownloadMarkdown(selectedKB)}
                className="btn-secondary flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                下载 Markdown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
