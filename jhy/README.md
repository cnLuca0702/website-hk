# 景湖苑信息公示网站

一个可本地运行的小区信息公示站点，覆盖以下需求：

- 小区名称：景湖苑
- 公示分类：社区信息、业委会信息、物业信息
- 支持上传图片、Word、Excel、PDF 等常用文件
- 附件仅支持在线浏览，不提供下载按钮
- 支持发帖权限管理（按分类分配）
- 已发布公示支持编辑与删除（作者或管理员）

## 技术栈

- Node.js + Express
- EJS 模板
- JSON 文件存储（`data/db.json`）
- Multer 文件上传
- Mammoth / Word Extractor / XLSX 附件预览

## 快速开始

```bash
npm install
npm start
```

启动后访问：`http://localhost:3000`

如果部署在子路径（如 `/jhy`），可设置：

```bash
BASE_PATH=/jhy npm start
```

## 默认账号

- 管理员：`admin`
- 密码：`Admin@123456`

建议首次登录后，在权限管理页面创建并分配真实账号。

## 权限说明

- `admin`：可发布全部分类，可进入权限管理
- 其他角色：按分类开关控制是否可发帖

在“权限管理”页面可创建用户并编辑分类发帖权限。

## 附件预览说明

支持以下类型：

- 图片：`.png .jpg .jpeg .gif .webp`
- PDF：`.pdf`
- Word：`.doc .docx`
- Excel：`.xls .xlsx`

预览通过受控路由 `/attachments/:id/view` 实现，仅提供在线查看入口。

## 项目结构

- `server.js`：主应用（路由、认证、权限、上传、预览）
- `views/`：页面模板
- `public/styles.css`：样式
- `data/db.json`：数据文件
- `uploads/`：附件存储目录
