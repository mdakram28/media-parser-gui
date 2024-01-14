
video_parameter_set_rbsp( ) { Descriptor
    bs.f(`vps_video_parameter_set_id`, 4);
    bs.f(`vps_base_layer_internal_flag`, 1);
    bs.f(`vps_base_layer_available_flag`, 1);
    bs.f(`vps_max_layers_minus1`, 6);
    bs.f(`vps_max_sub_layers_minus1`, 3);
    bs.f(`vps_temporal_id_nesting_flag`, 1);
    bs.f(`vps_reserved_0xffff_16bits`, 16);
    profile_tier_level( 1, c.vps_max_sub_layers_minus1 )
    bs.f(`vps_sub_layer_ordering_info_present_flag`, 1);
    for( i = ( c.vps_sub_layer_ordering_info_present_flag ? 0 : c.vps_max_sub_layers_minus1 );
    i <= c.vps_max_sub_layers_minus1; i++ ) {
        bs.uvlc(`vps_max_dec_pic_buffering_minus1[${i}]`);
        bs.uvlc(`vps_max_num_reorder_pics[${i}]`);
        bs.uvlc(`vps_max_latency_increase_plus1[${i}]`);
    }
    bs.f(`vps_max_layer_id`, 6);
    bs.uvlc(`vps_num_layer_sets_minus1`);
    for( i = 1; i <= c.vps_num_layer_sets_minus1; i++ )
    for( j = 0; j <= c.vps_max_layer_id; j++ )
    bs.f(`layer_id_included_flag[${i}][${j}]`, 1);
    bs.f(`vps_timing_info_present_flag`, 1);
    if( c.vps_timing_info_present_flag ) {
        bs.f(`vps_num_units_in_tick`, 32);
        bs.f(`vps_time_scale`, 32);
        bs.f(`vps_poc_proportional_to_timing_flag`, 1);
        if( c.vps_poc_proportional_to_timing_flag )
        bs.uvlc(`vps_num_ticks_poc_diff_one_minus1`);
        bs.uvlc(`vps_num_hrd_parameters`);
        for( i = 0; i < c.vps_num_hrd_parameters; i++ ) {
            bs.uvlc(`hrd_layer_set_idx[${i}]`);
            if( i > 0 )
            bs.f(`cprms_present_flag[${i}]`, 1);
            hrd_parameters( c.cprms_present_flag[ i ], c.vps_max_sub_layers_minus1 )
        }
    }
    bs.f(`vps_extension_flag`, 1);
    if( c.vps_extension_flag )
    while( more_rbsp_data( ) )
    bs.f(`vps_extension_data_flag`, 1);
    rbsp_trailing_bits( )
}
