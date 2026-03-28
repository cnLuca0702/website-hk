const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const mammoth = require('mammoth');
const XLSX = require('xlsx');
const WordExtractor = require('word-extractor');

const app = express();
const PORT = process.env.PORT || 3000;
const SITE_NAME = '景湖苑信息公示平台';
const RAW_BASE_PATH = process.env.BASE_PATH || '';
const BASE_PATH = (() => {
  if (!RAW_BASE_PATH) return '';
  let value = RAW_BASE_PATH.trim();
  if (!value.startsWith('/')) value = `/${value}`;
  if (value.length > 1 && value.endsWith('/')) value = value.slice(0, -1);
  return value;
})();

const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const MAX_UPLOAD_SIZE_MB = 100;

const CATEGORIES = {
  community: '社区信息',
  committee: '业委会信息',
  property: '物业信息',
};

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp']);

const ALLOWED_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp',
  '.pdf',
  '.doc', '.docx',
  '.xls', '.xlsx',
]);

function normalizeOriginalFilename(filename) {
  if (!filename) return '未命名文件';

  const original = String(filename).trim();
  if (!original) return '未命名文件';

  const safeOriginal = original.replace(/[/\\]/g, '_').trim();
  const decoded = Buffer.from(original, 'latin1').toString('utf8');
  const safeDecoded = decoded.replace(/[/\\]/g, '_').trim();

  if (safeDecoded && !safeDecoded.includes('�')) {
    return safeDecoded;
  }
  return safeOriginal || '未命名文件';
}

function getSafeOriginalName(file) {
  if (!file) return '未命名文件';
  if (file.safeOriginalName) return file.safeOriginalName;
  const safe = normalizeOriginalFilename(file.originalname);
  file.safeOriginalName = safe;
  return safe;
}

