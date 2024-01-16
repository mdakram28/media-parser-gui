import { BitRange, ByteRange } from "../../bitstream/range";
import { Bitstream, MAX_ITER, ParserCtx, syntax } from "../../bitstream/parser";
import { BitBuffer } from "../../bitstream/buffer";
import { assert, assertNums, forEachChild, getChildValue } from "../../bitstream/util";
import { MediaTrack } from "../../types/media.types";
import { EMPTY_TREE } from "../../bitstream/bitstream-explorer";

// https://wiki.multimedia.cx/index.php/Duck_IVF


export const isIVFFormat = (buffer: Uint8Array) => {
    const bs = new Bitstream(new BitBuffer(buffer));
    const signature = bs.fixedWidthString("signature", 4);
    return (signature.toLocaleUpperCase() === "DKIF");
}

export const extracIvfTracks = (buffer: Uint8Array, codecs?: string[]): Record<string, MediaTrack> => {
    const root = DuckIVF(new BitBuffer(buffer));
    const trackCodec = getChildValue(root, "codec");
    assert(trackCodec !== undefined, "Codec not found in ivf");
    const codecName = trackCodec!.toString().toLowerCase();

    if (codecs && codecs.indexOf(codecName) === -1) {
        return {};
    }

    const track: MediaTrack = {
        samplesType: codecName,
        chunkRanges: [],
        sampleRanges: []
    };

    forEachChild(root, "frame", (frame, i) => {
        const frameRange = new ByteRange(
            Math.floor(frame.start/8) + 12, 
            Math.floor((frame.start+frame.size)/8)
        );
        track.sampleRanges.push(frameRange);
        track.chunkRanges.push(frameRange);
    });

    return {
        [trackCodec!.toString()]: track
    };
}

export function DuckIVF (buffer: BitBuffer) {
    const bs = new Bitstream(buffer);
    /*
    Multi-byte numbers of little-endian. An IVF file begins with a 32-byte header:

    bytes 0-3    signature: 'DKIF'
    bytes 4-5    version (should be 0)
    bytes 6-7    length of header in bytes
    bytes 8-11   codec FourCC (e.g., 'VP80')
    bytes 12-13  width in pixels
    bytes 14-15  height in pixels
    bytes 16-19  time base denominator
    bytes 20-23  time base numerator
    bytes 24-27  number of frames in file
    bytes 28-31  unused
    The header is followed by a series of frames. Each frame consists of a 12-byte header followed by data:

    bytes 0-3    size of frame in bytes (not including the 12-byte header)
    bytes 4-11   64-bit presentation timestamp
    bytes 12..   frame data
    */

    // Header
    bs.fixedWidthString("signature", 4);
    bs.le("version", 2);
    bs.le("length", 2);
    bs.fixedWidthString("codec", 4);
    bs.le("width", 2);
    bs.le("height", 2);
    bs.le("time", 4);
    bs.le("time", 4);
    bs.le("number", 4);
    bs.le("unused", 4);

    const frame = syntax("frame", (bs) => {
        const size = bs.le("size", 4);
        bs.le("pts_timestamp", 8);
        const frame_end = bs.getPos() + size*8;

        bs.gotoPos(frame_end);
    });

    let i = 0;
    while (bs.getPos() < bs.getEndPos()) {
        if (i++ > MAX_ITER) break;
        frame(bs);
    }

    return bs.getCurrent();
};

