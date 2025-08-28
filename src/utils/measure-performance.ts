
export enum LogLevel {
	VERBOSE,
	MINIMAL
}

export const measurePerformance = async <T>(fn: () => Promise<T> | T, level: LogLevel = LogLevel.MINIMAL) => {
	// Memory usage before
	const memoryBefore = process.memoryUsage();

	// CPU usage before (requires process.cpuUsage())
	const cpuBefore = process.cpuUsage();

	// High-resolution time before
	const hrTimeBefore = process.hrtime.bigint();

	try {
		// Execute the function
		const result = await fn();

		// High-resolution time after
		const hrTimeAfter = process.hrtime.bigint();

		// Memory usage after
		const memoryAfter = process.memoryUsage();

		// CPU usage after
		const cpuAfter = process.cpuUsage(cpuBefore);

		// Calculate execution time in milliseconds
		const executionTimeMs = Number(hrTimeAfter - hrTimeBefore) / 1_000_000;

		// Calculate CPU usage percentages
		// Total CPU time used during the function execution
		const totalCpuTimeMs = (cpuAfter.user + cpuAfter.system) / 1000;

		// CPU percentage = (CPU time used / wall clock time) * 100
		const cpuUsagePercent = {
			user: executionTimeMs > 0 ? (cpuAfter.user / 1000 / executionTimeMs) * 100 : 0,
			system: executionTimeMs > 0 ? (cpuAfter.system / 1000 / executionTimeMs) * 100 : 0,
			total: executionTimeMs > 0 ? (totalCpuTimeMs / executionTimeMs) * 100 : 0
		};


		switch (level) {
			case LogLevel.MINIMAL:
				console.log(`Execution Time: ${executionTimeMs.toFixed(3)} ms`);
				break;
			default:
				// Calculate memory differences

				// Log performance metrics
				console.log('=== Performance Metrics ===');
				console.log(`Execution Time: ${executionTimeMs.toFixed(3)} ms`);
				console.log('CPU Usage (Time):', {
					user: `${(cpuAfter.user / 1000).toFixed(3)} ms`,
					system: `${(cpuAfter.system / 1000).toFixed(3)} ms`,
					total: `${totalCpuTimeMs.toFixed(3)} ms`
				});
				console.log('CPU Usage (Percentage):', {
					user: `${cpuUsagePercent.user.toFixed(2)}%`,
					system: `${cpuUsagePercent.system.toFixed(2)}%`,
					total: `${cpuUsagePercent.total.toFixed(2)}%`
				});

//				const memoryDiff = {
//					rss: memoryAfter.rss - memoryBefore.rss,
//					heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
//					heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
//					external: memoryAfter.external - memoryBefore.external,
//					arrayBuffers: memoryAfter.arrayBuffers - memoryBefore.arrayBuffers
//				};


//		console.log('Memory Usage Changes:', {
//			rss: `${(memoryDiff.rss / 1024 / 1024).toFixed(3)} MB`,
//			heapUsed: `${(memoryDiff.heapUsed / 1024 / 1024).toFixed(3)} MB`,
//			heapTotal: `${(memoryDiff.heapTotal / 1024 / 1024).toFixed(3)} MB`,
//			external: `${(memoryDiff.external / 1024 / 1024).toFixed(3)} MB`,
//			arrayBuffers: `${(memoryDiff.arrayBuffers / 1024 / 1024).toFixed(3)} MB`
//		});
//		console.log('Current Memory Usage:', {
//			rss: `${(memoryAfter.rss / 1024 / 1024).toFixed(3)} MB`,
//			heapUsed: `${(memoryAfter.heapUsed / 1024 / 1024).toFixed(3)} MB`,
//			heapTotal: `${(memoryAfter.heapTotal / 1024 / 1024).toFixed(3)} MB`
//		});
//				console.log('Result:', { result });
//				console.log('================================================');
				break;
		}

		return result;
	} catch (error) {
		const hrTimeAfter = process.hrtime.bigint();
		const executionTimeMs = Number(hrTimeAfter - hrTimeBefore) / 1_000_000;
		console.error(`Function failed after ${executionTimeMs.toFixed(3)} ms:`, error);
		throw error;
	}
};