function ensureDirs() {
  [DATA_DIR, UPLOAD_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
}

function createInitialDB() {
  const adminPassword = bcrypt.hashSync('Admin@123456', 10);
  const editorPassword = bcrypt.hashSync('Editor@123456', 10);

  return {
    users: [
      {
        id: 1,
        username: 'admin',
        passwordHash: adminPassword,
        role: 'admin',
        permissions: {
          community: true,
          committee: true,
          property: true,
        },
      },
      {
        id: 2,
        username: 'editor',
        passwordHash: editorPassword,
        role: 'editor',
        permissions: {
          community: true,
          committee: false,
          property: true,
        },
      },
    ],
    posts: [],
    attachments: [],
    nextIds: {
      user: 3,
      post: 1,
      attachment: 1,
    },
  };
}

function loadDB() {
  ensureDirs();
  if (!fs.existsSync(DB_FILE)) {
    const initial = createInitialDB();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }

  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  let changed = false;
  db.attachments = (db.attachments || []).map((att) => {
    const fixedName = normalizeOriginalFilename(att.originalName);
    if (fixedName === att.originalName) return att;

    changed = true;
    const fixedExt = path.extname(fixedName).toLowerCase();
    return {
      ...att,
      originalName: fixedName,
      ext: fixedExt || att.ext,
    };
  });

  if (changed) {
    saveDB(db);
  }
  return db;
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

function getAuthorName(users, authorId) {
  const user = users.find((u) => u.id === authorId);
  return user ? user.username : '未知用户';
}

function canPost(user, category) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return Boolean(user.permissions && user.permissions[category]);
}

function withBasePath(urlPath) {
  if (!BASE_PATH) return urlPath;
  if (!urlPath.startsWith('/')) return urlPath;
  return `${BASE_PATH}${urlPath}`;
}

function canManagePost(user, post) {
  if (!user || !post) return false;
  if (user.role === 'admin') return true;
  return user.id === post.authorId;
}

function deleteAttachmentFile(storedName) {
  const filePath = path.join(UPLOAD_DIR, storedName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

function getAttachmentDisplayMeta(ext) {
  const normalizedExt = (ext || '').toLowerCase();
  if (IMAGE_EXTS.has(normalizedExt)) {
    return { kind: 'image', icon: '🖼', label: '图片' };
  }
  if (normalizedExt === '.pdf') {
    return { kind: 'pdf', icon: '📄', label: 'PDF' };
  }
  if (normalizedExt === '.doc' || normalizedExt === '.docx') {
    return { kind: 'word', icon: '📝', label: 'Word' };
  }
  if (normalizedExt === '.xls' || normalizedExt === '.xlsx') {
    return { kind: 'excel', icon: '📊', label: 'Excel' };
  }
  return { kind: 'file', icon: '📁', label: '文件' };
}

function renderEmbedPreview({ title, mode, html, text }) {
  const body = mode === 'html'
    ? `<div class="wrap">${html}</div>`
    : `<pre class="text">${text || ''}</pre>`;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; font-family: "PingFang SC","Microsoft YaHei",sans-serif; background: #f6f9fd; color: #1a2f47; }
    .wrap { padding: 12px; overflow-x: auto; }
    .text { margin: 0; padding: 14px; white-space: pre-wrap; line-height: 1.7; }
    table { border-collapse: collapse; width: 100%; background: #fff; }
    td, th { border: 1px solid #d9e3ef; padding: 6px 8px; font-size: 14px; }
  </style>
</head>
<body>${body}</body>
</html>`;
}

function requireLogin(req, res, next) {
  if (!req.currentUser) return res.redirect(withBasePath('/login?error=请先登录'));
  next();
}

function requireAdmin(req, res, next) {
  if (!req.currentUser || req.currentUser.role !== 'admin') {
    return res.status(403).render('error', { message: '仅管理员可访问此页面。' });
  }
  next();
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(getSafeOriginalName(file)).toLowerCase();
    const unique = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}${ext}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(getSafeOriginalName(file)).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new Error('仅支持图片、Word、Excel、PDF 等常用文件。'));
    }
    cb(null, true);
  },
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'jinghuyuan-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax' },
  })
);

app.use((req, res, next) => {
  const db = loadDB();
  req.db = db;
  req.currentUser = db.users.find((u) => u.id === req.session.userId) || null;

  res.locals.siteName = SITE_NAME;
  res.locals.categories = CATEGORIES;
  res.locals.currentUser = req.currentUser;
  res.locals.basePath = BASE_PATH;
  next();
});

app.get('/', (req, res) => {
  const category = req.query.category;
  let posts = req.db.posts;

  if (category && CATEGORIES[category]) {
    posts = posts.filter((p) => p.category === category);
  }

  const ordered = posts
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((post) => ({
      ...post,
      categoryLabel: CATEGORIES[post.category] || post.category,
      authorName: getAuthorName(req.db.users, post.authorId),
      attachmentCount: req.db.attachments.filter((att) => att.postId === post.id).length,
      canManage: canManagePost(req.currentUser, post),
    }));

  res.render('index', {
    posts: ordered,
    activeCategory: category || '',
  });
});

app.get('/login', (req, res) => {
  if (req.currentUser) return res.redirect(withBasePath('/'));
  res.render('login', { error: req.query.error || '' });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = req.db.users.find((u) => u.username === username);

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).render('login', { error: '用户名或密码错误。' });
  }

  req.session.userId = user.id;
  res.redirect(withBasePath('/'));
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect(withBasePath('/'));
  });
});

app.get('/posts/new', requireLogin, (req, res) => {
  res.render('new-post', { error: '', form: {} });
});

app.post('/posts', requireLogin, (req, res) => {
  upload.array('attachments', 10)(req, res, (err) => {
    if (err) {
      return res.status(400).render('new-post', {
        error: err.message,
        form: req.body,
      });
    }

    const { title, content, category } = req.body;

    if (!title || !content || !category || !CATEGORIES[category]) {
      return res.status(400).render('new-post', {
        error: '请填写完整信息并选择正确分类。',
        form: req.body,
      });
    }

    if (!canPost(req.currentUser, category)) {
      return res.status(403).render('new-post', {
        error: '你没有该分类的发帖权限，请联系管理员。',
        form: req.body,
      });
    }

    const db = req.db;
    const post = {
      id: db.nextIds.post++,
      title: title.trim(),
      content: content.trim(),
      category,
      authorId: req.currentUser.id,
      createdAt: new Date().toISOString(),
    };

    db.posts.push(post);

    const files = req.files || [];
    files.forEach((file) => {
      const originalName = getSafeOriginalName(file);
      db.attachments.push({
        id: db.nextIds.attachment++,
        postId: post.id,
        originalName,
        storedName: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        ext: path.extname(originalName).toLowerCase(),
      });
    });

    saveDB(db);
    res.redirect(withBasePath(`/post/${post.id}`));
  });
});

app.get('/post/:id', (req, res) => {
  const postId = Number(req.params.id);
  const post = req.db.posts.find((p) => p.id === postId);

  if (!post) {
    return res.status(404).render('error', { message: '未找到该公示信息。' });
  }

  const attachments = req.db.attachments.filter((a) => a.postId === post.id);
  res.render('post-detail', {
    post: {
      ...post,
      categoryLabel: CATEGORIES[post.category] || post.category,
      authorName: getAuthorName(req.db.users, post.authorId),
    },
    attachments: attachments.map((file) => ({
      ...file,
      ...getAttachmentDisplayMeta(file.ext),
      extText: (file.ext || '').replace('.', '').toUpperCase() || 'FILE',
    })),
    canManage: canManagePost(req.currentUser, post),
  });
});

app.get('/post/:id/edit', requireLogin, (req, res) => {
  const postId = Number(req.params.id);
  const post = req.db.posts.find((p) => p.id === postId);

  if (!post) {
    return res.status(404).render('error', { message: '未找到该公示信息。' });
  }

  if (!canManagePost(req.currentUser, post)) {
    return res.status(403).render('error', { message: '你没有编辑该公示的权限。' });
  }

  const attachments = req.db.attachments.filter((a) => a.postId === post.id);
  return res.render('edit-post', {
    error: '',
    post,
    attachments,
  });
});

app.post('/post/:id/edit', requireLogin, (req, res) => {
  upload.array('attachments', 10)(req, res, (err) => {
    const postId = Number(req.params.id);
    const db = req.db;
    const post = db.posts.find((p) => p.id === postId);

    if (!post) {
      return res.status(404).render('error', { message: '未找到该公示信息。' });
    }

    if (!canManagePost(req.currentUser, post)) {
      return res.status(403).render('error', { message: '你没有编辑该公示的权限。' });
    }

    const existingAttachments = db.attachments.filter((a) => a.postId === post.id);
    if (err) {
      return res.status(400).render('edit-post', {
        error: err.message,
        post: { ...post, ...req.body },
        attachments: existingAttachments,
      });
    }

    const { title, content, category } = req.body;
    if (!title || !content || !category || !CATEGORIES[category]) {
      return res.status(400).render('edit-post', {
        error: '请填写完整信息并选择正确分类。',
        post: { ...post, ...req.body },
        attachments: existingAttachments,
      });
    }

    if (post.category !== category && !canPost(req.currentUser, category)) {
      return res.status(403).render('edit-post', {
        error: '你没有权限将公示调整到该分类。',
        post: { ...post, ...req.body },
        attachments: existingAttachments,
      });
    }

    const deleteAttachmentIdsRaw = req.body.deleteAttachmentIds || [];
    const deleteAttachmentIds = (Array.isArray(deleteAttachmentIdsRaw) ? deleteAttachmentIdsRaw : [deleteAttachmentIdsRaw])
      .map((v) => Number(v))
      .filter((v) => Number.isFinite(v));

    const deleteSet = new Set(deleteAttachmentIds);
    const toDelete = existingAttachments.filter((a) => deleteSet.has(a.id));
    toDelete.forEach((file) => deleteAttachmentFile(file.storedName));
    db.attachments = db.attachments.filter((a) => !deleteSet.has(a.id));

    const newFiles = req.files || [];
    newFiles.forEach((file) => {
      const originalName = getSafeOriginalName(file);
      db.attachments.push({
        id: db.nextIds.attachment++,
        postId: post.id,
        originalName,
        storedName: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        ext: path.extname(originalName).toLowerCase(),
      });
    });

    post.title = title.trim();
    post.content = content.trim();
    post.category = category;
    post.updatedAt = new Date().toISOString();

    saveDB(db);
    return res.redirect(withBasePath(`/post/${post.id}`));
  });
});

app.post('/post/:id/delete', requireLogin, (req, res) => {
  const postId = Number(req.params.id);
  const db = req.db;
  const post = db.posts.find((p) => p.id === postId);

  if (!post) {
    return res.status(404).render('error', { message: '未找到该公示信息。' });
  }

  if (!canManagePost(req.currentUser, post)) {
    return res.status(403).render('error', { message: '你没有删除该公示的权限。' });
  }

  const attachments = db.attachments.filter((a) => a.postId === post.id);
  attachments.forEach((file) => deleteAttachmentFile(file.storedName));

  db.attachments = db.attachments.filter((a) => a.postId !== post.id);
  db.posts = db.posts.filter((p) => p.id !== post.id);
  saveDB(db);

  return res.redirect(withBasePath('/'));
});

app.get('/attachments/:id/view', async (req, res) => {
  const attachmentId = Number(req.params.id);
  const attachment = req.db.attachments.find((a) => a.id === attachmentId);
  const embed = req.query.embed === '1';

  if (!attachment) {
    return res.status(404).render('error', { message: '附件不存在。' });
  }

  const filePath = path.join(UPLOAD_DIR, attachment.storedName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).render('error', { message: '附件文件已丢失。' });
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(attachment.originalName)}`);

  try {
    if (attachment.ext === '.pdf' || IMAGE_EXTS.has(attachment.ext)) {
      return res.type(attachment.mimeType).sendFile(filePath);
    }

    if (attachment.ext === '.docx') {
      const result = await mammoth.convertToHtml({ path: filePath });
      if (embed) {
        return res.type('html').send(renderEmbedPreview({
          title: attachment.originalName,
          mode: 'html',
          html: result.value,
          text: '',
        }));
      }
      return res.render('attachment-preview', {
        title: attachment.originalName,
        mode: 'html',
        html: result.value,
        text: '',
      });
    }

    if (attachment.ext === '.doc') {
      const extractor = new WordExtractor();
      const extracted = await extractor.extract(filePath);
      if (embed) {
        return res.type('html').send(renderEmbedPreview({
          title: attachment.originalName,
          mode: 'text',
          html: '',
          text: extracted.getBody(),
        }));
      }
      return res.render('attachment-preview', {
        title: attachment.originalName,
        mode: 'text',
        html: '',
        text: extracted.getBody(),
      });
    }

    if (attachment.ext === '.xls' || attachment.ext === '.xlsx') {
      const workbook = XLSX.readFile(filePath);
      const firstSheetName = workbook.SheetNames[0];
      const firstSheet = workbook.Sheets[firstSheetName];
      const html = XLSX.utils.sheet_to_html(firstSheet);
      if (embed) {
        return res.type('html').send(renderEmbedPreview({
          title: `${attachment.originalName}（工作表：${firstSheetName}）`,
          mode: 'html',
          html,
          text: '',
        }));
      }

      return res.render('attachment-preview', {
        title: `${attachment.originalName}（工作表：${firstSheetName}）`,
        mode: 'html',
        html,
        text: '',
      });
    }

    return res.status(415).render('error', {
      message: '当前文件类型暂不支持在线预览。',
    });
  } catch (previewErr) {
    return res.status(500).render('error', {
      message: `附件预览失败：${previewErr.message}`,
    });
  }
});

app.get('/admin/users', requireAdmin, (req, res) => {
  const message = req.query.message || '';
  res.render('admin-users', {
    users: req.db.users,
    message,
  });
});

app.post('/admin/users', requireAdmin, (req, res) => {
  const { username, password, role } = req.body;
  const db = req.db;

  if (!username || !password || !['admin', 'editor', 'resident'].includes(role)) {
    return res.redirect(withBasePath('/admin/users?message=用户创建失败：参数不完整'));
  }

  if (db.users.some((u) => u.username === username.trim())) {
    return res.redirect(withBasePath('/admin/users?message=用户创建失败：用户名已存在'));
  }

  const basePermissions = {
    community: false,
    committee: false,
    property: false,
  };

  if (role === 'admin') {
    Object.keys(basePermissions).forEach((key) => {
      basePermissions[key] = true;
    });
  }

  db.users.push({
    id: db.nextIds.user++,
    username: username.trim(),
    passwordHash: bcrypt.hashSync(password, 10),
    role,
    permissions: basePermissions,
  });

  saveDB(db);
  res.redirect(withBasePath('/admin/users?message=用户创建成功'));
});

app.post('/admin/users/:id/permissions', requireAdmin, (req, res) => {
  const userId = Number(req.params.id);
  const db = req.db;
  const user = db.users.find((u) => u.id === userId);

  if (!user) {
    return res.redirect(withBasePath('/admin/users?message=更新失败：用户不存在'));
  }

  const role = req.body.role;
  if (!['admin', 'editor', 'resident'].includes(role)) {
    return res.redirect(withBasePath('/admin/users?message=更新失败：角色不合法'));
  }

  user.role = role;

  if (role === 'admin') {
    user.permissions = {
      community: true,
      committee: true,
      property: true,
    };
  } else {
    user.permissions = {
      community: req.body.community === 'on',
      committee: req.body.committee === 'on',
      property: req.body.property === 'on',
    };
  }

  saveDB(db);
  res.redirect(withBasePath('/admin/users?message=权限更新成功'));
});

app.use((_req, res) => {
  res.status(404).render('error', { message: '页面不存在。' });
});

app.listen(PORT, () => {
  console.log(`景湖苑公示网站已启动: http://localhost:${PORT}`);
  console.log('默认管理员: admin / Admin@123456');
});
