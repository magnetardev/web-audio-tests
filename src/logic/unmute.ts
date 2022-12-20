/** 
 * @author Spencer Evans evans.spencer@gmail.com
 * This file is heavily based off of https://github.com/swevans/unmute
 * It is cleaned up and optimized a bit.
 */

declare global {
	interface Document {
		webkitHidden: Document["hidden"];
		mozHidden: Document["hidden"];
		msHidden: Document["hidden"];
	}
}

const START_PLAYBACK_EVENTS: string[] = ["click", "contextmenu", "mousedown", "mouseup", "touchend", "keydown", "keyup"];
const EVENT_OPTIONS: AddEventListenerOptions = { capture: true, passive: true };

// get environment details
const userAgent = navigator.userAgent.toLowerCase();
const isIOS = (
	(userAgent.indexOf("iphone") >= 0 && userAgent.indexOf("like iphone") < 0) ||
	(userAgent.indexOf("ipad") >= 0 && userAgent.indexOf("like ipad") < 0) ||
	(userAgent.indexOf("ipod") >= 0 && userAgent.indexOf("like ipod") < 0) ||
	(userAgent.indexOf("mac os x") >= 0 && navigator.maxTouchPoints > 0)
);

let hiddenKey: keyof Document | undefined;
let visibilityEventName: string | undefined;
if (document.hidden !== undefined) {
	hiddenKey = "hidden";
	visibilityEventName = "visibilitychange";
} else if (document.webkitHidden !== undefined) {
	hiddenKey = "webkitHidden";
	visibilityEventName = "webkitvisibilitychange";
} else if (document.mozHidden !== undefined) {
	hiddenKey = "mozHidden";
	visibilityEventName = "mozvisibilitychange";
} else if (document.msHidden !== undefined) {
	hiddenKey = "msHidden";
	visibilityEventName = "msvisibilitychange";
}

// setup helper functions
function noop() {}

function consumePromise(promise: Promise<void> | undefined, catchHandler: () => void = noop) {
	if (!promise) {
		return;
	}
	promise.then(noop).catch(catchHandler);
}

export function generateSilence(): string {
	return "data:audio/mpeg;base64,//uQx"
		+ "A".repeat(23) + "WGluZwAAAA8AAAACAAACcQCA"
		+ "gICA".repeat(16) + "/".repeat(66) + "8AAABhTEFNRTMuMTAwA8MAAAAAAAAAABQgJAUHQQAB9AAAAnGMHkkI"
		+ "A".repeat(320) + "//sQxAADgnABGiAAQBCqgCRMAAgEAH"
		+ "/".repeat(15) + "7+n/9FTuQsQH//////2NG0jWUGlio5gLQTOtIoeR2WX////X4s9Atb/JRVCbBUpeRUq"
		+ "/".repeat(18) + "9RUi0f2jn/+xDECgPCjAEQAABN4AAANIAAAAQVTEFNRTMuMTAw"
		+ "V".repeat(97) + "Q==";
}

export class UnmuteHandler {
	context: AudioContext;
	allowPlayback: boolean = true;
	hasMediaPlaybackEventOccurred: boolean = false;
	silenceSource: string;
	channelElement?: HTMLAudioElement;

	// bound events
	private boundHandleVisibility: () => void;
	private boundHandleStartPlayback: () => void;
	private boundHandleFocusChange: (event: Event) => void;
	private boundHandleStateChange: (event: Event) => void;

	constructor(context: AudioContext, silenceSource: string) {
		this.context = context;
		this.silenceSource = silenceSource;
		this.boundHandleVisibility = this.updatePlaybackState.bind(this);
		this.boundHandleFocusChange = this.handleFocusChange.bind(this);
		this.boundHandleStateChange = this.handleStateChange.bind(this);
		this.boundHandleStartPlayback = this.handleStartPlayback.bind(this);

		if (visibilityEventName) {
			document.addEventListener(visibilityEventName, this.boundHandleVisibility, EVENT_OPTIONS);
		}

		if (isIOS) {
			window.addEventListener("focus", this.boundHandleFocusChange, EVENT_OPTIONS);
			window.addEventListener("blur", this.boundHandleFocusChange, EVENT_OPTIONS);
		}

		for (let i = 0, length = START_PLAYBACK_EVENTS.length; i < length; i++) {
			window.addEventListener(START_PLAYBACK_EVENTS[i], this.boundHandleStartPlayback, EVENT_OPTIONS);
		}

		context.addEventListener("statechange", this.boundHandleStateChange, EVENT_OPTIONS);
		if (!context.onstatechange) {
			context.onstatechange = this.boundHandleStateChange;
		}
	}

	private destroyChannelElement() {
		let channelElement = this.channelElement;
		if (!channelElement) {
			return;
		}
		channelElement.src = "about:blank";
		channelElement.load();
		channelElement = undefined;
	}

	private updateChannelState(isUserGesture: boolean) {
		let channelElement = this.channelElement;

		if (!isIOS) {
			return;
		}

		if (!this.allowPlayback) {
			return this.destroyChannelElement();
		}

		if (!isUserGesture) {
			return;
		}

		if (!channelElement) {
			channelElement = document.createElement("audio");
			this.channelElement = channelElement;

			channelElement.setAttribute("x-webkit-airplay", "deny");
			channelElement.controls = false;
			channelElement.disableRemotePlayback = true;
			channelElement.preload = "auto";
			channelElement.src = this.silenceSource;
			channelElement.loop = true;
			channelElement.load();
		}

		if (channelElement.paused) {
			consumePromise(channelElement.play(), this.destroyChannelElement.bind(this));
		}
	}

	private updateContextState() {
		let context = this.context;
		let state = context.state;
		if (this.allowPlayback && state !== "running" && state !== "closed" && this.hasMediaPlaybackEventOccurred) {
			consumePromise(context.resume());
		} else if (state === "running") {
			consumePromise(context.suspend());
		}
	}

	private handleStateChange(event: Event & { unmuteHandled?: boolean }) {
		if (event && event.unmuteHandled) {
			return 
		}
		event.unmuteHandled = true;
		this.updateContextState();
	}

	private updatePlaybackState() {
		let shouldAllowPlayback: boolean = !(hiddenKey && document[hiddenKey]) && (!isIOS || document.hasFocus());

		if (shouldAllowPlayback !== this.allowPlayback) {
			this.allowPlayback = shouldAllowPlayback;
			this.updateChannelState(false);
			this.updateContextState();
		}
	}

	private handleStartPlayback() {
		this.hasMediaPlaybackEventOccurred = true;
		this.updateChannelState(true);
		this.updateContextState();
	}

	private handleFocusChange(event: Event) {
		if (event && event.target !== window) {
			return;
		}
		this.updatePlaybackState();
	}

	dispose() {
		let context = this.context;
		let stateChangeHandler = this.boundHandleStateChange;

		this.destroyChannelElement();

		if (visibilityEventName) {
			document.removeEventListener(visibilityEventName, this.boundHandleVisibility);
		}

		if (isIOS) {
			let focusChangeHandler = this.boundHandleFocusChange;
			window.removeEventListener("focus", focusChangeHandler);
			window.removeEventListener("blur", focusChangeHandler);
		}

		for (let i = 0, length = START_PLAYBACK_EVENTS.length; i < length; i++) {
			window.removeEventListener(START_PLAYBACK_EVENTS[i], this.boundHandleStartPlayback);
		}

		context.removeEventListener("statechange", stateChangeHandler);
		if (context.onstatechange === stateChangeHandler) {
			context.onstatechange = null;
		}
	}
}

