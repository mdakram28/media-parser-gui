import { Av1Bs } from "../av1-bitstream";
import { Clip3, decode_signed_subexp_with_ref, get_relative_dist } from "./common";
import { constant } from "./constants";
import { RefFrame0 } from "./obu_frame_header";

export function read_delta_q(bs: Av1Bs) {
    const c: any = bs.ctx;
    bs.f(`delta_coded`, 1);
    if (c.delta_coded) {
        bs.su("delta_q", 1 + 6);
    } else {
        c.delta_q = 0
    }
    return c.delta_q
}

export function quantization_params(bs: Av1Bs) {
    const c: any = bs.ctx;

    bs.f(`base_q_idx`, 8);
    c.DeltaQYDc = read_delta_q(bs);
    if (c.NumPlanes > 1) {
        if (c.separate_uv_delta_q)
            bs.f(`diff_uv_delta`, 1);
        else
            c.diff_uv_delta = 0
        c.DeltaQUDc = read_delta_q(bs);
        c.DeltaQUAc = read_delta_q(bs);
        if (c.diff_uv_delta) {
            c.DeltaQVDc = read_delta_q(bs);
            c.DeltaQVAc = read_delta_q(bs);
        } else {
            c.DeltaQVDc = c.DeltaQUDc
            c.DeltaQVAc = c.DeltaQUAc
        }
    } else {
        c.DeltaQUDc = 0
        c.DeltaQUAc = 0
        c.DeltaQVDc = 0
        c.DeltaQVAc = 0
    }
    bs.f(`using_qmatrix`, 1);
    if (c.using_qmatrix) {
        bs.f(`qm_y`, 4);
        bs.f(`qm_u`, 4);
        if (!c.separate_uv_delta_q)
            c.qm_v = c.qm_u
        else
            bs.f(`qm_v`, 4);
    }
}


export function segmentation_params(bs: Av1Bs) {
    const c: any = bs.ctx;
    bs.f(`segmentation_enabled`, 1);
    if (c.segmentation_enabled == 1) {
        if (c.primary_ref_frame == constant.PRIMARY_REF_NONE) {
            c.segmentation_update_map = 1
            c.segmentation_temporal_update = 0
            c.segmentation_update_data = 1
        } else {
            bs.f(`segmentation_update_map`, 1);
            if (c.segmentation_update_map == 1)
                bs.f(`segmentation_temporal_update`, 1);
            bs.f(`segmentation_update_data`, 1);
        }
        if (c.segmentation_update_data == 1) {
            for (let i = 0; i < constant.MAX_SEGMENTS; i++) {
                for (let j = 0; j < constant.SEG_LVL_MAX; j++) {
                    c.feature_enabled = bs.f(`feature_enabled[${i}][${j}]`, 1);
                    c.FeatureEnabled[i][j] = c.feature_enabled;
                    c.clippedValue = 0;
                    if (c.feature_enabled == 1) {
                        c.bitsToRead = c.Segmentation_Feature_Bits[j]
                        c.limit = c.Segmentation_Feature_Max[j]
                        if (c.Segmentation_Feature_Signed[j] == 1) {
                            bs.su("feature_value", 1 + c.bitsToRead);
                            c.clippedValue = Clip3(-c.limit, c.limit, c.feature_value)
                        } else {
                            bs.f(`feature_value`, c.bitsToRead);
                            c.clippedValue = Clip3(0, c.limit, c.feature_value)
                        }
                    }
                    c.FeatureData[i][j] = c.clippedValue
                }
            }
        }
    } else {
        for (let i = 0; i < constant.MAX_SEGMENTS; i++) {
            for (let j = 0; j < constant.SEG_LVL_MAX; j++) {
                c.FeatureEnabled[i][j] = 0
                c.FeatureData[i][j] = 0
            }
        }
    }
    c.SegIdPreSkip = 0
    c.LastActiveSegId = 0
    for (let i = 0; i < constant.MAX_SEGMENTS; i++) {
        for (let j = 0; j < constant.SEG_LVL_MAX; j++) {
            if (c.FeatureEnabled[i][j]) {
                c.LastActiveSegId = i
                if (j >= constant.SEG_LVL_REF_FRAME) {
                    c.SegIdPreSkip = 1
                }
            }
        }
    }
}


