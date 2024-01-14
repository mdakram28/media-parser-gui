// import { syntax } from "../../../bitstream/parser";
// import { NALU_TYPE, NaluCtx } from "../hevc-bitstream";
// import { st_ref_pic_set } from "./seq_parameter_set_rbsp";

// enum SliceType {
//     B = 0,
//     P = 1,
//     I = 2
// };

// const ref_pic_lists_modification = syntax("ref_pic_lists_modification", (bs: NaluCtx) => {
//     const c: any = bs.ctx;

//     bs.f(`ref_pic_list_modification_flag_l0`, 1);
//     if (c.ref_pic_list_modification_flag_l0)
//         for (let i = 0; i <= c.num_ref_idx_l0_active_minus1; i++)
//             bs.f(`list_entry_l0[${i}]`, v);
//     if (c.slice_type == B) {
//         bs.f(`ref_pic_list_modification_flag_l1`, 1);
//         if (c.ref_pic_list_modification_flag_l1)
//             for (let i = 0; i <= c.num_ref_idx_l1_active_minus1; i++)
//                 bs.f(`list_entry_l1[${i}]`, v);
//     }
// });




// const pred_weight_table = syntax("pred_weight_table", (bs: NaluCtx) => {
//     const c: any = bs.ctx;
//     const ChromaArrayType = c.separate_colour_plane_flag == 0 ? c.chroma_format_idc : 0;

//     bs.uvlc(`luma_log2_weight_denom`);
//     if( ChromaArrayType != 0 )
//     bs.svlc(`delta_chroma_log2_weight_denom`);
//     for(let i= 0; i <= c.num_ref_idx_l0_active_minus1; i++ )
//     if( ( pic_layer_id( RefPicList0[ i ] ) != c.nuh_layer_id ) ||
//     ( PicOrderCnt( RefPicList0[ i ] ) != PicOrderCnt( CurrPic ) ) )
//     bs.f(`luma_weight_l0_flag[${i}]`, 1);
//     if( ChromaArrayType != 0 )
//     for(let i= 0; i <= c.num_ref_idx_l0_active_minus1; i++ )
//     if( ( pic_layer_id( RefPicList0[ i ] ) != nuh_layer_id ) ||
//     ( PicOrderCnt(RefPicList0[ i ]) != PicOrderCnt( CurrPic ) ) )
//     bs.f(`chroma_weight_l0_flag[${i}]`, 1);
//     for(let i= 0; i <= c.num_ref_idx_l0_active_minus1; i++ ) {
//         if( c.luma_weight_l0_flag[ i ] ) {
//             bs.svlc(`delta_luma_weight_l0[${i}]`);
//             bs.svlc(`luma_offset_l0[${i}]`);
//         }
//         if( c.chroma_weight_l0_flag[ i ] )
//         for(let j= 0; j < 2; j++ ) {
//             bs.svlc(`delta_chroma_weight_l0[${i}][${j}]`);
//             bs.svlc(`delta_chroma_offset_l0[${i}][${j}]`);
//         }
//     }
//     if( c.slice_type == B ) {
//         for(let i= 0; i <= num_ref_idx_l1_active_minus1; i++ )
//         if( ( pic_layer_id( RefPicList0[ i ] ) != nuh_layer_id ) ||
//         ( PicOrderCnt(RefPicList1[ i ]) != PicOrderCnt( CurrPic ) ) )
//         bs.f(`luma_weight_l1_flag[${i}]`, 1);
//         if( ChromaArrayType != 0 )
//         for(let i= 0; i <= num_ref_idx_l1_active_minus1; i++ )
//         if( ( pic_layer_id( RefPicList0[ i ] ) != nuh_layer_id ) ||
//         ( PicOrderCnt(RefPicList1[ i ]) != PicOrderCnt( CurrPic ) ) )
//         bs.f(`chroma_weight_l1_flag[${i}]`, 1);
//         for(let i= 0; i <= num_ref_idx_l1_active_minus1; i++ ) {
//             if( c.luma_weight_l1_flag[ i ] ) {
//                 bs.svlc(`delta_luma_weight_l1[${i}]`);
//                 bs.svlc(`luma_offset_l1[${i}]`);
//             }
//             if( c.chroma_weight_l1_flag[ i ] )
//             for(let j= 0; j < 2; j++ ) {
//                 bs.svlc(`delta_chroma_weight_l1[${i}][${j}]`);
//                 bs.svlc(`delta_chroma_offset_l1[${i}][${j}]`);
//             }
//         }
//     }
// });



