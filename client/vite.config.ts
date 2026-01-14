import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import fs from "fs";
import path from "path";

// Check if mkcert certificates exist for trusted local HTTPS
const certPath = path.resolve(__dirname, "localhost.pem");
const keyPath = path.resolve(__dirname, "localhost-key.pem");
const hasMkcertCerts = fs.existsSync(certPath) && fs.existsSync(keyPath);

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		// Only use HTTPS if we have trusted mkcert certificates
		// Otherwise, use HTTP (self-signed certs don't work with Google Pay/Apple Pay)
		...(hasMkcertCerts ? [basicSsl()] : []),
	],
	server: {
		port: 5173,
		strictPort: true,
		host: true, // allow external hosts
		allowedHosts: true, // <--- this allows your ngrok domain
		proxy: {
			"/api": {
				target: "http://localhost:5000",
				changeOrigin: true,
				secure: false,
				ws: true,
			},
			"/auth": {
				target: "http://localhost:5000",
				changeOrigin: true,
				secure: false,
			},
		},
	},

});
