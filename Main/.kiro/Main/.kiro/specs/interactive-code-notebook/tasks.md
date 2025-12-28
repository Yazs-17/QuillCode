# Implementation Plan

- [x] 1. 项目基础设施搭建



  - [-] 1.1 配置前端项目依赖和结构





    - 安装Vue Router、Pinia、Axios、Monaco Editor等依赖
    - 创建目录结构：views、components、stores、services、router
    - 配置Vite别名和环境变量
    - _Requirements: 9.1, 9.2_
  - [x] 1.2 初始化后端NestJS项目



    - 创建backend目录并初始化NestJS项目
    - 安装TypeORM、PostgreSQL驱动、JWT、bcrypt等依赖
    - 配置数据库连接和环境变量
    - _Requirements: 9.1, 9.2_

  - [x] 1.3 配置Docker Compose开发环境


    - 创建docker-compose.yml配置PostgreSQL和Elasticsearch
    - 配置开发环境网络和卷挂载
    - _Requirements: 9.3, 9.4_

- [x] 2. 用户认证系统



  - [x] 2.1 实现后端认证模块


    - 创建User实体和数据库迁移
    - 实现注册接口（bcrypt密码加密）
    - 实现登录接口（JWT生成）
    - 实现JWT策略和AuthGuard
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 2.2 实现前端认证功能

    - 创建auth store管理登录状态
    - 实现LoginView和RegisterView页面
    - 配置Axios拦截器添加JWT头
    - 实现路由守卫保护受限页面
    - _Requirements: 1.2, 1.3, 1.4, 1.5_
  - [ ]* 2.3 编写认证模块测试
    - 编写注册和登录API测试
    - 编写JWT验证测试
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 3. 文章管理系统





  - [x] 3.1 实现后端文章模块

    - 创建Article实体（支持algorithm/snippet/html类型）
    - 实现文章CRUD接口
    - 添加用户关联和权限校验
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  - [x] 3.2 实现前端文章列表和详情


    - 创建article store管理文章状态
    - 实现ArticleList和ArticleCard组件
    - 实现文章详情页ArticleView
    - _Requirements: 2.1, 2.5_
  - [x] 3.3 实现文章编辑器页面


    - 创建EditorView主编辑页面
    - 集成Markdown编辑器组件
    - 实现文章类型选择和保存功能
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1_
  - [ ]* 3.4 编写文章模块测试
    - 编写文章CRUD API测试
    - 编写权限校验测试
    - _Requirements: 2.1, 2.5, 2.6_

- [x] 4. 代码编辑器集成





  - [x] 4.1 集成Monaco Editor组件

    - 安装并配置Monaco Editor
    - 创建CodeEditor组件支持多语言语法高亮
    - 实现代码编辑器与文章数据绑定
    - _Requirements: 3.1, 3.2_
  - [x] 4.2 实现编辑器双栏布局


    - 创建左侧Markdown编辑区
    - 创建右侧代码编辑区
    - 实现可拖拽分割线调整布局
    - _Requirements: 3.1_

  - [x] 4.3 实现代码预览区域

    - 创建CodePreview组件显示执行结果
    - 创建HtmlPreview组件用于HTML/Vue预览
    - 实现预览区域切换逻辑
    - _Requirements: 3.3, 3.4_

