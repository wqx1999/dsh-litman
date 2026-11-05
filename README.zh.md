# litman for DeepSeek Harness

[English](./README.md)

[litman](https://litman.dev) 把你读过的论文存在你自己的电脑上，由 AI 助手帮你归档、检索。这个插件把 litman 接入 DeepSeek Harness，其余一切都是 litman 本身：[litman.dev](https://litman.dev) · [GitHub](https://github.com/wqx1999/litman)。

## 安装

在 DeepSeek Harness 里打开 **插件 → 添加插件**，填入

```
https://github.com/wqx1999/dsh-litman
```

点 **安装**，再点 **启用**。需要 DeepSeek Harness 0.2。

不用先装 litman，插件可以帮你装。

## 使用

- **打开文献库**：点左侧栏的 **litman**，列出你的 litman 文献库；点 **新会话**，就把这个库作为工作区打开，litman 的 skill 已经就绪。
- **还没装 litman**：在任意会话里说一句，比如「帮我装 litman」。AI 会先检查，问过你再装，用官网的一键安装命令装好，再把 litman 的 skill 接入 DeepSeek Harness。DeepSeek Harness 的沙箱会挡住下载，所以可能会请你允许一次。

## 它在你电脑上做什么

- 用 `lit vault list` 列出你的文献库。
- 打开文献库时添加一个工作区。
- 你同意后，运行 `get.litman.dev` 的官方安装命令（uv 和 litman 装在你的用户目录下），再运行 `lit install-skill --agent dsh`。
- 插件本身不联网，也不存任何数据。

## 许可

MIT。litman 本身是 [AGPL-3.0](https://github.com/wqx1999/litman/blob/main/LICENSE)。问题和 bug 请提到 [litman 的 issues](https://github.com/wqx1999/litman/issues)。
