import { useState, useEffect } from 'react';
import {
  CogIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const API_CONFIG_KEY = 'doc_kb_api_config';

interface ApiConfig {
  llmProvider: 'openai' | 'anthropic' | 'ollama';
  openaiApiKey: string;
  openaiBaseUrl: string;
  openaiModel: string;
  anthropicApiKey: string;
  anthropicModel: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
}

const defaultConfig: ApiConfig = {
  llmProvider: 'ollama',
  openaiApiKey: '',
  openaiBaseUrl: 'https://api.openai.com/v1',
  openaiModel: 'gpt-4o-mini',
  anthropicApiKey: '',
  anthropicModel: 'claude-3-sonnet-20240229',
  ollamaBaseUrl: 'http://localhost:11434',
  ollamaModel: 'llama3.2',
};

export default function SettingsPage() {
  const [config, setConfig] = useState<ApiConfig>(defaultConfig);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // 从 localStorage 加载配置
    const savedConfig = localStorage.getItem(API_CONFIG_KEY);
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(API_CONFIG_KEY, JSON.stringify(config));
    setSaved(true);
    toast.success('配置已保存到浏览器');
    setTimeout(() => setSaved(false), 3000);
  };

  const testConnection = async () => {
    toast.loading('正在测试连接...', { id: 'test' });
    
    try {
      // 简单的连接测试 - 检查 API 是否可达
      const response = await fetch('/api/health');
      if (response.ok) {
        toast.success('API 连接成功！', { id: 'test' });
      } else {
        toast.error('API 连接失败', { id: 'test' });
      }
    } catch (error) {
      toast.error('无法连接到后端服务', { id: 'test' });
    }
  };

  const providerOptions = [
    { value: 'ollama', label: 'Ollama (本地)', icon: '🖥️' },
    { value: 'openai', label: 'OpenAI (云端)', icon: '☁️' },
    { value: 'anthropic', label: 'Anthropic (云端)', icon: '🤖' },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-primary-600 text-white p-2 rounded-lg">
            <CogIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">API 配置</h2>
            <p className="mt-1 text-gray-600">配置 LLM API 连接参数</p>
          </div>
        </div>
      </div>

      {/* 提示 */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <GlobeAltIcon className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">配置说明</p>
            <p className="mt-1">
              此配置保存在浏览器本地。配置更改后需要刷新页面生效。
              推荐使用 <strong>Ollama</strong> 本地模型，无需 API Key。
            </p>
          </div>
        </div>
      </div>

      {/* 提供者选择 */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">LLM 提供者</h3>
        <div className="grid grid-cols-3 gap-4">
          {providerOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setConfig({ ...config, llmProvider: option.value as ApiConfig['llmProvider'] })}
              className={`p-4 rounded-lg border-2 transition-all ${
                config.llmProvider === option.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">{option.icon}</div>
              <div className={`font-medium ${
                config.llmProvider === option.value ? 'text-primary-700' : 'text-gray-700'
              }`}>
                {option.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Ollama 配置 */}
      {config.llmProvider === 'ollama' && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🖥️ Ollama 配置</h3>
          <div className="space-y-4">
            <div>
              <label className="label">服务地址</label>
              <input
                type="text"
                value={config.ollamaBaseUrl}
                onChange={(e) => setConfig({ ...config, ollamaBaseUrl: e.target.value })}
                className="input"
                placeholder="http://localhost:11434"
              />
            </div>
            <div>
              <label className="label">模型名称</label>
              <input
                type="text"
                value={config.ollamaModel}
                onChange={(e) => setConfig({ ...config, ollamaModel: e.target.value })}
                className="input"
                placeholder="llama3.2"
              />
              <p className="mt-1 text-xs text-gray-500">
                常用模型: llama3.2, llama3, mistral, qwen2.5, deepseek-r1
              </p>
            </div>
          </div>
        </div>
      )}

      {/* OpenAI 配置 */}
      {config.llmProvider === 'openai' && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">☁️ OpenAI 配置</h3>
          <div className="space-y-4">
            <div>
              <label className="label">API Key *</label>
              <input
                type="password"
                value={config.openaiApiKey}
                onChange={(e) => setConfig({ ...config, openaiApiKey: e.target.value })}
                className="input"
                placeholder="sk-..."
              />
            </div>
            <div>
              <label className="label">Base URL</label>
              <input
                type="text"
                value={config.openaiBaseUrl}
                onChange={(e) => setConfig({ ...config, openaiBaseUrl: e.target.value })}
                className="input"
                placeholder="https://api.openai.com/v1"
              />
            </div>
            <div>
              <label className="label">模型名称</label>
              <input
                type="text"
                value={config.openaiModel}
                onChange={(e) => setConfig({ ...config, openaiModel: e.target.value })}
                className="input"
                placeholder="gpt-4o-mini"
              />
            </div>
          </div>
        </div>
      )}

      {/* Anthropic 配置 */}
      {config.llmProvider === 'anthropic' && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🤖 Anthropic 配置</h3>
          <div className="space-y-4">
            <div>
              <label className="label">API Key *</label>
              <input
                type="password"
                value={config.anthropicApiKey}
                onChange={(e) => setConfig({ ...config, anthropicApiKey: e.target.value })}
                className="input"
                placeholder="sk-ant-..."
              />
            </div>
            <div>
              <label className="label">模型名称</label>
              <input
                type="text"
                value={config.anthropicModel}
                onChange={(e) => setConfig({ ...config, anthropicModel: e.target.value })}
                className="input"
                placeholder="claude-3-sonnet-20240229"
              />
            </div>
          </div>
        </div>
      )}

      {/* 保存按钮 */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          className="btn-primary flex items-center gap-2"
        >
          {saved ? (
            <>
              <CheckCircleIcon className="w-5 h-5" />
              已保存
            </>
          ) : (
            '保存配置'
          )}
        </button>
        <button
          onClick={testConnection}
          className="btn-secondary flex items-center gap-2"
        >
          测试连接
        </button>
      </div>

      {/* Ollama 安装提示 */}
      {config.llmProvider === 'ollama' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">💡 Ollama 本地部署指南</h4>
          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
            <li>访问 <a href="https://ollama.ai" target="_blank" className="text-primary-600 hover:underline">ollama.ai</a> 下载安装</li>
            <li>安装完成后，在终端运行: <code className="bg-gray-200 px-1 rounded">ollama pull llama3.2</code></li>
            <li>启动服务: <code className="bg-gray-200 px-1 rounded">ollama serve</code></li>
            <li>默认服务地址: <code className="bg-gray-200 px-1 rounded">http://localhost:11434</code></li>
          </ol>
        </div>
      )}
    </div>
  );
}
