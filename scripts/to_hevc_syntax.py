
import re
import sys
from .syntax_util import format_code


text = """


slice_segment_header( ) { Descriptor
first_slice_segment_in_pic_flag u(1)
if( nal_unit_type >= BLA_W_LP && nal_unit_type <= RSV_IRAP_VCL23 )
no_output_of_prior_pics_flag u(1)
slice_pic_parameter_set_id ue(v)
if( !first_slice_segment_in_pic_flag ) {
if( dependent_slice_segments_enabled_flag )
dependent_slice_segment_flag u(1)
slice_segment_address u(v)
}
if( !dependent_slice_segment_flag ) {
for( i = 0; i < num_extra_slice_header_bits; i++ )
slice_reserved_flag[ i ] u(1)
slice_type ue(v)
if( output_flag_present_flag )
pic_output_flag u(1)
if( separate_colour_plane_flag = = 1 )
colour_plane_id u(2)
if( nal_unit_type != IDR_W_RADL && nal_unit_type != IDR_N_LP ) {
slice_pic_order_cnt_lsb u(v)
short_term_ref_pic_set_sps_flag u(1)
if( !short_term_ref_pic_set_sps_flag )
st_ref_pic_set( num_short_term_ref_pic_sets )
else if( num_short_term_ref_pic_sets > 1 )
short_term_ref_pic_set_idx u(v)
if( long_term_ref_pics_present_flag ) {
if( num_long_term_ref_pics_sps > 0 )
num_long_term_sps ue(v)
num_long_term_pics ue(v)
for( i = 0; i < num_long_term_sps + num_long_term_pics; i++ ) {
if( i < num_long_term_sps ) {
if( num_long_term_ref_pics_sps > 1 )
lt_idx_sps[ i ] u(v)
} else {
poc_lsb_lt[ i ] u(v)
used_by_curr_pic_lt_flag[ i ] u(1)
}
delta_poc_msb_present_flag[ i ] u(1)
if( delta_poc_msb_present_flag[ i ] )
delta_poc_msb_cycle_lt[ i ] ue(v)
}
}
if( sps_temporal_mvp_enabled_flag )
slice_temporal_mvp_enabled_flag u(1)
}
Rec. ITU-T H.265 v5 (02/2018) 47
if( sample_adaptive_offset_enabled_flag ) {
slice_sao_luma_flag u(1)
if( ChromaArrayType != 0 )
slice_sao_chroma_flag u(1)
}
if( slice_type = = P | | slice_type = = B ) {
num_ref_idx_active_override_flag u(1)
if( num_ref_idx_active_override_flag ) {
num_ref_idx_l0_active_minus1 ue(v)
if( slice_type = = B )
num_ref_idx_l1_active_minus1 ue(v)
}
if( lists_modification_present_flag && NumPicTotalCurr > 1 )
ref_pic_lists_modification( )
if( slice_type = = B )
mvd_l1_zero_flag u(1)
if( cabac_init_present_flag )
cabac_init_flag u(1)
if( slice_temporal_mvp_enabled_flag ) {
if( slice_type = = B )
collocated_from_l0_flag u(1)
if( ( collocated_from_l0_flag && num_ref_idx_l0_active_minus1 > 0 ) | |
( !collocated_from_l0_flag && num_ref_idx_l1_active_minus1 > 0 ) )
collocated_ref_idx ue(v)
}
48 Rec. ITU-T H.265 v5 (02/2018)
if( ( weighted_pred_flag && slice_type = = P ) | |
( weighted_bipred_flag && slice_type = = B ) )
pred_weight_table( )
five_minus_max_num_merge_cand ue(v)
if( motion_vector_resolution_control_idc = = 2 )
use_integer_mv_flag u(1)
}
slice_qp_delta se(v)
if( pps_slice_chroma_qp_offsets_present_flag ) {
slice_cb_qp_offset se(v)
slice_cr_qp_offset se(v)
}
if( pps_slice_act_qp_offsets_present_flag ) {
slice_act_y_qp_offset se(v)
slice_act_cb_qp_offset se(v)
slice_act_cr_qp_offset se(v)
}
if( chroma_qp_offset_list_enabled_flag )
cu_chroma_qp_offset_enabled_flag u(1)
if( deblocking_filter_override_enabled_flag )
deblocking_filter_override_flag u(1)
if( deblocking_filter_override_flag ) {
slice_deblocking_filter_disabled_flag u(1)
if( !slice_deblocking_filter_disabled_flag ) {
slice_beta_offset_div2 se(v)
slice_tc_offset_div2 se(v)
}
}
if( pps_loop_filter_across_slices_enabled_flag &&
( slice_sao_luma_flag | | slice_sao_chroma_flag | |
!slice_deblocking_filter_disabled_flag ) )
slice_loop_filter_across_slices_enabled_flag u(1)
}
if( tiles_enabled_flag | | entropy_coding_sync_enabled_flag ) {
num_entry_point_offsets ue(v)
if( num_entry_point_offsets > 0 ) {
offset_len_minus1 ue(v)
for( i = 0; i < num_entry_point_offsets; i++ )
entry_point_offset_minus1[ i ] u(v)
}
}
if( slice_segment_header_extension_present_flag ) {
slice_segment_header_extension_length ue(v)
for( i = 0; i < slice_segment_header_extension_length; i++)
slice_segment_header_extension_data_byte[ i ] u(8)
}
byte_alignment( )
}



ref_pic_lists_modification( ) { Descriptor
ref_pic_list_modification_flag_l0 u(1)
if( ref_pic_list_modification_flag_l0 )
for( i = 0; i <= num_ref_idx_l0_active_minus1; i++ )
list_entry_l0[ i ] u(v)
if( slice_type = = B ) {
ref_pic_list_modification_flag_l1 u(1)
if( ref_pic_list_modification_flag_l1 )
for( i = 0; i <= num_ref_idx_l1_active_minus1; i++ )
list_entry_l1[ i ] u(v)
}
}

"""


