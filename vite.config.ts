import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    define: {
        global: 'globalThis',  // ← thêm dòng này
    },

    server: {
        port: 5222,
        allowedHosts: [
            'localhost',
            '127.0.0.1',
            'regretful-folic-omen.ngrok-free.dev'
        ]
    }
});
