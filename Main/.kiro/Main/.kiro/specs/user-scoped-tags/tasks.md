# Implementation Plan: User-Scoped Tags

## Overview

将标签系统从全局共享模式改为用户隔离模式，涉及数据库迁移、实体修改、服务层和控制器层调整。

## Tasks

- [-] 1. 修改 Tag 实体添加用户关联
  - [-] 1.1 更新 Tag 实体添加 userId 字段和 User 关联
    - 添加 `userId: string` 字段
    - 添加 `@ManyToOne(() => User)` 关联
    - 添加 `@JoinColumn({ name: 'user_id' })` 装饰器
    - _Requirements: 1.1, 4.1_

- [ ] 2. 修改 TagService 实现用户隔离
  - [ ] 2.1 修改 create 方法接受 userId 参数
    - 方法签名改为 `create(createTagDto: CreateTagDto, userId: string)`
    - 创建标签时设置 userId
    - 重复检查改为检查同一用户下的标签名
    - _Requirements: 1.2, 1.4_
  - [ ] 2.2 修改 findAll 方法按用户过滤
    - 方法签名改为 `findAll(userId: string)`
    - 查询条件添加 `where: { userId }`
    - articleCount 统计改为只统计该用户的文章
    - _Requirements: 1.3, 2.1, 2.2_
  - [ ] 2.3 修改 findOne 方法验证所有权
    - 方法签名改为 `findOne(id: string, userId: string)`
    - 查询条件添加 userId 过滤
    - _Requirements: 3.1_
  - [ ] 2.4 修改 remove 方法验证所有权
    - 方法签名改为 `remove(id: string, userId: string)`
    - 调用 findOne 验证所有权后再删除
    - _Requirements: 3.1, 3.2_
  - [ ] 2.5 修改 addTagToArticle 方法验证所有权
    - 方法签名改为 `addTagToArticle(articleId: string, tagId: string, userId: string)`
    - 验证标签属于当前用户
    - 验证文章属于当前用户
    - _Requirements: 3.3_
  - [ ] 2.6 编写 TagService 单元测试
    - 测试用户隔离逻辑
    - 测试权限验证逻辑
    - _Requirements: 1.2, 1.3, 1.4, 2.1, 3.1, 3.2, 3.3_

- [ ] 3. 修改 TagController 传递用户 ID
  - [ ] 3.1 修改 create 端点传递 userId
    - 从 `req.user.id` 获取用户 ID
    - 传递给 `tagService.create()`
    - _Requirements: 1.2_
  - [ ] 3.2 修改 findAll 端点传递 userId
    - 从 `req.user.id` 获取用户 ID
    - 传递给 `tagService.findAll()`
    - _Requirements: 1.3_
  - [ ] 3.3 修改 findOne 端点传递 userId
    - 从 `req.user.id` 获取用户 ID
    - 传递给 `tagService.findOne()`
    - _Requirements: 3.1_
  - [ ] 3.4 修改 remove 端点传递 userId
    - 从 `req.user.id` 获取用户 ID
    - 传递给 `tagService.remove()`
    - _Requirements: 3.1, 3.2_
  - [ ] 3.5 修改 addTagToArticle 端点传递 userId
    - 从 `req.user.id` 获取用户 ID
    - 传递给 `tagService.addTagToArticle()`
    - _Requirements: 3.3_

- [ ] 4. Checkpoint - 确保代码编译通过
  - 确保所有 TypeScript 编译无错误
  - 确保所有测试通过，如有问题请询问用户

- [ ] 5. 更新数据库结构
  - [ ] 5.1 更新 init.sql 添加 user_id 字段
    - 添加 `user_id` 列定义
    - 添加外键约束 `fk_tags_user`
    - 修改唯一约束从 `uk_name` 改为 `uk_user_tag(user_id, name)`
    - 移除默认标签插入（因为标签现在需要关联用户）
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 6. Final Checkpoint - 验证完整功能
  - 确保所有测试通过，如有问题请询问用户
