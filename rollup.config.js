import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';

export default {
  input: './src/index.ts',
  output: {
    file: './dist/index.js',
    format: 'umd',
    name: 'micromodal'
  },
  plugins: [
    typescript({
      cacheRoot: 'tmp/rpt2_cache'
    }),
    terser()
  ]
}
