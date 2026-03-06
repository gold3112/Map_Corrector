import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import meta from '../src/userscript.meta.js';

const args = process.argv.slice(2);
const watch = args.includes('--watch');

const ctx = await esbuild.context({
  entryPoints: ['src/index.js'],
  bundle: true,
  outfile: 'dist/map-corrector.user.js',
  format: 'iife',
  banner: {
    js: meta,
  },
});

if (watch) {
  await ctx.watch();
  console.log('Watching for changes...');
} else {
  await ctx.rebuild();
  await ctx.dispose();
  console.log('Build finished.');
}
