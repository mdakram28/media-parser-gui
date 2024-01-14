import { syntax } from "../../../bitstream/parser";
import { NaluCtx } from "../hevc-bitstream";
import { scaling_list_data } from "./seq_parameter_set_rbsp";


const pps_range_extension = syntax("pps_range_extension", (bs: NaluCtx) => {
    const c: any = bs.ctx;
    if (c.transform_skip_enabled_flag)
        bs.uvlc(`log2_max_transform_skip_block_size_minus2`);
    bs.f(`cross_component_prediction_enabled_flag`, 1);
    bs.f(`chroma_qp_offset_list_enabled_flag`, 1);
    if (c.chroma_qp_offset_list_enabled_flag) {
        bs.uvlc(`diff_cu_chroma_qp_offset_depth`);
        bs.uvlc(`chroma_qp_offset_list_len_minus1`);
        for (let i = 0; i <= c.chroma_qp_offset_list_len_minus1; i++) {
            bs.svlc(`cb_qp_offset_list[${i}]`);
            bs.svlc(`cr_qp_offset_list[${i}]`);
        }
    }
    bs.uvlc(`log2_sao_offset_scale_luma`);
    bs.uvlc(`log2_sao_offset_scale_chroma`);
});


const pps_scc_extension = syntax("pps_scc_extension", (bs: NaluCtx) => {

    const c: any = bs.ctx;
    bs.f(`pps_curr_pic_ref_enabled_flag`, 1);
    bs.f(`residual_adaptive_colour_transform_enabled_flag`, 1);
    if (c.residual_adaptive_colour_transform_enabled_flag) {
        bs.f(`pps_slice_act_qp_offsets_present_flag`, 1);
        bs.svlc(`pps_act_y_qp_offset_plus5`);
        bs.svlc(`pps_act_cb_qp_offset_plus5`);
        bs.svlc(`pps_act_cr_qp_offset_plus3`);
    }
    bs.f(`pps_palette_predictor_initializers_present_flag`, 1);
    if (c.pps_palette_predictor_initializers_present_flag) {
        bs.uvlc(`pps_num_palette_predictor_initializers`);
        if (c.pps_num_palette_predictor_initializers > 0) {
            bs.f(`monochrome_palette_flag`, 1);
            bs.uvlc(`luma_bit_depth_entry_minus8`);
            if (!c.monochrome_palette_flag)
                bs.uvlc(`chroma_bit_depth_entry_minus8`);
            const numComps = c.monochrome_palette_flag ? 1 : 3
            for (let comp = 0; comp < numComps; comp++)
                for (let i = 0; i < c.pps_num_palette_predictor_initializers; i++) {
                    let v: number;
                    if (i == 0)
                        v = c.luma_bit_depth_entry_minus8 + 8;
                    else if (i == 1 || i == 2)
                        v = c.chroma_bit_depth_entry_minus8 + 8;
                    else throw Error("Bad bad bad");
                    bs.f(`pps_palette_predictor_initializer[${comp}][${i}]`, v);
                }
        }
    }
});



const pps_multilayer_extension = syntax("pps_multilayer_extension", (bs: NaluCtx) => {
    const c: any = bs.ctx;
    bs.f(`poc_reset_info_present_flag`, 1);
    bs.f(`pps_infer_scaling_list_flag`, 1);
    if (c.pps_infer_scaling_list_flag)
        bs.f(`pps_scaling_list_ref_layer_id`, 6);
    bs.uvlc(`num_ref_loc_offsets`);
    for (let i = 0; i < c.num_ref_loc_offsets; i++) {
        bs.f(`ref_loc_offset_layer_id[${i}]`, 6);
        bs.f(`scaled_ref_layer_offset_present_flag[${i}]`, 1);
        if (c.scaled_ref_layer_offset_present_flag[i]) {
            bs.svlc(`scaled_ref_layer_left_offset[${c.ref_loc_offset_layer_id[i]}]`);
            bs.svlc(`scaled_ref_layer_top_offset[${c.ref_loc_offset_layer_id[i]}]`);
            bs.svlc(`scaled_ref_layer_right_offset[${c.ref_loc_offset_layer_id[i]}]`);
            bs.svlc(`scaled_ref_layer_bottom_offset[${c.ref_loc_offset_layer_id[i]}]`);
        }
        bs.f(`ref_region_offset_present_flag[${i}]`, 1);
        if (c.ref_region_offset_present_flag[i]) {
            bs.svlc(`ref_region_left_offset[${c.ref_loc_offset_layer_id[i]}]`);
            bs.svlc(`ref_region_top_offset[${c.ref_loc_offset_layer_id[i]}]`);
            bs.svlc(`ref_region_right_offset[${c.ref_loc_offset_layer_id[i]}]`);
            bs.svlc(`ref_region_bottom_offset[${c.ref_loc_offset_layer_id[i]}]`);
        }
        bs.f(`resample_phase_set_present_flag[${i}]`, 1);
        if (c.resample_phase_set_present_flag[i]) {
            bs.uvlc(`phase_hor_luma[${c.ref_loc_offset_layer_id[i]}]`);
            bs.uvlc(`phase_ver_luma[${c.ref_loc_offset_layer_id[i]}]`);
            bs.uvlc(`phase_hor_chroma_plus8[${c.ref_loc_offset_layer_id[i]}]`);
            bs.uvlc(`phase_ver_chroma_plus8[${c.ref_loc_offset_layer_id[i]}]`);
        }
    }
    bs.f(`colour_mapping_enabled_flag`, 1);
    if (c.colour_mapping_enabled_flag)
        colour_mapping_table(bs);
});


