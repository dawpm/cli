# @dawpm/cli

The `dawpm` command. Install free and open-source plugins for FL Studio from the terminal — like `npm`, but for VSTs.

```sh
npm install -g @dawpm/cli
```

## Quick start

```sh
dawpm init my-track --daw fl-studio
cd my-track
dawpm install @dsk/overture
dawpm list
```

Tell `dawpm` where FL Studio lives once, in `~/.dawpmrc`:

```ini
[daw.fl-studio]
exe = C:\Program Files\Image-Line\FL Studio 21\FL64.exe
```

By default, the CLI talks to [dawpm-registry.yanncotineau.dev](https://dawpm-registry.yanncotineau.dev). Override it with `registry = https://...` in `.dawpmrc` or `--registry` on the command line.

## Commands

| Command | What it does |
| --- | --- |
| `init <name> --daw <id>` | scaffold a new project |
| `install [@ns/name]` | install everything in `dawpm.yaml`, or add one plugin |
| `uninstall @ns/name` | remove a plugin and its files |
| `search <query>` | search the registry |
| `info @ns/name` | show details about a plugin |
| `list` | list declared dependencies |
| `scan` | discover plugins already installed for the DAW |
| `config` | print the resolved configuration |

## Configuration

Config is resolved npm-style (later wins): defaults → `/etc/dawpmrc` → `~/.dawpmrc` → `./.dawpmrc` (walked up) → `DAWPM_*` env vars → CLI flags.

## License

MIT
