# Requirements Document

## Introduction

本项目是一个"可执行的网页互动笔记系统"，旨在将文章（思路/见解/记录）、代码（可运行、可校验、可预览）和标签（用于搜索、RAG分析）统一为结构化知识单元。系统支持本地离线和在线预览两种运行模式，为开发者提供一个随写、随存、随运行的代码笔记环境。

## Glossary

- **Notebook_System**: 网页互动编辑笔记系统的核心应用
- **Article**: 文章实体，包含文字内容、代码片段、类型和标签
- **Code_Executor**: 代码执行引擎，负责安全隔离地运行用户代码
- **Tag**: 标签实体，用于文章分类、搜索和RAG语义聚合
- **RAG**: Retrieval-Augmented Generation，检索增强生成技术
- **Share_Link**: 分享链接，允许外部用户只读访问文章
- **Prod_Mode**: 生产模式，功能受限的在线Demo版本
- **Dev_Mode**: 开发模式，完整功能的本地自部署版本
- **Monaco_Editor**: 微软开源的代码编辑器组件
- **Sandbox**: 沙箱环境，用于安全执行用户代码

---

## Requirements

### Requirement 1: 用户认证系统

**User Story:** As a 开发者, I want 注册和登录账户, so that 我可以安全地管理我的个人笔记和代码。

#### Acceptance Criteria

1. WHEN 用户提交注册表单, THE Notebook_System SHALL 使用bcrypt加密存储密码并创建新用户账户。
2. WHEN 用户提交有效的登录凭证, THE Notebook_System SHALL 生成JWT令牌并返回给客户端。
3. WHILE 用户持有有效JWT令牌, THE Notebook_System SHALL 允许访问受保护的API端点。
4. IF JWT令牌已过期, THEN THE Notebook_System SHALL 返回401状态码并要求重新登录。
5. WHEN 用户请求个人资料, THE Notebook_System SHALL 返回当前登录用户的基本信息。

---

### Requirement 2: 文章管理系统

**User Story:** As a 开发者, I want 创建、编辑和管理我的代码笔记文章, so that 我可以系统化地记录和复用我的代码知识。

#### Acceptance Criteria

1. WHEN 用户创建新文章, THE Notebook_System SHALL 保存文章内容、代码片段、类型和关联标签。
2. WHERE 文章类型为Algorithm, THE Notebook_System SHALL 支持算法校验功能（固定输入产生固定输出）。
3. WHERE 文章类型为Snippet, THE Notebook_System SHALL 支持工具代码的存储和执行。
4. WHERE 文章类型为HTML/Vue3, THE Notebook_System SHALL 支持前端页面的实时预览。
5. WHEN 用户编辑文章, THE Notebook_System SHALL 更新文章内容并保留修改历史时间戳。
6. WHEN 用户删除文章, THE Notebook_System SHALL 移除文章及其关联的标签关系。

---

### Requirement 3: 代码编辑与预览

**User Story:** As a 开发者, I want 在笔记中编写和实时预览代码, so that 我可以验证代码的正确性并记录可运行的代码片段。

#### Acceptance Criteria

1. WHEN 用户打开文章编辑页面, THE Notebook_System SHALL 显示左侧Markdown编辑区和右侧Monaco代码编辑区。
2. WHEN 用户在代码编辑区输入代码, THE Notebook_System SHALL 提供语法高亮和基本代码补全功能。
3. WHEN 用户点击运行按钮, THE Notebook_System SHALL 在右下角区域显示代码执行结果或页面预览。
4. WHERE 文章类型为HTML/Vue3, THE Notebook_System SHALL 在iframe中渲染前端页面预览。

---

### Requirement 4: 代码执行引擎

**User Story:** As a 开发者, I want 安全地执行我的代码片段, so that 我可以验证代码逻辑而不影响系统安全。

#### Acceptance Criteria

1. WHILE 系统运行在Prod_Mode, THE Code_Executor SHALL 仅支持TypeScript和JavaScript代码执行。
2. WHILE 系统运行在Prod_Mode, THE Code_Executor SHALL 使用AsyncFunction在沙箱中执行代码并禁止文件系统和网络访问。
3. WHILE 系统运行在Dev_Mode, THE Code_Executor SHALL 使用Docker容器隔离执行多语言代码。
4. IF 代码执行超过10秒, THEN THE Code_Executor SHALL 终止执行并返回超时错误。
5. WHEN 代码执行完成, THE Code_Executor SHALL 返回标准输出、标准错误和执行状态。