export function delta_q_params(bs: Av1Bs) {
    const c: any = bs.ctx;
    c.delta_q_res = 0
    c.delta_q_present = 0
    if (c.base_q_idx > 0) {
        bs.f(`delta_q_present`, 1);
    }
    if (c.delta_q_present) {
        bs.f(`delta_q_res`, 2);
    }
}

export function delta_lf_params(bs: Av1Bs) {
    const c: any = bs.ctx;
    c.delta_lf_present = 0
    c.delta_lf_res = 0
    c.delta_lf_multi = 0
    if (c.delta_q_present) {
        if (!c.allow_intrabc)
            bs.f(`delta_lf_present`, 1);
        if (c.delta_lf_present) {
            bs.f(`delta_lf_res`, 2);
            bs.f(`delta_lf_multi`, 1);
        }
    }
}

export function cdef_params(bs: Av1Bs) {
    const c: any = bs.ctx;
    if (c.CodedLossless || c.allow_intrabc ||
        !c.enable_cdef) {
        c.cdef_bits = 0
        c.cdef_y_pri_strength[0] = 0
        c.cdef_y_sec_strength[0] = 0
        c.cdef_uv_pri_strength[0] = 0
        c.cdef_uv_sec_strength[0] = 0
        c.CdefDamping = 3
        return
    }
    bs.f(`cdef_damping_minus_3`, 2);
    c.CdefDamping = c.cdef_damping_minus_3 + 3
    bs.f(`cdef_bits`, 2);
    for (let i = 0; i < (1 << c.cdef_bits); i++) {
        bs.f(`cdef_y_pri_strength[${i}]`, 4);
        bs.f(`cdef_y_sec_strength[${i}]`, 2);
        if (c.cdef_y_sec_strength[i] == 3)
            c.cdef_y_sec_strength[i] += 1
        if (c.NumPlanes > 1) {
            bs.f(`cdef_uv_pri_strength[${i}]`, 4);
            bs.f(`cdef_uv_sec_strength[${i}]`, 2);
            if (c.cdef_uv_sec_strength[i] == 3)
                c.cdef_uv_sec_strength[i] += 1
        }
    }
}

export function lr_params(bs: Av1Bs) {
    const c: any = bs.ctx;
    if (c.AllLossless || c.allow_intrabc ||
        !c.enable_restoration) {
        c.FrameRestorationType[0] = FramRestorationType.RESTORE_NONE
        c.FrameRestorationType[1] = FramRestorationType.RESTORE_NONE
        c.FrameRestorationType[2] = FramRestorationType.RESTORE_NONE
        c.UsesLr = 0
        return
    }
    c.UsesLr = 0
    c.usesChromaLr = 0
    for (let i = 0; i < c.NumPlanes; i++) {
        bs.f(`lr_type`, 2);
        c.FrameRestorationType[i] = Remap_Lr_Type[c.lr_type]
        if (c.FrameRestorationType[i] != FramRestorationType.RESTORE_NONE) {
            c.UsesLr = 1
            if (i > 0) {
                c.usesChromaLr = 1
            }
        }
    }
    if (c.UsesLr) {
        if (c.use_128x128_superblock) {
            bs.f(`lr_unit_shift`, 1);
            c.lr_unit_shift++
        } else {
            bs.f(`lr_unit_shift`, 1);
            if (c.lr_unit_shift) {
                bs.f(`lr_unit_extra_shift`, 1);
                c.lr_unit_shift += c.lr_unit_extra_shift
            }
        }
        c.LoopRestorationSize[0] = constant.RESTORATION_TILESIZE_MAX >> (2 - c.lr_unit_shift)
        if (c.subsampling_x && c.subsampling_y && c.usesChromaLr) {
            bs.f(`lr_uv_shift`, 1);
        } else {
            c.lr_uv_shift = 0
        }
        c.LoopRestorationSize[1] = c.LoopRestorationSize[0] >> c.lr_uv_shift
        c.LoopRestorationSize[2] = c.LoopRestorationSize[0] >> c.lr_uv_shift
    }
}

var FramRestorationType = {
    RESTORE_NONE: 0,
    RESTORE_SWITCHABLE: 3,
    RESTORE_WIENER: 1,
    RESTORE_SGRPROJ: 2,
}
var Remap_Lr_Type = [
    FramRestorationType.RESTORE_NONE, FramRestorationType.RESTORE_SWITCHABLE, FramRestorationType.RESTORE_WIENER, FramRestorationType.RESTORE_SGRPROJ
]

