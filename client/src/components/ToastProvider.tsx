import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
	id: number;
	type: ToastType;
	message: string;
	duration?: number; // ms
}

interface ToastContextValue {
	show: (message: string, type?: ToastType, duration?: number) => void;
	success: (message: string, duration?: number) => void;
	error: (message: string, duration?: number) => void;
	info: (message: string, duration?: number) => void;
	warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
	const ctx = useContext(ToastContext);
	if (!ctx) throw new Error("useToast must be used within ToastProvider");
	return ctx;
}

export default function ToastProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const remove = useCallback((id: number) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

	const show = useCallback(
		(message: string, type: ToastType = "info", duration: number = 4000) => {
			const id = Date.now() + Math.floor(Math.random() * 1000);
			const toast: Toast = { id, type, message, duration };
			setToasts((prev) => [...prev, toast]);
			window.setTimeout(() => remove(id), duration);
		},
		[remove]
	);

	const value = useMemo<ToastContextValue>(
		() => ({
			show,
			success: (m, d) => show(m, "success", d),
			error: (m, d) => show(m, "error", d),
			info: (m, d) => show(m, "info", d),
			warning: (m, d) => show(m, "warning", d),
		}),
		[show]
	);

	return (
		<ToastContext.Provider value={value}>
			{children}
			<div className="toast-container">
				{toasts.map((t) => (
					<div key={t.id} className={`toast toast--${t.type}`}>
						{t.message}
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
}
