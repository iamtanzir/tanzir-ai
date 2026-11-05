import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';

export default {
  input: 'app.js',
  output: {
    file: 'dist/app.bundle.js',
    format: 'iife',
    name: 'MrRobotApp',
    sourcemap: false,
  },
  plugins: [
    nodeResolve(),
    commonjs(),
    copy({
      targets: [
        { src: 'index.html', dest: 'dist', transform: (content) => content.toString().replaceAll('src="dist/app.bundle.js"', 'src="app.bundle.js"') },
        { src: 'styles.css', dest: 'dist' },
        { src: 'db.js', dest: 'dist' },
        { src: 'version.json', dest: 'dist' },
        { src: 'manifest.json', dest: 'dist' },
        { src: 'sw.js', dest: 'dist', transform: (content) => content.toString().replace('"./app.js"', '"./app.bundle.js", "./db.js"') },
        { src: 'icon-192.png', dest: 'dist' },
        { src: 'icon-512.png', dest: 'dist' },
      ],
      hook: 'writeBundle',
    }),
  ],
};
