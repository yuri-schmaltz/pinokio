{
  "title": "Face Detector",
  "description": "Detect and analyze faces in images using MediaPipe",
  "version": "1.0.0",
  "icon": "https://emoji.gg/assets/emoji/7329-ai.png",
  "info": "https://github.com/example/face-detector",
  "run": [
    {
      "if": "{{$local.url}}",
      "then": [
        {
          "type": "link",
          "text": "📊 Open Dashboard",
          "href": "{{$local.url}}"
        }
      ]
    }
  ],
  "menu": [
    {
      "text": "🚀 Install Dependencies",
      "href": "install.json",
      "if": "{{!info.installed}}"
    },
    {
      "text": "▶️ Start Server",
      "href": "start.json",
      "if": "{{info.installed && !info.running}}"
    },
    {
      "text": "⏹️ Stop Server",
      "href": "stop.json",
      "if": "{{info.running}}"
    },
    {
      "text": "🔄 Update",
      "href": "update.json"
    },
    {
      "text": "🧹 Reset App",
      "href": "reset.json"
    },
    {
      "text": "🔍 Diagnostics",
      "href": "diagnostics.json"
    },
    {
      "text": "✓ Check GPU",
      "href": "check_gpu.json"
    }
  ],
  "tabs": [
    {
      "text": "Overview",
      "href": "#"
    },
    {
      "text": "Upload Image",
      "href": "#upload"
    },
    {
      "text": "Results",
      "href": "#results"
    },
    {
      "text": "Export",
      "href": "#export"
    },
    {
      "text": "Settings",
      "href": "#settings"
    },
    {
      "text": "Logs",
      "href": "#logs"
    }
  ]
}
