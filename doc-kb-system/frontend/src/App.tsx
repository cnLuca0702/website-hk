import { Routes, Route, NavLink } from 'react-router-dom';
import {
  DocumentArrowUpIcon,
  DocumentTextIcon,
  FolderIcon,
  Cog6ToothIcon,
  WrenchIcon,
} from '@heroicons/react/24/outline';
import UploadPage from './pages/UploadPage';
import DocumentsPage from './pages/DocumentsPage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import ClassificationsPage from './pages/ClassificationsPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-primary-600 text-white p-2 rounded-lg">
                <DocumentTextIcon className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                文档知识库构建系统
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              基于 docling + ExtractThinker + KBBuilder
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* 侧边栏 */}
        <aside className="w-64 bg-white min-h-[calc(100vh-64px)] border-r border-gray-200">
          <nav className="p-4 space-y-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <DocumentArrowUpIcon className="w-5 h-5" />
              <span className="font-medium">文档上传</span>
            </NavLink>
            
            <NavLink
              to="/documents"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <DocumentTextIcon className="w-5 h-5" />
              <span className="font-medium">文档管理</span>
            </NavLink>
            
            <NavLink
              to="/knowledge-base"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <FolderIcon className="w-5 h-5" />
              <span className="font-medium">知识库</span>
            </NavLink>
            
            <NavLink
              to="/classifications"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <Cog6ToothIcon className="w-5 h-5" />
              <span className="font-medium">文档类型配置</span>
            </NavLink>
            
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <WrenchIcon className="w-5 h-5" />
              <span className="font-medium">API 配置</span>
            </NavLink>
          </nav>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 p-8">
          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
            <Route path="/classifications" element={<ClassificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
