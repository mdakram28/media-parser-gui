import { DataNode } from "../../types/parser.types";
import { Bitstream, MAX_ITER, ParserCtx, syntax } from "../../bitstream/parser";
import { BoxCtx } from "./mp4-bitstream";

type NestedBoxes = {
    [name: string]: (bs: Bitstream<BoxCtx & ParserCtx>, end: number) => void
}

export function Box(subBoxes: NestedBoxes) {
    return syntax("box", (bs: Bitstream<BoxCtx & ParserCtx>, end: number) => {
        bs.updateCtx(new BoxCtx());
        const c = bs.ctx;

        const startPos = bs.getPos();
        bs.f("size", 32);
        bs.f("type", 32);

        if (c.size == 1) {
            bs.f("largesize", 64);
        } else if (c.size == 0) {
            c.size = Math.floor((end - startPos) / 8);
        }
        const boxEndPos = startPos + c.size * 8;
        const boxTypeName = Array(4).fill(0).map((_, i) => String.fromCharCode((c.type >> (8 * i)) & 0xFF)).reverse().join("");
        bs.setVarName(`box_${boxTypeName}`);
        bs.setTitle(`box_${boxTypeName}`);

        if (subBoxes[boxTypeName]) {
            subBoxes[boxTypeName](bs, boxEndPos);
        } else {
            bs.error(`TODO: Box parser`);
            bs.setTitle(`box_${boxTypeName} (Unexpected)`);
        }

        bs.gotoPos(boxEndPos);
    });
}

export function Container(subBoxes: NestedBoxes) {
    const subBoxSyntax = Box(subBoxes);
    return (bs: Bitstream<BoxCtx & ParserCtx>, end: number) => {
        let i = 0;
        while (bs.getPos() < end) {
            if (i++ > MAX_ITER) break;
            subBoxSyntax(bs, end);
        }
    };
}
