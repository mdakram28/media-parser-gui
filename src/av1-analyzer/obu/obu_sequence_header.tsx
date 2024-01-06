import { Bitstream, ObuCtx, syntax } from "../av1-bitstream";

const SELECT_SCREEN_CONTENT_TOOLS = 2;
const SELECT_INTEGER_MV = 2;

enum ChromaSamplePos {
    CSP_UNKNOWN = 0,                // Unknown (in this case the source video transfer function must be signaled outside the AV1 bitstream)
    CSP_VERTICAL = 1,               // Horizontally co-located with (0, 0) luma sample, vertical position in the middle between two luma samples
    CSP_COLOCATED = 2,              // co-located with (0, 0) luma sample
    CSP_RESERVED = 3,
}

enum MatrixCoeff {
    MC_IDENTITY = 0,                // Identity matrix
    MC_BT_709 = 1,                  // BT.709
    MC_UNSPECIFIED = 2,             // Unspecified
    MC_RESERVED_3 = 3,              // For future use
    MC_FCC = 4,                     // US FCC 73.628
    MC_BT_470_B_G = 5,              // BT.470 System B, G (historical)
    MC_BT_601 = 6,                  // BT.601
    MC_SMPTE_240 = 7,               // SMPTE 240 M
    MC_SMPTE_YCGCO = 8,             // YCgCo
    MC_BT_2020_NCL = 9,             // BT.2020 non-constant luminance, BT.2100 YCbCr
    MC_BT_2020_CL = 10,             // BT.2020 constant luminance
    MC_SMPTE_2085 = 11,             // SMPTE ST 2085 YDzDx
    MC_CHROMAT_NCL = 12,            // Chromaticity-derived non-constant luminance
    MC_CHROMAT_CL = 13,             // Chromaticity-derived constant luminance
    MC_ICTCP = 14,                  // BT.2100 ICtCp
}

enum TransferCharacterestics {
    TC_RESERVED_0 = 0,              // For future use
    TC_BT_709 = 1,                  // BT.709
    TC_UNSPECIFIED = 2,             // Unspecified
    TC_RESERVED_3 = 3,              // For future use
    TC_BT_470_M = 4,                // BT.470 System M (historical)
    TC_BT_470_B_G = 5,              // BT.470 System B, G (historical)
    TC_BT_601 = 6,                  // BT.601
    TC_SMPTE_240 = 7,               // SMPTE 240 M
    TC_LINEAR = 8,                  // Linear
    TC_LOG_100 = 9,                 // Logarithmic (100 : 1 range)
    TC_LOG_100_SQRT10 = 10,         // Logarithmic (100 * Sqrt(10) : 1 range)
    TC_IEC_61966 = 11,              // IEC 61966-2-4
    TC_BT_1361 = 12,                // BT.1361
    TC_SRGB = 13,                   // sRGB or sYCC
    TC_BT_2020_10_BIT = 14,         // BT.2020 10-bit systems
    TC_BT_2020_12_BIT = 15,         // BT.2020 12-bit systems
    TC_SMPTE_2084 = 16,             // SMPTE ST 2084, ITU BT.2100 PQ
    TC_SMPTE_428 = 17,              // SMPTE ST 428
    TC_HLG = 18,                    // BT.2100 HLG, ARIB STD-B67
}

enum ColorPrimaries {
    CP_BT_709 = 1,                  // BT.709
    CP_UNSPECIFIED = 2,             // Unspecified
    CP_BT_470_M = 4,                // BT.470 System M (historical)
    CP_BT_470_B_G = 5,              // BT.470 System B, G (historical)
    CP_BT_601 = 6,                  // BT.601
    CP_SMPTE_240 = 7,               // SMPTE 240
    CP_GENERIC_FILM = 8,            // Generic film (color filters using illuminant C)
    CP_BT_2020 = 9,                 // BT.2020, BT.2100
    CP_XYZ = 10,                    // SMPTE 428 (CIE 1921 XYZ)
    CP_SMPTE_431 = 11,              // SMPTE RP 431-2
    CP_SMPTE_432 = 12,              // SMPTE EG 432-1
    CP_EBU_3213 = 22,               // EBU Tech. 3213-E
}

const timing_info = syntax("timing_info", (bs: Bitstream<ObuCtx>) => {
    bs.f("num_units_in_display_tick", 32)
    bs.f("time_scale", 32)
    bs.f("equal_picture_interval", 1)
    if (bs.ctx.equal_picture_interval)
        bs.uvlc("num_ticks_per_picture_minus_1")
});

