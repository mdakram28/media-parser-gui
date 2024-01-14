


pred_weight_table( ) { Descriptor
    bs.uvlc(`luma_log2_weight_denom`);
    if( ChromaArrayType != 0 )
    bs.svlc(`delta_chroma_log2_weight_denom`);
    for(let i= 0; i <= num_ref_idx_l0_active_minus1; i++ )
    if( ( pic_layer_id( RefPicList0[ i ] ) != nuh_layer_id ) ||
    ( PicOrderCnt( RefPicList0[ i ] ) != PicOrderCnt( CurrPic ) ) )
    bs.f(`luma_weight_l0_flag[${i}]`, 1);
    if( ChromaArrayType != 0 )
    for(let i= 0; i <= num_ref_idx_l0_active_minus1; i++ )
    if( ( pic_layer_id( RefPicList0[ i ] ) != nuh_layer_id ) ||
    ( PicOrderCnt(RefPicList0[ i ]) != PicOrderCnt( CurrPic ) ) )
    bs.f(`chroma_weight_l0_flag[${i}]`, 1);
    for(let i= 0; i <= num_ref_idx_l0_active_minus1; i++ ) {
        if( c.luma_weight_l0_flag[ i ] ) {
            bs.svlc(`delta_luma_weight_l0[${i}]`);
            bs.svlc(`luma_offset_l0[${i}]`);
        }
        if( c.chroma_weight_l0_flag[ i ] )
        for(let j= 0; j < 2; j++ ) {
            bs.svlc(`delta_chroma_weight_l0[${i}][${j}]`);
            bs.svlc(`delta_chroma_offset_l0[${i}][${j}]`);
        }
    }
    if( slice_type == B ) {
        for(let i= 0; i <= num_ref_idx_l1_active_minus1; i++ )
        if( ( pic_layer_id( RefPicList0[ i ] ) != nuh_layer_id ) ||
        ( PicOrderCnt(RefPicList1[ i ]) != PicOrderCnt( CurrPic ) ) )
        bs.f(`luma_weight_l1_flag[${i}]`, 1);
        if( ChromaArrayType != 0 )
        for(let i= 0; i <= num_ref_idx_l1_active_minus1; i++ )
        if( ( pic_layer_id( RefPicList0[ i ] ) != nuh_layer_id ) ||
        ( PicOrderCnt(RefPicList1[ i ]) != PicOrderCnt( CurrPic ) ) )
        bs.f(`chroma_weight_l1_flag[${i}]`, 1);
        for(let i= 0; i <= num_ref_idx_l1_active_minus1; i++ ) {
            if( c.luma_weight_l1_flag[ i ] ) {
                bs.svlc(`delta_luma_weight_l1[${i}]`);
                bs.svlc(`luma_offset_l1[${i}]`);
            }
            if( c.chroma_weight_l1_flag[ i ] )
            for(let j= 0; j < 2; j++ ) {
                bs.svlc(`delta_chroma_weight_l1[${i}][${j}]`);
                bs.svlc(`delta_chroma_offset_l1[${i}][${j}]`);
            }
        }
    }
}

