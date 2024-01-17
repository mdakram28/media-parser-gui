import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { BitstreamExplorerContext } from "../bitstream/bitstream-explorer";



export function FrameViewer({ config }: { config: VideoDecoderConfig }) {
    const { trackBuffer } = useContext(BitstreamExplorerContext);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [frames, setFrames] = useState<VideoFrame[]>([]);
    const [currentFrame, setCurrentFrame] = useState<number>(0);
    
    const redraw = useCallback(() => {
        if (currentFrame >= frames.length) return;

        canvasRef.current!.width = containerRef.current!.clientWidth;
        canvasRef.current!.height = containerRef.current!.clientHeight;

        const canvas = canvasRef.current!;
        const context = canvas.getContext('2d')!;
        const frame = frames[currentFrame];
        console.log(frame.displayHeight, frame.displayWidth);

        var vRatio = frame.displayWidth / frame.displayHeight;

        const w = canvas.width
        const h = canvas.width/vRatio;
        context.drawImage(frame, 0, 0, w, h);
        context.strokeStyle = "green";
        context.strokeRect(0,0, w, h);

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

    return <div className="flexv-item" ref={containerRef} style={{overflow: "hidden"}}>
        <div className="toolbar">
            <a data-tooltip="Previous frame" className="toolbar-item"
                onClick={() => currentFrame > 0 && setCurrentFrame( (currentFrame - 1) % frames.length)}>
                <i className="fas fa-chevron-left"></i>
            </a>
            <div className="toolbar-item">
                {currentFrame} / {frames.length}
            </div>
            <a data-tooltip="Next frame" className="toolbar-item"
                onClick={() => setCurrentFrame((currentFrame + 1) % frames.length)}>
                <i className="fas fa-chevron-right"></i>
            </a>
        </div>
        <canvas ref={canvasRef}/>
    </div>
}
