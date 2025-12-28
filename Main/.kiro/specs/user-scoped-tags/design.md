# Design Document: User-Scoped Tags

## Overview

本设计文档描述如何将标签系统从全局共享模式改为用户隔离模式。主要涉及数据库结构变更、实体修改、服务层逻辑调整和控制器层参数传递。

## Architecture

### 当前架构问题

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   User A    │────▶│    Tags     │◀────│   User B    │
│  (articles) │     │  (global)   │     │  (articles) │
└─────────────┘     └─────────────┘     └─────────────┘
```

当前所有用户共享同一个标签池，导致：
- 用户 A 创建的标签对用户 B 可见
- articleCount 统计所有用户的文章

### 目标架构

```
┌─────────────┐     ┌─────────────┐
│   User A    │────▶│  Tags (A)   │
│  (articles) │     └─────────────┘
└─────────────┘     
                    
┌─────────────┐     ┌─────────────┐
│   User B    │────▶│  Tags (B)   │
│  (articles) │     └─────────────┘
└─────────────┘
```

每个用户拥有独立的标签空间。

## Components and Interfaces

### 1. Tag Entity 修改

```typescript
// backend/src/entities/tag.entity.ts
@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })  // 新增
  userId: string;

  @ManyToOne(() => User)        // 新增
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  name: string;

  @OneToMany(() => ArticleTag, (articleTag) => articleTag.tag)
  articleTags: ArticleTag[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

### 2. TagService 接口修改

```typescript
interface TagService {
  // 创建标签时需要 userId
  create(createTagDto: CreateTagDto, userId: string): Promise<Tag>;
  
  // 查询标签时需要 userId
  findAll(userId: string): Promise<(Tag & { articleCount: number })[]>;
  
  // 查询单个标签时验证所有权
  findOne(id: string, userId: string): Promise<Tag>;
  
  // 删除标签时验证所有权
  remove(id: string, userId: string): Promise<void>;
  
  // 添加标签到文章时验证所有权
  addTagToArticle(articleId: string, tagId: string, userId: string): Promise<void>;
}
```

### 3. TagController 修改

所有端点需要从 JWT token 中提取 userId 并传递给服务层。

## Data Models

### 数据库表结构变更

#### 修改前 (tags 表)
| Column | Type | Constraints |
|--------|------|-------------|
| id | CHAR(36) | PRIMARY KEY |
| name | VARCHAR(50) | UNIQUE |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

#### 修改后 (tags 表)
| Column | Type | Constraints |
|--------|------|-------------|
| id | CHAR(36) | PRIMARY KEY |
| user_id | CHAR(36) | NOT NULL, FOREIGN KEY → users.id |
| name | VARCHAR(50) | NOT NULL |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

新增约束：
- UNIQUE KEY `uk_user_tag` (`user_id`, `name`) - 同一用户下标签名唯一
- 移除原有的 UNIQUE KEY `uk_name` (`name`)

### 迁移 SQL

```sql
-- 1. 添加 user_id 列（允许 NULL 以便迁移）
ALTER TABLE `tags` ADD COLUMN `user_id` CHAR(36) NULL AFTER `id`;

-- 2. 添加外键约束
ALTER TABLE `tags` ADD CONSTRAINT `fk_tags_user` 
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

-- 3. 移除原有的唯一约束
ALTER TABLE `tags` DROP INDEX `uk_name`;

-- 4. 添加新的复合唯一约束
ALTER TABLE `tags` ADD UNIQUE KEY `uk_user_tag` (`user_id`, `name`);

-- 5. 处理现有数据（可选：将现有标签分配给第一个管理员用户）
-- UPDATE `tags` SET `user_id` = (SELECT id FROM users WHERE role = 'admin' LIMIT 1) WHERE `user_id` IS NULL;

-- 6. 设置 user_id 为 NOT NULL（在数据迁移完成后）
-- ALTER TABLE `tags` MODIFY COLUMN `user_id` CHAR(36) NOT NULL;
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Tag Creation Associates User

*For any* user and any valid tag name, when the user creates a tag, the resulting tag's userId field SHALL equal the creating user's ID.

**Validates: Requirements 1.2**

### Property 2: Tag Query Returns Only User's Tags

*For any* user querying tags, all tags in the result set SHALL have a userId matching the querying user's ID.

**Validates: Requirements 1.3**

### Property 3: Tag Name Uniqueness Is User-Scoped

*For any* two different users A and B, if user A has a tag with name N, user B SHALL be able to create a tag with the same name N without conflict.

**Validates: Requirements 1.4**

### Property 4: Article Count Is User-Scoped

*For any* user querying their tags, the articleCount for each tag SHALL equal the count of articles belonging to that user that are associated with that tag.

**Validates: Requirements 2.1, 2.2**

### Property 5: Tag Deletion Requires Ownership

*For any* user attempting to delete a tag, if the tag's userId does not match the requesting user's ID, the operation SHALL be rejected with an authorization error.

**Validates: Requirements 3.1, 3.2**

### Property 6: Tag-Article Association Requires Ownership

*For any* user attempting to add a tag to an article, if either the tag or the article does not belong to the user, the operation SHALL be rejected.

**Validates: Requirements 3.3**

## Error Handling

### Authorization Errors

| Scenario | Error Code | HTTP Status | Message |
|----------|------------|-------------|---------|
| Delete tag not owned by user | TAG_NOT_FOUND or FORBIDDEN | 403/404 | "Tag not found or access denied" |
| Add tag to article not owned | FORBIDDEN | 403 | "Cannot add tag to article you don't own" |
| Use tag not owned by user | FORBIDDEN | 403 | "Cannot use tag you don't own" |

### Validation Errors

| Scenario | Error Code | HTTP Status | Message |
|----------|------------|-------------|---------|
| Duplicate tag name for same user | TAG_EXISTS | 409 | "Tag with this name already exists" |

## Testing Strategy

### Unit Tests

使用 Jest 进行单元测试，重点测试：
- TagService 方法的用户过滤逻辑
- 权限验证逻辑
- 错误处理路径

### Property-Based Tests

使用 fast-check 进行属性测试，每个属性测试运行至少 100 次迭代。

测试标注格式：
```typescript
// **Feature: user-scoped-tags, Property 1: Tag Creation Associates User**
// **Validates: Requirements 1.2**
```

### Integration Tests

- 测试数据库约束（唯一性、外键）
- 测试端到端的 API 调用流程
- 测试多用户并发场景

### Test Configuration

```typescript
// jest.config.js
{
  testEnvironment: 'node',
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts'],
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80 }
  }
}
```
