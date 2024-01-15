import { Bitstream, ParserCtx } from "bitstream/parser";
import { Box, Container } from "../box-util";
import { BoxCtx } from "../mp4-bitstream";
import { AV1Sample } from "./sample_av1";


function SampleEntry(bs: Bitstream<BoxCtx & ParserCtx>, end: number) {
    bs.f("reserved", 8 * 6);
    bs.f("data_reference_index", 16);
}

export function VisualSampleEntry(bs: Bitstream<BoxCtx & ParserCtx>, end: number) {
    SampleEntry(bs, end);

    bs.f("pre_defined", 16);
    bs.f("reserved", 16);
    bs.f("pre_defined[0]", 32);
    bs.f("pre_defined[1]", 32);
    bs.f("pre_defined[2]", 32);
    bs.f("width", 16);
    bs.f("height", 16);
    bs.f("horizresolution", 32);
    bs.f("vertresolution", 32);
    bs.f("reserved", 32);
    bs.f("frame_count", 16);
    bs.fixedWidthString("compressorname", 32);
    bs.f("depth", 16);
    bs.f("pre_defined", 16);
}

const SampleEntryBox = Box({
    "av01": AV1Sample
});

function TableBox(cb: (bs: Bitstream<BoxCtx & ParserCtx>, i: number) => void) {
    return (bs: Bitstream<BoxCtx & ParserCtx>, end: number) => {
        const version = bs.f("version", 8);
        bs.f("flags", 24);
        const entry_count = bs.f("entry_count", 32);
        for (let i = 0; i < entry_count; i++) {
            cb(bs, i);
        }
    }
}

export const Box_stbl = Container({
    "stsd": (bs: Bitstream<BoxCtx & ParserCtx>, end: number) => {
        const version = bs.f("version", 8);
        bs.f("flags", 24);
        const entry_count = bs.f("entry_count", 32);
        for (let i = 1; i <= entry_count; i++) {
            SampleEntryBox(bs, end);
        }
    },
    "stts": TableBox((bs, i) => {
        bs.f(`sample_count[${i}]`, 32);
        bs.f(`sample_delta[${i}]`, 32);
    }),
    "stsc": TableBox((bs, i) => {
        bs.f(`first_chunk[${i}]`, 32);
        bs.f(`samples_per_chunk[${i}]`, 32);
        bs.f(`sample_description_index[${i}]`, 32);
    }),
    "stss": TableBox((bs, i) => {
        bs.f(`sample_number[${i}]`, 32);
    }),
    "stsz": (bs: Bitstream<BoxCtx & ParserCtx>, end: number) => {
        const version = bs.f("version", 8);
        bs.f("flags", 24);
        const sample_size = bs.f(`sample_size`, 32);
        const sample_count = bs.f(`sample_count`, 32);
        if (sample_size == 0) {
            for (let i = 1; i <= sample_count; i++) {
                bs.f(`entry_size[${i}]`, 32);
            }
        }
    },
    "stz2": (bs: Bitstream<BoxCtx & ParserCtx>, end: number) => {
        const version = bs.f("version", 8);
        bs.f("flags", 24);
        bs.f("reserved", 24);
        const field_size = bs.f("field_size", 8);
        const sample_count = bs.f(`sample_count`, 32);
        for (let i = 1; i <= sample_count; i++) {
            bs.f(`entry_size[${i}]`, field_size);
        }
    },

    "stco": TableBox((bs, i) => {
        bs.f(`chunk_offset[${i}]`, 32);
    }),
    "co64": TableBox((bs, i) => {
        bs.f(`chunk_offset[${i}]`, 64);
    }),

    // "ctts": (bs: Bitstream<BoxCtx & ParserCtx>, end: number) => {
    //     // TODO: (composition) time to sample
    // },
    // "cslg": (bs: Bitstream<BoxCtx & ParserCtx>, end: number) => {
    //     // TODO: composition to decode timeline mapping
    // },
    // "stsc": (bs: Bitstream<BoxCtx & ParserCtx>, end: number) => {
    //     // TODO: sample-to-chunk, partial data-offset information
    // },
    // "stsz": (bs: Bitstream<BoxCtx & ParserCtx>, end: number) => {
    //     // TODO: sample sizes (framing)
    // },
    // "stz2": (bs: Bitstream<BoxCtx & ParserCtx>, end: number) => {
    //     // TODO: compact sample sizes (framing)
    // },
    // "stco": (bs: Bitstream<BoxCtx & ParserCtx>, end: number) => {
    //     // TODO: chunk offset, partial data-offset information
    // },
    // "co64": (bs: Bitstream<BoxCtx & ParserCtx>, end: number) => {
    //     // TODO: 64-bit chunk offset
    // },
    // "stss": (bs: Bitstream<BoxCtx & ParserCtx>, end: number) => {
    //     // TODO: sync sample table
    // },
    // "stsh": (bs: Bitstream<BoxCtx & ParserCtx>, end: number) => {
    //     // TODO: shadow sync sample table
    // },
    // "padb": (bs: Bitstream<BoxCtx & ParserCtx>, end: number) => {
    //     // TODO: sample padding bits
    // },
    // "stdp": (bs: Bitstream<BoxCtx & ParserCtx>, end: number) => {
    //     // TODO: sample degradation priority
    // },
    // "sdtp": (bs: Bitstream<BoxCtx & ParserCtx>, end: number) => {
    //     // TODO: independent and disposable samples
    // },
    // "sbgp": (bs: Bitstream<BoxCtx & ParserCtx>, end: number) => {
    //     // TODO: sample-to-group
    // },
    // "sgpd": (bs: Bitstream<BoxCtx & ParserCtx>, end: number) => {
    //     // TODO: sample group description
    // },
    // "subs": (bs: Bitstream<BoxCtx & ParserCtx>, end: number) => {
    //     // TODO: sub-sample information
    // },
    // "saiz": (bs: Bitstream<BoxCtx & ParserCtx>, end: number) => {
    //     // TODO: sample auxiliary information sizes
    // },
    // "saio": (bs: Bitstream<BoxCtx & ParserCtx>, end: number) => {
    //     // TODO: sample auxiliary information offsets
    // },
});
