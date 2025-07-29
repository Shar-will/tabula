# Tabula - Chrome Extension for Tab Management

## 🎯 Overview

**Tabula** is a powerful Chrome extension that transforms your new tab page into a comprehensive tab management system. Built with modern web technologies, it provides intuitive drag-and-drop functionality, workspace organization, and advanced tab grouping capabilities to enhance your browsing productivity.

## ✨ Features

### 🗂️ **Tab Management**
- **Recent Tabs Sidebar** - Collapsible sidebar showing all currently open tabs
- **Smart Tab Display** - Shows favicons and truncated titles for easy identification
- **Real-time Updates** - Automatically syncs with browser tab changes

### 🎨 **Workspace Organization**
- **Multiple Workspaces** - Create up to 10 separate workspaces for different contexts
- **Workspace Switching** - Smooth slide animations between workspaces
- **Auto-save** - Automatically saves workspace state when switching

### 🖱️ **Drag & Drop System**
- **Intuitive Interface** - Drag tabs from sidebar to create new groups
- **Visual Feedback** - Clear drop zones and visual indicators during drag operations
- **Flexible Organization** - Move tabs between groups or create new groups on canvas

### 📁 **Tab Groups**
- **Customizable Groups** - Editable names and selectable icons from Lucide React
- **Group Actions** - Sort, duplicate, delete, and archive functionality
- **Tab Count Display** - Shows number of tabs with click-to-open-all functionality

### 💾 **Data Persistence**
- **Local Storage** - All data stored locally using IndexedDB
- **Offline Functionality** - Works completely offline
- **Data Recovery** - Recently deleted section with 14-day retention

### 🎭 **Modern UI/UX**
- **Smooth Animations** - Framer Motion powered transitions
- **Responsive Design** - Works on different screen sizes
- **Accessibility** - Full keyboard navigation and ARIA support

## 🛠️ Technology Stack

### **Frontend**
- **React 19** - Latest React with modern hooks and features
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Utility-first styling with latest features
- **Framer Motion** - Smooth animations and transitions

### **Drag & Drop**
- **@dnd-kit/core** - Modern, accessible drag and drop library
- **@dnd-kit/sortable** - Sortable list functionality
- **@dnd-kit/utilities** - Helper utilities for drag operations

### **Build Tools**
- **Vite** - Fast build tool and development server
- **ESLint** - Code quality and consistency
- **PostCSS** - CSS processing and optimization

### **Chrome Extension**
- **Manifest V3** - Latest Chrome extension manifest format
- **Chrome APIs** - tabs, storage, and activeTab permissions
- **IndexedDB** - Local data persistence

## 🚀 Installation

### **For Development**

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/tabula.git
   cd tabula
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

### **Load Extension in Chrome**

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `dist` folder
4. The extension will appear in your extensions list
5. Open a new tab to see Tabula in action

## 📁 Project Structure

```
tabula/
├── src/
│   ├── components/
│   │   └── ui/
│   │       ├── AnimatedButton.tsx
│   │       ├── DragDropTest.tsx
│   │       └── button.tsx
│   ├── hooks/
│   ├── lib/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
│   ├── assets/
│   │   └── icons/
│   ├── background.ts
│   └── manifest.json
├── index.html
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## 🎯 Usage

### **Getting Started**

1. **Open a new tab** - Tabula automatically replaces the default new tab page
2. **View recent tabs** - See all your open tabs in the collapsible sidebar
3. **Create workspaces** - Organize tabs into different workspaces for work, personal, etc.
4. **Drag and drop** - Drag tabs from the sidebar to create new groups or organize existing ones

### **Workspace Management**

- **Switch workspaces** - Click on workspace tabs at the top
- **Create new workspace** - Use the "+" button to add new workspaces
- **Rename workspaces** - Click on workspace names to edit them

### **Tab Organization**

- **Create groups** - Drag tabs to empty canvas areas to create new groups
- **Edit groups** - Click on group names to rename, double-click icons to change
- **Group actions** - Hover over groups to see context menu options
- **Archive/delete** - Use context menus to archive or delete groups

## 🔧 Development

### **Available Scripts**

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:watch` - Build with file watching
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run preview` - Preview production build

### **Key Components**

- **App.tsx** - Main application component
- **DragDropTest.tsx** - Test component for drag and drop functionality
- **AnimatedButton.tsx** - Example component with Framer Motion animations

### **Chrome Extension Development**

- **Manifest V3** - Uses the latest Chrome extension manifest format
- **Content Security Policy** - Secure CSP without unsafe-inline
- **Background Service Worker** - Handles extension background tasks
- **New Tab Override** - Replaces default new tab page

## 🎨 Design System

### **Colors**
- **Primary**: #447EFC (Highlight blue)
- **Background**: #FCFDFF (Clean white)
- **Text**: #232529 (Dark gray)
- **Borders**: #E5E7EB (Light gray)

### **Typography**
- **Font**: Inter
- **Letter Spacing**: -4%
- **Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### **Animations**
- **Easing**: cubic-bezier
- **Library**: Framer Motion
- **Transitions**: Smooth, responsive animations

## 🔒 Privacy & Security

- **No Data Collection** - All data stored locally on your device
- **No External Requests** - Works completely offline
- **Minimal Permissions** - Only requests necessary Chrome APIs
- **Open Source** - Transparent codebase for security review

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Development Guidelines**

- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Implement proper error handling
- Add tests for new features
- Follow the existing code style

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Chrome Extension APIs** - For providing the extension platform
- **React Team** - For the amazing React framework
- **Tailwind CSS** - For the utility-first CSS framework
- **Framer Motion** - For smooth animations
- **@dnd-kit** - For accessible drag and drop functionality

## 📞 Support

- **Issues**: Report bugs and feature requests on GitHub
- **Discussions**: Join community discussions for help and ideas
- **Documentation**: Check the docs folder for detailed guides

---

**Built with ❤️ for better tab management**