import { Bitstream, syntax } from "../../../bitstream/parser";
import { Av1Bs, ObuCtx } from "../av1-bitstream";
import { assertNums } from "./common";
import { Av1Const } from "./constants";
import { Default_Angle_Delta_Cdf, Default_Cfl_Alpha_Cdf, Default_Cfl_Sign_Cdf, Default_Comp_Bwd_Ref_Cdf, Default_Comp_Group_Idx_Cdf, Default_Comp_Mode_Cdf, Default_Comp_Ref_Cdf, Default_Comp_Ref_Type_Cdf, Default_Compound_Idx_Cdf, Default_Compound_Mode_Cdf, Default_Compound_Type_Cdf, Default_Dc_Sign_Cdf, Default_Delta_Lf_Cdf, Default_Delta_Q_Cdf, Default_Drl_Mode_Cdf, Default_Eob_Extra_Cdf, Default_Eob_Pt_1024_Cdf, Default_Eob_Pt_128_Cdf, Default_Eob_Pt_16_Cdf, Default_Eob_Pt_256_Cdf, Default_Eob_Pt_32_Cdf, Default_Eob_Pt_512_Cdf, Default_Eob_Pt_64_Cdf, Default_Filter_Intra_Cdf, Default_Filter_Intra_Mode_Cdf, Default_Inter_Intra_Cdf, Default_Inter_Intra_Mode_Cdf, Default_Inter_Tx_Type_Set1_Cdf, Default_Inter_Tx_Type_Set2_Cdf, Default_Inter_Tx_Type_Set3_Cdf, Default_Interp_Filter_Cdf, Default_Intra_Frame_Y_Mode_Cdf, Default_Intra_Tx_Type_Set1_Cdf, Default_Intra_Tx_Type_Set2_Cdf, Default_Intrabc_Cdf, Default_Is_Inter_Cdf, Default_Motion_Mode_Cdf, Default_Mv_Bit_Cdf, Default_Mv_Class0_Bit_Cdf, Default_Mv_Class0_Fr_Cdf, Default_Mv_Class0_Hp_Cdf, Default_Mv_Class_Cdf, Default_Mv_Fr_Cdf, Default_Mv_Hp_Cdf, Default_Mv_Joint_Cdf, Default_Mv_Sign_Cdf, Default_New_Mv_Cdf, Default_Palette_Size_2_Uv_Color_Cdf, Default_Palette_Size_2_Y_Color_Cdf, Default_Palette_Size_3_Uv_Color_Cdf, Default_Palette_Size_3_Y_Color_Cdf, Default_Palette_Size_4_Uv_Color_Cdf, Default_Palette_Size_4_Y_Color_Cdf, Default_Palette_Size_5_Uv_Color_Cdf, Default_Palette_Size_5_Y_Color_Cdf, Default_Palette_Size_6_Uv_Color_Cdf, Default_Palette_Size_6_Y_Color_Cdf, Default_Palette_Size_7_Uv_Color_Cdf, Default_Palette_Size_7_Y_Color_Cdf, Default_Palette_Size_8_Uv_Color_Cdf, Default_Palette_Size_8_Y_Color_Cdf, Default_Palette_Uv_Mode_Cdf, Default_Palette_Uv_Size_Cdf, Default_Palette_Y_Mode_Cdf, Default_Palette_Y_Size_Cdf, Default_Partition_W128_Cdf, Default_Partition_W16_Cdf, Default_Partition_W32_Cdf, Default_Partition_W64_Cdf, Default_Partition_W8_Cdf, Default_Ref_Mv_Cdf, Default_Restoration_Type_Cdf, Default_Segment_Id_Cdf, Default_Segment_Id_Predicted_Cdf, Default_Single_Ref_Cdf, Default_Skip_Cdf, Default_Skip_Mode_Cdf, Default_Tx_16x16_Cdf, Default_Tx_32x32_Cdf, Default_Tx_64x64_Cdf, Default_Tx_8x8_Cdf, Default_Txb_Skip_Cdf, Default_Txfm_Split_Cdf, Default_Uni_Comp_Ref_Cdf, Default_Use_Obmc_Cdf, Default_Use_Sgrproj_Cdf, Default_Use_Wiener_Cdf, Default_Uv_Mode_Cfl_Allowed_Cdf, Default_Uv_Mode_Cfl_Not_Allowed_Cdf, Default_Wedge_Index_Cdf, Default_Wedge_Inter_Intra_Cdf, Default_Y_Mode_Cdf, Default_Zero_Mv_Cdf } from "./default_cdf_tables";

