import { test } from "vitest";
import { getSpaceViaOsa } from "./get-space-via-osa";

test("get space via apple script", async () => {
	const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

	for (let i = 0; i < 7; i++) {
		console.log(`Run ${i + 1}:`);
		const result = await getSpaceViaOsa();
		console.log(result);

		// Wait 1 second before next iteration (except after the last one)
		if (i < 6) {
			await delay(1000);
		}
	}
});
