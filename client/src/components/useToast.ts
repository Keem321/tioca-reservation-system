import { createContext, useContext } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
	id: number;
	type: ToastType;
	message: string;
	duration?: number; // ms
}

export interface ToastContextValue {
	show: (message: string, type?: ToastType, duration?: number) => void;
	success: (message: string, duration?: number) => void;
	error: (message: string, duration?: number) => void;
	info: (message: string, duration?: number) => void;
	warning: (message: string, duration?: number) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
	const ctx = useContext(ToastContext);
	if (!ctx) throw new Error("useToast must be used within ToastProvider");
	return ctx;
}
