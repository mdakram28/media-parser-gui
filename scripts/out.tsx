loop_filter_params( ) {	Type
    if ( CodedLossless || allow_intrabc ) {	 
        c.loop_filter_level[ 0 ] = 0	 
        c.loop_filter_level[ 1 ] = 0	 
        loop_filter_ref_deltas[ INTRA_FRAME ] = 1	 
        loop_filter_ref_deltas[ LAST_FRAME ] = 0	 
        loop_filter_ref_deltas[ LAST2_FRAME ] = 0	 
        loop_filter_ref_deltas[ LAST3_FRAME ] = 0	 
        loop_filter_ref_deltas[ BWDREF_FRAME ] = 0	 
        loop_filter_ref_deltas[ GOLDEN_FRAME ] = -1	 
        loop_filter_ref_deltas[ ALTREF_FRAME ] = -1	 
        loop_filter_ref_deltas[ ALTREF2_FRAME ] = -1	 
        for ( i = 0; i < 2; i++ ) {	 
            loop_filter_mode_deltas[ i ] = 0	 
        }	 
        return	 
    }	 
    bs.f(`loop_filter_level[${0}]`, 6);
    bs.f(`loop_filter_level[${1}]`, 6);
    if ( NumPlanes > 1 ) {	 
        if ( c.loop_filter_level[ 0 ] || c.loop_filter_level[ 1 ] ) {	 
            bs.f(`loop_filter_level[${2}]`, 6);
            bs.f(`loop_filter_level[${3}]`, 6);
        }	 
    }	 
    bs.f(`loop_filter_sharpness`, 3);
    bs.f(`loop_filter_delta_enabled`, 1);
    if ( c.loop_filter_delta_enabled == 1 ) {	 
        bs.f(`loop_filter_delta_update`, 1);
        if ( c.loop_filter_delta_update == 1 ) {	 
            for ( i = 0; i < TOTAL_REFS_PER_FRAME; i++ ) {	 
                bs.f(`update_ref_delta`, 1);
                if ( c.update_ref_delta == 1 )	 
                loop_filter_ref_deltas[ i ]	su(1+6)
            }	 
            for ( i = 0; i < 2; i++ ) {	 
                bs.f(`update_mode_delta`, 1);
                if ( c.update_mode_delta == 1 )	 
                loop_filter_mode_deltas[ i ]	su(1+6)
            }	 
        }	 
    }	 
}