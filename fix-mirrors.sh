#!/bin/bash
# 修复 capacitor-cordova-android-plugins/build.gradle 中的镜像配置
# 每次 cap sync 后需要运行此脚本

FILE="capacitor-cordova-android-plugins/build.gradle"

# 替换 buildscript.repositories 中的 google()
sed -i '/^buildscript {/,/^    }/{
  /        google()/i\        maven { url '"'"'https://maven.aliyun.com/repository/google'"'"' }\n        maven { url '"'"'https://maven.aliyun.com/repository/public'"'"' }\n        maven { url '"'"'https://maven.aliyun.com/repository/gradle-plugin'"'"' }
}' "$FILE"

# 替换 repositories 中的 google()（第一个出现的，不在 buildscript 块中）
# 用 awk 精确处理
python3 -c "
import re
with open('$FILE', 'r') as f:
    content = f.read()

# 只替换 buildscript 块外的 repositories 中的 google()
# 找到所有 google() 出现的位置
lines = content.split('\n')
in_buildscript = False
repos_added = False
result = []
for line in lines:
    if 'buildscript {' in line:
        in_buildscript = True
    elif in_buildscript and line.strip() == '}' and not line.startswith('    ' * 2):
        in_buildscript = False
    
    if not in_buildscript and not repos_added and '    google()' in line and 'buildscript' not in line:
        result.append(\"    maven { url 'https://maven.aliyun.com/repository/google' }\")
        result.append(\"    maven { url 'https://maven.aliyun.com/repository/public' }\")
        repos_added = True
    
    result.append(line)

with open('$FILE', 'w') as f:
    f.write('\n'.join(result))
"

echo "Mirror config restored in $FILE"
