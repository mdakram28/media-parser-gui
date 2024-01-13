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

export function BitstreamUploader({ title }: {title: string}) {
    const { readFileUploadData } = useContext(BitstreamExplorerContext);
    return <div className='FilesDragAndDrop'
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
}