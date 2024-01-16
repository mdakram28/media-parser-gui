import { MAX_ITER, syntax } from "../../../bitstream/parser";
import { NaluCtx } from "../hevc-bitstream";
import { profile_tier_level } from "./profile_tier_level";
import { hrd_parameters } from "./hrd_parameters";

function limit_iter(i: number) {
    if (i > MAX_ITER) {
        const err = Error("Max iteration reached");
        console.error(err);
        throw err;
    }
}

const EXTENDED_SAR = 255;

const sps_range_extension = syntax("sps_range_extension", (bs: NaluCtx) => {
    bs.f(`transform_skip_rotation_enabled_flag`, 1);
    bs.f(`transform_skip_context_enabled_flag`, 1);
    bs.f(`implicit_rdpcm_enabled_flag`, 1);
    bs.f(`explicit_rdpcm_enabled_flag`, 1);
    bs.f(`extended_precision_processing_flag`, 1);
    bs.f(`intra_smoothing_disabled_flag`, 1);
    bs.f(`high_precision_offsets_enabled_flag`, 1);
    bs.f(`persistent_rice_adaptation_enabled_flag`, 1);
    bs.f(`cabac_bypass_alignment_enabled_flag`, 1);
});



const sps_scc_extension = syntax("sps_scc_extension", (bs: NaluCtx) => {
    const c: any = bs.ctx;
    bs.f(`sps_curr_pic_ref_enabled_flag`, 1);
    bs.f(`palette_mode_enabled_flag`, 1);
    if (c.palette_mode_enabled_flag) {
        bs.uvlc(`palette_max_size`);
        bs.uvlc(`delta_palette_max_predictor_size`);
        bs.f(`sps_palette_predictor_initializers_present_flag`, 1);
        if (c.sps_palette_predictor_initializers_present_flag) {
            bs.uvlc(`sps_num_palette_predictor_initializers_minus1`);
            const numComps = (c.chroma_format_idc == 0) ? 1 : 3
            for (let comp = 0; comp < numComps; comp++) {
                limit_iter(comp);
                for (let i = 0; i <= c.sps_num_palette_predictor_initializers_minus1; i++) {
                    limit_iter(i);
                    const BitDepthY = 8 + c.bit_depth_luma_minus8;
                    const BitDepthC = 8 + c.bit_depth_chroma_minus8;
                    const v = i == 0 ? BitDepthY : BitDepthC;
                    bs.f(`sps_palette_predictor_initializer[${comp}][${i}]`, v);
                }
            }
        }
    }
    bs.f(`motion_vector_resolution_control_idc`, 2);
    bs.f(`intra_boundary_filtering_disabled_flag`, 1);
});

const sps_multilayer_extension = syntax("sps_multilayer_extension", (bs: NaluCtx) => {
    bs.f("inter_view_mv_vert_constraint_flag", 1);
});


export const scaling_list_data = syntax("scaling_list_data", (bs: NaluCtx) => {
    const c: any = bs.ctx;

    for (let sizeId = 0; sizeId < 4; sizeId++) {
        limit_iter(sizeId);
        for (let matrixId = 0; matrixId < 6; matrixId += (sizeId == 3) ? 3 : 1) {
            limit_iter(matrixId);
            bs.f(`scaling_list_pred_mode_flag[ ${sizeId} ][ ${matrixId} ]`, 1);
            if (!c.scaling_list_pred_mode_flag[sizeId][matrixId])
                bs.uvlc(`scaling_list_pred_matrix_id_delta[ ${sizeId} ][ ${matrixId} ]`);
            else {
                let nextCoef = 8
                const coefNum = Math.min(64, (1 << (4 + (sizeId << 1))));
                if (sizeId > 1) {
                    bs.svlc(`scaling_list_dc_coef_minus8[${sizeId - 2} ][${matrixId}]`);
                    nextCoef = c.scaling_list_dc_coef_minus8[sizeId - 2][matrixId] + 8;
                }
                for (let i = 0; i < coefNum; i++) {
                    limit_iter(i);
                    bs.svlc("scaling_list_delta_coef");
                    nextCoef = (nextCoef + c.scaling_list_delta_coef + 256) % 256
                    bs.addSyntaxValue(`ScalingList[${sizeId}][${matrixId}][${i}]`, "Not from bitstream", nextCoef, bs.getPos(), true);
                }
            }
        }
    }
});


