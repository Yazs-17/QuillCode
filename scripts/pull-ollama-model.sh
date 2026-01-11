#!/bin/bash
# QuillCode - Ollama 模型拉取脚本
# 用于首次启动时下载 AI 模型

set -e

# 默认模型
DEFAULT_MODEL="llama3:8b"
MODEL="${OLLAMA_MODEL:-$DEFAULT_MODEL}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}QuillCode - Ollama 模型拉取工具${NC}"
echo "=================================="

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}错误: Docker 未运行，请先启动 Docker${NC}"
    exit 1
fi

# 检查 Ollama 容器是否存在
if ! docker ps -a --format '{{.Names}}' | grep -q "quillcode-ollama"; then
    echo -e "${RED}错误: quillcode-ollama 容器不存在${NC}"
    echo "请先启动 AI 模式: docker-compose -f docker-compose.ai.yml up -d"
    exit 1
fi

# 检查 Ollama 容器是否运行
if ! docker ps --format '{{.Names}}' | grep -q "quillcode-ollama"; then
    echo -e "${YELLOW}Ollama 容器未运行，正在启动...${NC}"
    docker start quillcode-ollama
    sleep 5
fi

# 等待 Ollama 服务就绪
echo "等待 Ollama 服务就绪..."
for i in {1..30}; do
    if docker exec quillcode-ollama ollama list > /dev/null 2>&1; then
        echo -e "${GREEN}Ollama 服务已就绪${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}错误: Ollama 服务启动超时${NC}"
        exit 1
    fi
    sleep 2
done

# 检查模型是否已存在
echo "检查模型 ${MODEL}..."
if docker exec quillcode-ollama ollama list | grep -q "${MODEL}"; then
    echo -e "${GREEN}模型 ${MODEL} 已存在${NC}"
    exit 0
fi

# 拉取模型
echo -e "${YELLOW}开始拉取模型 ${MODEL}...${NC}"
echo "这可能需要几分钟到几十分钟，取决于网络速度和模型大小"
echo ""

docker exec -it quillcode-ollama ollama pull "${MODEL}"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}模型 ${MODEL} 拉取成功！${NC}"
    echo ""
    echo "可用模型列表:"
    docker exec quillcode-ollama ollama list
else
    echo -e "${RED}模型拉取失败${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}设置完成！QuillCode AI 功能已就绪。${NC}"
