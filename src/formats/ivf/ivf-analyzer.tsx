import { BitBuffer } from "../../bitstream/buffer";
import { BitstreamExplorer } from "../../bitstream/bitstream-explorer";
import { BitstreamUploader } from "../../bitstream/uploader";
import { DuckIVF } from "./ivf-bitstream";
import { AnalyzerLayout } from "../../components/analyzer-layout";
import { TrackDownloader } from "../../components/downloader";
import { SyntaxToolbar } from "../../components/syntax-toolbar";
import { SyntaxTable } from "../../components/syntax-table";
import { HexEditor } from "../../components/hex-editor";

export function IvfAnalyzerComponent() {
    return (
        <BitstreamExplorer
            parser={(buffers) => DuckIVF(buffers[0])}
            uploader={
                <BitstreamUploader title="Drop IVF file here" samples={{
                    "av1_single.ivf": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/sample_data/av1_single.ivf",
                }} />
            }
        >
            <AnalyzerLayout
                left={<>
                    <SyntaxToolbar leftItems={<TrackDownloader downloadExtension=".ivf" />} />
                    <SyntaxTable />
                </>}
                right={<HexEditor />}
            />
        </BitstreamExplorer>
    );
}