export const st_ref_pic_set = syntax("st_ref_pic_set", (bs: NaluCtx, stRpsIdx: number) => {
    const c: any = bs.ctx;
    if (stRpsIdx != 0)
        bs.f(`inter_ref_pic_set_prediction_flag`, 1);
    if (c.inter_ref_pic_set_prediction_flag) {
        if (stRpsIdx == c.num_short_term_ref_pic_sets)
            bs.uvlc(`delta_idx_minus1`);
        bs.f(`delta_rps_sign`, 1);
        bs.uvlc(`abs_delta_rps_minus1`);
        const RefRpsIdx = stRpsIdx - (c.delta_idx_minus1 + 1);
        for (let j = 0; j <= c.NumDeltaPocs[RefRpsIdx]; j++) {
            limit_iter(j);
            bs.f(`used_by_curr_pic_flag[${j}]`, 1);
            if (!c.used_by_curr_pic_flag[j])
                bs.f(`use_delta_flag[${j}]`, 1);
        }
    } else {
        bs.uvlc(`num_negative_pics`);
        bs.uvlc(`num_positive_pics`);
        for (let i = 0; i < c.num_negative_pics; i++) {
            limit_iter(i);
            bs.uvlc(`delta_poc_s0_minus1[${i}]`);
            bs.f(`used_by_curr_pic_s0_flag[${i}]`, 1);
        }
        for (let i = 0; i < c.num_positive_pics; i++) {
            limit_iter(i);
            bs.uvlc(`delta_poc_s1_minus1[${i}]`);
            bs.f(`used_by_curr_pic_s1_flag[${i}]`, 1);
        }
    }
});


const vui_parameters = syntax("vui_parameters", (bs: NaluCtx) => {
    const c: any = bs.ctx;

    bs.f(`aspect_ratio_info_present_flag`, 1);
    if (c.aspect_ratio_info_present_flag) {
        bs.f(`aspect_ratio_idc`, 8);
        if (c.aspect_ratio_idc == EXTENDED_SAR) {
            bs.f(`sar_width`, 16);
            bs.f(`sar_height`, 16);
        }
    }
    bs.f(`overscan_info_present_flag`, 1);
    if (c.overscan_info_present_flag)
        bs.f(`overscan_appropriate_flag`, 1);
    bs.f(`video_signal_type_present_flag`, 1);
    if (c.video_signal_type_present_flag) {
        bs.f(`video_format`, 3);
        bs.f(`video_full_range_flag`, 1);
        bs.f(`colour_description_present_flag`, 1);
        if (c.colour_description_present_flag) {
            bs.f(`colour_primaries`, 8);
            bs.f(`transfer_characteristics`, 8);
            bs.f(`matrix_coeffs`, 8);
        }
    }
    bs.f(`chroma_loc_info_present_flag`, 1);
    if (c.chroma_loc_info_present_flag) {
        bs.uvlc(`chroma_sample_loc_type_top_field`);
        bs.uvlc(`chroma_sample_loc_type_bottom_field`);
    }
    bs.f(`neutral_chroma_indication_flag`, 1);
    bs.f(`field_seq_flag`, 1);
    bs.f(`frame_field_info_present_flag`, 1);
    bs.f(`default_display_window_flag`, 1);
    if (c.default_display_window_flag) {
        bs.uvlc(`def_disp_win_left_offset`);
        bs.uvlc(`def_disp_win_right_offset`);
        bs.uvlc(`def_disp_win_top_offset`);
        bs.uvlc(`def_disp_win_bottom_offset`);
    }
    bs.f(`vui_timing_info_present_flag`, 1);
    if (c.vui_timing_info_present_flag) {
        bs.f(`vui_num_units_in_tick`, 32);
        bs.f(`vui_time_scale`, 32);
        bs.f(`vui_poc_proportional_to_timing_flag`, 1);
        if (c.vui_poc_proportional_to_timing_flag)
            bs.uvlc(`vui_num_ticks_poc_diff_one_minus1`);
        bs.f(`vui_hrd_parameters_present_flag`, 1);
        if (c.vui_hrd_parameters_present_flag)
            hrd_parameters(bs, 1, c.sps_max_sub_layers_minus1);
    }
    bs.f(`bitstream_restriction_flag`, 1);
    if (c.bitstream_restriction_flag) {
        bs.f(`tiles_fixed_structure_flag`, 1);
        bs.f(`motion_vectors_over_pic_boundaries_flag`, 1);
        bs.f(`restricted_ref_pic_lists_flag`, 1);
        bs.uvlc(`min_spatial_segmentation_idc`);
        bs.uvlc(`max_bytes_per_pic_denom`);
        bs.uvlc(`max_bits_per_min_cu_denom`);
        bs.uvlc(`log2_max_mv_length_horizontal`);
        bs.uvlc(`log2_max_mv_length_vertical`);
    }
});


