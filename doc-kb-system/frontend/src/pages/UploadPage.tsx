import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { documentApi } from '../services/api';

interface UploadFile {
  file: File;
  id?: string;
  status: 'uploading' | 'success' | 'error';
  progress: number;
}

export default function UploadPage() {
  const [uploads, setUploads] = useState<UploadFile[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newUploads: UploadFile[] = acceptedFiles.map((file) => ({
      file,
      status: 'uploading',
      progress: 0,
    }));

    setUploads((prev) => [...prev, ...newUploads]);

    // 逐个上传文件
    for (const upload of newUploads) {
      try {
        const response = await documentApi.upload(upload.file);
        
        if (response.success) {
          setUploads((prev) =>
            prev.map((u) =>
              u.file === upload.file
                ? { ...u, id: response.data?.id, status: 'success', progress: 100 }
                : u
            )
          );
          toast.success(`${upload.file.name} 上传成功`);
        } else {
          throw new Error(response.message || '上传失败');
        }
      } catch (error: any) {
        setUploads((prev) =>
          prev.map((u) =>
            u.file === upload.file ? { ...u, status: 'error', progress: 0 } : u
          )
        );
        toast.error(`${upload.file.name} 上传失败: ${error.message}`);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/html': ['.html', '.htm'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    multiple: true,
  });

  const removeUpload = (file: File) => {
    setUploads((prev) => prev.filter((u) => u.file !== file));
  };

  const clearCompleted = () => {
    setUploads((prev) => prev.filter((u) => u.status !== 'success'));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">文档上传</h2>
        <p className="mt-1 text-gray-600">
          支持 PDF、DOCX、XLSX、PPTX、HTML、图片等格式
        </p>
      </div>

      {/* 拖拽上传区域 */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <CloudArrowUpIcon className="mx-auto h-16 w-16 text-gray-400" />
        <p className="mt-4 text-lg font-medium text-gray-900">
          {isDragActive ? '释放文件以上传' : '拖拽文件到此处，或点击选择文件'}
        </p>
        <p className="mt-2 text-sm text-gray-500">
          支持 PDF、Word、Excel、PowerPoint、HTML、图片等格式
        </p>
      </div>

      {/* 上传列表 */}
      {uploads.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              上传进度 ({uploads.filter((u) => u.status === 'success').length}/{uploads.length})
            </h3>
            {uploads.some((u) => u.status === 'success') && (
              <button
                onClick={clearCompleted}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                清除已完成
              </button>
            )}
          </div>

          <div className="space-y-3">
            {uploads.map((upload, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200"
              >
                <DocumentIcon className="w-10 h-10 text-gray-400 flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {upload.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(upload.file.size)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {upload.status === 'uploading' && (
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-600 transition-all duration-300"
                          style={{ width: `${upload.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">上传中...</span>
                    </div>
                  )}
                  
                  {upload.status === 'success' && (
                    <CheckCircleIcon className="w-6 h-6 text-green-500" />
                  )}
                  
                  {upload.status === 'error' && (
                    <span className="text-xs text-red-500">失败</span>
                  )}

                  <button
                    onClick={() => removeUpload(upload.file)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 下一步提示 */}
      {uploads.some((u) => u.status === 'success') && (
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            文件上传成功！请前往
            <a href="/documents" className="font-medium underline mx-1">
              文档管理
            </a>
            页面处理文档。
          </p>
        </div>
      )}
    </div>
  );
}
