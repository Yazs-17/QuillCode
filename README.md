[TOC]

## General Introduction

As the description, this project is used for making mini tutorials with interactive functions, and I'd like to use my own toolkit to make it!

## Tasks split

- [ ] 实现实时预览指定文件夹下的markdown files
- [ ] markdown 上传，文件展示与懒加载
- [ ] 用Vue pinia 同步“当前文件名、内容、保存状态”
- [ ] 单体 JWT ，保存唯一状态
- [ ] 文章Vim式 快捷在线编辑






## Functions

1. 未来功能前瞻：
   - 文件上传（包含教程markdown file、standard code file），markdown file 实时渲染
   - code real-time preview 
   - add console 调试功能
   - AI语义知识库加入，AI智能筛选
   - 管理后台，用户登陆功能，java( spring boot ) 
2. 阶段性任务
   - 宣传一下自己做的小玩具



## Some Tools

Vue (frontend) & java springboot (H5 , mongodb or mysql)(or go gin or express) & minidatabase(sqlite and so on )

## Start



## Self Deploy



## the last


## if you ?

如果你想用原生手写，你只需要做到：
1. 引入 marked.js/showdown.js & highlight.js -> 原因不言而喻
2. 手写iframe通信机制（postMessage） -> 安全的代码与运行沙箱
3. 数据响应更新系统（reactivity system） -> 自动更新预览
4. 模块化组件（`<template>` & JS 动态clone & Web Components） -> 不言而喻
5. 状态管理 （event bus/observer）-> 不言而喻
6. 强大的组织能力和赤石精神
