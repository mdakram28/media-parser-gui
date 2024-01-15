tile_group_obu( sz ) {	Type
    NumTiles = TileCols * TileRows	 
    startBitPos = get_position( )	 
    c.tile_start_and_end_present_flag = 0	 
    if ( NumTiles > 1 )	 
    bs.f(`tile_start_and_end_present_flag`, 1);
    if ( NumTiles == 1 || !c.tile_start_and_end_present_flag ) {	 
        c.tg_start = 0	 
        c.tg_end = NumTiles - 1	 
        } else {	 
        tileBits = TileColsLog2 + TileRowsLog2	 
        bs.f(`tg_start`, tileBits);
        bs.f(`tg_end`, tileBits);
    }	 
    byte_alignment( )	 
    endBitPos = get_position( )	 
    headerBytes = (endBitPos - startBitPos) / 8	 
    sz -= headerBytes	 
    
    for ( TileNum = c.tg_start; TileNum <= c.tg_end; TileNum++ ) {	 
        tileRow = TileNum / TileCols	 
        tileCol = TileNum % TileCols	 
        lastTile = TileNum == c.tg_end	 
        if ( lastTile ) {	 
            tileSize = sz	 
            } else {	 
            tile_size_minus_1	le(TileSizeBytes)
            tileSize = tile_size_minus_1 + 1	 
            sz -= tileSize + TileSizeBytes	 
        }	 
        MiRowStart = MiRowStarts[ tileRow ]	 
        MiRowEnd = MiRowStarts[ tileRow + 1 ]	 
        MiColStart = MiColStarts[ tileCol ]	 
        MiColEnd = MiColStarts[ tileCol + 1 ]	 
        CurrentQIndex = base_q_idx	 
        init_symbol( tileSize )	 
        decode_tile( )	 
        exit_symbol( )	 
    }	 
    if ( c.tg_end == NumTiles - 1 ) {	 
        if ( !disable_frame_end_update_cdf ) {	 
            frame_end_update_cdf( )	 
        }	 
        decode_frame_wrapup( )	 
        SeenFrameHeader = 0	 
    }	 
}