const colour_mapping_table = syntax("colour_mapping_table", (bs: NaluCtx) => {
    const c: any = bs.ctx;

    bs.uvlc(`num_cm_ref_layers_minus1`);
    for (let i = 0; i <= c.num_cm_ref_layers_minus1; i++)
        bs.f(`cm_ref_layer_id[${i}]`, 6);
    bs.f(`cm_octant_depth`, 2);
    bs.f(`cm_y_part_num_log2`, 2);
    bs.uvlc(`luma_bit_depth_cm_input_minus8`);
    bs.uvlc(`chroma_bit_depth_cm_input_minus8`);
    bs.uvlc(`luma_bit_depth_cm_output_minus8`);
    bs.uvlc(`chroma_bit_depth_cm_output_minus8`);
    bs.f(`cm_res_quant_bits`, 2);
    bs.f(`cm_delta_flc_bits_minus1`, 2);
    if (c.cm_octant_depth == 1) {
        bs.svlc(`cm_adapt_threshold_u_delta`);
        bs.svlc(`cm_adapt_threshold_v_delta`);
    }
    colour_mapping_octants(bs, 0, 0, 0, 0, 1 << c.cm_octant_depth)
});

const colour_mapping_octants = syntax("colour_mapping_octants", (bs: NaluCtx, inpDepth, idxY, idxCb, idxCr, inpLength) => {
    const c: any = bs.ctx;
    const BitDepthCmInputY = 8 + c.luma_bit_depth_cm_input_minus8;
    const BitDepthCmOutputY = 8 + c.luma_bit_depth_cm_output_minus8;
    const CMResLSBits = Math.max(0, (10 + BitDepthCmInputY - BitDepthCmOutputY - c.cm_res_quant_bits - (c.cm_delta_flc_bits_minus1 + 1)));
    const OctantNumY = 1 << (c.cm_octant_depth + c.cm_y_part_num_log2);
    const PartNumY = 1 << c.cm_y_part_num_log2;

    if (inpDepth < c.cm_octant_depth)
        bs.f(`split_octant_flag`, 1);
    if (c.split_octant_flag)
        for (let k = 0; k < 2; k++)
            for (let m = 0; m < 2; m++)
                for (let n = 0; n < 2; n++)
                    colour_mapping_octants(bs, inpDepth + 1, idxY + PartNumY * k * inpLength / 2,
                        idxCb + m * inpLength / 2, idxCr + n * inpLength / 2, inpLength / 2)
    else
        for (let i = 0; i < PartNumY; i++) {
            const idxShiftY = idxY + (i << (c.cm_octant_depth - inpDepth));
            for (let j = 0; j < 4; j++) {
                bs.f(`coded_res_flag[${idxShiftY}][${idxCb}][${idxCr}][${j}]`, 1);
                if (c.coded_res_flag[idxShiftY][idxCb][idxCr][j])
                    for (let _c = 0; _c < 3; _c++) {
                        bs.uvlc(`res_coeff_q[${idxShiftY}][${idxCb}][${idxCr}][${j}][${_c}]`);
                        bs.f(`res_coeff_r[${idxShiftY}][${idxCb}][${idxCr}][${j}][${_c}]`, CMResLSBits);
                        if (c.res_coeff_q[idxShiftY][idxCb][idxCr][j][_c] ||
                            c.res_coeff_r[idxShiftY][idxCb][idxCr][j][_c])
                            bs.f(`res_coeff_s[${idxShiftY}][${idxCb}][${idxCr}][${j}][${_c}]`, 1);
                    }
            }
        }
});


const pps_3d_extension = syntax("pps_3d_extension", (bs: NaluCtx) => {
    const c: any = bs.ctx;

    bs.f(`dlts_present_flag`, 1);
    if (c.dlts_present_flag) {
        bs.f(`pps_depth_layers_minus1`, 6);
        bs.f(`pps_bit_depth_for_depth_layers_minus8`, 4);

        const depthMaxValue = (1 << (c.pps_bit_depth_for_depth_layers_minus8 + 8)) - 1;

        for (let i = 0; i <= c.pps_depth_layers_minus1; i++) {
            bs.f(`dlt_flag[${i}]`, 1);
            if (c.dlt_flag[i]) {
                bs.f(`dlt_pred_flag[${i}]`, 1);
                if (!c.dlt_pred_flag[i])
                    bs.f(`dlt_val_flags_present_flag[${i}]`, 1);
                if (c.dlt_val_flags_present_flag[i])
                    for (let j = 0; j <= depthMaxValue; j++)
                        bs.f(`dlt_value_flag[${i}][${j}]`, 1);
                else
                    delta_dlt(bs, i);
            }
        }
    }
});

