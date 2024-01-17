import { ReactElement, useContext, useState } from "react";
import { BitstreamExplorerContext } from "../bitstream/bitstream-explorer";
import { FormControlLabel, Switch } from "@mui/material";
import { MediaTrack } from "../types/media.types";
import { downloadBlob } from "../browser-util";
import { SyntaxTableSettings } from "./syntax-table";



export function SyntaxToolbar({ leftItems, rightItems }: {
    rightItems?: ReactElement,
    leftItems?: ReactElement
}) {
    const {
        syntax: root,
        setFilter,
        reset,
        settings, setSettings
    } = useContext(BitstreamExplorerContext);

    function SettingSwitch<T extends keyof SyntaxTableSettings>(
        title: string,
        key: T
    ) {

        return <div className="toolbar-item">
            <FormControlLabel control={
                <Switch value={settings[key]} onChange={(ev) => setSettings(s => ({ ...s, [key]: ev.target.checked }))} />
            } label={title} />
        </div>
    }

    return <>
        <div className="toolbar">
            <div data-tooltip="Filter by title" className="toolbar-item" style={{ verticalAlign: "middle" }}>
                <i className="fas fa-search"></i>&nbsp;&nbsp;
                <form onSubmit={(e: any) => {
                    e.preventDefault();
                    const search = new FormData(e.target).get("search")?.toString() || "";
                    setFilter(f => ({ ...f, text: search }))
                }}>
                    <input name="search" />
                </form>
            </div>
            {leftItems}

            <span className="toolbar-item" style={{ flex: 1 }}></span>
            {rightItems}

            {/* Right */}
            <a className="toolbar-item"
                data-tooltip="Reset"
                onClick={reset}><i className="fas fa-redo"></i></a>
            <a data-tooltip="Settings" className="toolbar-item"
                onClick={(ev: any) => {
                    console.log(ev.target);
                    const button: HTMLElement = ev.target.closest(".toolbar-item");
                    const menu = button.getElementsByClassName("toolbar-menu")[0];
                    if (!menu) return;
                    menu.classList.toggle("visible");
                    if (menu.classList.contains("visible")) {
                        const closeListener = (ev: any) => {
                            if (!menu.contains(ev.target)) {
                                menu.classList.remove("visible");
                                document.removeEventListener("click", closeListener);
                            }
                        };
                        setTimeout(() => document.addEventListener("click", closeListener), 0);
                    }
                }}>
                <i className="fas fa-sliders-h"></i>
                <div className="toolbar-menu">

                    
                    {SettingSwitch("Show hidden syntax", "showHiddenSyntax")}
                    {SettingSwitch("Show size bars", "showSizeBar")}
                </div>
            </a >
        </div >
    </>
}