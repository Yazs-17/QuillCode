@echo off
echo =====================================================
echo Interactive Code Notebook - MySQL 数据库初始化
echo =====================================================
echo.

set DB_USER=root
set DB_PASS=sjblp
set DB_NAME=code_notebook

echo 正在初始化数据库...
mysql -u%DB_USER% -p%DB_PASS% < init.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =====================================================
    echo 数据库初始化成功！
    echo 数据库名: %DB_NAME%
    echo 用户名: %DB_USER%
    echo =====================================================
) else (
    echo.
    echo 数据库初始化失败，请检查MySQL服务是否运行
)

pause