const decoder_model_info = syntax("decoder_model_info", (bs: Bitstream<ObuCtx>) => {
    bs.f("buffer_delay_length_minus_1", 5)
    bs.f("num_units_in_decoding_tick", 32)
    bs.f("buffer_removal_time_length_minus_1", 5)
    bs.f("frame_presentation_time_length_minus_1", 5)
});

const operating_parameters_info = syntax("operating_parameters_info", (bs: Bitstream<ObuCtx>, op: number) => {
    const c = bs.ctx;
    const n = c.buffer_delay_length_minus_1 + 1
    bs.f(`decoder_buffer_delay[${op}]`, n)
    bs.f(`encoder_buffer_delay[${op}]`, n)
    bs.f(`low_delay_mode_flag[${op}]`, 1)
})

const choose_operating_point = (bs: Bitstream<ObuCtx>) => {
    return bs.ctx.operating_points_cnt_minus_1;
}

const color_config = syntax("color_config", (bs: Bitstream<ObuCtx>) => {
    const c = bs.ctx;
    bs.f("high_bitdepth", 1)
    if (c.seq_profile == 2 && c.high_bitdepth) {
        bs.f("twelve_bit", 1)
        c.BitDepth = c.twelve_bit ? 12 : 10
    } else if (c.seq_profile <= 2) {
        c.BitDepth = c.high_bitdepth ? 10 : 8
    }
    if (c.seq_profile == 1) {
        c.mono_chrome = 0
    } else {
        bs.f("mono_chrome", 1)
    }
    c.NumPlanes = c.mono_chrome ? 1 : 3
    bs.f("color_description_present_flag", 1)
    if (c.color_description_present_flag) {
        bs.f("color_primaries", 8)
        bs.f("transfer_characteristics", 8)
        bs.f("matrix_coefficients", 8)
    } else {
        c.color_primaries = ColorPrimaries.CP_UNSPECIFIED
        c.transfer_characteristics = TransferCharacterestics.TC_UNSPECIFIED
        c.matrix_coefficients = MatrixCoeff.MC_UNSPECIFIED
    }
    if (c.mono_chrome) {
        bs.f("color_range", 1)
        c.subsampling_x = 1
        c.subsampling_y = 1
        c.chroma_sample_position = ChromaSamplePos.CSP_UNKNOWN
        c.separate_uv_delta_q = 0
        return
    } else if (c.color_primaries == ColorPrimaries.CP_BT_709 &&
        c.transfer_characteristics == TransferCharacterestics.TC_SRGB &&
        c.matrix_coefficients == MatrixCoeff.MC_IDENTITY) {
        c.color_range = 1
        c.subsampling_x = 0
        c.subsampling_y = 0
    } else {
        bs.f("color_range", 1)
        if (c.seq_profile == 0) {
            c.subsampling_x = 1
            c.subsampling_y = 1
        } else if (c.seq_profile == 1) {
            c.subsampling_x = 0
            c.subsampling_y = 0
        } else {
            if (c.BitDepth == 12) {
                bs.f("subsampling_x", 1)
                if (c.subsampling_x)
                    bs.f("subsampling_y", 1)
                else
                    c.subsampling_y = 0
            } else {
                c.subsampling_x = 1
                c.subsampling_y = 0
            }
        }
        if (c.subsampling_x && c.subsampling_y) {
            bs.f("chroma_sample_position", 2)
        }
    }
    bs.f("separate_uv_delta_q", 1)
})


