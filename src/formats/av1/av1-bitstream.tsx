import { sequence_header_obu } from "./obu/obu_sequence_header";
import { frame_obu } from "./obu/obu_frame";
import { FrameType } from "./obu/obu_frame_header";
import { Bitstream, ParserCtx, syntax } from "../../bitstream/parser";
import { Av1Const } from "./obu/constants";
import { BitBuffer } from "../../bitstream/buffer";


// https://aomediacodec.github.io/av1-spec
export type Av1Bs = Bitstream<ObuCtx>;

enum OBU_TYPE {
    // 0	Reserved
    OBU_SEQUENCE_HEADER = 1,
    OBU_TEMPORAL_DELIMITER = 2,
    OBU_FRAME_HEADER = 3,
    OBU_TILE_GROUP = 4,
    OBU_METADATA = 5,
    OBU_FRAME = 6,
    OBU_REDUNDANT_FRAME_HEADER = 7,
    OBU_TILE_LIST = 8,
    // 9-14	Reserved
    OBU_PADDING = 15,
}

export class ObuCtx {
    obu_has_size_field = 0
    obu_size = 0
    obu_extension_flag = 0
    obu_type = 0
    OperatingPointIdc = 0
    temporal_id = 0
    spatial_id = 0

    // From sequence_header_obu
    seq_profile = 0
    still_picture = 0
    reduced_still_picture_header = 0
    timing_info_present_flag = 0
    decoder_model_info_present_flag = 0
    initial_display_delay_present_flag = 0
    operating_points_cnt_minus_1 = 0
    operating_point_idc: number[] = []
    seq_level_idx: number[] = []
    seq_tier: number[] = []
    decoder_model_present_for_this_op: number[] = []
    initial_display_delay_present_for_this_op: number[] = []
    buffer_delay_length_minus_1 = 0
    frame_id_numbers_present_flag = 0
    frame_width_bits_minus_1 = 0
    frame_height_bits_minus_1 = 0
    additional_frame_id_length_minus_1 = 0
    delta_frame_id_length_minus_2 = 0
    equal_picture_interval = 0
    frame_presentation_time_length_minus_1 = 0
    enable_interintra_compound = 0
    enable_masked_compound = 0
    enable_warped_motion = 0
    enable_dual_filter = 0
    enable_order_hint = 0
    enable_jnt_comp = 0
    enable_ref_frame_mvs = 0
    seq_force_screen_content_tools = 0
    seq_force_integer_mv = 0
    OrderHintBits = 0
    seq_choose_screen_content_tools = 0
    seq_choose_integer_mv = 0
    order_hint_bits_minus_1 = 0
    enable_superres = 0
    enable_cdef = 0
    enable_restoration = 0
    film_grain_params_present = 0
    buffer_removal_time_length_minus_1 = 0

    // From sequence_header_obu > color_config
    high_bitdepth = 0
    BitDepth = 0
    twelve_bit = 0
    mono_chrome = 0
    color_description_present_flag = 0
    color_primaries = 0
    transfer_characteristics = 0
    matrix_coefficients = 0
    color_range = 0
    subsampling_x = 0
    subsampling_y = 0
    chroma_sample_position = 0
    separate_uv_delta_q = 0
    NumPlanes = 0

    // Frame header
    show_existing_frame = 0
    frame_type = 0
    FrameIsIntra = 0
    show_frame = 0
    showable_frame = 0
    refresh_frame_flags = 0
    idLen = 0;
    frame_to_show_map_idx = 0
    RefFrameType: FrameType[] = []
    error_resilient_mode = 0
    TileNum = 0
    RefValid: number[] = []
    RefOrderHint: number[] = []
    ref_order_hint: number[] = []
    OrderHints: number[] = []
    RefFrameId: number[] = []
    current_frame_id = 0
    disable_cdf_update = 0
    allow_screen_content_tools = 0
    force_integer_mv = 0
    frame_size_override_flag = 0
    primary_ref_frame = 0
    buffer_removal_time_present_flag = 0
    allow_intrabc = 0
    frame_refs_short_signaling = 0
    last_frame_idx = 0
    gold_frame_idx = 0
    allow_high_precision_mv = 0
    is_motion_mode_switchable = 0
    use_ref_frame_mvs = 0
    disable_frame_end_update_cdf = 0
    allow_warped_motion = 0
    reduced_tx_set = 0
    PrevFrameID = 0
    order_hint = 0
    frame_width_minus_1 = 0
    frame_height_minus_1 = 0
    max_frame_width_minus_1 = 0
    max_frame_height_minus_1 = 0
    FrameWidth = 0
    FrameHeight = 0
    use_superres = 0
    SuperresDenom = 0
    coded_denom = 0;
    MiCols = 0
    MiRows = 0
    UpscaledWidth = 0
    render_and_frame_size_different = 0
    render_width_minus_1 = 0
    render_height_minus_1 = 0
    RenderWidth = 0
    RenderHeight = 0
    delta_frame_id_minus_1 = 0
    expectedFrameId: number[] = []
    interpolation_filter = 0;
    RefFrameSignBias: number[] = []
    ref_frame_idx: number[] = []
    MiColStarts = []
    MiRowStarts = []


