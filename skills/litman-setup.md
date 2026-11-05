# litman setup

litman (https://litman.dev) is a local literature manager driven by the `lit`
command. This skill only gets litman installed and connected to DeepSeek
Harness. After that, litman's own skills (`lit-library`, `lit-reading`) do
the real work.

## 1. Check

Run `lit --version`.

- It works and the `lit-library` skill is available: stop here and follow
  `lit-library` / `lit-reading`.
- It works but there is no `lit-library` skill: go to step 4.
- `lit` is not found: go to step 2.

## 2. Ask

Ask the user, in their language, whether to install litman. One or two
sentences: litman is a local literature manager, and installing it runs the
official installer from get.litman.dev. Do not install without a clear yes.

## 3. Install

Run the official one-line installer for this system:

- macOS / Linux: `curl -LsSf https://get.litman.dev/install.sh | sh`
- Windows (PowerShell): `powershell -ExecutionPolicy ByPass -c "irm https://get.litman.dev/install.ps1 | iex"`

DeepSeek Harness fixed its PATH when it started, so `lit` may still be "not
found" right after installing. Then call it by its full path:
`~/.local/bin/lit`, on Windows `%USERPROFILE%\.local\bin\lit.exe` (if the
installer printed another directory, use that one).

## 4. Connect to DeepSeek Harness

Run `lit install-skill --agent dsh` (with the full path if needed). It copies
litman's skills to `~/.agents/skills`; they are available from the next turn.
If it reports out-of-date copies, run it again with `--force`.

## 5. Vault

Run `lit vault list`. If no vault is registered, ask the user where to keep
their library, then run `lit init "<parent folder>"` (it creates
`<parent folder>/literature_vault` and makes it the active vault).

Tell the user litman is ready. Do not list or explain `lit` commands from
memory: litman's own skills cover them, and `lit --help` lists them. From now
on use `lit-library` / `lit-reading`.
The litman entry in the left sidebar opens a vault in a new session.
