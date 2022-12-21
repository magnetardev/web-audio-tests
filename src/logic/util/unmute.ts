export function generateSilence(): string {
	return "data:audio/mpeg;base64,//uQx"
		+ "A".repeat(23) + "WGluZwAAAA8AAAACAAACcQCA"
		+ "gICA".repeat(16) + "/".repeat(66) + "8AAABhTEFNRTMuMTAwA8MAAAAAAAAAABQgJAUHQQAB9AAAAnGMHkkI"
		+ "A".repeat(320) + "//sQxAADgnABGiAAQBCqgCRMAAgEAH"
		+ "/".repeat(15) + "7+n/9FTuQsQH//////2NG0jWUGlio5gLQTOtIoeR2WX////X4s9Atb/JRVCbBUpeRUq"
		+ "/".repeat(18) + "9RUi0f2jn/+xDECgPCjAEQAABN4AAANIAAAAQVTEFNRTMuMTAw"
		+ "V".repeat(97) + "Q==";
}

export function unmute() {
	const audioElement = document.createElement("audio");
	audioElement.setAttribute("x-webkit-airplay", "deny");
	audioElement.controls = false;
	audioElement.disableRemotePlayback = true;
	audioElement.preload = "auto";
	audioElement.loop = true;
	audioElement.src = generateSilence();
	audioElement.load();
	audioElement.play();
}