const delta_dlt = syntax("delta_dlt", (bs: NaluCtx, i: number) => {
    const c: any = bs.ctx;
    const v = c.pps_bit_depth_for_depth_layers_minus8 + 8;
    bs.f("bs.num_val_delta_dlt", v);
    if (c.num_val_delta_dlt > 0) {
        if (c.num_val_delta_dlt > 1)
            bs.f("max_diff", v);
        if (c.num_val_delta_dlt > 2 && c.max_diff > 0)
            bs.f("min_diff_minus1", Math.ceil(Math.log2(c.max_diff + 1)));
        bs.f("delta_dlt_val0", v);
        if (c.max_diff > (c.min_diff_minus1 + 1)) {
            const len = Math.ceil(Math.log2(c.max_diff - c.minDiff + 1));
            for (let k = 1; k < c.num_val_delta_dlt; k++)
                bs.f(`delta_val_diff_minus_min[${k}]`, len);
        }
    }
});







export function pic_parameter_set_rbsp(bs: NaluCtx, end: number) {
    const c: any = bs.ctx;
    bs.uvlc(`pps_pic_parameter_set_id`);
    bs.uvlc(`pps_seq_parameter_set_id`);
    bs.f(`dependent_slice_segments_enabled_flag`, 1);
    bs.f(`output_flag_present_flag`, 1);
    bs.f(`num_extra_slice_header_bits`, 3);
    bs.f(`sign_data_hiding_enabled_flag`, 1);
    bs.f(`cabac_init_present_flag`, 1);
    bs.uvlc(`num_ref_idx_l0_default_active_minus1`);
    bs.uvlc(`num_ref_idx_l1_default_active_minus1`);
    bs.svlc(`init_qp_minus26`);
    bs.f(`constrained_intra_pred_flag`, 1);
    bs.f(`transform_skip_enabled_flag`, 1);
    bs.f(`cu_qp_delta_enabled_flag`, 1);
    if (c.cu_qp_delta_enabled_flag)
        bs.uvlc(`diff_cu_qp_delta_depth`);
    bs.svlc(`pps_cb_qp_offset`);
    bs.svlc(`pps_cr_qp_offset`);
    bs.f(`pps_slice_chroma_qp_offsets_present_flag`, 1);
    bs.f(`weighted_pred_flag`, 1);
    bs.f(`weighted_bipred_flag`, 1);
    bs.f(`transquant_bypass_enabled_flag`, 1);
    bs.f(`tiles_enabled_flag`, 1);
    bs.f(`entropy_coding_sync_enabled_flag`, 1);
    if (c.tiles_enabled_flag) {
        bs.uvlc(`num_tile_columns_minus1`);
        bs.uvlc(`num_tile_rows_minus1`);
        bs.f(`uniform_spacing_flag`, 1);
        if (!c.uniform_spacing_flag) {
            for (let i = 0; i < c.num_tile_columns_minus1; i++)
                bs.uvlc(`column_width_minus1[${i}]`);
            for (let i = 0; i < c.num_tile_rows_minus1; i++)
                bs.uvlc(`row_height_minus1[${i}]`);
        }
        bs.f(`loop_filter_across_tiles_enabled_flag`, 1);
    }
    bs.f(`pps_loop_filter_across_slices_enabled_flag`, 1);
    bs.f(`deblocking_filter_control_present_flag`, 1);
    if (c.deblocking_filter_control_present_flag) {
        bs.f(`deblocking_filter_override_enabled_flag`, 1);
        bs.f(`pps_deblocking_filter_disabled_flag`, 1);
        if (!c.pps_deblocking_filter_disabled_flag) {
            bs.svlc(`pps_beta_offset_div2`);
            bs.svlc(`pps_tc_offset_div2`);
        }
    }
    bs.f(`pps_scaling_list_data_present_flag`, 1);
    if (c.pps_scaling_list_data_present_flag)
        scaling_list_data(bs);
    bs.f(`lists_modification_present_flag`, 1);
    bs.uvlc(`log2_parallel_merge_level_minus2`);
    bs.f(`slice_segment_header_extension_present_flag`, 1);
    bs.f(`pps_extension_present_flag`, 1);
    if (c.pps_extension_present_flag) {
        bs.f(`pps_range_extension_flag`, 1);
        bs.f(`pps_multilayer_extension_flag`, 1);
        bs.f(`pps_3d_extension_flag`, 1);
        bs.f(`pps_scc_extension_flag`, 1);
        bs.f(`pps_extension_4bits`, 4);
    }
    if (c.pps_range_extension_flag)
        pps_range_extension(bs);
    if (c.pps_multilayer_extension_flag)
        pps_multilayer_extension(bs) /* specified in Annex F */
    if (c.pps_3d_extension_flag)
        pps_3d_extension(bs); /* specified in Annex I */
    if (c.pps_scc_extension_flag)
        pps_scc_extension(bs);
    if (c.pps_extension_4bits)
        while (bs.getPos() < end)
            bs.f(`pps_extension_data_flag`, 1);
    // rbsp_trailing_bits()
}

