[TOC]

## 项目概述

QuillCode 是一个面向程序员的在线代码笔记系统，旨在提供一个"随写、随存、随运行"的代码学习与管理环境。系统支持 Markdown 文档编写、多语言代码编辑与在线执行、标签分类管理、智能文章关联与推荐、文章分享与评论等功能。
"Quill" 一词源自英文中的"羽毛笔"，象征着书写与创作。在 QuillCode 中，每一篇代码笔记都被称为一个 "Quill"，寓意用户用代码书写自己的技术成长之路。


## Functions

1. 未来功能前瞻：
   - 文件上传（包含教程markdown file、standard code file），markdown file 实时渲染
   - add console 调试功能
   - AI语义知识库加入，AI智能筛选
   - 管理后台重做并独立出来
	 - 强化AI推荐，优化es检索（考虑加入AI推荐流）
   - Github发布形式
     - 源码开源
     - QuillCode 更加倾向于在线试用，对试用者（需要登录注册）可以下载软件（跳转到github releases 页面下载），开源软件，是一款 electron 软件
   
2. 阶段性任务
   
   - 宣传一下自己做的小玩具
   
     



## Some Tools

Vue (frontend) & Nest.js (backend) & TypeROM

## Start

```bash
# TODO
```



## Self Deploy

TODO

## the last

TODO


## To Start

1. node 20.19.5
2. docker pull elasticsearch:8.12.2
   ```bash
   docker run -d --name es -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" -e "xpack.security.enabled=false" -e "ES_JAVA_OPTS=-Xms512m -Xmx512m" elasticsearch:8.12.2
   # 
   docker start es
   ```
   
   
   
3. ollama llama3:8b

4. mysql 8.0.39,  执行database/init.sql, 定时任务可以采用 Windows 任务计划程序设置定时执行备份脚本 ()

5. nestjs, vue3,TypeORM 版本均在 package中给出 

6. 给某人管理员权限： 
   ```sql
   USE code_notebook;
   UPDATE users SET role = 'admin' WHERE username = 'Yazs';
   ```

7. 
