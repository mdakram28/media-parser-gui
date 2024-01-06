import { Bitstream, ObuCtx, ParserCtx, syntax } from "../av1-bitstream";

const NUM_REF_FRAMES = 8;
const REFS_PER_FRAME = 7;
const SELECT_SCREEN_CONTENT_TOOLS = 2;
const SELECT_INTEGER_MV = 2;
const PRIMARY_REF_NONE = 7;
const SUPERRES_DENOM_BITS = 3;
const SUPERRES_DENOM_MIN = 9;
const SUPERRES_NUM = 8;

export enum FrameType {
    KEY_FRAME = 0,
    INTER_FRAME = 1,
    INTRA_ONLY_FRAME = 2,
    SWITCH_FRAME = 3,
}

export enum RefFrame0 {
    INTRA_FRAME = 0,
    LAST_FRAME = 1,
    LAST2_FRAME = 2,
    LAST3_FRAME = 3,
    GOLDEN_FRAME = 4,
    BWDREF_FRAME = 5,
    ALTREF2_FRAME = 6,
    ALTREF_FRAME = 7,
}

export enum RefFrame1 {
    NONE = -1,          // (this block uses single prediction)
    INTRA_FRAME = 0,    // (this block uses interintra prediction)
    LAST_FRAME = 1,
    LAST2_FRAME = 2,
    LAST3_FRAME = 3,
    GOLDEN_FRAME = 4,
    BWDREF_FRAME = 5,
    ALTREF2_FRAME = 6,
    ALTREF_FRAME = 7,
}

export enum InterpolationFilter {
    EIGHTTAP = 0,
    EIGHTTAP_SMOOTH = 1,
    EIGHTTAP_SHARP = 2,
    BILINEAR = 3,
    SWITCHABLE = 4,
}

const temporal_point_info = syntax("temporal_point_info", (bs: Bitstream<ObuCtx>) => {
    const n = bs.ctx.frame_presentation_time_length_minus_1 + 1
    bs.f("frame_presentation_time", n)
})

const mark_ref_frames = (bs: Bitstream<ObuCtx>) => {
    const c = bs.ctx;
    const diffLen = c.delta_frame_id_length_minus_2 + 2
    for (let i = 0; i < NUM_REF_FRAMES; i++) {
        if (c.current_frame_id > (1 << diffLen)) {
            if (c.RefFrameId[i] > c.current_frame_id ||
                c.RefFrameId[i] < (c.current_frame_id - (1 << diffLen)))
                c.RefValid[i] = 0
        } else {
            if (c.RefFrameId[i] > c.current_frame_id &&
                c.RefFrameId[i] < ((1 << c.idLen) +
                    c.current_frame_id -
                    (1 << diffLen)))
                c.RefValid[i] = 0
        }
    }
}

const frame_size = syntax("frame_size", (bs: Bitstream<ObuCtx>) => {
    const c = bs.ctx;
    const superres_params = bs.syntax("superres_params", () => {
        if (c.enable_superres)
            bs.f("use_superres", 1)
        else
            c.use_superres = 0
        if (c.use_superres) {
            bs.f("coded_denom", SUPERRES_DENOM_BITS)
            c.SuperresDenom = c.coded_denom + SUPERRES_DENOM_MIN
        } else {
            c.SuperresDenom = SUPERRES_NUM
        }
        c.UpscaledWidth = c.FrameWidth
        c.FrameWidth = (c.UpscaledWidth * SUPERRES_NUM +
            (c.SuperresDenom / 2)) / c.SuperresDenom
    });

    if (c.frame_size_override_flag) {
        let n = c.frame_width_bits_minus_1 + 1
        bs.f("frame_width_minus_1", n)
        n = c.frame_height_bits_minus_1 + 1
        bs.f("frame_height_minus_1", n)
        c.FrameWidth = c.frame_width_minus_1 + 1
        c.FrameHeight = c.frame_height_minus_1 + 1
    } else {
        c.FrameWidth = c.max_frame_width_minus_1 + 1
        c.FrameHeight = c.max_frame_height_minus_1 + 1
    }
    superres_params()
    // compute_image_size()
    c.MiCols = 2 * ((c.FrameWidth + 7) >> 3)
    c.MiRows = 2 * ((c.FrameHeight + 7) >> 3)
})

