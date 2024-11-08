
export const Av1Const = {

    REFS_PER_FRAME: 7, //	Number of reference frames that can be used for inter prediction
    TOTAL_REFS_PER_FRAME: 8, //	Number of reference frame types (including intra type)
    BLOCK_SIZE_GROUPS: 4, //	Number of contexts when decoding y_mode
    BLOCK_SIZES: 22, //	Number of different block sizes used
    BLOCK_INVALID: 22, //	Sentinel value to mark partition choices that are not allowed
    MAX_SB_SIZE: 128, //	Maximum size of a superblock in luma samples
    MI_SIZE: 4, //	Smallest size of a mode info block in luma samples
    MI_SIZE_LOG2: 2, //	Base 2 logarithm of smallest size of a mode info block
    MAX_TILE_WIDTH: 4096, //	Maximum width of a tile in units of luma samples
    MAX_TILE_AREA: 4096 * 2304, //	Maximum area of a tile in units of luma samples
    MAX_TILE_ROWS: 64, //	Maximum number of tile rows
    MAX_TILE_COLS: 64, //	Maximum number of tile columns
    INTRABC_DELAY_PIXELS: 256, //	Number of horizontal luma samples before intra block copy can be used
    INTRABC_DELAY_SB64: 4, //	Number of 64 by 64 blocks before intra block copy can be used
    NUM_REF_FRAMES: 8, //	Number of frames that can be stored for future reference
    IS_INTER_CONTEXTS: 4, //	Number of contexts for is_inter
    REF_CONTEXTS: 3, //	Number of contexts for single_ref, comp_ref, comp_bwdref, uni_comp_ref, uni_comp_ref_p1 and uni_comp_ref_p2
    MAX_SEGMENTS: 8, //	Number of segments allowed in segmentation map
    SEGMENT_ID_CONTEXTS: 3, //	Number of contexts for segment_id
    SEG_LVL_ALT_Q: 0, //	Index for quantizer segment feature
    SEG_LVL_ALT_LF_Y_V: 1, //	Index for vertical luma loop filter segment feature
    SEG_LVL_REF_FRAME: 5, //	Index for reference frame segment feature
    SEG_LVL_SKIP: 6, //	Index for skip segment feature
    SEG_LVL_GLOBALMV: 7, //	Index for global mv feature
    SEG_LVL_MAX: 8, //	Number of segment features
    PLANE_TYPES: 2, //	Number of different plane types (luma or chroma)
    TX_SIZE_CONTEXTS: 3, //	Number of contexts for transform size
    INTERP_FILTERS: 3, //	Number of values for interp_filter
    INTERP_FILTER_CONTEXTS: 16, //	Number of contexts for interp_filter
    SKIP_MODE_CONTEXTS: 3, //	Number of contexts for decoding skip_mode
    SKIP_CONTEXTS: 3, //	Number of contexts for decoding skip
    PARTITION_CONTEXTS: 4, //	Number of contexts when decoding partition
    TX_SIZES: 5, //	Number of square transform sizes
    TX_SIZES_ALL: 19, //	Number of transform sizes (including non-square sizes)
    TX_MODES: 3, //	Number of values for tx_mode
    DCT_DCT: 0, //	Inverse transform rows with DCT and columns with DCT
    ADST_DCT: 1, //	Inverse transform rows with DCT and columns with ADST
    DCT_ADST: 2, //	Inverse transform rows with ADST and columns with DCT
    ADST_ADST: 3, //	Inverse transform rows with ADST and columns with ADST
    FLIPADST_DCT: 4, //	Inverse transform rows with DCT and columns with FLIPADST
    DCT_FLIPADST: 5, //	Inverse transform rows with FLIPADST and columns with DCT
    FLIPADST_FLIPADST: 6, //	Inverse transform rows with FLIPADST and columns with FLIPADST
    ADST_FLIPADST: 7, //	Inverse transform rows with FLIPADST and columns with ADST
    FLIPADST_ADST: 8, //	Inverse transform rows with ADST and columns with FLIPADST
    IDTX: 9, //	Inverse transform rows with identity and columns with identity
    V_DCT: 10, //	Inverse transform rows with identity and columns with DCT
    H_DCT: 11, //	Inverse transform rows with DCT and columns with identity
    V_ADST: 12, //	Inverse transform rows with identity and columns with ADST
    H_ADST: 13, //	Inverse transform rows with ADST and columns with identity
    V_FLIPADST: 14, //	Inverse transform rows with identity and columns with FLIPADST
    H_FLIPADST: 15, //	Inverse transform rows with FLIPADST and columns with identity
    TX_TYPES: 16, //	Number of inverse transform types
    MB_MODE_COUNT: 17, //	Number of values for YMode
    INTRA_MODES: 13, //	Number of values for y_mode
    UV_INTRA_MODES_CFL_NOT_ALLOWED: 13, //	Number of values for uv_mode when chroma from luma is not allowed
    UV_INTRA_MODES_CFL_ALLOWED: 14, //	Number of values for uv_mode when chroma from luma is allowed
    COMPOUND_MODES: 8, //	Number of values for compound_mode
    COMPOUND_MODE_CONTEXTS: 8, //	Number of contexts for compound_mode
    COMP_NEWMV_CTXS: 5, //	Number of new mv values used when constructing context for compound_mode
    NEW_MV_CONTEXTS: 6, //	Number of contexts for new_mv
    ZERO_MV_CONTEXTS: 2, //	Number of contexts for zero_mv
    REF_MV_CONTEXTS: 6, //	Number of contexts for ref_mv
    DRL_MODE_CONTEXTS: 3, //	Number of contexts for drl_mode
    MV_CONTEXTS: 2, //	Number of contexts for decoding motion vectors including one for intra block copy
    MV_INTRABC_CONTEXT: 1, //	Motion vector context used for intra block copy
    MV_JOINTS: 4, //	Number of values for mv_joint
    MV_CLASSES: 11, //	Number of values for mv_class
    CLASS0_SIZE: 2, //	Number of values for mv_class0_bit
    MV_OFFSET_BITS: 10, //	Maximum number of bits for decoding motion vectors
    MAX_LOOP_FILTER: 63, //	Maximum value used for loop filtering
    REF_SCALE_SHIFT: 14, //	Number of bits of precision when scaling reference frames
    SUBPEL_BITS: 4, //	Number of bits of precision when choosing an inter prediction filter kernel
    SUBPEL_MASK: 15*(1 << 4) - 1, //
    SCALE_SUBPEL_BITS: 10, //	Number of bits of precision when computing inter prediction locations
    MV_BORDER: 128, //	Value used when clipping motion vectors
    PALETTE_COLOR_CONTEXTS: 5, //	Number of values for color contexts
    PALETTE_MAX_COLOR_CONTEXT_HASH: 8, //	Number of mappings between color context hash and color context
    PALETTE_BLOCK_SIZE_CONTEXTS: 7, //	Number of values for palette block size
    PALETTE_Y_MODE_CONTEXTS: 3, //	Number of values for palette Y plane mode contexts
    PALETTE_UV_MODE_CONTEXTS: 2, //	Number of values for palette U and V plane mode contexts
    PALETTE_SIZES: 7, //	Number of values for palette_size
    PALETTE_COLORS: 8, //	Number of values for palette_color
    PALETTE_NUM_NEIGHBORS: 3, //	Number of neighbors considered within palette computation
    DELTA_Q_SMALL: 3, //	Value indicating alternative encoding of quantizer index delta values
    DELTA_LF_SMALL: 3, //	Value indicating alternative encoding of loop filter delta values
    QM_TOTAL_SIZE: 3344, //	Number of values in the quantizer matrix
    MAX_ANGLE_DELTA: 3, //	Maximum magnitude of AngleDeltaY and AngleDeltaUV
    DIRECTIONAL_MODES: 8, //	Number of directional intra modes
    ANGLE_STEP: 3, //	Number of degrees of step per unit increase in AngleDeltaY or AngleDeltaUV.
    TX_SET_TYPES_INTRA: 3, //	Number of intra transform set types
    TX_SET_TYPES_INTER: 4, //	Number of inter transform set types
    WARPEDMODEL_PREC_BITS: 16, //	Internal precision of warped motion models
    IDENTITY: 0, //	Warp model is just an identity transform
    TRANSLATION: 1, //	Warp model is a pure translation
    ROTZOOM: 2, //	Warp model is a rotation + symmetric zoom + translation
    AFFINE: 3, //	Warp model is a general affine transform
    GM_ABS_TRANS_BITS: 12, //	Number of bits encoded for translational components of global motion models, if part of a ROTZOOM or AFFINE model
    GM_ABS_TRANS_ONLY_BITS: 9, //	Number of bits encoded for translational components of global motion models, if part of a TRANSLATION model
    GM_ABS_ALPHA_BITS: 12, //	Number of bits encoded for non-translational components of global motion models
    DIV_LUT_PREC_BITS: 14, //	Number of fractional bits of entries in divisor lookup table
    DIV_LUT_BITS: 8, //	Number of fractional bits for lookup in divisor lookup table
    DIV_LUT_NUM: 257, //	Number of entries in divisor lookup table
    MOTION_MODES: 3, //	Number of values for motion modes
    SIMPLE: 0, //	Use translation or global motion compensation
    OBMC: 1, //	Use overlapped block motion compensation
    LOCALWARP: 2, //	Use local warp motion compensation
    LEAST_SQUARES_SAMPLES_MAX: 8, //	Largest number of samples used when computing a local warp
    LS_MV_MAX: 256, //	Largest motion vector difference to include in local warp computation
    WARPEDMODEL_TRANS_CLAMP: 1 << 23, //	Clamping value used for translation components of warp
    WARPEDMODEL_NONDIAGAFFINE_CLAMP: 1 << 13, //	Clamping value used for matrix components of warp
    WARPEDPIXEL_PREC_SHIFTS: 1 << 6, //	Number of phases used in warped filtering
    WARPEDDIFF_PREC_BITS: 10, //	Number of extra bits of precision in warped filtering
    GM_ALPHA_PREC_BITS: 15, //	Number of fractional bits for sending non-translational warp model coefficients
    GM_TRANS_PREC_BITS: 6, //	Number of fractional bits for sending translational warp model coefficients
    GM_TRANS_ONLY_PREC_BITS: 3, //	Number of fractional bits used for pure translational warps
    INTERINTRA_MODES: 4, //	Number of inter intra modes
    MASK_MASTER_SIZE: 64, //	Size of MasterMask array
    SEGMENT_ID_PREDICTED_CONTEXTS: 3, //	Number of contexts for segment_id_predicted
    FWD_REFS: 4, //	Number of syntax elements for forward reference frames
    BWD_REFS: 3, //	Number of syntax elements for backward reference frames
    SINGLE_REFS: 7, //	Number of syntax elements for single reference frames
    UNIDIR_COMP_REFS: 4, //	Number of syntax elements for unidirectional compound reference frames
    COMPOUND_TYPES: 2, //	Number of values for compound_type
    CFL_JOINT_SIGNS: 8, //	Number of values for cfl_alpha_signs
    CFL_ALPHABET_SIZE: 16, //	Number of values for cfl_alpha_u and cfl_alpha_v
    COMP_INTER_CONTEXTS: 5, //	Number of contexts for comp_mode
    COMP_REF_TYPE_CONTEXTS: 5, //	Number of contexts for comp_ref_type
    CFL_ALPHA_CONTEXTS: 6, //	Number of contexts for cfl_alpha_u and cfl_alpha_v
    INTRA_MODE_CONTEXTS: 5, //	Number of each of left and above contexts for intra_frame_y_mode
    COMP_GROUP_IDX_CONTEXTS: 6, //	Number of contexts for comp_group_idx
    COMPOUND_IDX_CONTEXTS: 6, //	Number of contexts for compound_idx
    INTRA_EDGE_KERNELS: 3, //	Number of filter kernels for the intra edge filter
    INTRA_EDGE_TAPS: 5, //	Number of kernel taps for the intra edge filter
    FRAME_LF_COUNT: 4, //	Number of loop filter strength values
    MAX_VARTX_DEPTH: 2, //	Maximum depth for variable transform trees
    TXFM_PARTITION_CONTEXTS: 21, //	Number of contexts for txfm_split
    REF_CAT_LEVEL: 640, //	Bonus weight for close motion vectors
    MAX_REF_MV_STACK_SIZE: 8, //	Maximum number of motion vectors in the stack
    MFMV_STACK_SIZE: 3, //	Stack size for motion field motion vectors
    MAX_TX_DEPTH: 2, //	Maximum times the transform can be split
    WEDGE_TYPES: 16, //	Number of directions for the wedge mask process
    FILTER_BITS: 7, //	Number of bits used in Wiener filter coefficients
    WIENER_COEFFS: 3, //	Number of Wiener filter coefficients to read
    SGRPROJ_PARAMS_BITS: 4, //	Number of bits needed to specify self guided filter set
    SGRPROJ_PRJ_SUBEXP_K: 4, //	Controls how self guided deltas are read
    SGRPROJ_PRJ_BITS: 7, //	Precision bits during self guided restoration
    SGRPROJ_RST_BITS: 4, //	Restoration precision bits generated higher than source before projection
    SGRPROJ_MTABLE_BITS: 20, //	Precision of mtable division table
    SGRPROJ_RECIP_BITS: 12, //	Precision of division by n table
    SGRPROJ_SGR_BITS: 8, //	Internal precision bits for core selfguided_restoration
    EC_PROB_SHIFT: 6, //	Number of bits to reduce CDF precision during arithmetic coding
    EC_MIN_PROB: 4, //	Minimum probability assigned to each symbol during arithmetic coding
    SELECT_SCREEN_CONTENT_TOOLS: 2, //	Value that indicates the allow_screen_content_tools syntax element is coded
    SELECT_INTEGER_MV: 2, //	Value that indicates the force_integer_mv syntax element is coded
    RESTORATION_TILESIZE_MAX: 256, //	Maximum size of a loop restoration tile
    MAX_FRAME_DISTANCE: 31, //	Maximum distance when computing weighted prediction
    MAX_OFFSET_WIDTH: 8, //	Maximum horizontal offset of a projected motion vector
    MAX_OFFSET_HEIGHT: 0, //	Maximum vertical offset of a projected motion vector
    WARP_PARAM_REDUCE_BITS: 6, //	Rounding bitwidth for the parameters to the shear process
    NUM_BASE_LEVELS: 2, //	Number of quantizer base levels
    COEFF_BASE_RANGE: 12, //	The quantizer range above NUM_BASE_LEVELS above which the Exp-Golomb coding process is activated
    BR_CDF_SIZE: 4, //	Number of values for coeff_br
    SIG_COEF_CONTEXTS_EOB: 4, //	Number of contexts for coeff_base_eob
    SIG_COEF_CONTEXTS_2D: 26, //	Context offset for coeff_base for horizontal-only or vertical-only transforms.
    SIG_COEF_CONTEXTS: 42, //	Number of contexts for coeff_base
    SIG_REF_DIFF_OFFSET_NUM: 5, //	Maximum number of context samples to be used in determining the context index for coeff_base and coeff_base_eob.
    SUPERRES_NUM: 8, //	Numerator for upscaling ratio
    SUPERRES_DENOM_MIN: 9, //	Smallest denominator for upscaling ratio
    SUPERRES_DENOM_BITS: 3, //	Number of bits sent to specify denominator of upscaling ratio
    SUPERRES_FILTER_BITS: 6, //	Number of bits of fractional precision for upscaling filter selection
    SUPERRES_FILTER_SHIFTS: 1, // << SUPERRES_FILTER_BITS	Number of phases of upscaling filters
    SUPERRES_FILTER_TAPS: 8, //	Number of taps of upscaling filters
    SUPERRES_FILTER_OFFSET: 3, //	Sample offset for upscaling filters
    SUPERRES_SCALE_BITS: 14, //	Number of fractional bits for computing position in upscaling
    SUPERRES_SCALE_MASK: (1 << 14) - 1, //	Mask for computing position in upscaling
    SUPERRES_EXTRA_BITS: 8, //	Difference in precision between SUPERRES_SCALE_BITS and SUPERRES_FILTER_BITS
    TXB_SKIP_CONTEXTS: 13, //	Number of contexts for all_zero
    EOB_COEF_CONTEXTS: 9, //	Number of contexts for eob_extra
    DC_SIGN_CONTEXTS: 3, //	Number of contexts for dc_sign
    LEVEL_CONTEXTS: 21, //	Number of contexts for coeff_br
    TX_CLASS_2D: 0, //	Transform class for transform types performing non-identity transforms in both directions
    TX_CLASS_HORIZ: 1, //	Transform class for transforms performing only a horizontal non-identity transform
    TX_CLASS_VERT: 2, //	Transform class for transforms performing only a vertical non-identity transform
    REFMVS_LIMIT: (1 << 12) - 1, //	Largest reference MV component that can be saved
    INTRA_FILTER_SCALE_BITS: 4, //	Scaling shift for intra filtering process
    INTRA_FILTER_MODES: 5, //	Number of types of intra filtering
    COEFF_CDF_Q_CTXS: 4, //	Number of selectable context types for the coeff( ) syntax structure
    PRIMARY_REF_NONE: 7, //	Value of primary_ref_frame indicating that there is no primary reference frame
    BUFFER_POOL_MAX_SIZE: 10, //	Number of frames in buffer pool
}