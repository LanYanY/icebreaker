# GitHub & Gitee 推送指南

本文档记录「开场白」项目的多平台开源发布流程，可复用于其他项目。

## 仓库地址

| 平台 | 地址 |
|------|------|
| GitHub | https://github.com/LanYanY/icebreaker |
| Gitee | https://gitee.com/yy_lan/icebreaker |

## Token 配置

Token 存储在 passvault 密码管理器中：

```bash
export PASSVAULT_MASTER_PASSWORD='主密码'
passvault get github   # GitHub Personal Access Token
passvault get gitee    # Gitee Access Token
```

### Token 权限要求

| 平台 | 所需权限 |
|------|----------|
| GitHub | `repo` (完整仓库访问) |
| Gitee | `projects` (项目管理) |

### Token 获取地址

- GitHub: https://github.com/settings/tokens
- Gitee: https://gitee.com/profile/personal_access_tokens

## 一、创建远程仓库

### GitHub

```bash
curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d '{"name":"repo-name","description":"描述","private":false}'
```

### Gitee

```bash
curl -s -X POST 'https://gitee.com/api/v5/user/repos' \
  -d "access_token=$GITEE_TOKEN" \
  -d 'name=repo-name' \
  -d 'description=描述' \
  -d 'private=0'
```

## 二、配置 Git 远程仓库

```bash
cd your-project

# 添加远程仓库（HTTPS + Token 方式）
git remote add github "https://LanYanY:${GITHUB_TOKEN}@github.com/LanYanY/icebreaker.git"
git remote add gitee "https://yy_lan:${GITEE_TOKEN}@gitee.com/yy_lan/icebreaker.git"
```

### 多远程推送

```bash
# 推送到 GitHub
git push -u github master

# 推送到 Gitee
git push -u gitee master
```

### SSH 方式（可选，需配置密钥）

```bash
git remote add github "git@github.com:LanYanY/icebreaker.git"
git remote add gitee "git@gitee.com:yy_lan/icebreaker.git"
```

## 三、创建 Tag

```bash
# 创建带注释的 tag
git tag -a v1.2.0 -m "v1.2.0: release notes"

# 推送到两个远程
git push github v1.2.0
git push gitee v1.2.0
```

## 四、创建 Release

### GitHub Release

```bash
# 1. 创建 release（获取 release ID）
RELEASE_ID=$(curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/LanYanY/icebreaker/releases \
  -d '{
    "tag_name": "v1.2.0",
    "name": "v1.2.0 - Release Title",
    "body": "## Release Notes\n\n- Feature 1\n- Bug fix 1",
    "draft": false,
    "prerelease": false
  }' | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).id))")

# 2. 上传 APK 附件（文件名必须 ASCII！）
cp ~/桌面/开场白.apk /tmp/OpeningLine-v1.2.0.apk

curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Content-Type: application/vnd.android.package-archive" \
  "https://uploads.github.com/repos/LanYanY/icebreaker/releases/$RELEASE_ID/assets?name=OpeningLine-v1.2.0.apk" \
  --data-binary @/tmp/OpeningLine-v1.2.0.apk
```

### Gitee Release

```bash
# 1. 创建 release（必须传 target_commitish）
curl -s -X POST "https://gitee.com/api/v5/repos/yy_lan/icebreaker/releases" \
  -d "access_token=$GITEE_TOKEN" \
  -d 'tag_name=v1.2.0' \
  -d 'name=v1.2.0 - Release Title' \
  -d 'target_commitish=master' \
  --data-urlencode 'body=## Release Notes

- Feature 1
- Bug fix 1'

# 2. 获取 release ID
RELEASE_ID=$(curl -s "https://gitee.com/api/v5/repos/yy_lan/icebreaker/releases?access_token=$GITEE_TOKEN" \
  | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d)[0]?.id))")

# 3. 上传附件
curl -s -X POST "https://gitee.com/api/v5/repos/yy_lan/icebreaker/releases/$RELEASE_ID/attach_files" \
  -H "Content-Type: multipart/form-data" \
  -F "access_token=$GITEE_TOKEN" \
  -F "file=@/tmp/OpeningLine-v1.2.0.apk"
```

## 五、设置仓库公开

### Gitee

```bash
# Gitee API PATCH 必须传 name 参数（不同于 GitHub）
curl -s -X PATCH "https://gitee.com/api/v5/repos/yy_lan/icebreaker" \
  -d "access_token=$GITEE_TOKEN" \
  -d 'name=icebreaker' \
  -d 'private=false'
```

## 六、日常推送流程

```bash
# 修改代码后
git add -A
git commit -m "feat: 描述你的改动"

# 推送到两个平台
git push github master
git push gitee master

# 如果需要创建 release
git tag -a v1.3.0 -m "v1.3.0: 新功能描述"
git push github v1.3.0
git push gitee v1.3.0
```

