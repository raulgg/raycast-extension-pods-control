# Pods Control

Control AirPods and Beats listening modes (Off, Transparency, Adaptive, Noise Cancellation) and Conversation Awareness from Raycast, using a local CLI. Command subtitles show the current state as confirmed by macOS.

It runs on macOS only. Beats headphones that expose these controls in macOS may also work; see the CLI's [compatibility matrix](https://github.com/raulgg/pods-control/blob/HEAD/docs/compatibility.md) for tested models.

## Setup

1. Install the CLI with [Homebrew](https://brew.sh). It builds from source, so this can take a few minutes. If Homebrew reports that Apple's Command Line Tools are missing, run `xcode-select --install` first.

   ```bash
   brew install raulgg/tap/pods-control
   ```

   You can also skip this step: run any Pods Control command and accept **Install with Homebrew** when prompted.

2. Connect your AirPods or Beats and select them as your Mac's audio output.
3. Run a Pods Control command.

The extension needs CLI 0.5.0 or later and looks for it in `/opt/homebrew/bin` and `/usr/local/bin`. **Manage CLI** shows the installed version and offers **Update with Homebrew** when a newer release is available.

**Installing without Homebrew.** Follow the CLI's [installation instructions](https://github.com/raulgg/pods-control/blob/HEAD/README.md#install) and keep the complete installation together, including `avbypass.dylib`. If the binary is outside the standard locations, set its full path in the **CLI Path** preference.

## Commands

| Command                           | What it does                                                                                                                                    |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Set to Noise Cancellation**     | Switch to Noise Cancellation.                                                                                                                   |
| **Set to Transparency**           | Switch to Transparency.                                                                                                                         |
| **Set to Adaptive**               | Switch to Adaptive. Disabled by default; requires a model that supports it.                                                                     |
| **Set to Off**                    | Turn noise control off. Disabled by default; requires Off to be enabled in your AirPods settings.                                               |
| **Cycle Listening Mode**          | Step through the modes selected in its preferences. Unsupported modes are skipped.                                                              |
| **Toggle Conversation Awareness** | Turn Conversation Awareness on or off. Requires a model that supports it.                                                                       |
| **Pods Status**                   | Read the current mode and Conversation Awareness state. Run it once to activate Background Refresh, which keeps subtitles current every minute. |
| **Manage CLI**                    | Install, update, or repair the pods-control CLI. Each screen explains the next step and offers the matching action.                             |

Control commands show a success toast while Raycast is open and a HUD when it is closed, for example when triggered by a hotkey. Subtitles update after macOS confirms the change; if no AirPods or Beats are connected, **Pods Status** shows **Not connected**.

## Preferences

| Preference                 | Command              | Description                                                                                                           |
| -------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **CLI Path**               | Extension            | Full path to the `pods-control` binary. Leave empty for automatic detection. A set path overrides detection.          |
| **Modes to Cycle Through** | Cycle Listening Mode | Checkboxes for Noise Cancellation, Transparency, Adaptive, and Off. Select at least two. Off is unchecked by default. |

## Troubleshooting

### "CLI not found" after installing

Open **Manage CLI**. It detects unlinked or incomplete Homebrew installs and an invalid **CLI Path**, and gives you the exact command or preference to fix. After following the steps, choose **Refresh** in that view and run your command again.

### "Not connected"

Connect your AirPods or Beats and select them as the Mac's audio output. If several compatible devices are connected, disconnect the others; the extension does not choose between devices.

### Adaptive or Conversation Awareness is unavailable

Both depend on your model and firmware. Check the [compatibility matrix](https://github.com/raulgg/pods-control/blob/HEAD/docs/compatibility.md). **Set to Adaptive** is disabled by default; enable it in Raycast's extension settings if your model supports it.

### Off is unavailable

macOS lets you exclude Off from noise control. Enable it in your AirPods settings, or leave Off out of **Modes to Cycle Through**.

### Commands stopped working after a macOS update

Check the compatibility matrix and update the CLI from **Manage CLI** or with `brew upgrade raulgg/tap/pods-control`. A successful install does not by itself mean your device is supported.

## Privacy and security

The extension only runs the CLI locally and collects no analytics. The CLI uses private macOS audio interfaces together with a companion library that adjusts an entitlement check inside its own process; it does not need Accessibility permission or elevated privileges, but Apple can change these interfaces in any macOS update. Read the CLI's [security and trust model](https://github.com/raulgg/pods-control/blob/HEAD/SECURITY.md) before installing. The CLI keeps a small local cache, described in its [reference](https://github.com/raulgg/pods-control/blob/HEAD/docs/cli.md#cached-allow-off-availability).
