import { Bitstream, ObuCtx, syntax } from "../av1-bitstream";
import { frame_header_obu } from "./obu_frame_header";
import { tile_group_obu } from "./obu_tile_group";

export const frame_obu = syntax("frame_obu", (bs: Bitstream<ObuCtx>, sz: number) => {
    const c = bs.ctx;

    const startBitPos = bs.getPos()
    frame_header_obu(bs)
    bs.byte_alignment()
    const endBitPos = bs.getPos()
    const headerBytes = (endBitPos - startBitPos) / 8
    sz -= headerBytes
    tile_group_obu(bs, sz)
})