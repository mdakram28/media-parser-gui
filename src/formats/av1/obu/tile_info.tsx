import { syntax } from "../../../bitstream/parser";
import { Av1Bs } from "../av1-bitstream"
import { tile_log2 } from "./common";
import { Av1Const } from "./constants";

export const tile_info = syntax("tile_info", (bs: Av1Bs) => {
    const c: any = bs.ctx;

    c.sbCols = c.use_128x128_superblock ? ((c.MiCols + 31) >> 5) : ((c.MiCols + 15) >> 4)
    c.sbRows = c.use_128x128_superblock ? ((c.MiRows + 31) >> 5) : ((c.MiRows + 15) >> 4)
    c.sbShift = c.use_128x128_superblock ? 5 : 4
    c.sbSize = c.sbShift + 2
    c.maxTileWidthSb = Av1Const.MAX_TILE_WIDTH >> c.sbSize
    c.maxTileAreaSb = Av1Const.MAX_TILE_AREA >> (2 * c.sbSize)
    c.minLog2TileCols = tile_log2(c.maxTileWidthSb, c.sbCols)
    c.maxLog2TileCols = tile_log2(1, Math.min(c.sbCols, Av1Const.MAX_TILE_COLS))
    c.maxLog2TileRows = tile_log2(1, Math.min(c.sbRows, Av1Const.MAX_TILE_ROWS))
    c.minLog2Tiles = Math.max(c.minLog2TileCols,
        tile_log2(c.maxTileAreaSb, c.sbRows * c.sbCols))

    bs.f(`uniform_tile_spacing_flag`, 1);
    if (c.uniform_tile_spacing_flag) {
        c.TileColsLog2 = c.minLog2TileCols
        while (c.TileColsLog2 < c.maxLog2TileCols) {
            bs.f(`increment_tile_cols_log2`, 1);
            if (c.increment_tile_cols_log2 == 1)
                c.TileColsLog2++;
            else
                break
        }
        c.tileWidthSb = (c.sbCols + (1 << c.TileColsLog2) - 1) >> c.TileColsLog2
        let i = 0;
        for (let startSb = 0; startSb < c.sbCols; startSb += c.tileWidthSb) {
            c.MiColStarts[i] = startSb << c.sbShift
            i += 1
        }
        c.MiColStarts[i] = c.MiCols
        c.TileCols = i

        c.minLog2TileRows = Math.max(c.minLog2Tiles - c.TileColsLog2, 0)
        c.TileRowsLog2 = c.minLog2TileRows
        while (c.TileRowsLog2 < c.maxLog2TileRows) {
            bs.f(`increment_tile_rows_log2`, 1);
            if (c.increment_tile_rows_log2 == 1)
                c.TileRowsLog2++
            else
                break
        }
        c.tileHeightSb = (c.sbRows + (1 << c.TileRowsLog2) - 1) >> c.TileRowsLog2
        i = 0
        for (let startSb = 0; startSb < c.sbRows; startSb += c.tileHeightSb) {
            c.MiRowStarts[i] = c.startSb << c.sbShift
            i += 1
        }
        c.MiRowStarts[i] = c.MiRows
        c.TileRows = i
    } else {
        c.widestTileSb = 0
        c.startSb = 0
        let i;
        for (i = 0; c.startSb < c.sbCols; i++) {
            c.MiColStarts[i] = c.startSb << c.sbShift
            c.maxWidth = Math.min(c.sbCols - c.startSb, c.maxTileWidthSb)
            bs.ns("width_in_sbs_minus_1", c.maxWidth);
            c.sizeSb = c.width_in_sbs_minus_1 + 1
            c.widestTileSb = Math.max(c.sizeSb, c.widestTileSb)
            c.startSb += c.sizeSb
        }
        c.MiColStarts[i] = c.MiCols
        c.TileCols = i
        c.TileColsLog2 = tile_log2(1, c.TileCols)

        if (c.minLog2Tiles > 0)
            c.maxTileAreaSb = (c.sbRows * c.sbCols) >> (c.minLog2Tiles + 1)
        else
            c.maxTileAreaSb = c.sbRows * c.sbCols
        c.maxTileHeightSb = Math.max(c.maxTileAreaSb / c.widestTileSb, 1)

        c.startSb = 0
        for (i = 0; c.startSb < c.sbRows; i++) {
            c.MiRowStarts[i] = c.startSb << c.sbShift
            c.maxHeight = Math.min(c.sbRows - c.startSb, c.maxTileHeightSb)
            bs.ns("height_in_sbs_minus_1", c.maxHeight);
            c.sizeSb = c.height_in_sbs_minus_1 + 1
            c.startSb += c.sizeSb
        }
        c.MiRowStarts[i] = c.MiRows
        c.TileRows = i
        c.TileRowsLog2 = tile_log2(1, c.TileRows)
    }
    if (c.TileColsLog2 > 0 || c.TileRowsLog2 > 0) {
        bs.f("context_update_tile_id", c.TileRowsLog2 + c.TileColsLog2)
        bs.f(`tile_size_bytes_minus_1`, 2);
        c.TileSizeBytes = c.tile_size_bytes_minus_1 + 1
    } else {
        c.context_update_tile_id = 0
    }
});	 




