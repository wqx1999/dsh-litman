# litman for DeepSeek Harness

[中文](./README.zh.md)

[litman](https://litman.dev) keeps the papers you read on your own computer, in
a library your AI assistant files and searches for you. This plugin connects
litman to DeepSeek Harness. Everything else is litman itself:
[litman.dev](https://litman.dev) · [GitHub](https://github.com/wqx1999/litman).

## Install

In DeepSeek Harness, open **Plugins → Add plugin**, enter

```
https://github.com/wqx1999/dsh-litman
```

then **Install** and **Enable**. Requires DeepSeek Harness 0.2.

You do not need litman installed first: the plugin can install it for you.

## Use

- **Open a library**: click **litman** in the left sidebar. It lists your
  litman libraries; **New session** opens one as a workspace, with litman's
  skills ready.
- **No litman yet**: ask in any session, for example "set up litman". The
  agent checks for litman, asks before installing, runs the official
  installer, and connects litman's skills to DeepSeek Harness. DeepSeek
  Harness may ask you to allow the installer once, because its sandbox blocks
  the download.

## What it does on your machine

- Lists your libraries with `lit vault list`.
- Adds a workspace when you open a library.
- With your yes, runs the official installer from `get.litman.dev` (uv and
  litman go under your home folder), then `lit install-skill --agent dsh`.
- The plugin itself sends nothing over the network and stores no data.

## License

MIT. litman itself is [AGPL-3.0](https://github.com/wqx1999/litman/blob/main/LICENSE).
Questions and bugs: [litman issues](https://github.com/wqx1999/litman/issues).