const sps_3d_extension = syntax("sps_3d_extension", (bs: NaluCtx) => {
    const c: any = bs.ctx;

    for (let d = 0; d <= 1; d++) {
        limit_iter(d);
        bs.f(`iv_di_mc_enabled_flag[${d}]`, 1);
        bs.f(`iv_mv_scal_enabled_flag[${d}]`, 1);
        if (d == 0) {
            bs.uvlc(`log2_ivmc_sub_pb_size_minus3[${d}]`);
            bs.f(`iv_res_pred_enabled_flag[${d}]`, 1);
            bs.f(`depth_ref_enabled_flag[${d}]`, 1);
            bs.f(`vsp_mc_enabled_flag[${d}]`, 1);
            bs.f(`dbbp_enabled_flag[${d}]`, 1);
        } else {
            bs.f(`tex_mc_enabled_flag[${d}]`, 1);
            bs.uvlc(`log2_texmc_sub_pb_size_minus3[${d}]`);
            bs.f(`intra_contour_enabled_flag[${d}]`, 1);
            bs.f(`intra_dc_only_wedge_enabled_flag[${d}]`, 1);
            bs.f(`cqt_cu_part_pred_enabled_flag[${d}]`, 1);
            bs.f(`inter_dc_only_enabled_flag[${d}]`, 1);
            bs.f(`skip_intra_enabled_flag[${d}]`, 1);
        }
    }
})


