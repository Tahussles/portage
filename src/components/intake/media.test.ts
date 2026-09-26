import { describe, expect, it } from "vitest";
import { MIME_CANDIDATES, encodeWav, nextLevel, pickMimeType, rms } from "./media";

describe("recording format", () => {
  it("prefers webm/opus (Chrome, Firefox, Edge)", () => {
    expect(pickMimeType(() => true)).toBe("audio/webm;codecs=opus");
  });

  it("uses audio/mp4 on iOS Safari", () => {
    const safari = (type: string) => type === "audio/mp4";
    expect(pickMimeType(safari)).toBe("audio/mp4");
  });

  it("returns null when nothing is supported or MediaRecorder is missing, so WAV capture is used", () => {
    expect(pickMimeType(() => false)).toBeNull();
    expect(pickMimeType(undefined)).toBeNull();
  });

  it("tries the candidates in order", () => {
    const asked: string[] = [];
    pickMimeType((t) => {
      asked.push(t);
      return false;
    });
    expect(asked).toEqual([...MIME_CANDIDATES]);
  });
});

describe("WAV fallback", () => {
  it("writes a 16-bit mono PCM header and clamps samples", async () => {
    const blob = encodeWav([new Float32Array([0, 1, -1]), new Float32Array([2])], 16000);
    expect(blob.type).toBe("audio/wav");
    const view = new DataView(await blob.arrayBuffer());
    const text = (o: number) => String.fromCharCode(...[0, 1, 2, 3].map((i) => view.getUint8(o + i)));
    expect(text(0)).toBe("RIFF");
    expect(text(8)).toBe("WAVE");
    expect(view.getUint16(22, true)).toBe(1); // mono
    expect(view.getUint32(24, true)).toBe(16000);
    expect(view.getUint32(40, true)).toBe(8); // 4 samples * 2 bytes
    expect(view.getInt16(46, true)).toBe(0x7fff);
    expect(view.getInt16(48, true)).toBe(-0x8000);
    expect(view.getInt16(50, true)).toBe(0x7fff); // 2 clamped to 1
  });
});

describe("orb level", () => {
  it("measures RMS and eases toward it with a 0.2 lerp", () => {
    expect(rms(new Float32Array([0.5, -0.5]))).toBeCloseTo(0.5);
    expect(rms(new Float32Array())).toBe(0);
    expect(nextLevel(0, 0.25)).toBeCloseTo(0.2);
    expect(nextLevel(0.5, 1)).toBeCloseTo(0.6);
  });
});
