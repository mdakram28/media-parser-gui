import { BitRange, ByteRange } from "../../bitstream/range";
import { Bitstream, MAX_ITER, ParserCtx, syntax } from "../../bitstream/parser";
import { Box, Container } from "./box-util";
import { Container_mdia } from "./boxes/box_mdia";
import { MSBBuffer } from "../../bitstream/buffer";

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
    const bs = new Bitstream(new MSBBuffer(buffer));
    try {
        bs.gotoPos(4 * 8);
        const boxTypeName = bs.fixedWidthString("type", 4);
        return (RootBoxMap as any)[boxTypeName] !== undefined;
    } catch (e) {
        return false;
    }
}

export const extractMp4Data = (buffer: Uint8Array) => {
    const bs = new Bitstream(new MSBBuffer(buffer));
    const mdats: Uint8Array[] = [];
    const mdat = Box({"mdat": (bs: Bitstream, end: number) => {
        mdats.push(bs.slice(new BitRange(bs.getPos(), end).toByteRange()));
    }});
    for(let i=0; i<MAX_ITER; i++) {
        mdat(bs, bs.getEndPos());
    }

    const totalSize = mdats.reduce((prev, val) => prev+val.byteLength, 0);
    const ret = new Uint8Array(totalSize);
    let offset = 0;
    for(const mdat of mdats) {
        ret.set(mdat, offset);
        offset += mdat.byteLength;
    }
    console.log(ret);
    return ret;
}



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