export const sequence_header_obu = syntax("sequence_header_obu", (bs: Bitstream<ObuCtx>) => {
    const c = bs.ctx;

    bs.f("seq_profile", 3);
    bs.f("still_picture", 1);
    bs.f("reduced_still_picture_header", 1);
    if (c.reduced_still_picture_header) {
        c.timing_info_present_flag = 0
        c.decoder_model_info_present_flag = 0
        c.initial_display_delay_present_flag = 0
        c.operating_points_cnt_minus_1 = 0
        c.operating_point_idc[0] = 0
        c.seq_level_idx[0] = bs.f("seq_level_idx[0]", 5)
        c.seq_tier[0] = 0
        c.decoder_model_present_for_this_op[0] = 0
        c.initial_display_delay_present_for_this_op[0] = 0
    } else {
        bs.f("timing_info_present_flag", 1)
        if (c.timing_info_present_flag) {
            timing_info(bs)
            bs.f("decoder_model_info_present_flag", 1)
            if (c.decoder_model_info_present_flag) {
                decoder_model_info(bs)
            }
        } else {
            c.decoder_model_info_present_flag = 0
        }
        bs.f("initial_display_delay_present_flag", 1)
        bs.f("operating_points_cnt_minus_1", 5)
        for (let i = 0; i <= c.operating_points_cnt_minus_1; i++) {
            bs.f(`operating_point_idc[${i}]`, 12)
            const seq_level_idx = bs.f(`seq_level_idx[${i}]`, 5)
            if (seq_level_idx > 7) {
                bs.f(`seq_tier[${i}]`, 1)
            } else {
                c.seq_tier[i] = 0
            }
            if (c.decoder_model_info_present_flag) {
                bs.f(`decoder_model_present_for_this_op[${i}]`, 1)
                if (c.decoder_model_present_for_this_op[i]) {
                    operating_parameters_info(bs, i)
                }
            } else {
                c.decoder_model_present_for_this_op[i] = 0
            }
            if (c.initial_display_delay_present_flag) {
                bs.f(`initial_display_delay_present_for_this_op[${i}]`, 1)
                if (c.initial_display_delay_present_for_this_op[i]) {
                    bs.f(`initial_display_delay_minus_1[${i}]`, 4)
                }
            }
        }
    }


    const operatingPoint = choose_operating_point(bs);
    const OperatingPointIdc = c.operating_point_idc[operatingPoint]
    bs.f("frame_width_bits_minus_1", 4)
    bs.f("frame_height_bits_minus_1", 4)
    let n = c.frame_width_bits_minus_1 + 1
    bs.f("max_frame_width_minus_1", n)
    n = c.frame_height_bits_minus_1 + 1
    bs.f("max_frame_height_minus_1", n)
    if (c.reduced_still_picture_header)
        c.frame_id_numbers_present_flag = 0
    else
        bs.f("frame_id_numbers_present_flag", 1)
    if (c.frame_id_numbers_present_flag) {
        bs.f("delta_frame_id_length_minus_2", 4)
        bs.f("additional_frame_id_length_minus_1", 3)
    }
    bs.f("use_128x128_superblock", 1)
    bs.f("enable_filter_intra", 1)
    bs.f("enable_intra_edge_filter", 1)

    if (c.reduced_still_picture_header) {
        c.enable_interintra_compound = 0
        c.enable_masked_compound = 0
        c.enable_warped_motion = 0
        c.enable_dual_filter = 0
        c.enable_order_hint = 0
        c.enable_jnt_comp = 0
        c.enable_ref_frame_mvs = 0
        c.seq_force_screen_content_tools = SELECT_SCREEN_CONTENT_TOOLS
        c.seq_force_integer_mv = SELECT_INTEGER_MV
        c.OrderHintBits = 0
    } else {
        bs.f("enable_interintra_compound", 1)
        bs.f("enable_masked_compound", 1)
        bs.f("enable_warped_motion", 1)
        bs.f("enable_dual_filter", 1)
        bs.f("enable_order_hint", 1)
        if (c.enable_order_hint) {
            bs.f("enable_jnt_comp", 1)
            bs.f("enable_ref_frame_mvs", 1)
        } else {
            c.enable_jnt_comp = 0
            c.enable_ref_frame_mvs = 0
        }
        bs.f("seq_choose_screen_content_tools", 1)
        if (c.seq_choose_screen_content_tools) {
            c.seq_force_screen_content_tools = SELECT_SCREEN_CONTENT_TOOLS
        } else {
            bs.f("seq_force_screen_content_tools", 1)
        }

        if (c.seq_force_screen_content_tools > 0) {
            bs.f("seq_choose_integer_mv", 1)
            if (c.seq_choose_integer_mv) {
                c.seq_force_integer_mv = SELECT_INTEGER_MV
            } else {
                bs.f("seq_force_integer_mv", 1)
            }
        } else {
            c.seq_force_integer_mv = SELECT_INTEGER_MV
        }
        if (c.enable_order_hint) {
            bs.f("order_hint_bits_minus_1", 3)
            c.OrderHintBits = c.order_hint_bits_minus_1 + 1
        } else {
            c.OrderHintBits = 0
        }
    }
    bs.f("enable_superres", 1)
    bs.f("enable_cdef", 1)
    bs.f("enable_restoration", 1)
    color_config(bs)
    bs.f("film_grain_params_present", 1)
});