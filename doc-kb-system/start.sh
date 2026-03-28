#!/bin/bash

# 文档知识库构建系统启动脚本

echo "================================"
echo "文档知识库构建系统"
echo "================================"
echo ""

# 检查 Python 版本
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "Python 版本: $python_version"

# 启动后端
echo ""
echo "启动后端服务..."
cd backend
source venv/bin/activate
python main.py &
BACKEND_PID=$!
echo "后端服务 PID: $BACKEND_PID"

# 等待后端启动
sleep 3

# 启动前端
echo ""
echo "启动前端服务..."
cd ../frontend
npm install
npm run dev &
FRONTEND_PID=$!
echo "前端服务 PID: $FRONTEND_PID"

echo ""
echo "================================"
echo "服务已启动:"
echo "  后端: http://localhost:8866"
echo "  前端: http://localhost:8822"
echo "  API 文档: http://localhost:8866/docs"
echo "================================"
echo ""
echo "按 Ctrl+C 停止服务"

# 等待用户中断
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
