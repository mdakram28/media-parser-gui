import { NaluCtx } from "../hevc-bitstream";

export function hrd_parameters(bs: NaluCtx, commonInfPresentFlag: number, maxNumSubLayersMinus1: number) {
    const c: any = bs.ctx;
    if (commonInfPresentFlag) {
        bs.f(`nal_hrd_parameters_present_flag`, 1);
        bs.f(`vcl_hrd_parameters_present_flag`, 1);
        if (c.nal_hrd_parameters_present_flag || c.vcl_hrd_parameters_present_flag) {
            bs.f(`sub_pic_hrd_params_present_flag`, 1);
            if (c.sub_pic_hrd_params_present_flag) {
                bs.f(`tick_divisor_minus2`, 8);
                bs.f(`du_cpb_removal_delay_increment_length_minus1`, 5);
                bs.f(`sub_pic_cpb_params_in_pic_timing_sei_flag`, 1);
                bs.f(`dpb_output_delay_du_length_minus1`, 5);
            }
            bs.f(`bit_rate_scale`, 4);
            bs.f(`cpb_size_scale`, 4);
            if (c.sub_pic_hrd_params_present_flag)
                bs.f(`cpb_size_du_scale`, 4);
            bs.f(`initial_cpb_removal_delay_length_minus1`, 5);
            bs.f(`au_cpb_removal_delay_length_minus1`, 5);
            bs.f(`dpb_output_delay_length_minus1`, 5);
        }
    }
    for (let i = 0; i <= maxNumSubLayersMinus1; i++) {
        bs.f(`fixed_pic_rate_general_flag[${i}]`, 1);
        if (!c.fixed_pic_rate_general_flag[i])
            bs.f(`fixed_pic_rate_within_cvs_flag[${i}]`, 1);
        if (c.fixed_pic_rate_within_cvs_flag[i])
            bs.uvlc(`elemental_duration_in_tc_minus1[${i}]`);
        else
            bs.f(`low_delay_hrd_flag[${i}]`, 1);
        if (!c.low_delay_hrd_flag[i])
            bs.uvlc(`cpb_cnt_minus1[${i}]`);
        if (c.nal_hrd_parameters_present_flag)
            sub_layer_hrd_parameters(bs, i, c.cpb_cnt_minus1[i] + 1);
        if (c.vcl_hrd_parameters_present_flag)
            sub_layer_hrd_parameters(bs, i, c.cpb_cnt_minus1[i] + 1)
    }
}

function sub_layer_hrd_parameters(bs: NaluCtx, subLayerId: number, CpbCnt: number) {
    const c: any = bs.ctx;

    for (let i = 0; i < CpbCnt; i++) {
        bs.uvlc(`bit_rate_value_minus1[${i}]`);
        bs.uvlc(`cpb_size_value_minus1[${i}]`);
        if (c.sub_pic_hrd_params_present_flag) {
            bs.uvlc(`cpb_size_du_value_minus1[${i}]`);
            bs.uvlc(`bit_rate_du_value_minus1[${i}]`);
        }
        bs.f(`cbr_flag[${i}]`, 1);
    }
}