## ⚠️ API 踩坑记录

### GitHub

| 问题 | 原因 | 解决 |
|------|------|------|
| Upload API 400 | 文件名含中文 | 先 `cp` 到 ASCII 文件名再上传 |
| Release body 截断 | JSON 中换行符 | 用 `--data-urlencode` 或文件读取 |
| Token 过期 401 | Token 有效期到期 | 重新生成 Token |

### Gitee

| 问题 | 原因 | 解决 |
|------|------|------|
| PATCH 报错 `name is missing` | Gitee API 要求 name 必填 | 传 `name=仓库名` |
| 创建 release 报错 `target_commitish is missing` | 必须指定分支 | 传 `target_commitish=master` |
| 仓库默认私有 | Gitee 新建仓库默认私有 | 需额外 PATCH 设为公开 |

### Git

| 问题 | 原因 | 解决 |
|------|------|------|
| 推送被拒 | 远程已有初始化内容 | `git pull --rebase` 合并后再推 |
| Token 泄露 | 密码写在脚本中 | 使用 passvault 或环境变量 |

## 开源前检查清单

- [ ] `.gitignore` 包含敏感文件（`*.jks`、`*.keystore`、`local.properties`）
- [ ] `.gitignore` 包含开发文件（`work_doc/`、`.pi/`、`node_modules/`、`dist/`）
- [ ] 代码中无硬编码 API Key 或密码
- [ ] `git rm --cached` 移除已跟踪的敏感文件
- [ ] `README.md` 包含项目说明、功能、构建指南
- [ ] `LICENSE` 文件已添加
- [ ] Release 包含可下载的 APK 附件

## 完整发布脚本

```bash
#!/bin/bash
set -e

export PASSVAULT_MASTER_PASSWORD="${PASSVAULT_MASTER_PASSWORD:-$(cat ~/.passvault/.master)}"
GITHUB_TOKEN=$(passvault get github 2>&1 | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).password))")
GITEE_TOKEN=$(passvault get gitee 2>&1 | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).password))")

VERSION=$1
if [ -z "$VERSION" ]; then
  echo "Usage: ./publish.sh <version> (e.g., ./publish.sh v1.3.0)"
  exit 1
fi

echo "=== 发布 $VERSION ==="

# 构建
echo "1/6 构建 APK..."
npm run build
npx cap sync android
bash fix-all-mirrors.sh
cd android && ./gradlew assembleRelease && cd ..

# 复制 APK
APK_PATH="/tmp/OpeningLine-${VERSION}.apk"
cp android/app/build/outputs/apk/release/app-release.apk "$APK_PATH"

# Commit & Tag
echo "2/6 创建 tag..."
git add -A
git commit -m "release: $VERSION" || true
git tag -a "$VERSION" -m "Release $VERSION"

# Push
echo "3/6 推送..."
git push github master "$VERSION"
git push gitee master "$VERSION"

# GitHub Release
echo "4/6 创建 GitHub Release..."
RELEASE_ID=$(curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/LanYanY/icebreaker/releases \
  -d "{\"tag_name\":\"$VERSION\",\"name\":\"$VERSION\",\"body\":\"Release $VERSION\"}" \
  | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).id))")

curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Content-Type: application/vnd.android.package-archive" \
  "https://uploads.github.com/repos/LanYanY/icebreaker/releases/$RELEASE_ID/assets?name=OpeningLine-${VERSION}.apk" \
  --data-binary "@$APK_PATH" > /dev/null

# Gitee Release
echo "5/6 创建 Gitee Release..."
curl -s -X POST "https://gitee.com/api/v5/repos/yy_lan/icebreaker/releases" \
  -d "access_token=$GITEE_TOKEN" \
  -d "tag_name=$VERSION" \
  -d "name=$VERSION" \
  -d 'target_commitish=master' > /dev/null

GITEE_RID=$(curl -s "https://gitee.com/api/v5/repos/yy_lan/icebreaker/releases?access_token=$GITEE_TOKEN" \
  | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d)[0]?.id))")

curl -s -X POST "https://gitee.com/api/v5/repos/yy_lan/icebreaker/releases/$GITEE_RID/attach_files" \
  -F "access_token=$GITEE_TOKEN" \
  -F "file=@$APK_PATH" > /dev/null

echo "6/6 清理..."
rm -f "$APK_PATH"

echo ""
echo "✅ $VERSION 发布完成"
echo "  GitHub: https://github.com/LanYanY/icebreaker/releases/tag/$VERSION"
echo "  Gitee:  https://gitee.com/yy_lan/icebreaker/releases/tag/$VERSION"
```
