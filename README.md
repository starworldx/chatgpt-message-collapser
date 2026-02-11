# chatgpt-message-collapser
Collapses user and AI conversations to make it easy to find specific chats and scrolling

# ChatGPT Message Collapser

A Chrome extension to collapse and expand messages in ChatGPT conversations. Helps navigate long threads by showing a 3-line preview of each message.

## Features

- **Collapse/Expand individual messages** — Click the ▼ button on any message
- **Collapse All / Expand All** — Toolbar buttons for bulk actions
- **3-line preview** — Collapsed messages show first few lines with fade effect
- **Scroll to Top/Bottom** — Quick navigation for long conversations
- **Message counter** — Shows how many messages are collapsed
- **Auto-detects new messages** — Works with streaming responses

## Installation

1. **Download** — Clone this repo or download the ZIP file
   ```bash
   git clone https://github.com/YOUR_USERNAME/chatgpt-message-collapser.git
   ```

2. **Open Chrome Extensions** — Navigate to `chrome://extensions/`

3. **Enable Developer Mode** — Toggle the switch in the top right corner

4. **Load the Extension** — Click "Load unpacked" and select the extension folder

5. **Done** — Visit [chatgpt.com](https://chatgpt.com) and start collapsing messages

## Usage

| Action | How |
|--------|-----|
| Collapse/expand one message | Click the ▼ button on the left of the message |
| Collapse all messages | Click "Collapse All" in the toolbar (top right) |
| Expand all messages | Click "Expand All" in the toolbar |
| Jump to top | Click "Top" in the toolbar |
| Jump to bottom | Click "Bottom" in the toolbar |

## Privacy

This extension:
- Runs entirely locally in your browser
- Makes no external network requests
- Collects no data
- Only activates on `chatgpt.com`

## Known Limitations

- ChatGPT occasionally updates their DOM structure, which may break selectors. If messages stop collapsing, the extension may need an update.
- Collapse state is not persisted across page refreshes (by design — keeps it simple)

## Contributing

Feel free to open issues or submit pull requests. This is a personal project shared for others who might find it useful.

## License

MIT License — use it however you like.

---

Built because I needed to navigate long ChatGPT conversations without endless scrolling.
