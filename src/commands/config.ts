import { resolveConfig, type CliGlobals } from '../util/config.js';
import { out, emitJson } from '../util/output.js';

export async function configCommand(globals: CliGlobals): Promise<void> {
  const cfg = await resolveConfig(globals);
  emitJson(cfg, () => {
    out.info(JSON.stringify(cfg, null, 2));
  });
}
