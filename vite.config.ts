import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: './src/components/Remote.tsx',
      name: 'WebRemote',
      formats: ['es', 'umd'],
      fileName: 'web-remote',
    },
    // rollupOptions: {
    //   // Make sure to externalize deps that shouldn't be bundled
    //   // into your library
    //   external: ['react', 'react-dom'],
    //   output: {
    //     // Provide global variables to use in the UMD build
    //     // for externalized deps
    //     globals: {
    //       react: 'React',
    //       'react-dom': 'ReactDOM',
    //     },
    //   },
    // },
  }
})
