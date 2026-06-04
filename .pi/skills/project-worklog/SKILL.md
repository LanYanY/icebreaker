---
name: project-worklog
description: 维护项目工作日志，记录Android开发进展、决策、变更和协作信息。适用于pi在仓库中的任务开始、变更、审查、交接、恢复或协调工作时使用。
---

# 项目工作日志

使用此技能维护仓库级别的协作记录，避免将其变成冗长的日记。

## 默认文件

- 主工作日志：`work_doc/agent_worklog.md`
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

## Android 开发相关

在Android项目中，记录以下内容：

### 构建相关
- Gradle构建命令：`./gradlew clean`、`./gradlew assembleDebug`、`./gradlew installDebug`
- 构建结果：成功/失败，错误信息
- 依赖变更：新增或更新的库

### 设备相关
- ADB命令：`adb devices`、`adb install`、`adb logcat`
- 设备连接状态
- 安装和测试结果

### 项目结构
- 代码文件：Java/Kotlin源文件、布局文件、资源文件
- 配置文件：build.gradle、AndroidManifest.xml、settings.gradle
- 版本控制：Git提交、分支状态

### 环境状态
- SDK版本：Android SDK、Build Tools、Platform Tools
- Java版本：JDK版本和JAVA_HOME配置
- 代理配置：Gradle代理设置

## 安装说明

此技能安装在：
- `.pi/skills/project-worklog/SKILL.md`（项目本地）
- 在pi中使用 `/skill:project-worklog` 手动调用

## 质量规则

- **条目长度**：每个条目控制在12行以内，除非失败需要确切细节。
- **使用路径**：优先使用链接或路径，而不是大型差异的文本摘要。
- **记录阻塞点**：明确记录阻塞点，特别是缺失的硬件引脚、不可用的工具、失败的构建或未验证的时序。
- **构建信息**：对于Android开发，包含目标设备和构建命令。
- **多代理工作**：记录每个代理拥有的文件或子系统。
- **安全规范**：不要在工作日志中存储密钥、私钥、令牌、序列号或个人数据。

## 最终响应检查清单

在响应用户之前：

- [ ] 确认工作日志已更新，或说明未更新的原因。
- [ ] 提及任何无法进行的验证。
- [ ] 识别项目的下一个具体里程碑。

## 示例条目

### 任务开始
```markdown
## 2026-06-04 17:00 CST - pi

- Context: 开始Android项目初始化任务
- Changes: none
- Verification: 环境检查完成（Java 17、ADB 37.0.0、SDK 34）
- Decisions: 使用Gradle 8.5、Android SDK 34、API 24作为最低版本
- Next: 创建项目结构并配置Gradle
```

### 构建完成
```markdown
## 2026-06-04 17:15 CST - pi

- Context: 完成项目结构创建和Git初始化
- Changes: 创建了12个文件，包括build.gradle、MainActivity.java、布局文件等
- Verification: ./gradlew --version 成功，git status显示所有文件已提交
- Decisions: 使用ConstraintLayout作为主布局，配置了Gradle代理
- Next: 执行首次构建测试
```

### 问题记录
```markdown
## 2026-06-04 17:30 CST - pi

- Context: 构建失败，依赖下载超时
- Changes: none（构建配置未变更）
- Verification: ./gradlew assembleDebug 失败，网络连接超时
- Decisions: 需要配置Gradle代理以加速依赖下载
- Next: 配置Gradle代理并重试构建
```
