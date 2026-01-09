import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store";
import "./globals.css";
import "./index.css";
import App from "./App.tsx";
import ToastProvider from "./components/ToastProvider";
import "./components/Toast.css";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<Provider store={store}>
			<ToastProvider>
				<App />
			</ToastProvider>
		</Provider>
	</StrictMode>
);
