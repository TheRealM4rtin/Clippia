import React from 'react'

const AboutTab: React.FC = () => {
  return (
    <div>
      <p>Fenestro.io v1.0</p>
      <ul style={{ textDecoration: 'underline' }}>Features</ul>
      <div>
        <li>Infinite whiteboard</li>
        <li>Windows 98-style UI</li>
        <li>Resizable windows</li>
        <li>Drag and drop windows</li>
        <li>Tiptap rich text editor</li>
      </div>
      <ul style={{ textDecoration: 'underline' }}>Roadmap</ul>
      <div>
        <li>Amiga music player</li>
      </div>
      <p>Made with ❤️ by <a href="https://x.com/mrtincss">Martin</a></p>
    </div>
  )
}

export default AboutTab

