import type { GameStateMenu } from "csgo-gsi-types";
import type EventEmitter from "events";

class MenuModule {
	#emit: (type: "debug" | "error" | "event", id: string, params: object) => void;

	#prevGameState: GameStateMenu | null;

	constructor(emit: (type: "debug" | "error" | "event", id: string, params: object) => void) {
		this.#emit = emit;
		this.#prevGameState = null;
	}

	parseState(state: GameStateMenu): void {
		if (this.#prevGameState) {
			if (this.#prevGameState.player?.name !== state.player?.name)
				this.#emit("event", "menu", { name: state.player?.name || "Unknown" });
		} else {
			this.#emit("event", "menu", { name: state.player?.name || "Unknown" });
		}

		this.#prevGameState = state;
	}
}

export default MenuModule;
