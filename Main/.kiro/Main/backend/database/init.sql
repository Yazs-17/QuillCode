-- =====================================================
-- QuillCode - MySQL 数据库初始化脚本
-- 数据库: code_notebook
-- 用户: root
-- 密码: sjblp
-- =====================================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `code_notebook` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE `code_notebook`;

-- =====================================================
-- 1. 用户表 (users)
-- =====================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` CHAR(36) NOT NULL COMMENT '用户UUID',
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `email` VARCHAR(100) NOT NULL COMMENT '邮箱',
  `password_hash` VARCHAR(255) NOT NULL COMMENT '密码哈希',
  `role` ENUM('user', 'admin') DEFAULT 'user' COMMENT '用户角色',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- =====================================================
-- 2. 文章表 (articles)
-- =====================================================
CREATE TABLE IF NOT EXISTS `articles` (
  `id` CHAR(36) NOT NULL COMMENT '文章UUID',
  `user_id` CHAR(36) NOT NULL COMMENT '用户ID',
  `title` VARCHAR(255) NOT NULL COMMENT '标题',
  `content` TEXT COMMENT 'Markdown内容',
  `code` TEXT COMMENT '代码内容',
  `type` ENUM('algorithm', 'snippet', 'html') DEFAULT 'snippet' COMMENT '文章类型',
  `language` VARCHAR(50) DEFAULT 'javascript' COMMENT '编程语言',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_type` (`type`),
  KEY `idx_language` (`language`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_articles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章表';

-- =====================================================
-- 3. 标签表 (tags)
-- =====================================================
CREATE TABLE IF NOT EXISTS `tags` (
  `id` CHAR(36) NOT NULL COMMENT '标签UUID',
  `name` VARCHAR(50) NOT NULL COMMENT '标签名称',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标签表';

-- =====================================================
-- 4. 文章-标签关联表 (article_tags)
-- =====================================================
CREATE TABLE IF NOT EXISTS `article_tags` (
  `article_id` CHAR(36) NOT NULL COMMENT '文章ID',
  `tag_id` CHAR(36) NOT NULL COMMENT '标签ID',
  PRIMARY KEY (`article_id`, `tag_id`),
  KEY `idx_tag_id` (`tag_id`),
  CONSTRAINT `fk_article_tags_article` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_article_tags_tag` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章标签关联表';

-- =====================================================
-- 5. 分享表 (shares)
-- =====================================================
CREATE TABLE IF NOT EXISTS `shares` (
  `id` CHAR(36) NOT NULL COMMENT '分享UUID',
  `article_id` CHAR(36) NOT NULL COMMENT '文章ID',
  `token` VARCHAR(64) NOT NULL COMMENT '分享令牌',
  `expires_at` TIMESTAMP NOT NULL COMMENT '过期时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_token` (`token`),
  KEY `idx_article_id` (`article_id`),
  KEY `idx_expires_at` (`expires_at`),
  CONSTRAINT `fk_shares_article` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分享表';

-- =====================================================
-- 6. 评论表 (comments)
-- =====================================================
CREATE TABLE IF NOT EXISTS `comments` (
  `id` CHAR(36) NOT NULL COMMENT '评论UUID',
  `share_id` CHAR(36) NOT NULL COMMENT '分享ID',
  `author_name` VARCHAR(50) NOT NULL COMMENT '评论者名称',
  `content` TEXT NOT NULL COMMENT '评论内容',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_share_id` (`share_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_comments_share` FOREIGN KEY (`share_id`) REFERENCES `shares` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论表';

-- =====================================================
-- 7. 操作日志表 (operation_logs) - 用于触发器记录
-- =====================================================
CREATE TABLE IF NOT EXISTS `operation_logs` (
  `id` BIGINT AUTO_INCREMENT NOT NULL COMMENT '日志ID',
  `table_name` VARCHAR(50) NOT NULL COMMENT '操作的表名',
  `operation_type` ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL COMMENT '操作类型',
  `record_id` CHAR(36) NOT NULL COMMENT '记录ID',
  `old_data` JSON COMMENT '旧数据',
  `new_data` JSON COMMENT '新数据',
  `operated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  PRIMARY KEY (`id`),
  KEY `idx_table_name` (`table_name`),
  KEY `idx_operation_type` (`operation_type`),
  KEY `idx_operated_at` (`operated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- =====================================================
-- 8. 视图 (Views)
-- =====================================================

-- 视图1: 文章详情视图 - 包含作者信息和标签
DROP VIEW IF EXISTS `v_article_details`;
CREATE VIEW `v_article_details` AS
SELECT 
  a.id AS article_id,
  a.title,
  a.content,
  a.code,
  a.type,
  a.language,
  a.created_at,
  a.updated_at,
  u.id AS user_id,
  u.username AS author_name,
  u.email AS author_email,
  (SELECT COUNT(*) FROM shares s WHERE s.article_id = a.id) AS share_count,
  (SELECT GROUP_CONCAT(t.name SEPARATOR ', ') 
   FROM article_tags at 
   JOIN tags t ON at.tag_id = t.id 
   WHERE at.article_id = a.id) AS tag_names
FROM articles a
JOIN users u ON a.user_id = u.id;

-- 视图2: 用户统计视图 - 每个用户的文章统计
DROP VIEW IF EXISTS `v_user_statistics`;
CREATE VIEW `v_user_statistics` AS
SELECT 
  u.id AS user_id,
  u.username,
  u.email,
  u.created_at AS registered_at,
  COUNT(DISTINCT a.id) AS article_count,
  COUNT(DISTINCT CASE WHEN a.type = 'algorithm' THEN a.id END) AS algorithm_count,
  COUNT(DISTINCT CASE WHEN a.type = 'snippet' THEN a.id END) AS snippet_count,
  COUNT(DISTINCT CASE WHEN a.type = 'html' THEN a.id END) AS html_count,
  COUNT(DISTINCT s.id) AS total_shares
FROM users u
LEFT JOIN articles a ON u.id = a.user_id
LEFT JOIN shares s ON a.id = s.article_id
GROUP BY u.id, u.username, u.email, u.created_at;

-- 视图3: 热门标签视图
DROP VIEW IF EXISTS `v_popular_tags`;
CREATE VIEW `v_popular_tags` AS
SELECT 
  t.id AS tag_id,
  t.name AS tag_name,
  COUNT(at.article_id) AS usage_count,
  t.created_at
FROM tags t
LEFT JOIN article_tags at ON t.id = at.tag_id
GROUP BY t.id, t.name, t.created_at
ORDER BY usage_count DESC;

-- =====================================================
-- 9. 存储过程 (Stored Procedures)
-- =====================================================

-- 存储过程1: 获取用户的文章列表（带分页）
DROP PROCEDURE IF EXISTS `sp_get_user_articles`;
DELIMITER //
CREATE PROCEDURE `sp_get_user_articles`(
  IN p_user_id CHAR(36),
  IN p_page INT,
  IN p_page_size INT,
  IN p_type VARCHAR(20)
)
BEGIN
  DECLARE v_offset INT;
  SET v_offset = (p_page - 1) * p_page_size;
  
  SELECT 
    a.id,
    a.title,
    a.type,
    a.language,
    a.created_at,
    a.updated_at,
    (SELECT GROUP_CONCAT(t.name) FROM article_tags at 
     JOIN tags t ON at.tag_id = t.id 
     WHERE at.article_id = a.id) AS tags
  FROM articles a
  WHERE a.user_id = p_user_id
    AND (p_type IS NULL OR p_type = '' OR a.type = p_type)
  ORDER BY a.updated_at DESC
  LIMIT v_offset, p_page_size;
END //
DELIMITER ;

-- 存储过程2: 创建文章并关联标签（事务处理）
DROP PROCEDURE IF EXISTS `sp_create_article_with_tags`;
DELIMITER //
CREATE PROCEDURE `sp_create_article_with_tags`(
  IN p_article_id CHAR(36),
  IN p_user_id CHAR(36),
  IN p_title VARCHAR(255),
  IN p_content TEXT,
  IN p_code TEXT,
  IN p_type VARCHAR(20),
  IN p_language VARCHAR(50),
  IN p_tag_ids TEXT  -- 逗号分隔的标签ID
)
BEGIN
  DECLARE v_tag_id CHAR(36);
  DECLARE v_pos INT;
  DECLARE v_remaining TEXT;
  
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;
  
  START TRANSACTION;
  
  -- 插入文章
  INSERT INTO articles (id, user_id, title, content, code, type, language)
  VALUES (p_article_id, p_user_id, p_title, p_content, p_code, p_type, p_language);
  
  -- 解析并插入标签关联
  IF p_tag_ids IS NOT NULL AND p_tag_ids != '' THEN
    SET v_remaining = p_tag_ids;
    
    WHILE LENGTH(v_remaining) > 0 DO
      SET v_pos = LOCATE(',', v_remaining);
      
      IF v_pos > 0 THEN
        SET v_tag_id = TRIM(SUBSTRING(v_remaining, 1, v_pos - 1));
        SET v_remaining = SUBSTRING(v_remaining, v_pos + 1);
      ELSE
        SET v_tag_id = TRIM(v_remaining);
        SET v_remaining = '';
      END IF;
      
      IF v_tag_id != '' THEN
        INSERT IGNORE INTO article_tags (article_id, tag_id) VALUES (p_article_id, v_tag_id);
      END IF;
    END WHILE;
  END IF;
  
  COMMIT;
  
  SELECT 'SUCCESS' AS result, p_article_id AS article_id;
END //
DELIMITER ;

-- 存储过程3: 获取用户统计数据
DROP PROCEDURE IF EXISTS `sp_get_user_stats`;
DELIMITER //
CREATE PROCEDURE `sp_get_user_stats`(
  IN p_user_id CHAR(36)
)
BEGIN
  SELECT 
    u.username,
    COUNT(DISTINCT a.id) AS total_articles,
    COUNT(DISTINCT s.id) AS total_shares,
    COUNT(DISTINCT c.id) AS total_comments,
    (SELECT COUNT(DISTINCT at.tag_id) FROM articles a2 
     JOIN article_tags at ON a2.id = at.article_id 
     WHERE a2.user_id = p_user_id) AS tags_used
  FROM users u
  LEFT JOIN articles a ON u.id = a.user_id
  LEFT JOIN shares s ON a.id = s.article_id
  LEFT JOIN comments c ON s.id = c.share_id
  WHERE u.id = p_user_id
  GROUP BY u.id, u.username;
END //
DELIMITER ;

-- 存储过程4: 清理过期分享
DROP PROCEDURE IF EXISTS `sp_cleanup_expired_shares`;
DELIMITER //
CREATE PROCEDURE `sp_cleanup_expired_shares`()
BEGIN
  DECLARE v_deleted_count INT DEFAULT 0;
  
  -- 删除过期的分享（评论会级联删除）
  DELETE FROM shares WHERE expires_at < NOW();
  
  SET v_deleted_count = ROW_COUNT();
  
  SELECT v_deleted_count AS deleted_shares, NOW() AS cleanup_time;
END //
DELIMITER ;

-- =====================================================
-- 10. 触发器 (Triggers)
-- =====================================================

-- 触发器1: 文章插入后记录日志
DROP TRIGGER IF EXISTS `tr_article_after_insert`;
DELIMITER //
CREATE TRIGGER `tr_article_after_insert`
AFTER INSERT ON `articles`
FOR EACH ROW
BEGIN
  INSERT INTO operation_logs (table_name, operation_type, record_id, new_data)
  VALUES ('articles', 'INSERT', NEW.id, 
    JSON_OBJECT(
      'title', NEW.title,
      'type', NEW.type,
      'language', NEW.language,
      'user_id', NEW.user_id
    )
  );
END //
DELIMITER ;

-- 触发器2: 文章更新后记录日志
DROP TRIGGER IF EXISTS `tr_article_after_update`;
DELIMITER //
CREATE TRIGGER `tr_article_after_update`
AFTER UPDATE ON `articles`
FOR EACH ROW
BEGIN
  INSERT INTO operation_logs (table_name, operation_type, record_id, old_data, new_data)
  VALUES ('articles', 'UPDATE', NEW.id,
    JSON_OBJECT(
      'title', OLD.title,
      'type', OLD.type,
      'language', OLD.language
    ),
    JSON_OBJECT(
      'title', NEW.title,
      'type', NEW.type,
      'language', NEW.language
    )
  );
END //
DELIMITER ;

-- 触发器3: 文章删除前记录日志
DROP TRIGGER IF EXISTS `tr_article_before_delete`;
DELIMITER //
CREATE TRIGGER `tr_article_before_delete`
BEFORE DELETE ON `articles`
FOR EACH ROW
BEGIN
  INSERT INTO operation_logs (table_name, operation_type, record_id, old_data)
  VALUES ('articles', 'DELETE', OLD.id,
    JSON_OBJECT(
      'title', OLD.title,
      'type', OLD.type,
      'language', OLD.language,
      'user_id', OLD.user_id
    )
  );
END //
DELIMITER ;

-- 触发器4: 用户注册后记录日志
DROP TRIGGER IF EXISTS `tr_user_after_insert`;
DELIMITER //
CREATE TRIGGER `tr_user_after_insert`
AFTER INSERT ON `users`
FOR EACH ROW
BEGIN
  INSERT INTO operation_logs (table_name, operation_type, record_id, new_data)
  VALUES ('users', 'INSERT', NEW.id,
    JSON_OBJECT(
      'username', NEW.username,
      'email', NEW.email
    )
  );
END //
DELIMITER ;

-- =====================================================
-- 初始化数据（可选）
-- =====================================================

-- 插入一些默认标签
INSERT INTO `tags` (`id`, `name`) VALUES
  (UUID(), 'JavaScript'),
  (UUID(), 'TypeScript'),
  (UUID(), 'Python'),
  (UUID(), 'Java'),
  (UUID(), 'Algorithm'),
  (UUID(), 'Data Structure'),
  (UUID(), 'Vue'),
  (UUID(), 'React'),
  (UUID(), 'Node.js'),
  (UUID(), 'CSS'),
  (UUID(), 'HTML'),
  (UUID(), 'Database'),
  (UUID(), 'API'),
  (UUID(), 'Tutorial')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- =====================================================
-- 完成
-- =====================================================
SELECT '数据库初始化完成！' AS message;

-- =====================================================
-- 11. 自动备份脚本说明
-- =====================================================
-- 
-- Windows 自动备份方案：
-- 
-- 1. 创建备份脚本 backup.bat:
-- ------------------------------------------
-- @echo off
-- set BACKUP_DIR=C:\mysql_backups
-- set DATE=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%
-- set DATE=%DATE: =0%
-- 
-- if not exist %BACKUP_DIR% mkdir %BACKUP_DIR%
-- 
-- mysqldump -u root -psjblp code_notebook > %BACKUP_DIR%\code_notebook_%DATE%.sql
-- 
-- REM 删除7天前的备份
-- forfiles /p %BACKUP_DIR% /s /m *.sql /d -7 /c "cmd /c del @path" 2>nul
-- 
-- echo Backup completed: %BACKUP_DIR%\code_notebook_%DATE%.sql
-- ------------------------------------------
-- 
-- 2. 使用 Windows 任务计划程序设置定时执行:
--    - 打开"任务计划程序"
--    - 创建基本任务
--    - 设置每天凌晨2点执行 backup.bat
-- 
-- =====================================================