- [x] 5. 代码执行引擎




  - [x] 5.1 实现前端沙箱执行器（Prod模式）
    - 创建codeExecutor工具类（已实现：frontend/src/utils/executor.js）
    - 使用AsyncFunction实现JS/TS沙箱执行（已实现）
    - 实现console输出捕获（已实现）
    - 添加执行超时控制（待完善）
    - _Requirements: 4.1, 4.2, 4.4, 4.5_
  - [x] 5.2 实现后端代码执行接口









    - 创建Executor模块
    - 实现SandboxExecutor（Prod模式）
    - 实现执行结果返回格式
    - _Requirements: 4.1, 4.2, 4.4, 4.5_
  - [x] 5.3 实现Docker执行器（Dev模式）


    - 集成dockerode库
    - 实现DockerExecutor支持多语言
    - 配置容器资源限制和网络隔离
    - _Requirements: 4.3, 4.4, 4.5_
  - [x] 5.4 连接前端运行按钮与执行引擎


    - 实现运行按钮点击事件（部分已实现）
    - 调用执行API并显示结果
    - 处理执行错误和超时
    - _Requirements: 3.3, 4.4, 4.5_
  - [ ]* 5.5 编写代码执行器测试
    - 编写沙箱执行器单元测试
    - 编写超时和错误处理测试
    - _Requirements: 4.2, 4.4_

- [x] 6. 标签系统






  - [x] 6.1 实现后端标签模块

    - 创建Tag实体和ArticleTag关联表
    - 实现标签CRUD接口
    - 实现文章-标签关联接口
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [x] 6.2 实现前端标签功能


    - 创建tag store管理标签状态
    - 实现TagSelector组件用于文章编辑
    - 实现TagCloud组件展示标签云
    - 实现按标签筛选文章功能
    - _Requirements: 5.1, 5.2, 5.4_
  - [ ]* 6.3 编写标签模块测试
    - 编写标签关联API测试
    - _Requirements: 5.1, 5.3_

- [x] 7. 搜索功能






  - [x] 7.1 集成Elasticsearch

    - 配置Elasticsearch连接
    - 创建文章索引映射
    - 实现文章创建/更新时的索引同步
    - _Requirements: 6.1_

  - [x] 7.2 实现搜索接口和前端

    - 实现全文搜索API
    - 创建SearchView搜索页面
    - 实现搜索结果展示和高亮
    - _Requirements: 6.1, 6.4_

  - [x] 7.3 实现RAG推荐功能（Dev模式）

    - 集成Ollama和LangChain.js
    - 实现基于标签的相似文章推荐
    - 添加推荐结果展示
    - _Requirements: 6.2, 6.3_

- [x] 8. 分享系统





  - [x] 8.1 实现后端分享模块


    - 创建Share实体
    - 实现分享链接生成接口（带过期时间）
    - 实现分享token访问接口
    - 实现分享链接管理接口
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 8.2 实现前端分享功能

    - 创建ShareDialog分享对话框
    - 实现SharePageView分享访问页面（只读模式）
    - 实现分享管理列表页面
    - _Requirements: 7.1, 7.2, 7.4_
  - [ ]* 8.3 编写分享模块测试
    - 编写分享链接生成和过期测试
    - _Requirements: 7.1, 7.3_

- [x] 9. 评论系统






  - [x] 9.1 实现后端评论模块

    - 创建Comment实体
    - 实现评论添加接口（关联分享）
    - 实现评论列表获取接口
    - 添加分享过期校验
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - [x] 9.2 实现前端评论功能


    - 创建CommentList组件
    - 创建CommentForm组件
    - 在分享页面集成评论功能
    - _Requirements: 8.1, 8.3_
  - [ ]* 9.3 编写评论模块测试
    - 编写评论添加和过期校验测试
    - _Requirements: 8.1, 8.2_

- [x] 10. 错误处理与UI完善





  - [x] 10.1 实现统一错误处理


    - 创建后端全局异常过滤器
    - 实现统一响应格式拦截器
    - 配置前端Axios错误拦截
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  - [x] 10.2 完善UI组件和样式





    - 实现AppHeader导航栏（重构现有header）
    - 实现AppSidebar侧边栏（重构现有file-manager）
    - 添加加载状态和空状态提示
    - 优化响应式布局
    - _Requirements: 3.1_
  - [x] 10.3 实现双模式切换


    - 读取APP_MODE环境变量
    - 根据模式启用/禁用功能
    - 添加模式指示器
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
