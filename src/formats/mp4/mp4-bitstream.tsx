import { BitRange, ByteRange } from "../../bitstream/range";
import { Bitstream, MAX_ITER, ParserCtx, syntax } from "../../bitstream/parser";
import { Box, Container } from "./box-util";
import { Container_mdia } from "./boxes/box_mdia";
import { BitBuffer } from "../../bitstream/buffer";
import { assert, assertNums, forEachChild, getChildValue } from "../../bitstream/util";
import { MediaTrack } from "../../types/media.types";

// https://b.goeswhere.com/ISO_IEC_14496-12_2015.pdf

export class BoxCtx {
    size: number = 0
    largesize: number = 0
    type: number = 0
    version: number = 0
    flags = 0

    // ftyp
    major_brand: number = 0
    minor_version: number = 0
    compatible_brands: number[] = []

    // mvhd
    rate = 0x00010000
    volume = 0x0100
    matrix = [0x00010000, 0, 0, 0, 0x00010000, 0, 0, 0, 0x40000000]
    pre_defined = []

    // mdhd
}

const RootBoxMap = {
    "ftyp": Box_ftyp,
    "mdat": () => { },
    "moov": Container({
        "mvhd": Box_mvhd,
        "trak": Container({
            'tkhd': Box_tkhd,
            'edts': Container({}),
            "mdia": Container_mdia,
        }),
        "mvex": Container({})
    }),
    "moof": Container({
        "traf": Container({})
    }),
    "mfra": Container({}),
    "skip": Container({
        "udta": Container({
            "strk": Container({})
        })
    }),
    "meta": Container({
        "dinf": Container({}),
        "ipro": Container({
            "sinf": Container({}),
        }),
        "fiin": Container({
            "paen": Container({}),
        })
    }),
    "meco": Container({
        "mere": Container({}),
    })
}
const ROOT_BOX = Box(RootBoxMap);

export const isMP4Format = (buffer: Uint8Array) => {
    const bs = new Bitstream(new BitBuffer(buffer));
    try {
        bs.gotoPos(4 * 8);
        const boxTypeName = bs.fixedWidthString("type", 4);
        return (RootBoxMap as any)[boxTypeName] !== undefined;
    } catch (e) {
        return false;
    }
}

export const extractMp4Tracks = (buffer: Uint8Array): Record<string, MediaTrack> => {
    const bs = new Bitstream(new BitBuffer(buffer));
    const rootBox = Box({
        "moov": RootBoxMap.moov
    });
    for (let i = 0; bs.getPos() < bs.getEndPos() && i < MAX_ITER; i++) {
        rootBox(bs, bs.getEndPos());
    }

    const tracks: Record<string, MediaTrack> = {};
    forEachChild(bs.getCurrent(), "box_moov", (node) => {
        forEachChild(node, "box_trak", (node, trackId) => {
            forEachChild(node, "box_mdia", (node) => {
                forEachChild(node, "box_minf", (node) => {
                    forEachChild(node, "box_stbl", (node) => {

                        const track: MediaTrack = {
                            samplesType: "xxxx",
                            sampleRanges: [],
                            chunkRanges: []
                        }
                        tracks[trackId] = track;

                        forEachChild(node, "box_stsd", (node) => {
                            if (!node.children) return;
                            for (const child of node.children) {
                                if (child.title?.toString().toLowerCase().startsWith("box_")) {
                                    track.samplesType = child.title?.toString().toLowerCase().split(" ")[0].substring(4);
                                }
                            }
                        });
                        
                        const chunkOffsets: number[] = [];
                        forEachChild(node, ["box_stco", "box_co64"], (node) => {
                            const offsets = assertNums(getChildValue(node, "chunk_offset"));
                            chunkOffsets.push(...offsets);
                        });
                        const numChunks = chunkOffsets.length;

                        const sampleSizes: number[] = [];
                        forEachChild(node, "box_stsz", (node) => {
                            const sizes = assertNums(getChildValue(node, "entry_size"));
                            sampleSizes.push(...sizes);
                        });
                        const numSamples = sampleSizes.length;
                        
                        const samplesPerChunk: number[] = [];
                        forEachChild(node, "box_stsc", (node) => {
                            const first_chunks = assertNums(getChildValue(node, "first_chunk"));
                            const spc_from_first_chunk = assertNums(getChildValue(node, "samples_per_chunk"));
                            assert(first_chunks[0] === 1, "First chunk start should be 1");

                            for(let i=0; i<first_chunks.length; i++) {
                                const first_chunk = first_chunks[i];
                                const last_chunk = i < first_chunks.length-1 ? first_chunks[i+1]-1 : numChunks;
                                const spc = spc_from_first_chunk[i];
                                for (let chunk=first_chunk; chunk <= last_chunk; chunk++) {
                                    samplesPerChunk[chunk-1] = spc;
                                }
                            }
                        });
                        // console.log(samplesPerChunk);
                        assert(samplesPerChunk.length === numChunks);
                        
                        const sampleOffsets = [];
                        for(let chunk=0; chunk<numChunks; chunk++) {
                            let sampleOffset = chunkOffsets[chunk];
                            for(let s=0; s<samplesPerChunk[chunk]; s++) {
                                sampleOffsets.push(sampleOffset);
                                const sampleSize = sampleSizes[sampleOffsets.length-1];
                                track.sampleRanges.push(new ByteRange(sampleOffset, sampleOffset+sampleSize));
                                sampleOffset += sampleSize;
                            }
                            track.chunkRanges.push(new ByteRange(chunkOffsets[chunk], sampleOffset));
                        }
                        // console.log(sampleOffsets);
                        assert(sampleOffsets.length === numSamples);

                    })
                })
            })
        })
    });
    console.log(tracks);

    return tracks;
}

