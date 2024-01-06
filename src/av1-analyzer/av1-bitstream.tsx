import { sequence_header_obu } from "./obu/obu_sequence_header";
import { frame_obu } from "./obu/obu_frame";
import { FrameType } from "./obu/obu_frame_header";
import { DataNode } from "../types/av1.types";


export class Bitstream<T extends {}> {
    pos = 0;
    bitPos = 0;
    private buffer: ArrayBuffer;
    private current: DataNode = {
        title: "ROOT",
        key: "root",
        children: [],
        start: 0,
        size: 0
    };
    readonly ctx: T;

    constructor(buffer: ArrayBuffer) {
        this.buffer = buffer;
        this.ctx = {} as T;
    }

    updateCtx(newCtx: Partial<T>) {
        Object.assign(this.ctx, newCtx);
    }

    getCurrent() {
        return this.current;
    }

    getEndPos() {
        return this.buffer.byteLength * 8;
    }

    readByte() {
        const ret = new Uint8Array(this.buffer.slice(this.pos, this.pos + 1))[0];
        this.pos += 1;
        return ret;
    }

    readLeb128() {
        let value = 0;
        for (let i = 0; i < 8; i++) {
            const leb128_byte = this.readByte();
            value |= ((leb128_byte & 0x7f) << (i * 7));
            if (!(leb128_byte & 0x80)) {
                break
            }
        }
        return value
    }

    readUvlc() {
        let leadingZeros = 0
        while (true) {
            const done = this.readBits(1)
            if (done)
                break
            leadingZeros++
        }
        if (leadingZeros >= 32) {
            return (1 << 32) - 1
        }
        const value = this.readBits(leadingZeros)
        return value + (1 << leadingZeros) - 1
    }



    readBits(bits: number) {
        let i = this.pos * 8 + this.bitPos;
        const data = new Uint8Array(this.buffer.slice(this.pos, Math.ceil((i + bits) / 8)));
        let binStr = "";
        data.forEach(byte => binStr += byte.toString(2).padStart(8, '0'));
        binStr = binStr.slice(this.bitPos, this.bitPos + bits);
        i += bits;
        this.pos = Math.floor(i / 8);
        this.bitPos = this.pos % 8;
        return parseInt(binStr, 2);
    }

    setCtx(_title: keyof T | string, value: any) {
        const title = _title as string;
        if (title.endsWith("]")) {
            const ind = parseInt(title.substring(title.lastIndexOf('[') + 1, title.length - 1));
            const name = title.substring(0, title.lastIndexOf('['));
            (this.ctx[name as keyof T] as any[])[ind] = value as any;
        } else {
            this.ctx[title as keyof T] = value as any;
        }
    }

    f(title: keyof T | string, bits: number, e?: any) {
        let i = this.getPos();
        const startBitPos = i;
        // console.log(`Reading binary ${title.toString()} from ${i}`);
        const data = new Uint8Array(this.buffer.slice(Math.floor(i / 8), Math.ceil((i + bits) / 8)));
        let binStr = "";
        data.forEach(byte => binStr += byte.toString(2).padStart(8, '0'));
        const start = i - Math.floor(i / 8) * 8;
        i += bits;
        this.pos = Math.floor(i / 8);
        this.bitPos = i % 8;
        binStr = binStr.slice(start, start + bits)
        const value = parseInt(binStr, 2);
        this.current.children?.push({
            key: title.toString() + Math.floor(Math.random() * 1909000000),
            title: `${title.toString()}: ${value}` + (e ? ` (${e[value]})` : ''),
            start: startBitPos,
            size: bits
        });
        this.setCtx(title, value);
        return value;
    }

    uvlc(title: keyof T | string) {
        const start = this.getPos();
        const val = this.readUvlc();
        this.current.children?.push({
            key: title.toString() + Math.floor(Math.random() * 100000),
            title: `${title.toString()}: ${val}`,
            start,
            size: this.getPos()-start
        });
        this.setCtx(title, val);
        return val;
    }

    error(msg: string) {
        this.current.children?.push({
            key: Math.floor(Math.random() * 100000).toString(),
            title: <>Error: {msg}</>,
            start: this.getPos(),
            size: 0
        });
    }

    setTitle(title: string) {
        this.current.title = title;
    }

    dropSyntax() {
        this.current.title += " (DROPPED)";
    }

    leb128(title: keyof T) {
        // console.log(`Reading leb128 ${title.toString()} from ${this.getPos()}`);
        const start = this.getPos();
        const val = this.readLeb128();
        this.current.children?.push({
            key: title.toString() + Math.floor(Math.random() * 100000),
            title: `${title.toString()}: ${val}`,
            start,
            size: this.getPos()-start
        });
        this.setCtx(title, val);
        return val;
    }

    gotoPos(p: number) {
        this.pos = p;
        this.bitPos = 0;
    }

    getPos() {
        return this.pos * 8 + this.bitPos;
    }

    byte_alignment() {
        if (this.bitPos > 0) {
            this.bitPos = 0;
            this.pos++;
        }
    }


    syntax<BS extends {}, T extends Array<any>, U>(title: string, fn: (bs: Bitstream<BS>, ...args: T) => U) {
        return (...args: T) => {
            const parent = this.current;
            this.current = {
                key: title + Math.floor(Math.random() * 100000),
                title,
                children: [],
                start: this.getPos(),
                size: 0
            }
            const ret = fn(this as any, ...args);
            this.current.size = this.getPos()-this.current.start;
            parent.children?.push(this.current);
            this.current = parent;
            return ret;
        }
    }
}

export function syntax<BS extends {}, T extends Array<any>, U>(title: string, fn: (bs: Bitstream<BS>, ...args: T) => U) {
    return (bs: Bitstream<any>, ...args: T) => bs.syntax(title, fn)(...args);
}

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

export class ParserCtx {
    SeenFrameHeader = 0;
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
};

export const AV1 = syntax("AV1", (bs: Bitstream<ParserCtx>) => {
    bs.updateCtx(new ParserCtx());
    let i = 0;
    while (bs.getPos() < bs.getEndPos()) {
        if (i++ > 1000) break;
        open_bitstream_unit(bs, 0);
    }
});

const open_bitstream_unit = syntax("open_bitstream_unit", (bs: Bitstream<ObuCtx & ParserCtx>, sz: number) => {
    bs.updateCtx(new ObuCtx());
    const c = bs.ctx;

    const obu_header = bs.syntax("obu_header", () => {
        const obu_extension_header = bs.syntax("obu_extension_header", () => {
            bs.f("temporal_id", 3)
            bs.f("spatial_id", 2)
            bs.f("extension_header_reserved_3bits", 3)
        });

        bs.f("obu_forbidden_bit", 1);
        bs.f("obu_type", 4);
        bs.f("obu_extension_flag", 1);
        bs.f("obu_has_size_field", 1);
        bs.f("obu_reserved_1bit", 1);
        if (c.obu_extension_flag == 1)
            obu_extension_header();
    });

    obu_header();
    if (c.obu_has_size_field) {
        bs.leb128("obu_size");
    } else {
        c.obu_size = sz - 1 - bs.ctx.obu_extension_flag;
    }
    const obuEndPos = (bs.getPos() + c.obu_size * 8) / 8;
    // console.log(c.obu_size, obuEndPos);

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
