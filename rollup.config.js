import scss from 'rollup-plugin-scss';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
// import resolve from '@rollup/plugin-node-resolve';
// import copy from 'rollup-plugin-copy'

// `npm run build` -> `production` is true
// `npm run dev` -> `production` is false
const production = !process.env.ROLLUP_WATCH;

export default {
    input: 'main.js',
    output: {
        file: 'script.js',
        format: 'iife', // immediately-invoked function expression — suitable for <script> tags
        sourcemap: true
    },
    plugins: [
        scss({
            output: 'main.css',
            watch: 'main.scss'
        }),
        // copy({
        //     targets: [
        //         { src: 'index.html', dest: 'dist' },
        //         { src: 'script.js', dest: 'dist' },
        //         { src: 'main.css', dest: 'dist' },
        //     ]
        // }),
        !production &&
        (serve({
            contentBase: '.',
            open: false,
            host: 'localhost',
            port: 3000,
        }), livereload({
            watch: 'src',
        }))
    ]
};