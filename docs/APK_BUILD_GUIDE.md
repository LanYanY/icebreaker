# APK 构建指南

本文档说明如何从源码构建「开场白」Android APK。

## 环境要求

| 依赖 | 版本 | 说明 |
|------|------|------|
| Node.js | 18+ | JavaScript 运行时 |
| npm | 9+ | 包管理器 |
| Java | 17 | Gradle 构建需要 |
| Android SDK | Platform 34 | 目标 SDK |
| Android Build Tools | 34.0.0 | 构建工具 |

## 快速构建

```bash
# 1. 安装依赖
npm install

# 2. 构建前端
npm run build

# 3. 同步到 Android 项目
npx cap sync android

# 4. 修复国内镜像（重要！每次 cap sync 后都要执行）
bash fix-all-mirrors.sh

# 5. 构建 Release APK
cd android && ./gradlew assembleRelease

# 6. APK 输出位置
# android/app/build/outputs/apk/release/app-release.apk
```

## 详细步骤

### 1. 安装 Node.js 依赖

```bash
cd ~/devSpace/icebreaker
npm install
```

### 2. 构建前端资源

```bash
npm run build
```

输出目录：`dist/`，包含 HTML、CSS、JS 和离线题库 JSON。

### 3. 同步到 Capacitor Android 项目

```bash
npx cap sync android
```

此命令会：
- 将 `dist/` 内容复制到 `android/app/src/main/assets/public/`
- 更新 Capacitor 插件的 Gradle 配置
- **⚠️ 会覆盖 `build.gradle` 的镜像配置**，需要下一步修复

### 4. 修复国内镜像源

```bash
bash fix-all-mirrors.sh
```

此脚本会：
- 将所有 AGP 版本统一为 `8.2.0`（cap sync 会写入 8.2.1，与 compileSdk 34 不兼容）
- 在所有 `build.gradle` 的 `repositories` 块中插入阿里云镜像（放在 `google()` 之前）

**⚠️ 重要**：每次执行 `cap sync android` 后都必须重新运行此脚本。

### 5. 构建 APK

```bash
cd android

# Release 版本（推荐，用于分发）
./gradlew assembleRelease

# Debug 版本（用于开发调试）
./gradlew assembleDebug
```

### 6. APK 输出

| 类型 | 路径 |
|------|------|
| Release | `android/app/build/outputs/apk/release/app-release.apk` |
| Debug | `android/app/build/outputs/apk/debug/app-debug.apk` |

## 签名配置

### Release 签名

Release APK 使用 `release-key.jks` 签名（已配置在 `build.gradle` 中）：

```
keystore: android/app/release-key.jks
alias: icebreaker
password: icebreaker123
```

### 生成新签名（如需要）

```bash
keytool -genkey -v \
  -keystore android/app/release-key.jks \
  -keyalg RSA -keysize 2048 \
  -validity 10000 \
  -alias icebreaker
```

## 安装到设备

### USB 安装

```bash
# 检查设备连接
adb devices

# 安装 Release APK
adb install android/app/build/outputs/apk/release/app-release.apk

# 覆盖安装（同包名）
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

### 小米设备注意事项

1. 开启「开发者选项」→「USB 调试」
2. 开启「USB 安装」（MIUI 特有，否则报 `INSTALL_FAILED_USER_RESTRICTED`）
3. 不同包名需先卸载旧版：`adb uninstall com.openingline.app`

## 完整构建脚本

```bash
#!/bin/bash
set -e

echo "=== 构建 开场白 APK ==="

echo "1/5 安装依赖..."
npm install --silent

echo "2/5 构建前端..."
npm run build

echo "3/5 同步到 Android..."
npx cap sync android

echo "4/5 修复镜像源..."
bash fix-all-mirrors.sh

echo "5/5 构建 Release APK..."
cd android && ./gradlew assembleRelease

echo ""
echo "✅ APK 构建完成"
echo "📦 输出: android/app/build/outputs/apk/release/app-release.apk"
echo "📱 安装: adb install android/app/build/outputs/apk/release/app-release.apk"
```

## 常见问题

### Gradle 下载超时

**现象**：`Could not resolve com.android.tools.build:gradle:8.2.0`

**原因**：国内网络无法访问 Google Maven

**解决**：运行 `bash fix-all-mirrors.sh`，确保阿里云镜像已配置

### AGP 版本不兼容

**现象**：`Minimum supported Gradle version is 8.2`

**原因**：`cap sync` 写入了 AGP 8.2.1，需要 Gradle 8.5+，但项目配置的 Gradle 是 8.5-bin

**解决**：运行 `bash fix-all-mirrors.sh`，将 AGP 降回 8.2.0

### install failed UPDATE_INCOMPATIBLE

**现象**：签名不一致无法覆盖安装

**原因**：Debug 和 Release 使用不同签名

**解决**：先卸载旧版 `adb uninstall com.openingline.app`，再安装新版

### cap sync 后镜像丢失

**现象**：构建时下载超时

**原因**：`cap sync android` 会重新生成 `capacitor-cordova-android-plugins/build.gradle`，覆盖手动配置

**解决**：每次 `cap sync` 后重新运行 `bash fix-all-mirrors.sh`

## 技术细节

| 配置 | 值 |
|------|-----|
| 包名 | `com.openingline.app` |
| compileSdk | 34 |
| targetSdk | 34 |
| minSdk | 22 |
| AGP 版本 | 8.2.0 |
| Gradle 版本 | 8.5 |
| Capacitor | 6.x |
| 签名 | release-key.jks (RSA 2048) |
