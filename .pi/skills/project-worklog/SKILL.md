---
name: project-worklog
description: 维护项目工作日志，记录开发进展、决策、变更和协作信息。适用于所有软件开发项目，在任务开始、变更、审查、交接、恢复或协调工作时使用。
---

# 项目工作日志

使用此技能维护仓库级别的协作记录，避免将其变成冗长的日记。

## 默认文件

- 主工作日志：`work_doc/agent_worklog.md`
- 归档目录：`work_doc/archive/`
- 技能文件：`.pi/skills/project-worklog/SKILL.md`

如果仓库已有等效的协作日志，请改用该文件，并在最终响应中说明路径。

## 工作流程

1. **任务开始时**：读取主工作日志的最新条目（如果存在）。
2. **保留历史**：保留现有的用户或代理条目。除非用户明确要求，否则不要重写历史。
3. **完成前记录**：在完成任何代码、配置、构建系统、文档或测试变更之前，向工作日志添加简短条目。
4. **内容简洁**：每个条目应事实清晰、简洁：意图、涉及文件、验证结果、决策、阻塞点和确切的下一步。
5. **使用绝对日期**：使用带本地时区的绝对日期格式，避免使用"今天"、"昨天"等模糊表述。
6. **多代理协作**：如果有多个代理在工作，说明所有权边界，避免声称其他代理完成的工作。
7. **无变更时**：即使没有文件变更，当任务产生决策、分析结果或交接状态时，仍需添加条目。

## 条目格式

使用以下结构添加条目（最新条目在最后）：

```markdown
## YYYY-MM-DD HH:MM TZ - <角色>

- Context: <此条目存在的原因>
- Changes: <更改的文件或区域；仅分析时填写"none">
- Verification: <命令、构建/测试结果，或"未运行：原因">
- Decisions: <重要假设或已确认的事实>
- Next: <单个最有用的下一步操作>
```

除非用户指定更具体的代理名称，否则使用 `pi` 作为角色。

## 特殊条目类型

### 1. 问题解决记录

当遇到并解决问题时，使用以下格式：

```markdown
## YYYY-MM-DD HH:MM TZ - pi

- Context: <问题描述>
- Problem: <具体错误信息或现象>
- Root Cause: <根本原因分析>
- Solution: <解决方案>
- Verification: <验证结果>
- Lessons Learned: <经验总结>
- Next: <下一步操作>
```

**示例**：
```markdown
## 2026-06-04 18:00 CST - pi

- Context: Gradle构建失败，无法下载依赖
- Problem: Could not GET 'https://dl.google.com/dl/android/maven2/...' - Connection timed out
- Root Cause: 中国网络环境无法直接访问Google Maven仓库
- Solution: 配置国内镜像源（阿里云、华为云、腾讯云）
- Verification: ./gradlew assembleDebug 成功，生成APK文件
- Lessons Learned: 在中国开发Android应用，必须配置国内镜像源
- Next: 记录镜像源配置到skill中
```

### 2. 网络搜索记录

当使用网络搜索解决问题时，使用以下格式：

```markdown
## YYYY-MM-DD HH:MM TZ - pi

- Context: <问题描述>
- Search Query: <搜索关键词>
- Search Results: <搜索结果摘要>
- Solution Found: <找到的解决方案>
- Implementation: <实施步骤>
- Verification: <验证结果>
- Next: <下一步操作>
```

**示例**：
```markdown
## 2026-06-04 18:05 CST - pi

- Context: 搜索中国国内Gradle镜像源配置方法
- Search Query: "中国国内 Gradle 构建 网络问题 解决方案 镜像源"
- Search Results: 找到阿里云、华为云、腾讯云等国内镜像源配置方法
- Solution Found: 使用国内镜像源替代Google Maven仓库
- Implementation: 修改build.gradle和gradle-wrapper.properties
- Verification: Gradle下载成功，构建通过
- Next: 记录配置到skill中
```

### 3. 方案验证记录

当验证解决方案时，使用以下格式：

```markdown
## YYYY-MM-DD HH:MM TZ - pi

- Context: <验证目的>
- Solution: <待验证的解决方案>
- Test Steps: <测试步骤>
- Results: <测试结果>
- Conclusion: <结论>
- Next: <下一步操作>
```

**示例**：
```markdown
## 2026-06-04 18:10 CST - pi

- Context: 验证Capacitor 6.x是否兼容compileSdk 34
- Solution: 降低Capacitor版本到6.x
- Test Steps: 1) 卸载Capacitor 8.x 2) 安装Capacitor 6.x 3) 重新构建
- Results: 构建成功，生成3.7MB APK文件
- Conclusion: Capacitor 6.x完全兼容compileSdk 34，推荐使用
- Next: 更新skill文档
```

### 4. 经验总结记录

当总结经验教训时，使用以下格式：

```markdown
## YYYY-MM-DD HH:MM TZ - pi

- Context: <经验总结的背景>
- Experience: <经验内容>
- Applicable Scenarios: <适用场景>
- Key Points: <关键要点>
- References: <参考资料>
- Next: <下一步操作>
```

