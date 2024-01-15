import { Bitstream, ParserCtx } from "../../../bitstream/parser";
import { Box, Container } from "../box-util";
import { BoxCtx } from "../mp4-bitstream";
import { Box_stbl } from "./box_stbl";


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
    bs.nullEndedString("name");
}


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