import { BitBuffer } from "../../bitstream/buffer";
import { Bitstream, MAX_ITER, ParserCtx, syntax } from "../../bitstream/parser";
import { ByteRange } from "../../bitstream/range";
import { pic_parameter_set_rbsp } from "./nalu/pic_parameter_set_rbsp";
import { seq_parameter_set_rbsp } from "./nalu/seq_parameter_set_rbsp";
import { slice_segment_header } from "./nalu/slice_segment_header";
import { video_parameter_set_rbsp } from "./nalu/video_parameter_set_rbsp";

export enum NALU_TYPE {
    // 0	Reserved
    TRAIL_N = 0,
    TRAIL_R = 1,
    TSA_N = 2,
    TSA_R = 3,
    STSA_N = 4,
    STSA_R = 5,
    RADL_N = 6,
    RADL_R = 7,
    RASL_N = 8,
    RASL_R = 9,
    RSV_VCL_N10 = 10,
    RSV_VCL_N12 = 12,
    RSV_VCL_N14 = 14,
    RSV_VCL_R11 = 11,
    RSV_VCL_R13 = 13,
    RSV_VCL_R15 = 15,
    BLA_W_LP = 16,
    BLA_W_RADL = 17,
    BLA_N_LP = 18,
    IDR_W_RADL = 19,
    IDR_N_LP = 20,
    CRA_NUT = 21,
    RSV_IRAP_VCL22 = 22,
    RSV_IRAP_VCL23 = 23,

    RSV_VCL24 = 24,
    RSV_VCL25 = 25,
    RSV_VCL26 = 26,
    RSV_VCL27 = 27,
    RSV_VCL28 = 28,
    RSV_VCL29 = 29,
    RSV_VCL30 = 30,
    RSV_VCL31 = 31,

    // Non VCL,
    VPS_NUT = 32,
    SPS_NUT = 33,
    PPS_NUT = 34,
    AUD_NUT = 35,
    EOS_NUT = 36,
    EOB_NUT = 37,
    FD_NUT = 38,
    PREFIX_SEI_NUT = 39,
    SUFFIX_SEI_NUT = 40,

    RSV_NVCL41 = 41,
    RSV_NVCL42 = 42,
    RSV_NVCL43 = 43,
    RSV_NVCL44 = 44,
    RSV_NVCL45 = 45,
    RSV_NVCL46 = 46,
    RSV_NVCL47 = 47,

    UNSPEC48 = 48,
    UNSPEC49 = 49,
    UNSPEC50 = 50,
    UNSPEC51 = 51,
    UNSPEC52 = 52,
    UNSPEC53 = 53,
    UNSPEC54 = 54,
    UNSPEC55 = 55,
    UNSPEC56 = 56,
    UNSPEC57 = 57,
    UNSPEC58 = 58,
    UNSPEC59 = 59,
    UNSPEC60 = 60,
    UNSPEC61 = 61,
    UNSPEC62 = 62,
    UNSPEC63 = 63,
}

export class NalCtx {
    nal_unit_type = 0
    nuh_layer_id = 0
    nuh_temporal_id_plus1 = 0


    separate_colour_plane_flag = 0
};

export class SliceCtx {
  first_slice_segment_in_pic_flag = 0;
  no_output_of_prior_pics_flag = 0;
  slice_pic_parameter_set_id = 0;
  dependent_slice_segment_flag = 0;
  slice_segment_address = 0;
  slice_reserved_undetermined_flag = [];
  slice_type = 0;
  pic_output_flag = 1;
  colour_plane_id = 0;
  slice_pic_order_cnt_lsb = 0;
  short_term_ref_pic_set_sps_flag = 0;
  short_term_ref_pic_set_idx = 0;
  num_ref_idx_l0_active_minus1 = 0;
  num_ref_idx_l1_active_minus1 = 0;
  slice_temporal_mvp_enabled_flag = 0;
  collocated_from_l0_flag = 1;
  deblocking_filter_override_flag = 0;
  slice_sao_luma_flag = 0;
  slice_sao_chroma_flag = 0;
  num_long_term_pics = 0;
  num_long_term_sps = 0;
}

const HEVC_START_CODE = new Uint8Array([0, 0, 1]);
const HEVC_ESCAPE_CODE = new Uint8Array([0, 0, 3]);

