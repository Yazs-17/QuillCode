@echo off
REM QuillCode - Ollama 模型拉取脚本 (Windows)
REM 用于首次启动时下载 AI 模型

setlocal enabledelayedexpansion

REM 默认模型
if "%OLLAMA_MODEL%"=="" (
    set MODEL=llama3:8b
) else (
    set MODEL=%OLLAMA_MODEL%
)

echo QuillCode - Ollama 模型拉取工具
echo ==================================

REM 检查 Docker 是否运行
docker info >nul 2>&1
if errorlevel 1 (
    echo 错误: Docker 未运行，请先启动 Docker Desktop
    exit /b 1
)

REM 检查 Ollama 容器是否存在
docker ps -a --format "{{.Names}}" | findstr /C:"quillcode-ollama" >nul
if errorlevel 1 (
    echo 错误: quillcode-ollama 容器不存在
    echo 请先启动 AI 模式: docker-compose -f docker-compose.ai.yml up -d
    exit /b 1
)

REM 检查 Ollama 容器是否运行
docker ps --format "{{.Names}}" | findstr /C:"quillcode-ollama" >nul
if errorlevel 1 (
    echo Ollama 容器未运行，正在启动...
    docker start quillcode-ollama
    timeout /t 5 /nobreak >nul
)

REM 等待 Ollama 服务就绪
echo 等待 Ollama 服务就绪...
set /a count=0
:wait_loop
docker exec quillcode-ollama ollama list >nul 2>&1
if errorlevel 1 (
    set /a count+=1
    if !count! geq 30 (
        echo 错误: Ollama 服务启动超时
        exit /b 1
    )
    timeout /t 2 /nobreak >nul
    goto wait_loop
)
echo Ollama 服务已就绪

REM 检查模型是否已存在
echo 检查模型 %MODEL%...
docker exec quillcode-ollama ollama list | findstr /C:"%MODEL%" >nul
if not errorlevel 1 (
    echo 模型 %MODEL% 已存在
    exit /b 0
)

REM 拉取模型
echo 开始拉取模型 %MODEL%...
echo 这可能需要几分钟到几十分钟，取决于网络速度和模型大小
echo.

docker exec -it quillcode-ollama ollama pull %MODEL%

if errorlevel 1 (
    echo 模型拉取失败
    exit /b 1
)

echo.
echo 模型 %MODEL% 拉取成功！
echo.
echo 可用模型列表:
docker exec quillcode-ollama ollama list

echo.
echo 设置完成！QuillCode AI 功能已就绪。
