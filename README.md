# av1-parser-gui

A browser based AV1 bitstream parser and visualizer.
Live App: https://mdakram.com/av1-parser-gui/

### Preview
![](docs/output.gif)

## Usage

To install and start, follow these steps:

```bash
# Get the code
git clone https://github.com/mdakram28/av1-parser-gui.git
cd av1-parser-gui
# Build
npm install
# Run
npm start
```

## Input processing

The input needs to be a raw AV1 bitstream.
You can extract the raw bitstream from a .mp4/.mov or any other container by using ffmpeg:

```bash
ffmpeg -i my/input/video.mp4 -t 2 -c:v copy -copy_unknown bitstream.obu
```

Upload the bitstream in the GUI.