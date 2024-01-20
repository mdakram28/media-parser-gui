import { HexEditor } from "../../components/hex-editor";
import { BitBuffer } from "../../bitstream/buffer";
import { BitstreamExplorer, EMPTY_TREE } from "../../bitstream/bitstream-explorer";
import { BitstreamUploader } from "../../bitstream/uploader";
import { AV1 } from "./av1-bitstream";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { extractMp4Tracks, isMP4Format } from "../../formats/mp4/mp4-bitstream";
import { SyntaxToolbar } from "../../components/syntax-toolbar";
import { SyntaxTable } from "../../components/syntax-table";
import { MediaTrack } from "../../types/media.types";
import { useState } from "react";
import { extracIvfTracks, isIVFFormat } from "../ivf/ivf-bitstream";
import { TrackDownloader } from "../../components/downloader";
import { FrameViewer } from "../../components/frame-viewer";
import { Tabs } from "../../components/tabs";
import { FrameViewerFfmpeg } from "../../components/frame-viewer-libde265";

export const Av1AnalyzerComponent = (props: {}) => {
    const [tracks, setTracks] = useState<Record<string, MediaTrack>>({});
    const [selectedTrack, setSelectedTrack] = useState<string>();

    return <BitstreamExplorer
        parser={(buffer: BitBuffer[]) => {
            return AV1(buffer);
        }}
        containers={["Detect", "MP4", "IVF", "OBU"]}
        unpack={(buffer: Uint8Array, format: string) => {
            format = format.split(" ")[0].toLowerCase();
            if (format == "mp4" || (format == "detect" && isMP4Format(buffer))) {
                const tracks = extractMp4Tracks(buffer, ["av01"]);
                if (Object.keys(tracks).length === 0) {
                    alert(`Could not find "av01" track in mp4 file.`);
                    return ["mp4", []];
                }
                setTracks(tracks);
                const trackId = selectedTrack || Object.keys(tracks)[0];
                const buffers = tracks[trackId].chunkRanges.map(chunkRange => new BitBuffer(buffer, chunkRange));
                return ["mp4", buffers];
            } else if (format == "ivf" || (format == "detect" && isIVFFormat(buffer))) {
                const tracks = extracIvfTracks(buffer, ["av01"]);
                if (Object.keys(tracks).length === 0) {
                    alert(`Could not find "av01" track in ivf file.`);
                    return ["mp4", []];
                }
                setTracks(tracks);
                const trackId = selectedTrack || Object.keys(tracks)[0];
                const buffers = tracks[trackId].chunkRanges.map(chunkRange => new BitBuffer(buffer, chunkRange));
                console.log(trackId, tracks, buffers);
                return ["ivf", buffers];
            }
            return ["obu", [new BitBuffer(buffer)]];
        }}
        uploader={<BitstreamUploader title="Drop AV1 raw bitstream file" samples={{
            "av1_multi.mp4": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/sample_data/av1_multi.mp4",
            "av1_single.ivf": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/sample_data/av1_single.ivf",
            "av1_audvid.mp4": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/sample_data/av1_audvid.mp4",
            "av1_single.mp4": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/sample_data/av1_single.mp4",
            "av1_single.obu": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/sample_data/av1_single.obu",
        }} />}
    >
        <PanelGroup autoSaveId="example" direction="horizontal">
            <Panel defaultSize={50} className="panel">
                <SyntaxToolbar
                    leftItems={<>
                        {
                            tracks && <div className="toolbar-item" data-tooltip="Select track to parse">
                                Track
                                <select value={selectedTrack} onChange={e => setSelectedTrack(e.target.value)}>
                                    {Object.keys(tracks).map(id => <option key={id} value={id}>{id}</option>)}
                                </select>
                            </div>
                        }
                        <TrackDownloader downloadExtension=".obu" />
                    </>} />
                <SyntaxTable />
            </Panel>
            <PanelResizeHandle className="resize-handle fa-solid fa-ellipsis-vertical" />
            <Panel className="panel">
                <Tabs defaultTab="frame"
                    tabs={[
                        {key: "frame", title: "Frame", render: <FrameViewer config={{codec: "av01.0.15M.10"}}/>},
                        {key: "hexEditor", title: "Hex", render: <HexEditor />}
                    ]}
                />
            </Panel>
        </PanelGroup>
    </BitstreamExplorer>
}
