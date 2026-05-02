# @dawpm/cli

Command-line interface for [dawpm](https://github.com/dawpm), a package manager
for DAW plugins, presets, and projects. Think `npm`, but for FL Studio (and
eventually Reaper, Ableton, Bitwig, ...).

## Install

```sh
npm install -g @dawpm/cli
```

## Quick start

```sh
# Create a new FL Studio project
dawpm init my-track --daw fl-studio
cd my-track

# Add dependencies (when published to a registry)
dawpm install image-line/sytrus

# Render
dawpm build -o out/track.wav
```

## Commands

| Command | Description |
| --- | --- |
| `dawpm init <name> --daw <id>` | Create a new project with `dawpm.yaml` |
| `dawpm install` (`i`) | Install all dependencies, write `dawpm.lock.yaml` |
| `dawpm uninstall <slug>` (`rm`) | Remove a dependency from `dawpm.yaml` |
| `dawpm scan` | Discover plugins already installed for the current DAW |
| `dawpm list` (`ls`) | Show declared + locked deps |
| `dawpm search <query>` | Search the registry |
| `dawpm get <type> <slug>` | Fetch a package manifest |
| `dawpm build` | Render the project via the DAW |
| `dawpm config` | Print resolved config |

## Global flags

- `--json` machine-readable JSON output
- `--log <level>` `silent | error | warn | info | debug`
- `--registry <url>` override registry URL
- `--cwd <path>` run as if from this directory

## Configuration

Resolved with npm-style precedence (later wins):

1. built-in defaults
2. `/etc/dawpmrc`
3. `~/.dawpmrc`
4. `./.dawpmrc` walked up from cwd
5. `DAWPM_*` env vars (use `__` for nesting, e.g. `DAWPM_DAW__FL-STUDIO__EXE`)
6. CLI flags

Example `.dawpmrc`:

```ini
registry = https://registry.dawpm.dev
log = info

[daw.fl-studio]
exe = C:\Program Files\Image-Line\FL Studio 21\FL64.exe
```

## License

MIT
