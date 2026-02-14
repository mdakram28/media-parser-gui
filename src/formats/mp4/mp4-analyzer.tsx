import { Bitstream } from "../../bitstream/parser";
import { ISOBMFF } from "./mp4-bitstream";
import { BitBuffer } from "../../bitstream/buffer";
import { BitstreamExplorer, EMPTY_TREE } from "../../bitstream/bitstream-explorer";
import { BitstreamUploader } from "../../bitstream/uploader";
import { AnalyzerLayout } from "../../components/analyzer-layout";
import { SyntaxToolbar } from "../../components/syntax-toolbar";
import { SyntaxTable } from "../../components/syntax-table";
import { HexEditor } from "../../components/hex-editor";

export function Mp4AnalyzerComponent() {
    return (
        <BitstreamExplorer
            parser={(buffers) => {
                const bs = new Bitstream(buffers[0]);
                ISOBMFF(bs, bs.getEndPos());
                return (bs.getCurrent().children || [EMPTY_TREE])[0];
            }}
            uploader={
                <BitstreamUploader title="Drop MP4 file here" samples={{
                    "av1_multi.mp4": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/sample_data/av1_multi.mp4",
                    "av1_audvid.mp4": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/sample_data/av1_audvid.mp4",
                    "hevc_single.mp4": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/sample_data/hevc_single.mp4",
                }} />
            }
        >
            <AnalyzerLayout
                left={<>
                    <SyntaxToolbar />
                    <SyntaxTable />
                </>}
                right={<HexEditor />}
            />
        </BitstreamExplorer>
    );
}