export function read_tx_mode(bs: Av1Bs) {
    const c: any = bs.ctx;
    if (c.CodedLossless == 1) {
        c.TxMode = c.ONLY_4X4
    } else {
        bs.f(`tx_mode_select`, 1);
        if (c.tx_mode_select) {
            c.TxMode = c.TX_MODE_SELECT
        } else {
            c.TxMode = c.TX_MODE_LARGEST
        }
    }
}

export function skip_mode_params(bs: Av1Bs) {
    const c: any = bs.ctx;
    if (c.FrameIsIntra || !c.reference_select || !c.enable_order_hint) {
        c.skipModeAllowed = 0
    } else {
        c.forwardIdx = -1
        c.backwardIdx = -1
        for (let i = 0; i < constant.REFS_PER_FRAME; i++) {
            c.refHint = c.RefOrderHint[c.ref_frame_idx[i]]
            if (get_relative_dist(bs, c.refHint, c.OrderHint) < 0) {
                if (c.forwardIdx < 0 ||
                    get_relative_dist(bs, c.refHint, c.forwardHint) > 0) {
                    c.forwardIdx = i
                    c.forwardHint = c.refHint
                }
            } else if (get_relative_dist(bs, c.refHint, c.OrderHint) > 0) {
                if (c.backwardIdx < 0 ||
                    get_relative_dist(bs, c.refHint, c.backwardHint) < 0) {
                    c.backwardIdx = i
                    c.backwardHint = c.refHint
                }
            }
        }
        if (c.forwardIdx < 0) {
            c.skipModeAllowed = 0
        } else if (c.backwardIdx >= 0) {
            c.skipModeAllowed = 1
            c.SkipModeFrame[0] = RefFrame0.LAST_FRAME + Math.min(c.forwardIdx, c.backwardIdx)
            c.SkipModeFrame[1] = RefFrame0.LAST_FRAME + Math.max(c.forwardIdx, c.backwardIdx)
        } else {
            c.secondForwardIdx = -1
            for (let i = 0; i < constant.REFS_PER_FRAME; i++) {
                c.refHint = c.RefOrderHint[c.ref_frame_idx[i]]
                if (get_relative_dist(bs, c.refHint, c.forwardHint) < 0) {
                    if (c.secondForwardIdx < 0 ||
                        get_relative_dist(bs, c.refHint, c.secondForwardHint) > 0) {
                        c.secondForwardIdx = i
                        c.secondForwardHint = c.refHint
                    }
                }
            }
            if (c.secondForwardIdx < 0) {
                c.skipModeAllowed = 0
            } else {
                c.skipModeAllowed = 1
                c.SkipModeFrame[0] = RefFrame0.LAST_FRAME + Math.min(c.forwardIdx, c.secondForwardIdx)
                c.SkipModeFrame[1] = RefFrame0.LAST_FRAME + Math.max(c.forwardIdx, c.secondForwardIdx)
            }
        }
    }
    if (c.skipModeAllowed) {
        bs.f(`skip_mode_present`, 1);
    } else {
        c.skip_mode_present = 0
    }
}

export function frame_reference_mode(bs: Av1Bs) {
    const c: any = bs.ctx;
    if (c.FrameIsIntra) {
        c.reference_select = 0
    } else {
        bs.f(`reference_select`, 1);
    }
}


export function read_global_param(bs: Av1Bs, type: number, ref: number, idx: number) {
    const c: any = bs.ctx;
    c.absBits = constant.GM_ABS_ALPHA_BITS
    c.precBits = constant.GM_ALPHA_PREC_BITS
    if (idx < 2) {
        if (type == constant.TRANSLATION) {
            c.absBits = constant.GM_ABS_TRANS_ONLY_BITS - (1 - c.allow_high_precision_mv)
            c.precBits = constant.GM_TRANS_ONLY_PREC_BITS - (1 - c.allow_high_precision_mv)
        } else {
            c.absBits = constant.GM_ABS_TRANS_BITS
            c.precBits = constant.GM_TRANS_PREC_BITS
        }
    }
    c.precDiff = constant.WARPEDMODEL_PREC_BITS - c.precBits
    c.round = (idx % 3) == 2 ? (1 << constant.WARPEDMODEL_PREC_BITS) : 0
    c.sub = (idx % 3) == 2 ? (1 << c.precBits) : 0
    c.mx = (1 << c.absBits)
    c.r = (c.PrevGmParams[ref][idx] >> c.precDiff) - c.sub
    c.gm_params[ref][idx] =
        (decode_signed_subexp_with_ref(bs, -c.mx, c.mx + 1, c.r) << c.precDiff) + c.round
}

