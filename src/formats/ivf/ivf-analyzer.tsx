import { HexEditor } from "../../components/hex-editor";
import { Bitstream } from "../../bitstream/parser";
import { BitBuffer } from "../../bitstream/buffer";
import { BitstreamExplorer, EMPTY_TREE } from "../../bitstream/bitstream-explorer";
import { BitstreamUploader } from "../../bitstream/uploader";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { SyntaxTable } from "../../components/syntax-table";
import { SyntaxToolbar } from "../../components/syntax-toolbar";
import { DuckIVF } from "./ivf-bitstream";
import { TrackDownloader } from "../../components/downloader";

export const IvfAnalyzerComponent = (props: {}) => {
    return <BitstreamExplorer
        parser={(buffers: BitBuffer[]) => {
            return DuckIVF(buffers[0]);
        }}
        uploader={<BitstreamUploader title="Drop MP4 file here" samples={{
            "av1_single.ivf": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/sample_data/av1_single.ivf",
        }} />}
    >
        <PanelGroup autoSaveId="example" direction="horizontal">
            <Panel defaultSize={50} className="panel">
                <SyntaxToolbar
                    leftItems={<TrackDownloader downloadExtension=".ivf" />}
                />
                <SyntaxTable />
            </Panel>
            <PanelResizeHandle className="resize-handle fa-solid fa-ellipsis-vertical" />
            <Panel className="panel">
                <HexEditor />
            </Panel>
        </PanelGroup>
    </BitstreamExplorer>
}
