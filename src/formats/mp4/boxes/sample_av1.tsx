import { open_bitstream_unit } from "../../av1/av1-bitstream";
import { Bitstream, MAX_ITER, ParserCtx } from "../../../bitstream/parser";
import { Box } from "../box-util";
import { BoxCtx } from "../mp4-bitstream";
import { VisualSampleEntry } from "./box_mdia";



const AV1CodecConfigurationRecordBox = Box({
  "av1C": (bs: Bitstream<BoxCtx & ParserCtx>, end: number) => {

    bs.f("marker", 1);
    bs.f("version", 7);
    bs.f("seq_profile", 3);
    bs.f("seq_level_idx_0", 5);
    bs.f("seq_tier_0", 1);
    bs.f("high_bitdepth", 1);
    bs.f("twelve_bit", 1);
    bs.f("monochrome", 1);
    bs.f("chroma_subsampling_x", 1);
    bs.f("chroma_subsampling_y", 1);
    bs.f("chroma_sample_position", 2);
    bs.f("reserved", 3);

    const initial_presentation_delay_present = bs.f("initial_presentation_delay_present", 1);

    if (initial_presentation_delay_present) {
      bs.f("initial_presentation_delay_minus_one", 4);
    } else {
      bs.f("reserved", 4);
    }

    bs.f("initial_presentation_delay_minus_one", 4);

    let i = 0;
    while (bs.getPos() < end) {
      if (i++ > MAX_ITER) break;
      open_bitstream_unit(bs, 0);
    }
    bs.gotoPos(end);
  }
});


export function AV1Sample(bs: Bitstream<BoxCtx & ParserCtx>, end: number) {
  VisualSampleEntry(bs, end);
  AV1CodecConfigurationRecordBox(bs, end);
}