const render_size = syntax("render_size", (bs: Bitstream<ObuCtx>) => {
    const c = bs.ctx;
    bs.f("render_and_frame_size_different", 1)
    if (c.render_and_frame_size_different == 1) {
        bs.f("render_width_minus_1", 16)
        bs.f("render_height_minus_1", 16)
        c.RenderWidth = c.render_width_minus_1 + 1
        c.RenderHeight = c.render_height_minus_1 + 1
    } else {
        c.RenderWidth = c.UpscaledWidth
        c.RenderHeight = c.FrameHeight
    }
})

const frame_size_with_refs = syntax("frame_size_with_refs", (bs: Bitstream<ObuCtx>) => {
    bs.error("Not implemented")
    // const c = bs.ctx;
    // let found_ref = 0;
    // for (let i = 0; i < REFS_PER_FRAME; i++) {  
    //     found_ref = bs.f("found_ref", 1)
    //     if (found_ref == 1) {
    //         c.UpscaledWidth = c.RefUpscaledWidth[ref_frame_idx[i]]
    //         FrameWidth = UpscaledWidth
    //         FrameHeight = RefFrameHeight[ref_frame_idx[i]]
    //         RenderWidth = RefRenderWidth[ref_frame_idx[i]]
    //         RenderHeight = RefRenderHeight[ref_frame_idx[i]]
    //         break
    //     }
    // }
    // if (found_ref == 0) {
    //     frame_size()
    //     render_size()
    // } else {
    //     superres_params()
    //     compute_image_size()
    // }
})

const read_interpolation_filter = syntax("read_interpolation_filter", (bs: Bitstream<ObuCtx>) => {
    const c = bs.ctx;
    const is_filter_switchable = bs.f("is_filter_switchable", 1)
    if (is_filter_switchable == 1) {
        c.interpolation_filter = InterpolationFilter.SWITCHABLE
    } else {
        bs.f("interpolation_filter", 2)
    }
})


const get_relative_dist = (bs: Bitstream<ObuCtx>, a: number, b: number) => {
    const c = bs.ctx;
    if (!c.enable_order_hint)
        return 0
    let diff = a - b
    const m = 1 << (c.OrderHintBits - 1)
    diff = (diff & (m - 1)) - (diff & m)
    return diff
}


