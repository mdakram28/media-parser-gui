import { ParserCtx } from "../av1-analyzer/av1-bitstream";
import { Bitstream, syntax } from "../bitstream/parser";
import { Box, Container } from "./box-util";
import { Container_mdia } from "./boxes/box_mdia";

// https://b.goeswhere.com/ISO_IEC_14496-12_2015.pdf

const MAX_ITER = 500;

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



const ROOT_BOX = Box({
    "ftyp": Box_ftyp,
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
})

export const ISOBMFF = syntax("ISOBMFF", (bs: Bitstream<BoxCtx & ParserCtx>, end: number) => {
    let i = 0;
    while (bs.getPos() < end) {
        if (i++ > MAX_ITER) break;
        ROOT_BOX(bs, end);
    }
});


function Box_ftyp(bs: Bitstream<BoxCtx & ParserCtx>, end: number) {
    /*
    aligned(8) class FileTypeBox
        extends Box(‘ftyp’) {
        unsigned int(32) major_brand;
        unsigned int(32) minor_version;
        unsigned int(32) compatible_brands[]; // to end of the box
    } 
    */
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
    /*
    aligned(8) class MovieHeaderBox extends FullBox(‘mvhd’, version, 0) {
        if (version==1) {
            unsigned int(64) creation_time;
            unsigned int(64) modification_time;
            unsigned int(32) timescale;
            unsigned int(64) duration;
        } else { // version==0
            unsigned int(32) creation_time;
            unsigned int(32) modification_time;
            unsigned int(32) timescale;
            unsigned int(32) duration;
        }
        template int(32) rate = 0x00010000; // typically 1.0
        template int(16) volume = 0x0100; // typically, full volume
        const bit(16) reserved = 0;
        const unsigned int(32)[2] reserved = 0;
        template int(32)[9] matrix =
        { 0x00010000,0,0,0,0x00010000,0,0,0,0x40000000 };
        // Unity matrix
        bit(32)[6] pre_defined = 0;
        unsigned int(32) next_track_ID;
    } 
    */
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
    /*
    aligned(8) class TrackHeaderBox
        extends FullBox(‘tkhd’, version, flags){
        if (version==1) {
            unsigned int(64) creation_time;
            unsigned int(64) modification_time;
            unsigned int(32) track_ID;
            const unsigned int(32) reserved = 0;
            unsigned int(64) duration;
        } else { // version==0
            unsigned int(32) creation_time;
            unsigned int(32) modification_time;
            unsigned int(32) track_ID;
            const unsigned int(32) reserved = 0;
            unsigned int(32) duration;
        }
        const unsigned int(32)[2] reserved = 0;
        template int(16) layer = 0;
        template int(16) alternate_group = 0;
        template int(16) volume = {if track_is_audio 0x0100 else 0};
        const unsigned int(16) reserved = 0;
        template int(32)[9] matrix=
        { 0x00010000,0,0,0,0x00010000,0,0,0,0x40000000 };
        // unity matrix
        unsigned int(32) width;
        unsigned int(32) height;
    }
    */

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