known_ctx_vars = set()

reg = '(\w+)(:?\[\s*[a-z]+\s*\])?(:?\[\s*[a-z]+\s*\])? u\((\d+|v)\)'
def repl(m):
    # print(m.groups())
    var_name = m.group(1)
    known_ctx_vars.add(var_name)
    if m.group(2) is not None:
        inner = m.group(2)[1:-1].strip()
        var_name += "[${" + inner + "}]"
    if m.group(3) is not None:
        inner = m.group(3)[1:-1].strip()
        var_name += "[${" + inner + "}]"
    bits = m.group(4)
    line = f"bs.f(`{var_name}`, {bits});"
    # print(line)
    return line

code = re.sub(reg, repl, text)


reg = '(\w+)(:?\[\s*[a-z]+\s*\])?(:?\[\s*[a-z]+\s*\])? (ue|se)\(v\)'
def repl(m):
    # print(m.groups())
    var_name = m.group(1)
    known_ctx_vars.add(var_name)
    if m.group(2) is not None:
        inner = m.group(2)[1:-1].strip()
        var_name += "[${" + inner + "}]"
    if m.group(3) is not None:
        inner = m.group(3)[1:-1].strip()
        var_name += "[${" + inner + "}]"
    
    if m.group(4) == "ue":
        line = f"bs.uvlc(`{var_name}`);"
    elif m.group(4) == "se":
        line = f"bs.svlc(`{var_name}`);"
    else:
        raise Exception("Only uvlc/svlc supported")
        
    # print(line)
    return line

code = re.sub(reg, repl, code)


reg = 'for\s*\(\s*([a-z]+)\s*='
def repl(m):
    return f"for(let {m.group(1)}="

code = re.sub(reg, repl, code)






code = code.replace("= =", "==")
code = code.replace("| |", "||")
code = format_code(code)


with open(sys.argv[1], "w") as f:
    f.write(code)