const uncompressed_header = syntax("uncompressed_header", (bs: Bitstream<ObuCtx>) => {
    const c = bs.ctx;
    if (c.frame_id_numbers_present_flag) {
        c.idLen = (c.additional_frame_id_length_minus_1 + c.delta_frame_id_length_minus_2 + 3)
    }
    const allFrames = (1 << NUM_REF_FRAMES) - 1
    if (c.reduced_still_picture_header) {
        c.show_existing_frame = 0
        c.frame_type = FrameType.KEY_FRAME
        c.FrameIsIntra = 1
        c.show_frame = 1
        c.showable_frame = 0
    } else {
        bs.f("show_existing_frame", 1)
        if (c.show_existing_frame == 1) {
            bs.f("frame_to_show_map_idx", 3)
            if (c.decoder_model_info_present_flag && !c.equal_picture_interval) {
                temporal_point_info(bs)
            }
            c.refresh_frame_flags = 0
            if (c.frame_id_numbers_present_flag) {
                bs.f("display_frame_id", c.idLen)
            }

            c.frame_type = c.RefFrameType[c.frame_to_show_map_idx]
            if (c.frame_type == FrameType.KEY_FRAME) {
                c.refresh_frame_flags = allFrames
            }
            if (c.film_grain_params_present) {
                // load_grain_params(frame_to_show_map_idx)
                bs.error("load_grain_params(frame_to_show_map_idx) not implemeted")
            }
            return
        }
        bs.f("frame_type", 2, FrameType)
        c.FrameIsIntra = (c.frame_type == FrameType.INTRA_ONLY_FRAME || c.frame_type == FrameType.KEY_FRAME) ? 1 : 0
        bs.f("show_frame", 1)
        if (c.show_frame && c.decoder_model_info_present_flag && !c.equal_picture_interval) {
            temporal_point_info(bs)
        }
        if (c.show_frame) {
            c.showable_frame = c.frame_type != FrameType.KEY_FRAME ? 1 : 0
        } else {
            bs.f("showable_frame", 1)
        }
        if (c.frame_type == FrameType.SWITCH_FRAME ||
            (c.frame_type == FrameType.KEY_FRAME && c.show_frame))
            c.error_resilient_mode = 1
        else
            bs.f("error_resilient_mode", 1)
    }





    if (c.frame_type == FrameType.KEY_FRAME && c.show_frame) {
        for (let i = 0; i < NUM_REF_FRAMES; i++) {
            c.RefValid[i] = 0
            c.RefOrderHint[i] = 0
        }
        for (let i = 0; i < REFS_PER_FRAME; i++) {
            c.OrderHints[RefFrame0.LAST_FRAME + i] = 0
        }
    }
    bs.f("disable_cdf_update", 1)
    if (c.seq_force_screen_content_tools == SELECT_SCREEN_CONTENT_TOOLS) {
        bs.f("allow_screen_content_tools", 1)
    } else {
        c.allow_screen_content_tools = c.seq_force_screen_content_tools
    }
    if (c.allow_screen_content_tools) {
        if (c.seq_force_integer_mv == SELECT_INTEGER_MV) {
            bs.f("force_integer_mv", 1)
        } else {
            c.force_integer_mv = c.seq_force_integer_mv
        }
    } else {
        c.force_integer_mv = 0
    }
    if (c.FrameIsIntra) {
        c.force_integer_mv = 1
    }
    if (c.frame_id_numbers_present_flag) {
        c.PrevFrameID = c.current_frame_id
        bs.f("current_frame_id", c.idLen)
        mark_ref_frames(bs)
    } else {
        c.current_frame_id = 0
    }
    if (c.frame_type == FrameType.SWITCH_FRAME)
        c.frame_size_override_flag = 1
    else if (c.reduced_still_picture_header)
        c.frame_size_override_flag = 0
    else
        bs.f("frame_size_override_flag", 1)
    bs.f("order_hint", c.OrderHintBits)
    const OrderHint = c.order_hint
    if (c.FrameIsIntra || c.error_resilient_mode) {
        c.primary_ref_frame = PRIMARY_REF_NONE
    } else {
        bs.f("primary_ref_frame", 3)
    }
    if (c.decoder_model_info_present_flag) {
        bs.f("buffer_removal_time_present_flag", 1)
        if (c.buffer_removal_time_present_flag) {
            for (let opNum = 0; opNum <= c.operating_points_cnt_minus_1; opNum++) {
                if (c.decoder_model_present_for_this_op[opNum]) {
                    const opPtIdc = c.operating_point_idc[opNum]
                    const inTemporalLayer = (opPtIdc >> c.temporal_id) & 1
                    const inSpatialLayer = (opPtIdc >> (c.spatial_id + 8)) & 1
                    if (opPtIdc == 0 || (inTemporalLayer && inSpatialLayer)) {
                        const n = c.buffer_removal_time_length_minus_1 + 1
                        bs.f(`buffer_removal_time[${opNum}]`, n)
                    }
                }
            }
        }
    }
    c.allow_high_precision_mv = 0
    c.use_ref_frame_mvs = 0
    c.allow_intrabc = 0
    if (c.frame_type == FrameType.SWITCH_FRAME ||
        (c.frame_type == FrameType.KEY_FRAME && c.show_frame)) {
        c.refresh_frame_flags = allFrames
    } else {
        bs.f("refresh_frame_flags", 8)
    }
    if (!c.FrameIsIntra || c.refresh_frame_flags != allFrames) {
        if (c.error_resilient_mode && c.enable_order_hint) {
            for (let i = 0; i < NUM_REF_FRAMES; i++) {
                bs.f(`ref_order_hint[${i}]`, c.OrderHintBits)
                if (c.ref_order_hint[i] != c.RefOrderHint[i]) {
                    c.RefValid[i] = 0
                }
            }
        }
    }
    if (c.FrameIsIntra) {
        frame_size(bs)
        render_size(bs)
        if (c.allow_screen_content_tools && c.UpscaledWidth == c.FrameWidth) {
            bs.f("allow_intrabc", 1)
        }
    } else {
        if (!c.enable_order_hint) {
            c.frame_refs_short_signaling = 0
        } else {
            bs.f("frame_refs_short_signaling", 1)
            if (c.frame_refs_short_signaling) {
                bs.f("last_frame_idx", 3)
                bs.f("gold_frame_idx", 3)
                // set_frame_refs()
            }
        }
        for (let i = 0; i < REFS_PER_FRAME; i++) {
            if (!c.frame_refs_short_signaling)
                bs.f(`ref_frame_idx[${i}]`, 3)
            if (c.frame_id_numbers_present_flag) {
                const n = c.delta_frame_id_length_minus_2 + 2
                bs.f("delta_frame_id_minus_1", n)
                const DeltaFrameId = c.delta_frame_id_minus_1 + 1
                c.expectedFrameId[i] = ((c.current_frame_id + (1 << c.idLen) -
                    DeltaFrameId) % (1 << c.idLen))
            }
        }
        if (c.frame_size_override_flag && !c.error_resilient_mode) {
            frame_size_with_refs(bs)
        } else {
            frame_size(bs)
            render_size(bs)
        }
        if (c.force_integer_mv) {
            c.allow_high_precision_mv = 0
        } else {
            bs.f("allow_high_precision_mv", 1)
        }
        read_interpolation_filter(bs)
        bs.f("is_motion_mode_switchable", 1)
        if (c.error_resilient_mode || !c.enable_ref_frame_mvs) {
            c.use_ref_frame_mvs = 0
        } else {
            bs.f("use_ref_frame_mvs", 1)
        }
        for (let i = 0; i < REFS_PER_FRAME; i++) {
            const refFrame = RefFrame0.LAST_FRAME + i
            const hint = c.RefOrderHint[c.ref_frame_idx[i]]
            c.OrderHints[refFrame] = hint
            if (!c.enable_order_hint) {
                c.RefFrameSignBias[refFrame] = 0
            } else {
                c.RefFrameSignBias[refFrame] = get_relative_dist(bs, hint, OrderHint) > 0 ? 1 : 0
            }
        }
    }
    // if (reduced_still_picture_header || disable_cdf_update)
    //     disable_frame_end_update_cdf = 1
    // else
    //     bs.f("disable_frame_end_update_cdf", 1)
    // if (primary_ref_frame == PRIMARY_REF_NONE) {
    //     init_non_coeff_cdfs()
    //     setup_past_independence()
    // } else {
    //     load_cdfs(ref_frame_idx[primary_ref_frame])
    //     load_previous()
    // }
    // if (use_ref_frame_mvs == 1)
    //     motion_field_estimation()
    // tile_info()
    // quantization_params()
    // segmentation_params()
    // delta_q_params()
    // delta_lf_params()
    // if (primary_ref_frame == PRIMARY_REF_NONE) {
    //     init_coeff_cdfs()
    // } else {
    //     load_previous_segment_ids()
    // }
    // CodedLossless = 1
    // for (segmentId = 0; segmentId < MAX_SEGMENTS; segmentId++) {
    //     qindex = get_qindex(1, segmentId)
    //     LosslessArray[segmentId] = qindex == 0 && DeltaQYDc == 0 &&
    //         DeltaQUAc == 0 && DeltaQUDc == 0 &&
    //         DeltaQVAc == 0 && DeltaQVDc == 0
    //     if (!LosslessArray[segmentId])
    //         CodedLossless = 0
    //     if (using_qmatrix) {
    //         if (LosslessArray[segmentId]) {
    //             SegQMLevel[0][segmentId] = 15
    //             SegQMLevel[1][segmentId] = 15
    //             SegQMLevel[2][segmentId] = 15
    //         } else {
    //             SegQMLevel[0][segmentId] = qm_y
    //             SegQMLevel[1][segmentId] = qm_u
    //             SegQMLevel[2][segmentId] = qm_v
    //         }
    //     }
    // }
    // AllLossless = CodedLossless && (FrameWidth == UpscaledWidth)
    // loop_filter_params()
    // cdef_params()
    // lr_params()
    // read_tx_mode()
    // frame_reference_mode()
    // skip_mode_params()
    // if (FrameIsIntra ||
    //     error_resilient_mode ||
    //     !enable_warped_motion)
    //     allow_warped_motion = 0
    // else
    //     bs.f("allow_warped_motion", 1)
    // bs.f("reduced_tx_set", 1)
    // global_motion_params()
    // film_grain_params()



});

export const frame_header_obu = syntax("frame_header_obu", (bs: Bitstream<ObuCtx & ParserCtx>) => {
    const c = bs.ctx;

    if (c.SeenFrameHeader == 1) {
        // frame_header_copy()
    } else {
        c.SeenFrameHeader = 1
        uncompressed_header(bs)
        if (c.show_existing_frame) {
            // decode_frame_wrapup()
            c.SeenFrameHeader = 0
        } else {
            c.TileNum = 0
            c.SeenFrameHeader = 1
        }
    }
});