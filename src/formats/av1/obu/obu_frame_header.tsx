import { Bitstream, ParserCtx, syntax } from "../../../bitstream/parser";
import { ObuCtx } from "../av1-bitstream";
import { Av1Const } from "./constants";
import { Default_Angle_Delta_Cdf, Default_Cfl_Alpha_Cdf, Default_Cfl_Sign_Cdf, Default_Comp_Bwd_Ref_Cdf, Default_Comp_Group_Idx_Cdf, Default_Comp_Mode_Cdf, Default_Comp_Ref_Cdf, Default_Comp_Ref_Type_Cdf, Default_Compound_Idx_Cdf, Default_Compound_Mode_Cdf, Default_Compound_Type_Cdf, Default_Delta_Lf_Cdf, Default_Delta_Q_Cdf, Default_Drl_Mode_Cdf, Default_Filter_Intra_Cdf, Default_Filter_Intra_Mode_Cdf, Default_Inter_Intra_Cdf, Default_Inter_Intra_Mode_Cdf, Default_Inter_Tx_Type_Set1_Cdf, Default_Inter_Tx_Type_Set2_Cdf, Default_Inter_Tx_Type_Set3_Cdf, Default_Interp_Filter_Cdf, Default_Intra_Tx_Type_Set1_Cdf, Default_Intra_Tx_Type_Set2_Cdf, Default_Intrabc_Cdf, Default_Is_Inter_Cdf, Default_Motion_Mode_Cdf, Default_New_Mv_Cdf, Default_Palette_Size_2_Uv_Color_Cdf, Default_Palette_Size_2_Y_Color_Cdf, Default_Palette_Size_3_Uv_Color_Cdf, Default_Palette_Size_3_Y_Color_Cdf, Default_Palette_Size_4_Uv_Color_Cdf, Default_Palette_Size_4_Y_Color_Cdf, Default_Palette_Size_5_Uv_Color_Cdf, Default_Palette_Size_5_Y_Color_Cdf, Default_Palette_Size_6_Uv_Color_Cdf, Default_Palette_Size_6_Y_Color_Cdf, Default_Palette_Size_7_Uv_Color_Cdf, Default_Palette_Size_7_Y_Color_Cdf, Default_Palette_Size_8_Uv_Color_Cdf, Default_Palette_Size_8_Y_Color_Cdf, Default_Palette_Uv_Mode_Cdf, Default_Palette_Uv_Size_Cdf, Default_Palette_Y_Mode_Cdf, Default_Palette_Y_Size_Cdf, Default_Partition_W128_Cdf, Default_Partition_W16_Cdf, Default_Partition_W32_Cdf, Default_Partition_W64_Cdf, Default_Partition_W8_Cdf, Default_Ref_Mv_Cdf, Default_Restoration_Type_Cdf, Default_Segment_Id_Cdf, Default_Segment_Id_Predicted_Cdf, Default_Single_Ref_Cdf, Default_Skip_Cdf, Default_Skip_Mode_Cdf, Default_Tx_16x16_Cdf, Default_Tx_32x32_Cdf, Default_Tx_64x64_Cdf, Default_Tx_8x8_Cdf, Default_Txfm_Split_Cdf, Default_Uni_Comp_Ref_Cdf, Default_Use_Obmc_Cdf, Default_Use_Sgrproj_Cdf, Default_Use_Wiener_Cdf, Default_Uv_Mode_Cfl_Allowed_Cdf, Default_Uv_Mode_Cfl_Not_Allowed_Cdf, Default_Wedge_Index_Cdf, Default_Wedge_Inter_Intra_Cdf, Default_Y_Mode_Cdf, Default_Zero_Mv_Cdf } from "./default_cdf_tables";
import { cdef_params, delta_lf_params, delta_q_params, frame_reference_mode, global_motion_params, loop_filter_params, lr_params, quantization_params, read_tx_mode, segmentation_params, skip_mode_params } from "./frame_params";
import { tile_info } from "./tile_info";

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




