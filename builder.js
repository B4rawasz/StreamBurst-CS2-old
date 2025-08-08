import * as asar from "@electron/asar";
import fs from "fs";
import path from "path";
import config from "./package.json" with { type: "json" };

if (fs.existsSync(path.join(".", "build", `${config.name}.asar`))) {
	fs.rmSync(path.join(".", "build", `${config.name}.asar`), { recursive: true, force: true });
}

asar.createPackage(".", path.join(".", "build", `${config.name}.asar`));
