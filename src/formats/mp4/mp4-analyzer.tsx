import { HexEditor } from "../../components/hex-editor";
import { Bitstream } from "../../bitstream/parser";
import { ISOBMFF } from "./mp4-bitstream";
import { BitBuffer } from "../../bitstream/buffer";
import { BitstreamExplorer, EMPTY_TREE } from "../../bitstream/bitstream-explorer";
import { BitstreamUploader } from "../../bitstream/uploader";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { SyntaxTable } from "../../components/syntax-table";
import { SyntaxToolbar } from "../../components/syntax-toolbar";

export const Mp4AnalyzerComponent = (props: {}) => {
    return <BitstreamExplorer
        parser={(buffers: BitBuffer[]) => {
            const bs = new Bitstream(buffers[0]);
            ISOBMFF(bs, bs.getEndPos());
            return (bs.getCurrent().children || [EMPTY_TREE])[0];
        }}
        uploader={<BitstreamUploader title="Drop MP4 file here" samples={{
            "av1_multi.mp4": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/sample_data/av1_multi.mp4",
            "av1_audvid.mp4": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/sample_data/av1_audvid.mp4",
            "hevc_single.mp4": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/sample_data/hevc_single.mp4",
        }} />}
    >
        <PanelGroup autoSaveId="example" direction="horizontal">
            <Panel defaultSize={50} className="panel">
                <SyntaxToolbar />
                <SyntaxTable />
            </Panel>
            <PanelResizeHandle className="resize-handle fa-solid fa-ellipsis-vertical" />
            <Panel className="panel">
                <HexEditor />
            </Panel>
        </PanelGroup>
    </BitstreamExplorer>
}
