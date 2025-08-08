import EventEmitter from "events";
import path from "path";
import http from "http";
import fs from "fs";
import { createHttpTerminator } from "http-terminator";
import type { Settings } from "./types.js";
import type { GameState, GameStateMenu } from "csgo-gsi-types";
import MenuModule from "./modules/Menu.js";

class CS2Module extends EventEmitter {
	#enabled: boolean;
	#settingsPath: string = path.join("..", "settings_template.json");
	#settings: Settings;
	#server: http.Server | null;
	#menuModule: MenuModule;
	#lastState: "spectating" | "playing" | "menu" | null;

	constructor() {
		super();
		this.#enabled = false;
		this.#settings = null;
		this.#server = null;
		this.#menuModule = new MenuModule(this.event.bind(this));
		this.#lastState = null;
	}

	setSettingsPath(settingsPath: string): void {
		this.#settingsPath = settingsPath;
	}

	enable(): void {
		if (this.#enabled) {
			this.emit("error", "CS2Module is already enabled.");
			return;
		}

		this.#enabled = true;

		this.#settings = JSON.parse(fs.readFileSync(this.#settingsPath, "utf8")).settings as Settings;

		this.#server = http.createServer((req, res) => {
			if (req.method == "POST") {
				this.#handlePOST(req, res);
			} else {
				res.writeHead(404, { "Content-Type": "text/plain" });
				res.end("Not Found");
			}
		});

		this.#server.listen(
			(this.#settings?.port?.value as number) || 3000,
			(this.#settings?.host?.value as string) || "localhost"
		);

		this.emit("debug", "Enabling");
		this.emit("debug", "Settings path: " + this.#settingsPath);
		this.emit("debug", "Path to CS2: " + this.#settings?.CS2_path?.value);
	}

	disable(): void {
		if (!this.#enabled) {
			this.emit("error", "CS2Module is not enabled.");
			return;
		}

		this.emit("debug", "Disabling");

		this.#enabled = false;

		if (this.#server === null) return;

		const terminator = createHttpTerminator({ server: this.#server });
		terminator.terminate();
	}

	event(type: "debug" | "error" | "event", id: string, params: object): void {
		if (!this.#enabled) {
			this.emit("error", "Module is not enabled.");
			return;
		}

		let eventData = {
			type: type,
			emitter: "streamburst-cs2",
			eventId: id,
			params: params,
		};

		if (type === "debug") {
			this.emit("debug", JSON.stringify(eventData, null, 2));
		} else if (type === "error") {
			this.emit("error", JSON.stringify(eventData, null, 2));
		} else {
			this.emit("event", JSON.stringify(eventData, null, 2));
		}
	}

	#handlePOST(req: http.IncomingMessage, res: http.ServerResponse): void {
		let body = "";
		req.on("data", (chunk) => {
			body += chunk;
		});

		req.on("end", () => {
			res.end("ok");
			this.#handleEvent(body);
		});
	}

	#handleEvent(json: string): void {
		const gameState = JSON.parse(json) as GameState;

		if (gameState.map) {
			if (gameState.allplayers) {
				if (this.#lastState !== "spectating") {
					this.#lastState = "spectating";
					this.event("event", "game_state_change", { state: "spectating" });
				}

				//TODO
			} else if (gameState.player?.activity === "playing") {
				if (this.#lastState !== "playing") {
					this.#lastState = "playing";
					this.event("event", "game_state_change", { state: "playing" });
				}

				//TODO
			}
		} else {
			if (this.#lastState !== "menu") {
				this.#lastState = "menu";
				this.event("event", "game_state_change", { state: "menu" });
			}

			this.#menuModule.parseState(gameState as GameStateMenu);
		}
	}
}

export default new CS2Module();