---

### Requirement 5: 标签系统

**User Story:** As a 开发者, I want 为文章添加标签, so that 我可以快速分类和检索我的笔记。

#### Acceptance Criteria

1. WHEN 用户为文章添加标签, THE Notebook_System SHALL 创建文章与标签的多对多关联。
2. WHEN 用户搜索标签, THE Notebook_System SHALL 返回包含该标签的所有文章列表。
3. WHEN 用户删除文章的标签, THE Notebook_System SHALL 移除文章与标签的关联但保留标签实体。
4. WHEN 用户查看标签列表, THE Notebook_System SHALL 显示所有标签及其关联文章数量。

---

### Requirement 6: 搜索与RAG集成

**User Story:** As a 开发者, I want 智能搜索我的历史代码和笔记, so that 我可以快速找到相关内容并获得推荐。

#### Acceptance Criteria

1. WHEN 用户输入搜索关键词, THE Notebook_System SHALL 使用Elasticsearch返回匹配的文章列表。
2. WHILE 系统运行在Dev_Mode, THE Notebook_System SHALL 使用Ollama提供基于RAG的相似文章推荐。
3. WHEN 用户查看文章详情, THE Notebook_System SHALL 根据标签显示相关文章推荐。
4. IF 搜索结果为空, THEN THE Notebook_System SHALL 显示基于标签的相似内容建议。

---

### Requirement 7: 分享系统

**User Story:** As a 开发者, I want 分享我的笔记给他人, so that 我可以展示我的代码和思路。

#### Acceptance Criteria

1. WHEN 用户创建分享链接, THE Notebook_System SHALL 生成唯一的分享URL并设置过期时间。
2. WHEN 访客通过分享链接访问文章, THE Notebook_System SHALL 以只读模式显示文章内容和代码。
3. IF 分享链接已过期, THEN THE Notebook_System SHALL 返回404状态并显示链接已失效提示。
4. WHEN 用户查看分享管理页面, THE Notebook_System SHALL 显示所有已创建的分享链接及其状态。

---

### Requirement 8: 评论系统

**User Story:** As a 访客, I want 在分享的文章下留言, so that 我可以与作者交流反馈。

#### Acceptance Criteria

1. WHEN 访客在分享文章下提交评论, THE Notebook_System SHALL 保存评论内容和提交时间。
2. WHERE 分享链接已过期, THE Notebook_System SHALL 禁止新评论的提交。
3. WHEN 文章作者查看评论, THE Notebook_System SHALL 按时间顺序显示所有评论。
4. WHEN 分享链接过期, THE Notebook_System SHALL 自动隐藏关联的评论。

---

### Requirement 9: 双模式运行

**User Story:** As a 系统管理员, I want 通过环境变量切换运行模式, so that 我可以灵活部署在线Demo或完整功能版本。

#### Acceptance Criteria

1. WHEN APP_MODE环境变量设置为prod, THE Notebook_System SHALL 启用功能受限的在线Demo模式。
2. WHEN APP_MODE环境变量设置为dev, THE Notebook_System SHALL 启用完整功能的本地自部署模式。
3. WHILE 系统运行在Prod_Mode, THE Notebook_System SHALL 禁用Docker代码执行和Ollama RAG功能。
4. WHILE 系统运行在Dev_Mode, THE Notebook_System SHALL 启用所有功能包括多语言代码执行。

---

### Requirement 10: 错误处理与响应

**User Story:** As a 开发者, I want 收到清晰的错误提示, so that 我可以理解问题并采取正确的操作。

#### Acceptance Criteria

1. WHEN API请求失败, THE Notebook_System SHALL 返回统一格式的错误响应包含错误码和描述信息。
2. WHEN 认证失败, THE Notebook_System SHALL 返回错误码1001和相应的错误描述。
3. WHEN 文章不存在, THE Notebook_System SHALL 返回错误码2001和相应的错误描述。
4. WHEN 代码执行失败, THE Notebook_System SHALL 返回错误码3001和执行错误详情。
