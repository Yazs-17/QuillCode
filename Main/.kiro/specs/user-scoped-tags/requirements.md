# Requirements Document

## Introduction

本功能修复标签系统的用户隔离问题。当前系统中标签是全局共享的，导致新用户能看到其他用户的标签及其文章数量统计。需要将标签改为用户级别隔离，确保每个用户只能看到和管理自己的标签。

## Glossary

- **Tag_Service**: 负责标签 CRUD 操作和标签-文章关联管理的后端服务
- **Tag_Entity**: 数据库中存储标签信息的实体，包含标签名称和所属用户
- **Article_Tag_Entity**: 文章与标签的多对多关联实体
- **User**: 系统中的注册用户，拥有独立的标签空间

## Requirements

### Requirement 1: 标签用户隔离

**User Story:** As a user, I want my tags to be private to my account, so that I can organize my articles without seeing other users' tags.

#### Acceptance Criteria

1. THE Tag_Entity SHALL include a user_id field to associate each tag with its owner
2. WHEN a user creates a tag, THE Tag_Service SHALL associate the tag with the current user's ID
3. WHEN a user queries tags, THE Tag_Service SHALL return only tags belonging to that user
4. WHEN checking for duplicate tag names, THE Tag_Service SHALL only check within the same user's tags

### Requirement 2: 用户级别文章数量统计

**User Story:** As a user, I want to see accurate article counts for my tags, so that I can understand how I've organized my content.

#### Acceptance Criteria

1. WHEN calculating article count for a tag, THE Tag_Service SHALL count only articles belonging to the current user
2. WHEN a user views their tag list, THE Tag_Service SHALL return article counts that reflect only their own articles

### Requirement 3: 标签操作权限控制

**User Story:** As a user, I want to ensure only I can modify or delete my tags, so that my organization system remains secure.

#### Acceptance Criteria

1. WHEN a user attempts to delete a tag, THE Tag_Service SHALL verify the tag belongs to the requesting user
2. IF a user attempts to delete another user's tag, THEN THE Tag_Service SHALL reject the request with an authorization error
3. WHEN a user attempts to add a tag to an article, THE Tag_Service SHALL verify both the tag and article belong to the requesting user

### Requirement 4: 数据库迁移

**User Story:** As a system administrator, I want the database schema to support user-scoped tags, so that the application can properly isolate user data.

#### Acceptance Criteria

1. THE Database_Schema SHALL include a user_id column in the tags table
2. THE Database_Schema SHALL have a foreign key constraint from tags.user_id to users.id
3. THE Database_Schema SHALL have a unique constraint on (user_id, name) combination instead of just name
4. WHEN the migration runs, THE Database_Schema SHALL handle existing tags appropriately
