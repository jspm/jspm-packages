import jspmRollup from '@jspm/plugin-rollup';

const baseUrl = new URL('./', import.meta.url);

export default [{
    // Important to use "./" here to indicate a local path
    // and not a package. Resolved to baseUrl below.
    input: ['./server.js'],
    plugins: [
        jspmRollup({
            baseUrl,

            // Generator options as per @jspm/generator
            defaultProvider: 'jspm',
            env: ["deno", "module", "production"],

            // map of externals to aliased or true
            //externals: true
        })
    ],
    output: {
        dir: 'dist/deno'
    }
}, {
    // Important to use "./" here to indicate a local path
    // and not a package. Resolved to baseUrl below.
    input: ['./lib/dom-main.js'],
    plugins: [
        jspmRollup({
            baseUrl,

            // Generator options as per @jspm/generator
            defaultProvider: 'jspm',
            env: ["browser", "module", "production"],

            // map of externals to aliased or true
            //externals: true
        })
    ],
    output: {
        dir: 'dist/browser'
    }
}]
