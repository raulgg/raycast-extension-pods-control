<p align="center">
  <img src="extension/assets/pods-control.png" width="128" alt="Pods Control icon">
</p>

<h1 align="center">Pods Control Raycast Extension</h1>

<p align="center">
  <a href="https://www.raycast.com/raulg/pods-control"><img alt="Pods Control on Raycast" src="https://img.shields.io/badge/Raycast-Pods%20Control-FF6363?style=flat-square&amp;logo=raycast&amp;logoColor=white"></a>
  <a href="https://www.raycast.com/raulg/pods-control"><img alt="Pods Control downloads on the Raycast Store" src="https://img.shields.io/raycast/dt/raulg/pods-control?style=flat-square&amp;logo=raycast&amp;logoColor=white&amp;color=FF6363"></a>
  <a href="https://github.com/raulgg/raycast-extension-pods-control/actions/workflows/quality.yaml"><img alt="Quality workflow status" src="https://img.shields.io/github/actions/workflow/status/raulgg/raycast-extension-pods-control/quality.yaml?branch=main&amp;style=flat-square&amp;label=quality"></a>
  <a href="LICENSE"><img alt="MIT license" src="https://img.shields.io/github/license/raulgg/raycast-extension-pods-control?style=flat-square"></a>
</p>

<p align="center">
  <a href="https://www.raycast.com/raulg/pods-control"><img alt="Install Pods Control from the Raycast Store" height="48" src="https://www.raycast.com/raulg/pods-control/install_button@2x.png"></a>
</p>

A Raycast extension that reads and changes the listening mode and Conversation Awareness of the connected AirPods or Beats, and shows the confirmed state in command subtitles.

The [development repository](https://github.com/raulgg/raycast-extension-pods-control) is where the extension is developed and tested. What the [Raycast Store](https://www.raycast.com/raulg/pods-control) publishes lives in [`extension/`](extension/). Setup, requirements, and troubleshooting are in the [extension README](extension/README.md).

## Features

- Set the listening mode to Off, Transparency, Adaptive, or Noise Cancellation.
- Cycle Listening Mode moves to the next enabled listening mode after the confirmed one. It follows listening mode order, wraps around, and skips modes the device does not support.
- Toggle Conversation Awareness between On and Off.
- Cycle Listening Mode and Toggle Conversation Awareness show that feature's confirmed state in the subtitle. Pods Status shows the listening mode and Conversation Awareness together in the status subtitle.
- Pods Status runs a status refresh and updates every subtitle from it. Turn on its background refresh to repeat that refresh every minute.
- Manage CLI detects, installs, updates, or repairs the [CLI](https://github.com/raulgg/pods-control).

Set to Adaptive and Set to Off start disabled. Adaptive needs a device that supports it. Off needs Off Listening Mode on in the device settings.

## Screenshots

Commands in Raycast. Cycle Listening Mode, Toggle Conversation Awareness, and Pods Status show the confirmed state. The set commands and Manage CLI show the default subtitle.

![Raycast command list, with the confirmed listening mode and Conversation Awareness in the subtitles](extension/metadata/pods-control-1.png)

Manage CLI when the CLI is not installed. Homebrew and Apple's developer tools are ready, and the next action is Install with Homebrew.

![Manage CLI ready to install the CLI with Homebrew](extension/metadata/pods-control-2.png)

## Contribute to the extension

Tests, test tooling, and the contributor docs stay at the root of the development repository. Read [CONTRIBUTING.md](CONTRIBUTING.md) before changing the extension. [ARCHITECTURE.md](ARCHITECTURE.md) maps the code, and [GLOSSARY.md](GLOSSARY.md) defines the terms used here.