export function seq_parameter_set_rbsp(bs: NaluCtx, end: number) {
    const c: any = bs.ctx;

    bs.f(`sps_video_parameter_set_id`, 4);
    bs.f(`sps_max_sub_layers_minus1`, 3);
    bs.f(`sps_temporal_id_nesting_flag`, 1);
    profile_tier_level(bs, 1, c.sps_max_sub_layers_minus1);
    bs.uvlc(`sps_seq_parameter_set_id`);
    bs.uvlc(`chroma_format_idc`);
    if (c.chroma_format_idc == 3)
        bs.f(`separate_colour_plane_flag`, 1);
    bs.uvlc(`pic_width_in_luma_samples`);
    bs.uvlc(`pic_height_in_luma_samples`);
    bs.f(`conformance_window_flag`, 1);
    if (c.conformance_window_flag) {
        bs.uvlc(`conf_win_left_offset`);
        bs.uvlc(`conf_win_right_offset`);
        bs.uvlc(`conf_win_top_offset`);
        bs.uvlc(`conf_win_bottom_offset`);
    }
    bs.uvlc(`bit_depth_luma_minus8`);
    bs.uvlc(`bit_depth_chroma_minus8`);
    bs.uvlc(`log2_max_pic_order_cnt_lsb_minus4`);
    bs.f(`sps_sub_layer_ordering_info_present_flag`, 1);
    for (let i = (c.sps_sub_layer_ordering_info_present_flag ? 0 : c.sps_max_sub_layers_minus1);
        i <= c.sps_max_sub_layers_minus1; i++) {
            limit_iter(i);
        bs.uvlc(`sps_max_dec_pic_buffering_minus1[${i}]`);
        bs.uvlc(`sps_max_num_reorder_pics[${i}]`);
        bs.uvlc(`sps_max_latency_increase_plus1[${i}]`);
    }
    bs.uvlc(`log2_min_luma_coding_block_size_minus3`);
    bs.uvlc(`log2_diff_max_min_luma_coding_block_size`);
    bs.uvlc(`log2_min_luma_transform_block_size_minus2`);
    bs.uvlc(`log2_diff_max_min_luma_transform_block_size`);
    bs.uvlc(`max_transform_hierarchy_depth_inter`);
    bs.uvlc(`max_transform_hierarchy_depth_intra`);
    bs.f(`scaling_list_enabled_flag`, 1);
    if (c.scaling_list_enabled_flag) {
        bs.f(`sps_scaling_list_data_present_flag`, 1);
        if (c.sps_scaling_list_data_present_flag)
            scaling_list_data(bs);
    }
    bs.f(`amp_enabled_flag`, 1);
    bs.f(`sample_adaptive_offset_enabled_flag`, 1);
    bs.f(`pcm_enabled_flag`, 1);
    if (c.pcm_enabled_flag) {
        bs.f(`pcm_sample_bit_depth_luma_minus1`, 4);
        bs.f(`pcm_sample_bit_depth_chroma_minus1`, 4);
        bs.uvlc(`log2_min_pcm_luma_coding_block_size_minus3`);
        bs.uvlc(`log2_diff_max_min_pcm_luma_coding_block_size`);
        bs.f(`pcm_loop_filter_disabled_flag`, 1);
    }
    bs.uvlc(`num_short_term_ref_pic_sets`);
    for (let i = 0; i < c.num_short_term_ref_pic_sets; i++) {
        limit_iter(i);
        st_ref_pic_set(bs, i);
    }
    bs.f(`long_term_ref_pics_present_flag`, 1);
    if (c.long_term_ref_pics_present_flag) {
        bs.uvlc(`num_long_term_ref_pics_sps`);
        for (let i = 0; i < c.num_long_term_ref_pics_sps; i++) {
            limit_iter(i);
            const v = c.log2_max_pic_order_cnt_lsb_minus4 + 4;
            bs.f(`lt_ref_pic_poc_lsb_sps[${i}]`, v);
            bs.f(`used_by_curr_pic_lt_sps_flag[${i}]`, 1);
        }
    }
    bs.f(`sps_temporal_mvp_enabled_flag`, 1);
    bs.f(`strong_intra_smoothing_enabled_flag`, 1);
    bs.f(`vui_parameters_present_flag`, 1);

    if (c.vui_parameters_present_flag)
        vui_parameters(bs);
    bs.f(`sps_extension_present_flag`, 1);
    if (c.sps_extension_present_flag) {
        bs.f(`sps_range_extension_flag`, 1);
        bs.f(`sps_multilayer_extension_flag`, 1);
        bs.f(`sps_3d_extension_flag`, 1);
        bs.f(`sps_scc_extension_flag`, 1);
        bs.f(`sps_extension_4bits`, 4);
    }
    if (c.sps_range_extension_flag)
        sps_range_extension(bs)
    if (c.sps_multilayer_extension_flag)
        sps_multilayer_extension(bs) /* specified in Annex F */
    if (c.sps_3d_extension_flag)
        sps_3d_extension(bs) /* specified in Annex I */
    if (c.sps_scc_extension_flag)
        sps_scc_extension(bs)
    // if (c.sps_extension_4bits)
        // while (bs.getPos() < end)
        //     bs.f(`sps_extension_data_flag`, 1);
    // rbsp_trailing_bits()
}