export function global_motion_params(bs: Av1Bs) {
    const c: any = bs.ctx;
    for (let ref = RefFrame0.LAST_FRAME; ref <= RefFrame0.ALTREF_FRAME; ref++) {
        c.GmType[ref] = constant.IDENTITY
        for (let i = 0; i < 6; i++) {
            c.gm_params[ref][i] = ((i % 3 == 2) ?
                1 << constant.WARPEDMODEL_PREC_BITS : 0)
        }
    }
    if (c.FrameIsIntra)
        return
    for (let ref = RefFrame0.LAST_FRAME; ref <= RefFrame0.ALTREF_FRAME; ref++) {
        bs.f(`is_global`, 1);
        if (c.is_global) {
            bs.f(`is_rot_zoom`, 1);
            if (c.is_rot_zoom) {
                c.type = constant.ROTZOOM
            } else {
                bs.f(`is_translation`, 1);
                c.type = c.is_translation ? constant.TRANSLATION : constant.AFFINE
            }
        } else {
            c.type = constant.IDENTITY
        }
        c.GmType[ref] = c.type

        if (c.type >= constant.ROTZOOM) {
            read_global_param(bs, c.type, ref, 2)
            read_global_param(bs, c.type, ref, 3)
            if (c.type == constant.AFFINE) {
                read_global_param(bs, c.type, ref, 4)
                read_global_param(bs, c.type, ref, 5)
            } else {
                c.gm_params[ref][4] = -c.gm_params[ref][3]
                c.gm_params[ref][5] = c.gm_params[ref][2]
            }
        }
        if (c.type >= constant.TRANSLATION) {
            read_global_param(bs, c.type, ref, 0);
            read_global_param(bs, c.type, ref, 1);
        }
    }
}




export function loop_filter_params(bs: Av1Bs) {
    const c: any = bs.ctx;
    if (c.CodedLossless || c.allow_intrabc) {
        c.loop_filter_level[0] = 0
        c.loop_filter_level[1] = 0
        c.loop_filter_ref_deltas[RefFrame0.INTRA_FRAME] = 1
        c.loop_filter_ref_deltas[RefFrame0.LAST_FRAME] = 0
        c.loop_filter_ref_deltas[RefFrame0.LAST2_FRAME] = 0
        c.loop_filter_ref_deltas[RefFrame0.LAST3_FRAME] = 0
        c.loop_filter_ref_deltas[RefFrame0.BWDREF_FRAME] = 0
        c.loop_filter_ref_deltas[RefFrame0.GOLDEN_FRAME] = -1
        c.loop_filter_ref_deltas[RefFrame0.ALTREF_FRAME] = -1
        c.loop_filter_ref_deltas[RefFrame0.ALTREF2_FRAME] = -1
        for (let i = 0; i < 2; i++) {
            c.loop_filter_mode_deltas[i] = 0
        }
        return
    }
    bs.f(`loop_filter_level[${0}]`, 6);
    bs.f(`loop_filter_level[${1}]`, 6);
    if (c.NumPlanes > 1) {
        if (c.loop_filter_level[0] || c.loop_filter_level[1]) {
            bs.f(`loop_filter_level[${2}]`, 6);
            bs.f(`loop_filter_level[${3}]`, 6);
        }
    }
    bs.f(`loop_filter_sharpness`, 3);
    bs.f(`loop_filter_delta_enabled`, 1);
    if (c.loop_filter_delta_enabled == 1) {
        bs.f(`loop_filter_delta_update`, 1);
        if (c.loop_filter_delta_update == 1) {
            for (let i = 0; i < constant.TOTAL_REFS_PER_FRAME; i++) {
                bs.f(`update_ref_delta`, 1);
                if (c.update_ref_delta == 1)
                    bs.su(`loop_filter_ref_deltas[${i}]`, 1 + 6);
            }
            for (let i = 0; i < 2; i++) {
                bs.f(`update_mode_delta`, 1);
                if (c.update_mode_delta == 1)
                    bs.su(`loop_filter_mode_deltas[${i}]`, 1 + 6);
            }
        }
    }
}