function init_symbol(bs: Av1Bs, sz: number) {
    assertNums(sz);
    const c = bs.ctx as any;
    c.numBits = Math.min(sz * 8, 15)

    bs.f("buf", c.numBits);
    c.paddedBuf = (c.buf << (15 - c.numBits))
    c.SymbolValue = ((1 << 15) - 1) ^ c.paddedBuf
    c.SymbolRange = 1 << 15
    c.SymbolMaxBits = 8 * sz - 15

    /*
    SymbolMaxBits (when non-negative) represents the number of bits still available to be read. 
    It is allowed for this number to go negative (either here or during read_symbol). 
    SymbolMaxBits (when negative) signifies that all available bits have been read, 
    and that -SymbolMaxBits of padding zero bits have been used in the symbol decoding process. 
    These padding zero bits are not present in the bitstream.
    */

    c.TileIntraFrameYModeCdf = Default_Intra_Frame_Y_Mode_Cdf;
    c.TileYModeCdf = Default_Y_Mode_Cdf
    c.TileUVModeCflNotAllowedCdf = Default_Uv_Mode_Cfl_Not_Allowed_Cdf
    c.TileUVModeCflAllowedCdf = Default_Uv_Mode_Cfl_Allowed_Cdf
    c.TileAngleDeltaCdf = Default_Angle_Delta_Cdf
    c.TileIntrabcCdf = Default_Intrabc_Cdf
    c.TilePartitionW8Cdf = Default_Partition_W8_Cdf
    c.TilePartitionW16Cdf = Default_Partition_W16_Cdf
    c.TilePartitionW32Cdf = Default_Partition_W32_Cdf
    c.TilePartitionW64Cdf = Default_Partition_W64_Cdf
    c.TilePartitionW128Cdf = Default_Partition_W128_Cdf
    c.TileSegmentIdCdf = Default_Segment_Id_Cdf
    c.TileSegmentIdPredictedCdf = Default_Segment_Id_Predicted_Cdf
    c.TileTx8x8Cdf = Default_Tx_8x8_Cdf
    c.TileTx16x16Cdf = Default_Tx_16x16_Cdf
    c.TileTx32x32Cdf = Default_Tx_32x32_Cdf
    c.TileTx64x64Cdf = Default_Tx_64x64_Cdf
    c.TileTxfmSplitCdf = Default_Txfm_Split_Cdf
    c.TileFilterIntraModeCdf = Default_Filter_Intra_Mode_Cdf
    c.TileFilterIntraCdf = Default_Filter_Intra_Cdf
    c.TileInterpFilterCdf = Default_Interp_Filter_Cdf
    c.TileMotionModeCdf = Default_Motion_Mode_Cdf
    c.TileNewMvCdf = Default_New_Mv_Cdf
    c.TileZeroMvCdf = Default_Zero_Mv_Cdf
    c.TileRefMvCdf = Default_Ref_Mv_Cdf
    c.TileCompoundModeCdf = Default_Compound_Mode_Cdf
    c.TileDrlModeCdf = Default_Drl_Mode_Cdf
    c.TileIsInterCdf = Default_Is_Inter_Cdf
    c.TileCompModeCdf = Default_Comp_Mode_Cdf
    c.TileSkipModeCdf = Default_Skip_Mode_Cdf
    c.TileSkipCdf = Default_Skip_Cdf
    c.TileCompRefCdf = Default_Comp_Ref_Cdf
    c.TileCompBwdRefCdf = Default_Comp_Bwd_Ref_Cdf
    c.TileSingleRefCdf = Default_Single_Ref_Cdf
    c.TileMvJointCdf = Default_Mv_Joint_Cdf
    c.TileMvSignCdf = Default_Mv_Sign_Cdf
    c.TileMvClassCdf = Default_Mv_Class_Cdf
    c.TileMvClass0BitCdf = Default_Mv_Class0_Bit_Cdf
    c.TileMvFrCdf = Default_Mv_Fr_Cdf
    c.TileMvClass0FrCdf = Default_Mv_Class0_Fr_Cdf
    c.TileMvClass0HpCdf = Default_Mv_Class0_Hp_Cdf
    c.TileMvBitCdf = Default_Mv_Bit_Cdf
    c.TileMvHpCdf = Default_Mv_Hp_Cdf
    c.TilePaletteYModeCdf = Default_Palette_Y_Mode_Cdf
    c.TilePaletteUVModeCdf = Default_Palette_Uv_Mode_Cdf
    c.TilePaletteYSizeCdf = Default_Palette_Y_Size_Cdf
    c.TilePaletteUVSizeCdf = Default_Palette_Uv_Size_Cdf
    c.TilePaletteSize2YColorCdf = Default_Palette_Size_2_Y_Color_Cdf
    c.TilePaletteSize2UVColorCdf = Default_Palette_Size_2_Uv_Color_Cdf
    c.TilePaletteSize3YColorCdf = Default_Palette_Size_3_Y_Color_Cdf
    c.TilePaletteSize3UVColorCdf = Default_Palette_Size_3_Uv_Color_Cdf
    c.TilePaletteSize4YColorCdf = Default_Palette_Size_4_Y_Color_Cdf
    c.TilePaletteSize4UVColorCdf = Default_Palette_Size_4_Uv_Color_Cdf
    c.TilePaletteSize5YColorCdf = Default_Palette_Size_5_Y_Color_Cdf
    c.TilePaletteSize5UVColorCdf = Default_Palette_Size_5_Uv_Color_Cdf
    c.TilePaletteSize6YColorCdf = Default_Palette_Size_6_Y_Color_Cdf
    c.TilePaletteSize6UVColorCdf = Default_Palette_Size_6_Uv_Color_Cdf
    c.TilePaletteSize7YColorCdf = Default_Palette_Size_7_Y_Color_Cdf
    c.TilePaletteSize7UVColorCdf = Default_Palette_Size_7_Uv_Color_Cdf
    c.TilePaletteSize8YColorCdf = Default_Palette_Size_8_Y_Color_Cdf
    c.TilePaletteSize8UVColorCdf = Default_Palette_Size_8_Uv_Color_Cdf
    c.TileDeltaQCdf = Default_Delta_Q_Cdf
    c.TileDeltaLFCdf = Default_Delta_Lf_Cdf
    c.TileDeltaLFMultiCdf = new Array(Av1Const.FRAME_LF_COUNT).fill(1)
    c.TileIntraTxTypeSet1Cdf = Default_Intra_Tx_Type_Set1_Cdf
    c.TileIntraTxTypeSet2Cdf = Default_Intra_Tx_Type_Set2_Cdf
    c.TileInterTxTypeSet1Cdf = Default_Inter_Tx_Type_Set1_Cdf
    c.TileInterTxTypeSet2Cdf = Default_Inter_Tx_Type_Set2_Cdf
    c.TileInterTxTypeSet3Cdf = Default_Inter_Tx_Type_Set3_Cdf
    c.TileUseObmcCdf = Default_Use_Obmc_Cdf
    c.TileInterIntraCdf = Default_Inter_Intra_Cdf
    c.TileCompRefTypeCdf = Default_Comp_Ref_Type_Cdf
    c.TileCflSignCdf = Default_Cfl_Sign_Cdf
    c.TileUniCompRefCdf = Default_Uni_Comp_Ref_Cdf
    c.TileWedgeInterIntraCdf = Default_Wedge_Inter_Intra_Cdf
    c.TileCompGroupIdxCdf = Default_Comp_Group_Idx_Cdf
    c.TileCompoundIdxCdf = Default_Compound_Idx_Cdf
    c.TileCompoundTypeCdf = Default_Compound_Type_Cdf
    c.TileInterIntraModeCdf = Default_Inter_Intra_Mode_Cdf
    c.TileWedgeIndexCdf = Default_Wedge_Index_Cdf
    c.TileCflAlphaCdf = Default_Cfl_Alpha_Cdf
    c.TileUseWienerCdf = Default_Use_Wiener_Cdf
    c.TileUseSgrprojCdf = Default_Use_Sgrproj_Cdf
    c.TileRestorationTypeCdf = Default_Restoration_Type_Cdf
    c.TileTxbSkipCdf = Default_Txb_Skip_Cdf
    c.TileEobPt16Cdf = Default_Eob_Pt_16_Cdf
    c.TileEobPt32Cdf = Default_Eob_Pt_32_Cdf
    c.TileEobPt64Cdf = Default_Eob_Pt_64_Cdf
    c.TileEobPt128Cdf = Default_Eob_Pt_128_Cdf
    c.TileEobPt256Cdf = Default_Eob_Pt_256_Cdf
    c.TileEobPt512Cdf = Default_Eob_Pt_512_Cdf
    c.TileEobPt1024Cdf = Default_Eob_Pt_1024_Cdf
    c.TileEobExtraCdf = Default_Eob_Extra_Cdf
    c.TileDcSignCdf = Default_Dc_Sign_Cdf
    // c.TileCoeffBaseEobCdf = Default_CoeffBaseEobCdf
    // c.TileCoeffBaseCdf = Default_CoeffBaseCdf
    // c.TileCoeffBrCdf = Default_CoeffBrCdf
}

