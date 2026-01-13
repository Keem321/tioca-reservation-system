import { useCallback, useMemo, useState } from "react";
import {
	ToastContext,
	type Toast,
	type ToastContextValue,
	type ToastType,
} from "./useToast";

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