function init_non_coeff_cdfs(bs: Bitstream<ObuCtx>) {
    const c: any = bs.ctx;

    c.YModeCdf = Default_Y_Mode_Cdf;
    c.UVModeCflNotAllowedCdf = Default_Uv_Mode_Cfl_Not_Allowed_Cdf;
    c.UVModeCflAllowedCdf = Default_Uv_Mode_Cfl_Allowed_Cdf;
    c.AngleDeltaCdf = Default_Angle_Delta_Cdf;
    c.IntrabcCdf = Default_Intrabc_Cdf;
    c.PartitionW8Cdf = Default_Partition_W8_Cdf;
    c.PartitionW16Cdf = Default_Partition_W16_Cdf;
    c.PartitionW32Cdf = Default_Partition_W32_Cdf;
    c.PartitionW64Cdf = Default_Partition_W64_Cdf;
    c.PartitionW128Cdf = Default_Partition_W128_Cdf;
    c.SegmentIdCdf = Default_Segment_Id_Cdf;
    c.SegmentIdPredictedCdf = Default_Segment_Id_Predicted_Cdf;
    c.Tx8x8Cdf = Default_Tx_8x8_Cdf;
    c.Tx16x16Cdf = Default_Tx_16x16_Cdf;
    c.Tx32x32Cdf = Default_Tx_32x32_Cdf;
    c.Tx64x64Cdf = Default_Tx_64x64_Cdf;
    c.TxfmSplitCdf = Default_Txfm_Split_Cdf;
    c.FilterIntraModeCdf = Default_Filter_Intra_Mode_Cdf;
    c.FilterIntraCdf = Default_Filter_Intra_Cdf;
    c.InterpFilterCdf = Default_Interp_Filter_Cdf;
    c.MotionModeCdf = Default_Motion_Mode_Cdf;
    c.NewMvCdf = Default_New_Mv_Cdf;
    c.ZeroMvCdf = Default_Zero_Mv_Cdf;
    c.RefMvCdf = Default_Ref_Mv_Cdf;
    c.CompoundModeCdf = Default_Compound_Mode_Cdf;
    c.DrlModeCdf = Default_Drl_Mode_Cdf;
    c.IsInterCdf = Default_Is_Inter_Cdf;
    c.CompModeCdf = Default_Comp_Mode_Cdf;
    c.SkipModeCdf = Default_Skip_Mode_Cdf;
    c.SkipCdf = Default_Skip_Cdf;
    c.CompRefCdf = Default_Comp_Ref_Cdf;
    c.CompBwdRefCdf = Default_Comp_Bwd_Ref_Cdf;
    c.SingleRefCdf = Default_Single_Ref_Cdf;
    // MvJointCdf[i] is set to a copy of Default_Mv_Joint_Cdf for i = 0..MV_CONTEXTS - 1
    // MvClassCdf[i] is set to a copy of Default_Mv_Class_Cdf for i = 0..MV_CONTEXTS - 1
    // MvClass0BitCdf[i][comp] is set to a copy of Default_Mv_Class0_Bit_Cdf for i = 0..MV_CONTEXTS - 1 and comp = 0..1
    // MvFrCdf[i] is set to a copy of Default_Mv_Fr_Cdf for i = 0..MV_CONTEXTS - 1
    // MvClass0FrCdf[i] is set to a copy of Default_Mv_Class0_Fr_Cdf for i = 0..MV_CONTEXTS - 1
    // MvClass0HpCdf[i][comp] is set to a copy of Default_Mv_Class0_Hp_Cdf for i = 0..MV_CONTEXTS - 1 and comp = 0..1
    // MvSignCdf[i][comp] is set to a copy of Default_Mv_Sign_Cdf for i = 0..MV_CONTEXTS - 1 and comp = 0..1
    // MvBitCdf[i][comp] is set to a copy of Default_Mv_Bit_Cdf for i = 0..MV_CONTEXTS - 1 and comp = 0..1
    // MvHpCdf[i][comp] is set to a copy of Default_Mv_Hp_Cdf for i = 0..MV_CONTEXTS - 1 and comp = 0..1
    c.PaletteYModeCdf = Default_Palette_Y_Mode_Cdf;
    c.PaletteUVModeCdf = Default_Palette_Uv_Mode_Cdf;
    c.PaletteYSizeCdf = Default_Palette_Y_Size_Cdf;
    c.PaletteUVSizeCdf = Default_Palette_Uv_Size_Cdf;
    c.PaletteSize2YColorCdf = Default_Palette_Size_2_Y_Color_Cdf;
    c.PaletteSize2UVColorCdf = Default_Palette_Size_2_Uv_Color_Cdf;
    c.PaletteSize3YColorCdf = Default_Palette_Size_3_Y_Color_Cdf;
    c.PaletteSize3UVColorCdf = Default_Palette_Size_3_Uv_Color_Cdf;
    c.PaletteSize4YColorCdf = Default_Palette_Size_4_Y_Color_Cdf;
    c.PaletteSize4UVColorCdf = Default_Palette_Size_4_Uv_Color_Cdf;
    c.PaletteSize5YColorCdf = Default_Palette_Size_5_Y_Color_Cdf;
    c.PaletteSize5UVColorCdf = Default_Palette_Size_5_Uv_Color_Cdf;
    c.PaletteSize6YColorCdf = Default_Palette_Size_6_Y_Color_Cdf;
    c.PaletteSize6UVColorCdf = Default_Palette_Size_6_Uv_Color_Cdf;
    c.PaletteSize7YColorCdf = Default_Palette_Size_7_Y_Color_Cdf;
    c.PaletteSize7UVColorCdf = Default_Palette_Size_7_Uv_Color_Cdf;
    c.PaletteSize8YColorCdf = Default_Palette_Size_8_Y_Color_Cdf;
    c.PaletteSize8UVColorCdf = Default_Palette_Size_8_Uv_Color_Cdf;
    c.DeltaQCdf = Default_Delta_Q_Cdf;
    c.DeltaLFCdf = Default_Delta_Lf_Cdf;
    // DeltaLFMultiCdf[i] is set to a copy of Default_Delta_Lf_Cdf for i = 0..FRAME_LF_COUNT - 1
    c.IntraTxTypeSet1Cdf = Default_Intra_Tx_Type_Set1_Cdf;
    c.IntraTxTypeSet2Cdf = Default_Intra_Tx_Type_Set2_Cdf;
    c.InterTxTypeSet1Cdf = Default_Inter_Tx_Type_Set1_Cdf;
    c.InterTxTypeSet2Cdf = Default_Inter_Tx_Type_Set2_Cdf;
    c.InterTxTypeSet3Cdf = Default_Inter_Tx_Type_Set3_Cdf;
    c.UseObmcCdf = Default_Use_Obmc_Cdf;
    c.InterIntraCdf = Default_Inter_Intra_Cdf;
    c.CompRefTypeCdf = Default_Comp_Ref_Type_Cdf;
    c.CflSignCdf = Default_Cfl_Sign_Cdf;
    c.UniCompRefCdf = Default_Uni_Comp_Ref_Cdf;
    c.WedgeInterIntraCdf = Default_Wedge_Inter_Intra_Cdf;
    c.CompGroupIdxCdf = Default_Comp_Group_Idx_Cdf;
    c.CompoundIdxCdf = Default_Compound_Idx_Cdf;
    c.CompoundTypeCdf = Default_Compound_Type_Cdf;
    c.InterIntraModeCdf = Default_Inter_Intra_Mode_Cdf;
    c.WedgeIndexCdf = Default_Wedge_Index_Cdf;
    c.CflAlphaCdf = Default_Cfl_Alpha_Cdf;
    c.UseWienerCdf = Default_Use_Wiener_Cdf;
    c.UseSgrprojCdf = Default_Use_Sgrproj_Cdf;
    c.RestorationTypeCdf = Default_Restoration_Type_Cdf;
}


