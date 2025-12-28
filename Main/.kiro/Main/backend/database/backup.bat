@echo off
REM =====================================================
REM QuillCode - MySQL 数据库自动备份脚本
REM =====================================================

REM 配置区域
set DB_USER=root
set DB_PASS=sjblp
set DB_NAME=code_notebook
set BACKUP_DIR=C:\mysql_backups\code_notebook

REM 生成日期时间戳 (格式: YYYYMMDD_HHMM)
set DATETIME=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%
set DATETIME=%DATETIME: =0%

REM 创建备份目录
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM 执行备份
echo [%date% %time%] 开始备份数据库 %DB_NAME%...
mysqldump -u %DB_USER% -p%DB_PASS% --single-transaction --routines --triggers %DB_NAME% > "%BACKUP_DIR%\%DB_NAME%_%DATETIME%.sql"

if %ERRORLEVEL% EQU 0 (
    echo [%date% %time%] 备份成功: %BACKUP_DIR%\%DB_NAME%_%DATETIME%.sql
) else (
    echo [%date% %time%] 备份失败!
    exit /b 1
)

REM 删除7天前的旧备份
echo [%date% %time%] 清理7天前的旧备份...
forfiles /p "%BACKUP_DIR%" /s /m *.sql /d -7 /c "cmd /c del @path" 2>nul

echo [%date% %time%] 备份任务完成!
