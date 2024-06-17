import 'dotenv/config.js';
import * as repl from 'repl';
import defineSymbols from 'repl/symbols.ts';
import {
  initSequelize,
  shutdownSequelize,
} from 'server/src/entity/sequelize.ts';

async function main() {
  await initSequelize('script');

  const myrepl = repl.start();
  myrepl.on('exit', () => {
    void (async () => {
      await shutdownSequelize();
      process.exit();
    })();
  });

  await defineSymbols((name, def) => (myrepl.context[name] = def));
}

main().catch(console.error);
