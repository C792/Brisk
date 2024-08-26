# Brisk - Minimal Local Music Player
![Logo](./docs/images/Logo.png)
Brisk persues for the top-notch in minimalistic UI design.

## Made by Iansong w/ Tauri and Vanilla HTML/CSS/JS

## How to use

1. Donwload .exe file or Installer on **Release Page**.
1. Move .exe file to the directory you want to keep it.
1. Double Click to open the app. The app will automatically generate audio/ and config/ directory and generate some mp3, json files.

### Keymap
|Key|Function|
|-|-|
|Toggle play/pause|Space|
|Fast forward 5 seconds|→|
|Rewind 5 seconds|←|
|Toggle full screen|F11|
|Seek to starting point|Home|
|Seek to end|End|
|Increase Volume by 5%|↑|
|Decrease Volume by 5%|↓|

### Well-Optimized Application
Using Rust as Backend and Native HTML Renderer (Microsoft WebView2), the application is optimized to use minimum of CPU and RAM despite harming UX.
![0% CPU and 3.6MB memory usage](./docs/images/performance.png)
Image above shows that the app used only 3.6MB while playing 40 minute long symphony (v0.1-beta.2)
