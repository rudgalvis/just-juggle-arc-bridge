export const onProcessClose = (
	callback: (signal: string, error?: any, promise?: any) => void,
) => {
	process.on("SIGTERM", () => callback("SIGTERM"));
	process.on("SIGINT", () => callback("SIGINT"));
	process.on("SIGQUIT", () => callback("SIGQUIT"));
	process.on("uncaughtException", (error) =>
		callback("uncaughtException", error),
	);
	process.on("unhandledRejection", (reason, promise) =>
		callback("unhandledRejection", reason, promise),
	);
};