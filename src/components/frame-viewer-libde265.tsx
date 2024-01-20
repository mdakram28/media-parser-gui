import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { BitstreamExplorerContext } from "../bitstream/bitstream-explorer";
import { mod } from "../browser-util";
import { BitBuffer } from "../bitstream/buffer";
import { HEVCSplitNalu, isSystemStreamHEVC, systemStreamToAnnexB } from "../formats/hevc/hevc-bitstream";

const joinBuffer = (buffers: BitBuffer[]) => {
    const ret = new Uint8Array(buffers.reduce((p, b) => p + b.byteLength(), 0));
    let offset = 0;
    for (const buffer of buffers) {
        ret.set(buffer.slice(), offset);
        offset += buffer.byteLength();
    }
    return ret;
}

const NALU_PUSH_DELAY = 0;

export function FrameViewerFfmpeg({ }: {}) {
    const { trackBuffer } = useContext(BitstreamExplorerContext);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [frames, setFrames] = useState<ImageData[]>([]);
    const [currentFrame, setCurrentFrame] = useState<number>(0);
    const logRef = useRef<HTMLPreElement>(null);

    const redraw = useCallback(() => {
        if (currentFrame >= frames.length) return;

        const canvas = canvasRef.current!;
        const container = containerRef.current!;
        const frame = frames[currentFrame];

        var vRatio = frame.width / frame.height;

        // const w = container.clientWidth - 2;
        // const h = container.clientWidth / vRatio - 2;
        const w = frame.width;
        const h = frame.height;
        canvas.width = w;
        canvas.height = h;
        // @ts-ignore
        canvas.style.width = w;
        // @ts-ignore
        canvas.style.height = h;

        const context = canvas.getContext('2d')!;
        context.putImageData(frame, 0, 0);


    }, [frames, currentFrame, containerRef]);

    const log = (...msgs: any[]) => {
        if (!logRef.current) {
            console.log(...msgs);
            return;
        }
        const pre = logRef.current;
        pre.innerHTML += msgs.map(m => m.toString()).join(" ") + "\n";
        // setTimeout(() => {   
        pre.scrollTop = pre.scrollHeight;
        // }, 100);
    }

    // @ts-ignore
    window.logger = {
        log: log,
        error: log
    }

    const extractFrames = async () => {
        // @ts-ignore

        const {Libde265}: any = await import("../third_party/libde265");
        console.log(Libde265);
        const libde265 = new Libde265({ log: log, error: log }).libde265;
        const decoder = new libde265.Decoder(true);
        console.log(decoder);

        decoder.set_image_callback((image: any) => {
            const canvas = canvasRef.current!;
            const context = canvas.getContext('2d')!;

            var w = image.get_width();
            var h = image.get_height();
            const image_data = context.createImageData(w, h);
            for (var i = 0; i < w * h; i++) {
                image_data.data[i * 4 + 3] = 255;
            }

            image.display(image_data, function (display_image_data: any) {
                setFrames(frames => [...frames, display_image_data]);
            });
            image.free();
        });

        let buffer = trackBuffer;
        if (isSystemStreamHEVC(trackBuffer)) {
            log("Converting to annexB for decoding");
            buffer = systemStreamToAnnexB(buffer);
        }

        const nalus = HEVCSplitNalu(buffer);
        log(`Nalu found: ${nalus.length}`);

        const pushNalu = () => {
            if (nalus.length == 0) {
                decoder.flush();
                return;
            }
            const nalu = nalus.shift()?.slice();

            // console.log("Pushing nalu");
            decoder.push_data(nalu);

            decoder.decode(function (err: any) {
                // console.log("Decode callback", err);
                switch (err) {
                    case libde265.DE265_ERROR_WAITING_FOR_INPUT_DATA:
                        setTimeout(pushNalu, NALU_PUSH_DELAY);
                        return;

                    default:
                        if (!libde265.de265_isOK(err)) {
                            log("Error: " + libde265.de265_get_error_text(err));
                            return;
                        }

                }

                if (nalus.length > 0) {
                    setTimeout(pushNalu, NALU_PUSH_DELAY);
                    return;
                }

                log("Decoding finished");
                decoder.free();
            });
        }
        log("Starting decoding");
        setTimeout(pushNalu, NALU_PUSH_DELAY);

        setFrames([]);
        return decoder;
    };

    useEffect(() => {
        const decoder = extractFrames();
        return () => {
            // decoder.stop();
            decoder.then(dec => dec.free());
        }
    }, [trackBuffer]);

    useEffect(() => {
        redraw();
    }, [frames, currentFrame]);

    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver(() => {
            redraw();
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, [containerRef.current]);

    return <div className="flexv-item flexv" ref={containerRef} style={{ overflow: "hidden" }}>
        <script src="/libde265.js" />
        <div className="toolbar">
            <a data-tooltip="Previous frame" className="toolbar-item"
                onClick={() => setCurrentFrame(mod(currentFrame - 1, frames.length))}>
                <i className="fas fa-chevron-left"></i>
            </a>
            <div className="toolbar-item">
                {currentFrame} / {frames.length}
            </div>
            <a data-tooltip="Next frame" className="toolbar-item"
                onClick={() => setCurrentFrame(mod(currentFrame + 1, frames.length))}>
                <i className="fas fa-chevron-right"></i>
            </a>
        </div>
        <canvas ref={canvasRef} tabIndex={0}
            style={{ border: "1px solid var(--border-color)" }}
            onKeyDown={e => {
                if (e.key === "ArrowRight") {
                    setCurrentFrame(mod(currentFrame + 1, frames.length))
                } else if (e.key === "ArrowLeft") {
                    setCurrentFrame(mod(currentFrame - 1, frames.length))
                }
            }} />

        <br />
        <br />
        <div style={{ height: 7, width: "100%", borderRadius: 10, backgroundColor: "var(--secondary-color)" }}>
            <div style={{
                height: "100%",
                width: (100 * currentFrame / frames.length) + "%",
                borderTopLeftRadius: 10,
                borderBottomLeftRadius: 10,
                borderRight: "4px solid white",
                backgroundColor: "var(--primary-color)"
            }} />
        </div>
        <pre ref={logRef} style={{ flex: 1, overflow: "auto" }} />
    </div>
}