// export function slice_segment_header(bs: NaluCtx, end: number) {
//     const c: any = bs.ctx;

//     // If separate_colour_plane_flag is equal to 0, ChromaArrayType is set equal to chroma_format_idc.
//     // – Otherwise (separate_colour_plane_flag is equal to 1), ChromaArrayType is set equal to 0.
//     const ChromaArrayType = c.separate_colour_plane_flag == 0 ? c.chroma_format_idc : 0;

//     bs.f(`first_slice_segment_in_pic_flag`, 1);
//     if (c.nal_unit_type >= NALU_TYPE.BLA_W_LP && c.nal_unit_type <= NALU_TYPE.RSV_IRAP_VCL23)
//         bs.f(`no_output_of_prior_pics_flag`, 1);
//     bs.uvlc(`slice_pic_parameter_set_id`);
//     if (!c.first_slice_segment_in_pic_flag) {
//         if (c.dependent_slice_segments_enabled_flag)
//             bs.f(`dependent_slice_segment_flag`, 1);
//         bs.f(`slice_segment_address`, v);
//     }
//     if (!c.dependent_slice_segment_flag) {
//         for (let i = 0; i < c.num_extra_slice_header_bits; i++)
//             bs.f(`slice_reserved_flag[${i}]`, 1);
//         bs.uvlc(`slice_type`, SliceType);
//         if (c.output_flag_present_flag)
//             bs.f(`pic_output_flag`, 1);
//         if (c.separate_colour_plane_flag == 1)
//             bs.f(`colour_plane_id`, 2);
//         if (c.nal_unit_type != NALU_TYPE.IDR_W_RADL && c.nal_unit_type != NALU_TYPE.IDR_N_LP) {
//             bs.f(`slice_pic_order_cnt_lsb`, v);
//             bs.f(`short_term_ref_pic_set_sps_flag`, 1);
//             if (!c.short_term_ref_pic_set_sps_flag)
//                 st_ref_pic_set(bs, c.num_short_term_ref_pic_sets);
//             else if (c.num_short_term_ref_pic_sets > 1)
//                 bs.f(`short_term_ref_pic_set_idx`, v);
//             if (c.long_term_ref_pics_present_flag) {
//                 if (c.num_long_term_ref_pics_sps > 0)
//                     bs.uvlc(`num_long_term_sps`);
//                 bs.uvlc(`num_long_term_pics`);
//                 for (let i = 0; i < c.num_long_term_sps + c.num_long_term_pics; i++) {
//                     if (i < c.num_long_term_sps) {
//                         if (c.num_long_term_ref_pics_sps > 1)
//                             bs.f(`lt_idx_sps[${i}]`, v);
//                     } else {
//                         bs.f(`poc_lsb_lt[${i}]`, v);
//                         bs.f(`used_by_curr_pic_lt_flag[${i}]`, 1);
//                     }
//                     bs.f(`delta_poc_msb_present_flag[${i}]`, 1);
//                     if (c.delta_poc_msb_present_flag[i])
//                         bs.uvlc(`delta_poc_msb_cycle_lt[${i}]`);
//                 }
//             }
//             if (c.sps_temporal_mvp_enabled_flag)
//                 bs.f(`slice_temporal_mvp_enabled_flag`, 1);
//         }
//         if (c.sample_adaptive_offset_enabled_flag) {
//             bs.f(`slice_sao_luma_flag`, 1);
//             if (ChromaArrayType != 0)
//                 bs.f(`slice_sao_chroma_flag`, 1);
//         }
//         if (c.slice_type == SliceType.P || c.slice_type == B) {
//             bs.f(`num_ref_idx_active_override_flag`, 1);
//             if (c.num_ref_idx_active_override_flag) {
//                 bs.uvlc(`num_ref_idx_l0_active_minus1`);
//                 if (c.slice_type == B)
//                     bs.uvlc(`num_ref_idx_l1_active_minus1`);
//             }
//             if (c.lists_modification_present_flag && NumPicTotalCurr > 1)
//                 ref_pic_lists_modification(bs);
//             if (c.slice_type == SliceType.B)
//                 bs.f(`mvd_l1_zero_flag`, 1);
//             if (c.cabac_init_present_flag)
//                 bs.f(`cabac_init_flag`, 1);
//             if (c.slice_temporal_mvp_enabled_flag) {
//                 if (c.slice_type == SliceType.B)
//                     bs.f(`collocated_from_l0_flag`, 1);
//                 if ((c.collocated_from_l0_flag && c.num_ref_idx_l0_active_minus1 > 0) ||
//                     (!c.collocated_from_l0_flag && c.num_ref_idx_l1_active_minus1 > 0))
//                     bs.uvlc(`collocated_ref_idx`);
//             }
//             if ((c.weighted_pred_flag && c.slice_type == SliceType.P) ||
//                 (c.weighted_bipred_flag && c.slice_type == SliceType.B))
//                 pred_weight_table(bs);
//             bs.uvlc(`five_minus_max_num_merge_cand`);
//             if (c.motion_vector_resolution_control_idc == 2)
//                 bs.f(`use_integer_mv_flag`, 1);
//         }
//         bs.svlc(`slice_qp_delta`);
//         if (c.pps_slice_chroma_qp_offsets_present_flag) {
//             bs.svlc(`slice_cb_qp_offset`);
//             bs.svlc(`slice_cr_qp_offset`);
//         }
//         if (c.pps_slice_act_qp_offsets_present_flag) {
//             bs.svlc(`slice_act_y_qp_offset`);
//             bs.svlc(`slice_act_cb_qp_offset`);
//             bs.svlc(`slice_act_cr_qp_offset`);
//         }
//         if (c.chroma_qp_offset_list_enabled_flag)
//             bs.f(`cu_chroma_qp_offset_enabled_flag`, 1);
//         if (c.deblocking_filter_override_enabled_flag)
//             bs.f(`deblocking_filter_override_flag`, 1);
//         if (c.deblocking_filter_override_flag) {
//             bs.f(`slice_deblocking_filter_disabled_flag`, 1);
//             if (!c.slice_deblocking_filter_disabled_flag) {
//                 bs.svlc(`slice_beta_offset_div2`);
//                 bs.svlc(`slice_tc_offset_div2`);
//             }
//         }
//         if (c.pps_loop_filter_across_slices_enabled_flag &&
//             (c.slice_sao_luma_flag || c.slice_sao_chroma_flag ||
//                 !c.slice_deblocking_filter_disabled_flag))
//             bs.f(`slice_loop_filter_across_slices_enabled_flag`, 1);
//     }
//     if (c.tiles_enabled_flag || c.entropy_coding_sync_enabled_flag) {
//         bs.uvlc(`num_entry_point_offsets`);
//         if (c.num_entry_point_offsets > 0) {
//             bs.uvlc(`offset_len_minus1`);
//             for (let i = 0; i < c.num_entry_point_offsets; i++)
//                 bs.f(`entry_point_offset_minus1[${i}]`, v);
//         }
//     }
//     if (c.slice_segment_header_extension_present_flag) {
//         bs.uvlc(`slice_segment_header_extension_length`);
//         for (let i = 0; i < c.slice_segment_header_extension_length; i++)
//             bs.f(`slice_segment_header_extension_data_byte[${i}]`, 8);
//     }
//     bs.byteAlign();
// }