    // Frame params
    FeatureEnabled = [[], [], [], [], [], [], [], [], [], [], [], [], [], []]
    FeatureData = [[], [], [], [], [], [], [], [], [], [], [], [], [], []]
    cdef_y_pri_strength = []
    cdef_y_sec_strength = []
    cdef_uv_pri_strength = []
    cdef_uv_sec_strength = []
    FrameRestorationType = []
    LoopRestorationSize = []
    SkipModeFrame = []
    PrevGmParams = [[], [], [], [], [], [], [], [], [], [], [], [], [], []]
    gm_params = [[], [], [], [], [], [], [], [], [], [], [], [], [], []]
    GmType = []
    loop_filter_ref_deltas = []
    loop_filter_level = []
    Segmentation_Feature_Bits = [8, 6, 6, 6, 6, 3, 0, 0]
    Segmentation_Feature_Signed = [1, 1, 1, 1, 1, 0, 0, 0]
    Segmentation_Feature_Max = [
        255, Av1Const.MAX_LOOP_FILTER, Av1Const.MAX_LOOP_FILTER,
        Av1Const.MAX_LOOP_FILTER, Av1Const.MAX_LOOP_FILTER, 7,
        0, 0]
};

export const AV1 = (buffers: BitBuffer[]) => {
    const bs = new Bitstream(new BitBuffer(new Uint8Array()));
    for(const buff of buffers) {
        bs.updateBuffer(buff);
        bs.updateCtx(new ParserCtx());

        let i = 0;
        while (bs.getPos() < bs.getEndPos()) {
            if (i++ > 1000) break;
            open_bitstream_unit(bs, 0);
        }
    }
    return bs.getCurrent();
};

export const open_bitstream_unit = syntax("open_bitstream_unit", (bs: Bitstream<ObuCtx & ParserCtx>, sz: number) => {
    bs.updateCtx(new ObuCtx());
    const c = bs.ctx;

    const obu_header = () => {
        const obu_extension_header = bs.syntax("obu_extension_header", () => {
            bs.f("temporal_id", 3);
            bs.f("spatial_id", 2);
            bs.f("extension_header_reserved_3bits", 3, { hidden: true });
        });

        bs.f("obu_forbidden_bit", 1);
        bs.f("obu_type", 4);
        bs.f("obu_extension_flag", 1);
        bs.f("obu_has_size_field", 1);
        bs.f("obu_reserved_1bit", 1, { hidden: true });
        if (c.obu_extension_flag == 1)
            obu_extension_header();
    };

    obu_header();
    if (c.obu_has_size_field) {
        bs.leb128("obu_size");
    } else {
        c.obu_size = sz - 1 - bs.ctx.obu_extension_flag;
    }
    const obuEndPos = bs.getPos() + c.obu_size * 8;

    if (c.obu_type != OBU_TYPE.OBU_SEQUENCE_HEADER &&
        c.obu_type != OBU_TYPE.OBU_TEMPORAL_DELIMITER &&
        c.OperatingPointIdc != 0 &&
        c.obu_extension_flag == 1) {
        const inTemporalLayer = (c.OperatingPointIdc >> c.temporal_id) & 1
        const inSpatialLayer = (c.OperatingPointIdc >> (c.spatial_id + 8)) & 1
        if (!inTemporalLayer || !inSpatialLayer) {
            bs.dropSyntax();
            return
        }
    }

    if (c.obu_type == OBU_TYPE.OBU_SEQUENCE_HEADER) {
        bs.setTitle("OBU_SEQUENCE_HEADER");
        // bs.error("sequence_header_obu(): Not implemented");
        sequence_header_obu(bs);
    }
    else if (c.obu_type == OBU_TYPE.OBU_TEMPORAL_DELIMITER) {
        bs.setTitle("OBU_TEMPORAL_DELIMITER");
        c.SeenFrameHeader = 0;
    }
    else if (c.obu_type == OBU_TYPE.OBU_FRAME_HEADER) {
        bs.setTitle("OBU_FRAME_HEADER");
        bs.error("frame_header_obu(): Not implemented");
    }
    else if (c.obu_type == OBU_TYPE.OBU_REDUNDANT_FRAME_HEADER) {
        bs.setTitle("OBU_REDUNDANT_FRAME_HEADER");
        bs.error("frame_header_obu(): Not implemented");
    }
    else if (c.obu_type == OBU_TYPE.OBU_TILE_GROUP) {
        bs.setTitle("OBU_TILE_GROUP");
        bs.error("tile_group_obu(obu_size): Not implemented");
    }
    else if (c.obu_type == OBU_TYPE.OBU_METADATA) {
        bs.setTitle("OBU_METADATA");
        bs.error("metadata_obu(): Not implemented");
    }
    else if (c.obu_type == OBU_TYPE.OBU_FRAME) {
        bs.setTitle("OBU_FRAME");
        // bs.error("frame_obu(): Not implemented");
        frame_obu(bs, c.obu_size);
    }
    else if (c.obu_type == OBU_TYPE.OBU_TILE_LIST) {
        bs.setTitle("OBU_TILE_LIST");
        bs.error("tile_list_obu(): Not implemented");
    }
    else if (c.obu_type == OBU_TYPE.OBU_PADDING) {
        bs.setTitle("OBU_PADDING");
        bs.error("padding_obu(): Not implemented");
    }
    else {
        bs.setTitle("RESERVED_OBU");
        bs.error("reserved_obu(): Not implemented");
    }

    bs.gotoPos(obuEndPos);
});
