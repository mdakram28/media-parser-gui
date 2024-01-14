import { syntax } from "../../../bitstream/parser";
import { NaluCtx } from "../hevc-bitstream";

export const profile_tier_level = syntax("profile_tier_level", (bs: NaluCtx, profilePresentFlag: number, maxNumSubLayersMinus1: number) => {
    const c: any = bs.ctx;
    if (profilePresentFlag) {
        bs.f(`general_profile_space`, 2);
        bs.f(`general_tier_flag`, 1);
        bs.f(`general_profile_idc`, 5);
        for (let j = 0; j < 32; j++)
            bs.f(`general_profile_compatibility_flag[${j}]`, 1);
        // bs.f("SKIP", 8);
        bs.f(`general_progressive_source_flag`, 1);
        bs.f(`general_interlaced_source_flag`, 1);
        bs.f(`general_non_packed_constraint_flag`, 1);
        bs.f(`general_frame_only_constraint_flag`, 1);
        if (c.general_profile_idc == 4 || c.general_profile_compatibility_flag[4] ||
            c.general_profile_idc == 5 || c.general_profile_compatibility_flag[5] ||
            c.general_profile_idc == 6 || c.general_profile_compatibility_flag[6] ||
            c.general_profile_idc == 7 || c.general_profile_compatibility_flag[7] ||
            c.general_profile_idc == 8 || c.general_profile_compatibility_flag[8] ||
            c.general_profile_idc == 9 || c.general_profile_compatibility_flag[9] ||
            c.general_profile_idc == 10 || c.general_profile_compatibility_flag[10]) {
            /* The number of bits in this syntax structure is not affected by this condition */
            bs.f(`general_max_12bit_constraint_flag`, 1);
            bs.f(`general_max_10bit_constraint_flag`, 1);
            bs.f(`general_max_8bit_constraint_flag`, 1);
            bs.f(`general_max_422chroma_constraint_flag`, 1);
            bs.f(`general_max_420chroma_constraint_flag`, 1);
            bs.f(`general_max_monochrome_constraint_flag`, 1);
            bs.f(`general_intra_constraint_flag`, 1);
            bs.f(`general_one_picture_only_constraint_flag`, 1);
            bs.f(`general_lower_bit_rate_constraint_flag`, 1);
            if (c.general_profile_idc == 5 || c.general_profile_compatibility_flag[5] ||
                c.general_profile_idc == 9 || c.general_profile_compatibility_flag[9] ||
                c.general_profile_idc == 10 || c.general_profile_compatibility_flag[10]) {
                bs.f(`general_max_14bit_constraint_flag`, 1);
                bs.f(`general_reserved_zero_33bits`, 33);
            } else
                bs.f(`general_reserved_zero_34bits`, 34);
        } else if (c.general_profile_idc == 2 || c.general_profile_compatibility_flag[2]) {
            bs.f(`general_reserved_zero_7bits`, 7);
            bs.f(`general_one_picture_only_constraint_flag`, 1);
            bs.f(`general_reserved_zero_35bits`, 35);
        } else
            bs.f(`general_reserved_zero_43bits`, 43);
        if ((c.general_profile_idc >= 1 && c.general_profile_idc <= 5) ||
            c.general_profile_idc == 9 ||
            c.general_profile_compatibility_flag[1] || c.general_profile_compatibility_flag[2] ||
            c.general_profile_compatibility_flag[3] || c.general_profile_compatibility_flag[4] ||
            c.general_profile_compatibility_flag[5] || c.general_profile_compatibility_flag[9])
            /* The number of bits in this syntax structure is not affected by this condition */
            bs.f(`general_inbld_flag`, 1);
        else
            bs.f(`general_reserved_zero_bit`, 1);
    }
    bs.f(`general_level_idc`, 8);
    for (let i = 0; i < maxNumSubLayersMinus1; i++) {
        bs.f(`sub_layer_profile_present_flag[${i}]`, 1);
        bs.f(`sub_layer_level_present_flag[${i}]`, 1);
    }
    if (maxNumSubLayersMinus1 > 0)
        for (let i = maxNumSubLayersMinus1; i < 8; i++)
            bs.f(`reserved_zero_2bits[${i}]`, 2);
    for (let i = 0; i < maxNumSubLayersMinus1; i++) {
        if (c.sub_layer_profile_present_flag[i]) {
            bs.f(`sub_layer_profile_space[${i}]`, 2);
            bs.f(`sub_layer_tier_flag[${i}]`, 1);
            bs.f(`sub_layer_profile_idc[${i}]`, 5);
            for (let j = 0; j < 32; j++)
                bs.f(`sub_layer_profile_compatibility_flag[${i}][${j}]`, 1);
            bs.f(`sub_layer_progressive_source_flag[${i}]`, 1);
            bs.f(`sub_layer_interlaced_source_flag[${i}]`, 1);
            bs.f(`sub_layer_non_packed_constraint_flag[${i}]`, 1);
            bs.f(`sub_layer_frame_only_constraint_flag[${i}]`, 1);
            if (c.sub_layer_profile_idc[i] == 4 || c.sub_layer_profile_compatibility_flag[i][4] ||
                c.sub_layer_profile_idc[i] == 5 || c.sub_layer_profile_compatibility_flag[i][5] ||
                c.sub_layer_profile_idc[i] == 6 || c.sub_layer_profile_compatibility_flag[i][6] ||
                c.sub_layer_profile_idc[i] == 7 || c.sub_layer_profile_compatibility_flag[i][7] ||
                c.sub_layer_profile_idc[i] == 8 || c.sub_layer_profile_compatibility_flag[i][8] ||
                c.sub_layer_profile_idc[i] == 9 || c.sub_layer_profile_compatibility_flag[i][9] ||
                c.sub_layer_profile_idc[i] == 10 || c.sub_layer_profile_compatibility_flag[i][10]
            ) {
                /* The number of bits in this syntax structure is not affected by this condition */
                bs.f(`sub_layer_max_12bit_constraint_flag[${i}]`, 1);
                bs.f(`sub_layer_max_10bit_constraint_flag[${i}]`, 1);
                bs.f(`sub_layer_max_8bit_constraint_flag[${i}]`, 1);
                bs.f(`sub_layer_max_422chroma_constraint_flag[${i}]`, 1);
                bs.f(`sub_layer_max_420chroma_constraint_flag[${i}]`, 1);
                bs.f(`sub_layer_max_monochrome_constraint_flag[${i}]`, 1);
                bs.f(`sub_layer_intra_constraint_flag[${i}]`, 1);
                bs.f(`sub_layer_one_picture_only_constraint_flag[${i}]`, 1);
                bs.f(`sub_layer_lower_bit_rate_constraint_flag[${i}]`, 1);
                if (c.sub_layer_profile_idc[i] == 5 ||
                    c.sub_layer_profile_compatibility_flag[i][5]) {
                    bs.f(`sub_layer_max_14bit_constraint_flag[${i}]`, 1);
                    bs.f(`sub_layer_reserved_zero_33bits[${i}]`, 33);
                } else
                    bs.f(`sub_layer_reserved_zero_34bits[${i}]`, 34);
            } else if (c.sub_layer_profile_idc[i] == 2 ||
                c.sub_layer_profile_compatibility_flag[i][2]) {
                bs.f(`sub_layer_reserved_zero_7bits[${i}]`, 7);
                bs.f(`sub_layer_one_picture_only_constraint_flag[${i}]`, 1);
                bs.f(`sub_layer_reserved_zero_35bits[${i}]`, 35);
            } else
                bs.f(`sub_layer_reserved_zero_43bits[${i}]`, 43);
            if ((c.sub_layer_profile_idc[i] >= 1 && c.sub_layer_profile_idc[i] <= 5) ||
                c.sub_layer_profile_idc[i] == 9 ||
                c.sub_layer_profile_compatibility_flag[1] ||
                c.sub_layer_profile_compatibility_flag[2] ||
                c.sub_layer_profile_compatibility_flag[3] ||
                c.sub_layer_profile_compatibility_flag[4] ||
                c.sub_layer_profile_compatibility_flag[5] ||
                c.sub_layer_profile_compatibility_flag[9])
                /* The number of bits in this syntax structure is not affected by this condition */
                bs.f(`sub_layer_inbld_flag[${i}]`, 1);
            else
                bs.f(`sub_layer_reserved_zero_bit[${i}]`, 1);
        }
        if (c.sub_layer_level_present_flag[i])
            bs.f(`sub_layer_level_idc[${i}]`, 8);
    }
});