export function systemStreamToStartCode(buffers: BitBuffer[]) {
    const ret: BitBuffer[] = [];
    for (const buffer of buffers) {
        buffer.reset();
        const bs = new Bitstream(buffer);
        let i = 0;
        while (bs.getPos() < bs.getEndPos()) {
            if (i++ > MAX_ITER) break;

            const nalu_size_bytes = bs.f("nalu_size", 32, {hidden: true});
            const nalu_end_pos = bs.getPos() + nalu_size_bytes*8;
            const startBytePos = Math.floor(bs.getPos()/8);
            bs.gotoPos(nalu_end_pos);
            const endBytePos = Math.floor(bs.getPos()/8);

            const arr = new Uint8Array(4 + (endBytePos-startBytePos));
            arr.set(HEVC_START_CODE, 1);
            arr.set(bs.slice(new ByteRange(startBytePos, endBytePos)), 4);
            ret.push(new BitBuffer(arr));
        }
    }

    console.log(buffers, ret);
    return ret;
}

export function isSystemStreamHEVC(buffer: Uint8Array) {
    const bs = new Bitstream(new BitBuffer(buffer));

    let i = 0;
    while (bs.getPos() < bs.getEndPos()) {
        if (i++ > MAX_ITER) break;

        const nalu_size_bytes = bs.f("nalu_size", 32, {hidden: true});
        if (nalu_size_bytes === 0) return false;
        const nalu_end_pos = bs.getPos() + nalu_size_bytes*8;
        if (nalu_end_pos < bs.getEndPos()) return false;
        bs.gotoPos(nalu_end_pos);
    }
    return bs.getPos() === bs.getEndPos();
}

export const HEVC = (buffer: BitBuffer) => {
    buffer.reset();
    buffer.setEscapeCode(new Uint8Array([0, 0, 3]));
    const bs = new Bitstream(buffer);
    bs.updateCtx(new ParserCtx());
    let i = 0;

    bs.byteAlign();
    let nextStartPos = bs.findNextBytes(HEVC_START_CODE);
    while (nextStartPos < bs.getEndPos()) {
        if (i++ > MAX_ITER) break;

        bs.gotoPos(nextStartPos + HEVC_START_CODE.length * 8);
        nextStartPos = bs.findNextBytes(HEVC_START_CODE);

        nal_unit(bs, nextStartPos);
    }
    return bs.getCurrent();
};

export const SystemStreamHEVC = (buffers: BitBuffer[]) => {
    const bs = new Bitstream(new BitBuffer(new Uint8Array()));
    bs.updateCtx(new ParserCtx());

    for(const buff of buffers) {
        buff.reset();
        bs.updateBuffer(buff);
        
        let i = 0;
        while (bs.getPos() < bs.getEndPos()) {
            if (i++ > MAX_ITER) break;
            // bs.findNextBytes(HEVC_START_CODE);
            const nalu_size_bytes = bs.f("nalu_size", 32, {hidden: true});
            const nalu_end_pos = bs.getPos() + nalu_size_bytes*8;
            buff.setEscapeCode(HEVC_ESCAPE_CODE);   // Set escape code
            nal_unit(bs, nalu_end_pos);
            buff.setEscapeCode();                   // Remove escape code
            bs.gotoPos(nalu_end_pos);
        }
    }
    return bs.getCurrent();
};

export type NaluCtx = Bitstream<NalCtx & ParserCtx>;

export const nal_unit = syntax("NAL_UNIT", (bs: NaluCtx, end: number) => {
    bs.updateCtx(new NalCtx());
    const c = bs.ctx;

    // nal_unit_header
    bs.f("forbidden_zero_bit", 1);
    bs.f("nal_unit_type", 6, { e: NALU_TYPE });
    bs.f("nuh_layer_id", 6);
    bs.f("nuh_temporal_id_plus1", 3);

    bs.setTitle(`[NALU] ${NALU_TYPE[c.nal_unit_type]}`);

    switch (bs.ctx.nal_unit_type) {
        case NALU_TYPE.VPS_NUT:
            video_parameter_set_rbsp(bs, end);
            break;
        case NALU_TYPE.SPS_NUT:
            seq_parameter_set_rbsp(bs, end);
            break;
        case NALU_TYPE.PPS_NUT:
            pic_parameter_set_rbsp(bs, end);
            break;
        case NALU_TYPE.IDR_N_LP:
        case NALU_TYPE.TRAIL_N:
        case NALU_TYPE.TRAIL_R:
            slice_segment_header(bs, end);
            break;
    }

    
    bs.gotoPos(end);
});
