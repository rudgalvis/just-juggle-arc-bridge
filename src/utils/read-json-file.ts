import fs from 'fs'

export const readJsonFile = async (path: string): Promise<object> => {
	const contents = await fs.readFileSync(path, 'utf-8');

	try {
		return JSON.parse(contents);
	} catch (e) {
		console.log(e)
		return undefined
	}
}