enum BlockSize {
    BLOCK_4X4 = 0,
    BLOCK_4X8 = 1,
    BLOCK_8X4 = 2,
    BLOCK_8X8 = 3,
    BLOCK_8X16 = 4,
    BLOCK_16X8 = 5,
    BLOCK_16X16 = 6,
    BLOCK_16X32 = 7,
    BLOCK_32X16 = 8,
    BLOCK_32X32 = 9,
    BLOCK_32X64 = 10,
    BLOCK_64X32 = 11,
    BLOCK_64X64 = 12,
    BLOCK_64X128 = 13,
    BLOCK_128X64 = 14,
    BLOCK_128X128 = 15,
    BLOCK_4X16 = 16,
    BLOCK_16X4 = 17,
    BLOCK_8X32 = 18,
    BLOCK_32X8 = 19,
    BLOCK_16X64 = 20,
    BLOCK_64X16 = 21,
}

function decode_tile(bs: Av1Bs) {
    const c = bs.ctx as any;
    throw Error("Tile decoding not supported");
    
    // clear_above_context( )	 
    for (let i = 0; i < Av1Const.FRAME_LF_COUNT; i++)
        c.DeltaLF[i] = 0
    for (let plane = 0; plane < c.NumPlanes; plane++) {
        for (let pass = 0; pass < 2; pass++) {
            c.RefSgrXqd[plane][pass] = c.Sgrproj_Xqd_Mid[pass]
            for (let i = 0; i < Av1Const.WIENER_COEFFS; i++) {
                c.RefLrWiener[plane][pass][i] = c.Wiener_Taps_Mid[i]
            }
        }
    }
    c.sbSize = c.use_128x128_superblock ? BlockSize.BLOCK_128X128 : BlockSize.BLOCK_64X64
    c.sbSize4 = c.Num_4x4_Blocks_Wide[c.sbSize]
    for (let r = c.MiRowStart; r < c.MiRowEnd; r += c.sbSize4) {
        // clear_left_context()
        // for (let c = c.MiColStart; c < c.MiColEnd; c += c.sbSize4) {
        //     c.ReadDeltas = c.delta_q_present
            // clear_cdef(r, c)
            // clear_block_decoded_flags(r, c, sbSize4)
            // read_lr(r, c, sbSize)
            // decode_partition(r, c, sbSize)
        // }
    }
}

