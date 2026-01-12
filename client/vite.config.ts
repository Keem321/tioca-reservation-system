import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	server: {
		port: 5173,
		strictPort: true, // Fail if port is in use instead of trying another port
		proxy: {
			"/api": {
				target: "http://localhost:5000",
				changeOrigin: true,
				secure: false,
				ws: true, // Enable WebSocket proxying
			},
			"/auth": {
				target: "http://localhost:5000",
				changeOrigin: true,
				secure: false,
			},
		},
	},
});