// export const  = (buffer: Uint8Array) => {
//     const bs = new Bitstream(new MSBBuffer(buffer));
//     const mdats: Uint8Array[] = [];
//     const mdat = Box({"mdat": (bs: Bitstream, end: number) => {
//         mdats.push(bs.slice(new BitRange(bs.getPos(), end).toByteRange()));
//     }});
//     for(let i=0; i<MAX_ITER; i++) {
//         mdat(bs, bs.getEndPos());
//     }

//     const totalSize = mdats.reduce((prev, val) => prev+val.byteLength, 0);
//     const ret = new Uint8Array(totalSize);
//     let offset = 0;
//     for(const mdat of mdats) {
//         ret.set(mdat, offset);
//         offset += mdat.byteLength;
//     }
//     console.log(ret);
//     return ret;
// }



export const ISOBMFF = syntax("ISOBMFF", (bs: Bitstream<BoxCtx & ParserCtx>, end: number) => {
    let i = 0;
    while (bs.getPos() < end) {
        if (i++ > MAX_ITER) break;
        ROOT_BOX(bs, end);
    }
});


function Box_ftyp(bs: Bitstream<BoxCtx & ParserCtx>, end: number) {
    bs.f("major_brand", 32);
    bs.f("minor_version", 32);

    let i = 0;
    while (bs.getPos() < end) {
        bs.f(`compatible_brands[${i}]`, 32);
        i++;
        if (i >= 500) break;
    }
}

function Box_mvhd(bs: Bitstream<BoxCtx & ParserCtx>, end: number) {
    const version = bs.f("version", 8);
    bs.f("flags", 24);
    if (version == 1) {
        bs.f("creation_time", 64);
        bs.f("modification_time", 64);
        bs.f("timescale", 32);
        bs.f("duration", 64);
    } else {
        bs.f("creation_time", 32);
        bs.f("modification_time", 32);
        bs.f("timescale", 32);
        bs.f("duration", 32);
    }

    bs.f("rate", 32);
    bs.f("volume", 16);
    bs.f("reserved", 16);
    bs.f("reserved", 64);

    for (let i = 0; i < 9; i++) {
        bs.f(`matrix[${i}]`, 32);
    }
    for (let i = 0; i < 6; i++) {
        bs.f(`pre_defined[${i}]`, 32);
    }
    bs.f("next_track_ID", 32);
}

function Box_tkhd(bs: Bitstream<BoxCtx & ParserCtx>, end: number) {

    const version = bs.f("version", 8);
    bs.f("flags", 24);
    if (version == 1) {
        bs.f("creation_time", 64);
        bs.f("modification_time", 64);
        bs.f("track_ID", 32);
        bs.f("reserved", 32);
        bs.f("duration", 64);
    } else {
        bs.f("creation_time", 32);
        bs.f("modification_time", 32);
        bs.f("track_ID", 32);
        bs.f("reserved", 32);
        bs.f("duration", 32);
    }
    bs.f("reserved", 32);
    bs.f("layer", 16);
    bs.f("alternate_group", 16);
    bs.f("volume", 16);
    bs.f("reserved", 16);

    for (let i = 0; i < 9; i++) {
        bs.f(`matrix[${i}]`, 32);
    }
    bs.f("width", 32);
    bs.f("height", 32);
}
