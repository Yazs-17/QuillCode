-- =====================================================
-- QuillCode - SQLite 数据库初始化脚本
-- 轻量级本地版本，支持 FTS5 全文搜索
-- =====================================================

-- =====================================================
-- 1. 用户表 (users)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =====================================================
-- 2. 文章表 (articles)
-- =====================================================
CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  code TEXT,
  type TEXT DEFAULT 'snippet' CHECK(type IN ('algorithm', 'snippet', 'html')),
  language TEXT DEFAULT 'javascript',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 文章表索引
CREATE INDEX IF NOT EXISTS idx_articles_user_id ON articles(user_id);
CREATE INDEX IF NOT EXISTS idx_articles_type ON articles(type);
CREATE INDEX IF NOT EXISTS idx_articles_language ON articles(language);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at);


-- =====================================================
-- 3. 标签表 (tags)
-- =====================================================
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, name)
);

-- 标签表索引
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);

-- =====================================================
-- 4. 文章-标签关联表 (article_tags)
-- =====================================================
CREATE TABLE IF NOT EXISTS article_tags (
  article_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (article_id, tag_id),
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- 关联表索引
CREATE INDEX IF NOT EXISTS idx_article_tags_tag_id ON article_tags(tag_id);

-- =====================================================
-- 5. 分享表 (shares)
-- =====================================================
CREATE TABLE IF NOT EXISTS shares (
  id TEXT PRIMARY KEY NOT NULL,
  article_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);

-- 分享表索引
CREATE INDEX IF NOT EXISTS idx_shares_article_id ON shares(article_id);
CREATE INDEX IF NOT EXISTS idx_shares_token ON shares(token);
CREATE INDEX IF NOT EXISTS idx_shares_expires_at ON shares(expires_at);

-- =====================================================
-- 6. 评论表 (comments)
-- =====================================================
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY NOT NULL,
  share_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (share_id) REFERENCES shares(id) ON DELETE CASCADE
);

-- 评论表索引
CREATE INDEX IF NOT EXISTS idx_comments_share_id ON comments(share_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);


-- =====================================================
-- 7. FTS5 全文搜索虚拟表
-- =====================================================
CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(
  title,
  content,
  code,
  content='articles',
  content_rowid='rowid',
  tokenize='unicode61'
);

-- =====================================================
-- 8. FTS5 同步触发器
-- =====================================================

-- 插入触发器
CREATE TRIGGER IF NOT EXISTS articles_fts_insert AFTER INSERT ON articles BEGIN
  INSERT INTO articles_fts(rowid, title, content, code)
  VALUES (NEW.rowid, NEW.title, NEW.content, NEW.code);
END;

-- 删除触发器
CREATE TRIGGER IF NOT EXISTS articles_fts_delete AFTER DELETE ON articles BEGIN
  INSERT INTO articles_fts(articles_fts, rowid, title, content, code)
  VALUES ('delete', OLD.rowid, OLD.title, OLD.content, OLD.code);
END;

-- 更新触发器
CREATE TRIGGER IF NOT EXISTS articles_fts_update AFTER UPDATE ON articles BEGIN
  INSERT INTO articles_fts(articles_fts, rowid, title, content, code)
  VALUES ('delete', OLD.rowid, OLD.title, OLD.content, OLD.code);
  INSERT INTO articles_fts(rowid, title, content, code)
  VALUES (NEW.rowid, NEW.title, NEW.content, NEW.code);
END;

-- =====================================================
-- 9. updated_at 自动更新触发器
-- =====================================================

-- 用户表更新触发器
CREATE TRIGGER IF NOT EXISTS users_updated_at AFTER UPDATE ON users BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 文章表更新触发器
CREATE TRIGGER IF NOT EXISTS articles_updated_at AFTER UPDATE ON articles 
WHEN OLD.title != NEW.title OR OLD.content != NEW.content OR OLD.code != NEW.code 
     OR OLD.type != NEW.type OR OLD.language != NEW.language BEGIN
  UPDATE articles SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- =====================================================
-- 完成
-- =====================================================