const uncompressed_header = (bs: Bitstream<ObuCtx>) => {
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
        bs.f("frame_type", 2, { e: FrameType })
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
    if (c.reduced_still_picture_header || c.disable_cdf_update)
        c.disable_frame_end_update_cdf = 1
    else
        bs.f(`disable_frame_end_update_cdf`, 1);
    if (c.primary_ref_frame == PRIMARY_REF_NONE) {
        init_non_coeff_cdfs(bs);
        // setup_past_independence()
    } else {
        // load_cdfs(c.ref_frame_idx[c.primary_ref_frame])
        // load_previous()
    }
    // if (c.use_ref_frame_mvs == 1)
    //     motion_field_estimation()
    tile_info(bs);
    quantization_params(bs);
    segmentation_params(bs);
    delta_q_params(bs);
    delta_lf_params(bs);
    // if (c.primary_ref_frame == PRIMARY_REF_NONE) {
    //     init_coeff_cdfs()
    // } else {
    //     load_previous_segment_ids()
    // }
    // c.CodedLossless = 1
    // for (let segmentId = 0; segmentId < constant.MAX_SEGMENTS; segmentId++) {
    //     // c.qindex = get_qindex(1, segmentId)
    //     c.LosslessArray[segmentId] = c.qindex == 0 && DeltaQYDc == 0 &&
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
    loop_filter_params(bs);
    cdef_params(bs);
    lr_params(bs);
    read_tx_mode(bs);
    frame_reference_mode(bs);
    skip_mode_params(bs);
    if (c.FrameIsIntra ||
        c.error_resilient_mode ||
        !c.enable_warped_motion)
        c.allow_warped_motion = 0
    else
        bs.f(`allow_warped_motion`, 1);
    bs.f(`reduced_tx_set`, 1);
    global_motion_params(bs)
    // film_grain_params(bs)

};

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