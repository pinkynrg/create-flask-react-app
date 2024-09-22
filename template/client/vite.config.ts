import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default ({mode}: {mode: string}) => {
  const envDirectory = path.dirname(process.cwd());
  const env = loadEnv(mode, envDirectory, '')
  return defineConfig({
    envDir: envDirectory,
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: `http://${env.SERVER_HOST}:${env.SERVER_PORT}`,
          changeOrigin: true,
        },
      }
    }
  })
}
