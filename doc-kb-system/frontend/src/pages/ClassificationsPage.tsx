import { useEffect, useState } from 'react';
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { classificationApi } from '../services/api';
import { DocumentClassification, ClassificationField } from '../types';

export default function ClassificationsPage() {
  const [classifications, setClassifications] = useState<DocumentClassification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<DocumentClassification | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    keywords: '',
    fields: [] as ClassificationField[],
  });

  useEffect(() => {
    fetchClassifications();
  }, []);

  const fetchClassifications = async () => {
    try {
      const response = await classificationApi.list();
      if (response.success) {
        setClassifications(response.data || []);
      }
    } catch (error) {
      toast.error('获取分类失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name: formData.name,
      description: formData.description,
      keywords: formData.keywords.split(',').map((k) => k.trim()).filter(Boolean),
      fields: formData.fields,
    };

    try {
      if (editing) {
        const response = await classificationApi.update(editing.id, data);
        if (response.success) {
          toast.success('分类已更新');
        }
      } else {
        const response = await classificationApi.create(data);
        if (response.success) {
          toast.success('分类已创建');
        }
      }
      setShowModal(false);
      setEditing(null);
      resetForm();
      fetchClassifications();
    } catch (error: any) {
      toast.error(editing ? '更新失败' : '创建失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个分类吗？')) return;

    try {
      const response = await classificationApi.delete(id);
      if (response.success) {
        toast.success('分类已删除');
        fetchClassifications();
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const handleEdit = (classification: DocumentClassification) => {
    setEditing(classification);
    setFormData({
      name: classification.name,
      description: classification.description,
      keywords: classification.keywords.join(', '),
      fields: classification.fields,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      keywords: '',
      fields: [],
    });
  };

  const addField = () => {
    setFormData({
      ...formData,
      fields: [
        ...formData.fields,
        { name: '', description: '', field_type: 'string', required: true },
      ],
    });
  };

  const updateField = (index: number, updates: Partial<ClassificationField>) => {
    const newFields = [...formData.fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFormData({ ...formData, fields: newFields });
  };

  const removeField = (index: number) => {
    setFormData({
      ...formData,
      fields: formData.fields.filter((_, i) => i !== index),
    });
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
          <h2 className="text-2xl font-bold text-gray-900">文档类型配置</h2>
          <p className="mt-1 text-gray-600">配置文档分类和抽取字段</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditing(null);
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          新建分类
        </button>
      </div>

      {/* 分类列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {classifications.map((classification) => (
          <div key={classification.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary-100 p-2 rounded-lg">
                  <DocumentTextIcon className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {classification.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {classification.description}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(classification)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(classification.id)}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 关键词 */}
            {classification.keywords.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2">关键词:</p>
                <div className="flex flex-wrap gap-2">
                  {classification.keywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 字段列表 */}
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2">
                抽取字段 ({classification.fields.length}):
              </p>
              <div className="space-y-1">
                {classification.fields.map((field, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm py-1 px-2 bg-gray-50 rounded"
                  >
                    <span className="font-medium text-gray-700">{field.name}</span>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="uppercase">{field.field_type}</span>
                      {field.required && <span className="text-red-500">*</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 创建/编辑模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">
                {editing ? '编辑分类' : '新建分类'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="label">分类名称 *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="input"
                    placeholder="如：发票、合同、报告"
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
                    placeholder="描述这个分类的特征..."
                  />
                </div>

                <div>
                  <label className="label">关键词（用逗号分隔）</label>
                  <input
                    type="text"
                    value={formData.keywords}
                    onChange={(e) =>
                      setFormData({ ...formData, keywords: e.target.value })
                    }
                    className="input"
                    placeholder="如：发票, 增值税, 金额"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="label">抽取字段</label>
                    <button
                      type="button"
                      onClick={addField}
                      className="text-sm text-primary-600 hover:underline"
                    >
                      + 添加字段
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.fields.map((field, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 rounded-lg space-y-2"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="字段名（英文）"
                            value={field.name}
                            onChange={(e) =>
                              updateField(index, { name: e.target.value })
                            }
                            className="input text-sm"
                          />
                          <select
                            value={field.field_type}
                            onChange={(e) =>
                              updateField(index, {
                                field_type: e.target.value as any,
                              })
                            }
                            className="input text-sm"
                          >
                            <option value="string">字符串</option>
                            <option value="number">数字</option>
                            <option value="integer">整数</option>
                            <option value="boolean">布尔值</option>
                            <option value="date">日期</option>
                            <option value="array">数组</option>
                            <option value="object">对象</option>
                          </select>
                        </div>
                        <input
                          type="text"
                          placeholder="字段描述"
                          value={field.description}
                          onChange={(e) =>
                            updateField(index, { description: e.target.value })
                          }
                          className="input text-sm"
                        />
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) =>
                                updateField(index, { required: e.target.checked })
                              }
                              className="rounded"
                            />
                            必填
                          </label>
                          <button
                            type="button"
                            onClick={() => removeField(index)}
                            className="text-sm text-red-600 hover:underline"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </form>

            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button onClick={handleSubmit} className="btn-primary">
                {editing ? '保存' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
