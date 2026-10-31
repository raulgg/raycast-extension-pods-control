import { readFileSync } from "node:fs";

export default JSON.parse(readFileSync(new URL("./extension/.prettierrc", import.meta.url), "utf8"));
