import { cpSync, existsSync, readFileSync, readdirSync, copyFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("./", import.meta.url));
if (!process.env.APPDATA) throw new Error("This deployment helper requires Windows APPDATA.");
const installed = join(process.env.APPDATA, "npm", "node_modules", "pi-web-ui");
const version = JSON.parse(readFileSync(join(installed, "package.json"), "utf8")).version;
const sourceVersion = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
if (version !== sourceVersion) {
	throw new Error(
		`Installed version ${version} differs from checkout version ${sourceVersion}. Rebase and rebuild first.`,
	);
}
try {
	execFileSync("git", ["merge-base", "--is-ancestor", `v${version}`, "HEAD"], { cwd: root, stdio: "ignore" });
} catch {
	throw new Error(`Checkout must be based on installed release tag v${version}, not arbitrary upstream main.`);
}
const target = join(installed, "web", "dist");
const source = join(root, "web", "dist");
if (!existsSync(join(source, "index.html"))) throw new Error("Run npm run build:web before deploying.");
const backup = join(root, "installed-web-dist-backup", version);
// The first patch used a flat backup directory; preserve that legacy backup too.
if (!existsSync(backup)) cpSync(target, backup, { recursive: true });
// Preserve old hashed assets and separately built vendor files for open tabs.
for (const name of readdirSync(source)) {
	if (name !== "index.html") cpSync(join(source, name), join(target, name), { recursive: true });
}
// Switch the entry point only after all new assets are available.
copyFileSync(join(source, "index.html"), join(target, "index.html"));
console.log(`Frontend deployed to ${target}`);
console.log(`Pre-deployment frontend backup: ${backup}`);
