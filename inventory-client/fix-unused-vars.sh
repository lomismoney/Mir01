#!/bin/bash

# 批量修復未使用變數的腳本

echo "開始修復未使用變數..."

# 修復常見的測試文件導入
find src -name "*.test.tsx" -exec sed -i '' 's/fireEvent, //g' {} \;
find src -name "*.test.tsx" -exec sed -i '' 's/, fireEvent//g' {} \;
find src -name "*.test.tsx" -exec sed -i '' 's/waitFor, //g' {} \;
find src -name "*.test.tsx" -exec sed -i '' 's/, waitFor//g' {} \;

# 修復未使用的參數（將參數重命名為 _）
find src -name "*.tsx" -name "*.ts" -exec sed -i '' 's/\(([^)]*\)e: [A-Za-z]*\([^)]*)\)/\1_: \2/' {} \;

echo "修復完成。請運行 npm run lint 檢查結果。"