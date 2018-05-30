import typescript from 'rollup-plugin-typescript2';

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
    })
  ]
}
