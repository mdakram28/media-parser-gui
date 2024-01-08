import { Bitstream, ParserCtx } from "../../bitstream/parser";
import { Box, Container } from "../box-util";
import { BoxCtx } from "../mp4-bitstream";



function Box_mdhd(bs: Bitstream<BoxCtx & ParserCtx>, end: number) {
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
    bs.f("pad", 1);
    bs.f("language[0]", 5);
    bs.f("language[1]", 5);
    bs.f("language[2]", 5);

    bs.f("pre_defined", 16);
}


function Box_hdlr(bs: Bitstream<BoxCtx & ParserCtx>, end: number) {
    const version = bs.f("version", 8);
    bs.f("flags", 24);

    bs.f("pre_defined", 32);
    bs.f("handler_type", 32);
    bs.f("reserved", 32);
    bs.f("reserved", 32);
    bs.f("reserved", 32);
    bs.utf8String("name");
}


const Box_stbl = Container({
    // "stts": (bs: Bitstream<BoxCtx & ParserCtx>, end: number) => {
    //     // TODO: (decoding) time-to-sample
    // },
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

const Box_minf = Container({
    'vmhd': (bs: Bitstream<BoxCtx & ParserCtx>, end: number) => {
        const version = bs.f("version", 8);
        bs.f("flags", 24);

        bs.f("graphicsmode", 16);
        bs.f("opcolor[0]", 16);
        bs.f("opcolor[1]", 16);
        bs.f("opcolor[2]", 16);
    },
    'smhd': (bs: Bitstream<BoxCtx & ParserCtx>, end: number) => {
        const version = bs.f("version", 8);
        bs.f("flags", 24);

        bs.f("balance", 16);
        bs.f("reserved", 16);
    },
    'hmhd': (bs: Bitstream<BoxCtx & ParserCtx>, end: number) => {
        const version = bs.f("version", 8);
        bs.f("flags", 24);

        bs.f("maxPDUsize", 16);
        bs.f("avgPDUsize", 16);
        bs.f("maxbitrate", 32);
        bs.f("avgbitrate", 32);
        bs.f("reserved", 32);
    },
    'sthd': (bs: Bitstream<BoxCtx & ParserCtx>, end: number) => {
        const version = bs.f("version", 8);
        bs.f("flags", 24);
    },
    'nmhd': (bs: Bitstream<BoxCtx & ParserCtx>, end: number) => {
        const version = bs.f("version", 8);
        bs.f("flags", 24);
    },
    'dinf': Container({

        'dref': (bs: Bitstream<BoxCtx & ParserCtx>, end: number) => {
            const version = bs.f("version", 8);
            bs.f("flags", 24);
            
            const DataEntryBox = Box({
                'DataEntryBox': (bs: Bitstream<BoxCtx & ParserCtx>) => {
                    
                }
            })
            
            const entry_count = bs.f("entry_count", 32);
            for (let i=1; i <= entry_count; i++) {
                DataEntryBox(bs, end);
            }
        },
    }),
    'stbl': Box_stbl
});


export const Container_mdia = Container({
    'mdhd': Box_mdhd,
    'hdlr': Box_hdlr,
    'minf': Box_minf,
});