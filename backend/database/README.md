# 数据库配置说明

## MySQL 配置信息

- **主机**: localhost
- **端口**: 3306
- **用户名**: root
- **密码**: sjblp
- **数据库名**: code_notebook

## 快速开始

### 方式一：使用脚本初始化

```bash
cd backend/database
setup.bat
```

### 方式二：手动执行 SQL

```bash
mysql -uroot -psjblp < backend/database/init.sql
```

### 方式三：在 MySQL 命令行中执行

```sql
source /path/to/backend/database/init.sql
```

## 安装依赖

```bash
cd backend
npm install
```

## 启动应用

```bash
# 开发模式（会自动同步表结构）
npm run start:dev

# 生产模式
npm run start:prod
```

## 数据库表结构

### 1. users (用户表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | CHAR(36) | 用户UUID (主键) |
| username | VARCHAR(50) | 用户名 (唯一) |
| email | VARCHAR(100) | 邮箱 (唯一) |
| password_hash | VARCHAR(255) | 密码哈希 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 2. articles (文章表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | CHAR(36) | 文章UUID (主键) |
| user_id | CHAR(36) | 用户ID (外键) |
| title | VARCHAR(255) | 标题 |
| content | TEXT | Markdown内容 |
| code | TEXT | 代码内容 |
| type | ENUM | 类型: algorithm/snippet/html |
| language | VARCHAR(50) | 编程语言 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 3. tags (标签表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | CHAR(36) | 标签UUID (主键) |
| name | VARCHAR(50) | 标签名称 (唯一) |
| created_at | TIMESTAMP | 创建时间 |

### 4. article_tags (文章标签关联表)

| 字段 | 类型 | 说明 |
|------|------|------|
| article_id | CHAR(36) | 文章ID (联合主键) |
| tag_id | CHAR(36) | 标签ID (联合主键) |

### 5. shares (分享表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | CHAR(36) | 分享UUID (主键) |
| article_id | CHAR(36) | 文章ID (外键) |
| token | VARCHAR(64) | 分享令牌 (唯一) |
| expires_at | TIMESTAMP | 过期时间 |
| created_at | TIMESTAMP | 创建时间 |

### 6. comments (评论表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | CHAR(36) | 评论UUID (主键) |
| share_id | CHAR(36) | 分享ID (外键) |
| author_name | VARCHAR(50) | 评论者名称 |
| content | TEXT | 评论内容 |
| created_at | TIMESTAMP | 创建时间 |

## 常用 SQL 查询

### 查看所有用户
```sql
SELECT id, username, email, created_at FROM users;
```

### 查看用户的所有文章
```sql
SELECT a.*, u.username 
FROM articles a 
JOIN users u ON a.user_id = u.id 
WHERE u.username = 'your_username';
```

### 查看文章及其标签
```sql
SELECT a.title, GROUP_CONCAT(t.name) as tags
FROM articles a
LEFT JOIN article_tags at ON a.id = at.article_id
LEFT JOIN tags t ON at.tag_id = t.id
GROUP BY a.id;
```

### 查看分享链接及评论数
```sql
SELECT s.token, a.title, COUNT(c.id) as comment_count
FROM shares s
JOIN articles a ON s.article_id = a.id
LEFT JOIN comments c ON s.id = c.share_id
GROUP BY s.id;
```

### 统计各标签的文章数
```sql
SELECT t.name, COUNT(at.article_id) as article_count
FROM tags t
LEFT JOIN article_tags at ON t.id = at.tag_id
GROUP BY t.id
ORDER BY article_count DESC;
```

## 清理数据

```sql
-- 清空所有数据（保留表结构）
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE comments;
TRUNCATE TABLE shares;
TRUNCATE TABLE article_tags;
TRUNCATE TABLE articles;
TRUNCATE TABLE tags;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;
```

## 删除数据库

```sql
DROP DATABASE IF EXISTS code_notebook;
```
