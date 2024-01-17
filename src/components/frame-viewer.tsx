import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { BitstreamExplorerContext } from "../bitstream/bitstream-explorer";
import { mod } from "../browser-util";



export function FrameViewer({ config }: { config: VideoDecoderConfig }) {
    const { trackBuffer } = useContext(BitstreamExplorerContext);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [frames, setFrames] = useState<VideoFrame[]>([]);
    const [currentFrame, setCurrentFrame] = useState<number>(0);

    const redraw = useCallback(() => {
        if (currentFrame >= frames.length) return;

        const canvas = canvasRef.current!;
        const container = containerRef.current!;
        const frame = frames[currentFrame];

        var vRatio = frame.displayWidth / frame.displayHeight;

        const w = container.clientWidth - 2;
        const h = container.clientWidth / vRatio - 2;
        canvas.width = w;
        canvas.height = h;
        // @ts-ignore
        canvas.style.width = w;
        // @ts-ignore
        canvas.style.height = h;

        const context = canvas.getContext('2d')!;
        context.drawImage(frame, 0, 0, w, h);


    }, [frames, currentFrame, containerRef]);

    useEffect(() => {
        (async () => {
            const decoded: VideoFrame[] = [];
            const decoder = new VideoDecoder({
                output: (frame: VideoFrame) => {
                    // frame.close();
                    decoded.push(frame);
                },
                error: console.error,
            });
            decoder.configure(config);

            console.log("Decoding frames ... ");

            for (const buffer of trackBuffer) {
                const chunk = new EncodedVideoChunk({
                    timestamp: 0,
                    type: "key",
                    duration: 1,
                    data: buffer.slice(),
                });
                decoder.decode(chunk);
            }

            await decoder.flush();

            setFrames(decoded);
        })();
    }, [trackBuffer, canvasRef]);

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

    return <div className="flexv-item" ref={containerRef} style={{ overflow: "hidden" }}>
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
                // display: "inline-block",
                height: "100%",
                width: (100 * currentFrame / frames.length) + "%",
                borderTopLeftRadius: 10,
                borderBottomLeftRadius: 10,
                borderRight: "4px solid white",
                backgroundColor: "var(--primary-color)"
            }} />
        </div>
    </div>
}
