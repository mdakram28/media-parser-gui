import styled from "@emotion/styled";
import { Button } from "@mui/material";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { DragEventHandler, useCallback, useContext } from "react";
import { BitstreamExplorerContext } from "./bitstream-explorer";



const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

export function BitstreamUploader({ title, samples }: { title: string, samples?: { [name: string]: string } }) {
    const { readFileUploadData, setBuffer } = useContext(BitstreamExplorerContext);
    return <div>
        <div className='FilesDragAndDrop'
            onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}
            onDrop={(e) => {
                console.log(e);
                e.preventDefault();
                e.stopPropagation();

                const { files } = e.dataTransfer;

                if (files && files.length) {
                    readFileUploadData(files[0]);
                }
            }}>
            <label className='FilesDragAndDrop__area'>
                {title}
                <VisuallyHiddenInput
                    type="file"
                    onChange={e => e.target.files && readFileUploadData(e.target.files[0])}
                />
                <span
                    role='img'
                    aria-label='emoji'
                    className='area__icon'
                >
                    &#128526;
                </span>
            </label>
        </div>

        {
            samples && <>
                <br />
                From Sample File:
                <form className="url-uploader" onSubmit={async (e: any) => {
                    e.preventDefault();
                    const search = new FormData(e.target).get("url")?.toString() || "";
                    if (!search) return;
                    setBuffer(new Uint8Array(await (await fetch(search)).arrayBuffer()));
                }}>
                    <select name="url">
                        {Object.entries(samples).map(([k, v]) => <option value={v}>{k}</option>)}
                    </select>
                    <button type="submit" >Load</button>
                </form></>
        }
        
        <br />
        From URL:
        <form className="url-uploader" onSubmit={async (e: any) => {
            e.preventDefault();
            const search = new FormData(e.target).get("url")?.toString() || "";
            if (!search) return;
            setBuffer(new Uint8Array(await (await fetch(search)).arrayBuffer()));
        }}>
            <input name="url" />
            <button type="submit" >Load</button>
        </form>
    </div>
}