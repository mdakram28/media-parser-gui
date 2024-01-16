# media-parser-gui

A browser based AV1, HEVC, MP4, IVF bitstream parser.

Features:
1. *Auto detect* and parse AV1/HEVC data from *MP4 and IVF* containers.
2. Unpack and download raw bitstream from MP4/IVF file.
2. In browser parsing. Data is not sent to any server.

Live App: https://mdakram.com/media-parser-gui/

#### AV1 Demo
https://mdakram.com/media-parser-gui/#/av1
![](public/ss_av1.png)

#### HEVC Demo
https://mdakram.com/media-parser-gui/#/hevc
![](public/ss_hevc.png)

#### MP4 Demo
https://mdakram.com/media-parser-gui/#/mp4
![](public/ss_mp4.png)


## Usage

To install and start, follow these steps:

```bash
# Get the code
git clone https://github.com/mdakram28/media-parser-gui.git
cd media-parser-gui
# Build
npm install
# Run
npm start
```

## AV1 Input

For the AV1 parser, the input needs to be a raw AV1 bitstream.
You can extract the raw bitstream from a .mp4/.mov or any other container by using ffmpeg:

```bash
ffmpeg -i my/input/video.mp4 -t 2 -c:v copy -copy_unknown bitstream.obu
```

Upload the bitstream in the GUI.