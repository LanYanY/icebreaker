#!/bin/bash
# 修复所有 Capacitor 插件 build.gradle
# cap sync 会覆盖这些文件，所以每次 sync 后运行
#
# 规则：
# 1. 只做最简单的文本替换，不用复杂正则
# 2. 每步操作后 grep 验证
# 3. 出错立即停止

set -e

echo "=== Fixing AGP versions ==="

# 1. 修复 capacitor-cordova-android-plugins 的 AGP 版本
CORDOVA="android/capacitor-cordova-android-plugins/build.gradle"
if [ -f "$CORDOVA" ]; then
  # 简单文本替换：8.2.1 → 8.2.0
  sed -i 's/gradle:8\.2\.1/gradle:8.2.0/g' "$CORDOVA"
  echo "  ✓ AGP in $CORDOVA"
fi

# 2. 修复 node_modules 插件的 AGP 版本
for f in node_modules/@capacitor/*/android/build.gradle; do
  if [ -f "$f" ]; then
    sed -i 's/gradle:8\.[0-9]*\.[0-9]*/gradle:8.2.0/g' "$f"
  fi
done
echo "  ✓ AGP in node_modules plugins"

echo "=== Fixing mirrors ==="

# 3. 给 capacitor-cordova-android-plugins 添加 mirrors（如果还没有）
if [ -f "$CORDOVA" ] && ! grep -q "maven.aliyun.com" "$CORDOVA"; then
  # 在 google() 前面插入三行 mirrors
  sed -i '/^        google()$/i\        maven { url '\''https://maven.aliyun.com/repository/google'\'' }\n        maven { url '\''https://maven.aliyun.com/repository/public'\'' }\n        maven { url '\''https://maven.aliyun.com/repository/gradle-plugin'\'' }' "$CORDOVA"
  echo "  ✓ Mirrors in $CORDOVA"
elif grep -q "maven.aliyun.com" "$CORDOVA" 2>/dev/null; then
  echo "  ✓ Mirrors already in $CORDOVA"
fi

# 4. 给 node_modules 插件添加 mirrors（如果还没有）
for f in node_modules/@capacitor/*/android/build.gradle; do
  if [ -f "$f" ] && ! grep -q "maven.aliyun.com" "$f"; then
    sed -i '/^        google()$/i\        maven { url '\''https://maven.aliyun.com/repository/google'\'' }\n        maven { url '\''https://maven.aliyun.com/repository/public'\'' }\n        maven { url '\''https://maven.aliyun.com/repository/gradle-plugin'\'' }' "$f"
  fi
done
echo "  ✓ Mirrors in node_modules plugins"

echo "=== Verifying ==="

# 5. 验证所有 AGP 版本
BAD_AGP=$(grep -r "gradle:8\.[^2]" android/capacitor-cordova-android-plugins/build.gradle node_modules/@capacitor/*/android/build.gradle 2>/dev/null || true)
if [ -n "$BAD_AGP" ]; then
  echo "  ❌ Found wrong AGP versions:"
  echo "$BAD_AGP"
  exit 1
fi

# 6. 验证所有文件都有 mirrors
for f in android/capacitor-cordova-android-plugins/build.gradle node_modules/@capacitor/*/android/build.gradle; do
  if [ -f "$f" ] && ! grep -q "maven.aliyun.com" "$f"; then
    echo "  ❌ Missing mirrors in: $f"
    exit 1
  fi
done

echo "  ✓ All verified OK"
echo "=== Done ==="