export const tile_group_obu = syntax("tile_group_obu", (bs: Bitstream<ObuCtx>, sz: number) => {
    const c = bs.ctx as any;
    // bs.error("Not implemented")
    assertNums(c.TileCols, c.TileRows);

    c.NumTiles = c.TileCols * c.TileRows
    const startBitPos = bs.getPos();
    c.tile_start_and_end_present_flag = 0
    if (c.NumTiles > 1)
        bs.f(`tile_start_and_end_present_flag`, 1);
    if (c.NumTiles == 1 || !c.tile_start_and_end_present_flag) {
        c.tg_start = 0
        c.tg_end = c.NumTiles - 1
    } else {
        assertNums(c.TileColsLog2, c.TileRowsLog2);
        c.tileBits = c.TileColsLog2 + c.TileRowsLog2
        bs.f(`tg_start`, c.tileBits);
        bs.f(`tg_end`, c.tileBits);
    }
    bs.byteAlign();

    const endBitPos = bs.getPos();

    const headerBytes = (endBitPos - startBitPos) / 8
    sz -= headerBytes;

    for (c.TileNum = c.tg_start; c.TileNum <= c.tg_end; c.TileNum++) {
        c.tileRow = c.TileNum / c.TileCols
        c.tileCol = c.TileNum % c.TileCols
        c.lastTile = c.TileNum == c.tg_end
        if (c.lastTile) {
            c.tileSize = sz
        } else {
            bs.le("tile_size_minus_1", c.TileSizeBytes);
            c.tileSize = c.tile_size_minus_1 + 1
            sz -= c.tileSize + c.TileSizeBytes
        }
        c.MiRowStart = c.MiRowStarts[c.tileRow]
        c.MiRowEnd = c.MiRowStarts[c.tileRow + 1]
        c.MiColStart = c.MiColStarts[c.tileCol]
        c.MiColEnd = c.MiColStarts[c.tileCol + 1]
        c.CurrentQIndex = c.base_q_idx
        init_symbol(bs, c.tileSize);
        decode_tile(bs)
        // exit_symbol()
    }
    // if (c.tg_end == NumTiles - 1) {
    //     if (!disable_frame_end_update_cdf) {
    //         frame_end_update_cdf()
    //     }
    //     decode_frame_wrapup()
    //     SeenFrameHeader = 0
    // }
});