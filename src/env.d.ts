/// <reference types="astro/client" />

declare module "*?worker&url" {
	const url: string;
	export default url;
}

declare global {
	abstract class AudioWorkletProcessor {
		port: MessagePort;
		process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean;
	}

	function registerProcessor(name: string, processor: { new(options: AudioWorkletNodeOptions): AudioWorkletProcessor }): void;
}

export {};