**示例**：
```markdown
## 2026-06-04 18:15 CST - pi

- Context: 总结Android开发网络问题解决经验
- Experience: 在中国开发Android应用，必须配置国内镜像源
- Applicable Scenarios: Gradle下载超时、Maven仓库访问失败、SDK下载失败
- Key Points: 1) 使用腾讯云镜像下载Gradle 2) 使用阿里云镜像下载依赖 3) 配置全局init.gradle
- References: https://maven.aliyun.com/repository/public
- Next: 更新android-dev skill
```

## Worklog 压缩机制

**当项目进入新阶段时，对worklog进行压缩，避免文件过长。**

### 压缩触发条件
- 项目里程碑完成（如v1.0发布、功能模块完成）
- 用户明确要求压缩或归档
- worklog超过15个条目
- 项目方向发生重大变化

### 压缩流程

1. **创建归档**：
   ```bash
   mkdir -p work_doc/archive
   cp work_doc/agent_worklog.md work_doc/archive/worklog_YYYY-MM-DD_phase.md
   ```

2. **生成摘要**：在归档文件顶部添加阶段摘要：
   ```markdown
   # Worklog 归档：[阶段名称]
   - 时间范围：YYYY-MM-DD 至 YYYY-MM-DD
   - 主要成果：<简述完成的工作>
   - 关键决策：<重要决策列表>
   - 问题解决：<解决的主要问题>
   - 经验总结：<重要经验教训>
   - 当前状态：<项目状态>
   - 后续方向：<下一步计划>
   ```

3. **压缩主文件**：保留最近10-15个条目，将更早的条目替换为摘要链接：
   ```markdown
   ## 历史记录

   此阶段的工作记录已归档至：[work_doc/archive/worklog_YYYY-MM-DD_phase.md]

   **阶段摘要**：
   - 时间：YYYY-MM-DD 至 YYYY-MM-DD
   - 成果：<简述>
   - 关键决策：<简述>
   - 问题解决：<简述>
   - 经验总结：<简述>

   ---

   ## 最近工作记录

   （保留最近的条目）
   ```

### 归档文件命名规范
- 格式：`worklog_YYYY-MM-DD_phase.md`
- 示例：`worklog_2026-06-04_initial-setup.md`
- 示例：`worklog_2026-06-10_v1.0-release.md`

## 质量规则

- **条目长度**：每个条目控制在12行以内，除非失败需要确切细节。
- **使用路径**：优先使用链接或路径，而不是大型差异的文本摘要。
- **记录阻塞点**：明确记录阻塞点，特别是缺失的依赖、不可用的工具、失败的构建或未验证的时序。
- **多代理工作**：记录每个代理拥有的文件或子系统。
- **安全规范**：不要在工作日志中存储密钥、私钥、令牌、序列号或个人数据。
- **问题解决**：详细记录问题解决过程，包括搜索关键词、解决方案来源、验证结果。
- **经验总结**：定期总结经验教训，便于后续参考。

## 最终响应检查清单

在响应用户之前：

- [ ] 确认工作日志已更新，或说明未更新的原因。
- [ ] 提及任何无法进行的验证。
- [ ] 识别项目的下一个具体里程碑。
- [ ] 记录任何问题解决过程（如果适用）。
- [ ] 总结经验教训（如果适用）。

## 示例条目

### 任务开始
```markdown
## 2026-06-04 17:00 CST - pi

- Context: 开始用户认证模块开发
- Changes: none
- Verification: 环境检查完成（Node.js 18、npm 9、数据库连接正常）
- Decisions: 使用JWT进行身份验证，bcrypt进行密码加密
- Next: 设计数据库用户表结构
```

### 代码变更
```markdown
## 2026-06-04 17:15 CST - pi

- Context: 实现用户注册功能
- Changes: 创建了src/models/user.js、src/routes/auth.js、src/controllers/authController.js
- Verification: npm test 通过，API测试返回201状态码
- Decisions: 使用MongoDB存储用户数据，添加了邮箱唯一性约束
- Next: 实现登录功能和JWT生成
```

### 问题解决
```markdown
## 2026-06-04 17:30 CST - pi

- Context: 构建失败，依赖安装超时
- Problem: npm install 失败，网络连接超时
- Root Cause: 中国网络环境无法直接访问npm官方源
- Solution: 配置淘宝镜像源
- Verification: npm install 成功，所有依赖安装完成
- Lessons Learned: 在中国开发Node.js应用，必须配置国内镜像源
- Next: 继续开发
```

### 网络搜索
```markdown
## 2026-06-04 17:45 CST - pi

- Context: 搜索Gradle镜像源配置方法
- Search Query: "Gradle 国内镜像源 配置"
- Search Results: 找到阿里云、华为云、腾讯云镜像源
- Solution Found: 使用阿里云镜像源
- Implementation: 修改build.gradle添加镜像源配置
- Verification: Gradle下载成功
- Next: 记录配置到skill
```

### 里程碑完成
```markdown
## 2026-06-10 15:00 CST - pi

- Context: v1.0用户认证模块完成
- Changes: 完成了注册、登录、JWT验证、密码重置功能
- Verification: 所有单元测试通过，集成测试通过
- Decisions: 将此阶段worklog归档，开始v2.0规划
- Next: 压缩worklog，开始v2.0功能规划
```
