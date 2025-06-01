# HedgeKit 🦔

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1-61dafb)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.3-646cff)](https://vitejs.dev/)

**Collaborative Agents for More Precise UI Generation**

HedgeKit is a schema-driven frontend code generation platform that leverages multiple AI models to help developers build React components and web applications faster. It features live preview, intelligent project planning, and collaborative AI agents that work together to create cohesive user interfaces.

## 🌟 Features

### 🤖 Multi-Agent Collaboration
- **Multiple AI Providers**: Supports OpenAI GPT, Claude Sonnet 4, Claude Opus 4, and Vercel v0
- **Agent Orchestration**: Intelligent workflow automation with automatic tool chaining
- **Action Budget System**: Smart resource management to optimize AI usage

### 🔨 Component Generation
- **AI-Powered Component Builder**: Generate React components from natural language descriptions
- **Multiple Generation Methods**: Choose between OpenAI GPT or Vercel v0 for component creation
- **Live Code Preview**: See your components rendered in real-time as they're generated

### 🎨 Asset Management
- **AI Image Generation**: Create images and logos using AI
- **CDN Integration**: Automatic upload to BunnyCDN for fast global delivery
- **Asset Organization**: Built-in image manager with editing capabilities

### 📋 Project Planning
- **AI Project Planner**: Break down projects into phases, milestones, and actionable tasks
- **Task Tracking**: Monitor progress with status updates and completion tracking
- **Execution CTAs**: One-click actions to execute tasks or start development sessions

### 👁️ Live Preview System
- **Unified Preview**: See all components and scenes in one place
- **Multiple Preview Modes**: Fast preview, compiled preview, and static preview options
- **Screenshot Capture**: Capture and analyze component screenshots for quality assessment

### 🏗️ Project Management
- **Multi-Project Support**: Manage multiple projects with different configurations
- **Schema-Driven Architecture**: Define project structure with TypeScript schemas
- **Version Control Ready**: Clean project structure optimized for Git workflows

## 🎨 Demo & Prototype

Check out the [HedgeKit UI Prototype](https://v0.dev/chat/polishing-agent-builder-2B1HzpJR21G) on v0.dev to see the design and user experience concepts behind the platform.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (`.nvmrc` file included)
- npm or yarn
- API keys for AI providers (at least one):
  - OpenAI API key (`VITE_OPEN_AI_KEY`)
  - Anthropic API key (`VITE_ANTHROPIC_KEY`)
  - Vercel token (`VITE_VERCEL_TOKEN`) for v0 generation

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/hedgekit.git
cd hedgekit
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```env
VITE_OPEN_AI_KEY=your_openai_key
VITE_ANTHROPIC_KEY=your_anthropic_key
VITE_VERCEL_TOKEN=your_vercel_token
VITE_BUNNY_CDN_API_KEY=your_bunny_cdn_key (optional)
```

4. Start the development server:
```bash
npm run dev
```

## 📖 Usage

### Creating a New Project

1. Launch HedgeKit and click "Create New Project"
2. Enter project details:
   - Name and description
   - Framework (React)
   - Choose a theme preset or customize colors
3. Click "Create Project"

### Generating Components

1. Navigate to the **Build Tools** tab
2. In the Component Generator:
   - Select generation method (OpenAI or v0)
   - Describe your component in natural language
   - Click "Generate"
3. The component will appear in the Project tab with live preview

### Using AI Agents

1. Click the chat icon to open the Agent Sidebar
2. Type your request, for example:
   - "Create a user profile card with avatar and social stats"
   - "Generate a project plan for a recipe sharing app"
   - "Build a navigation menu with dropdown support"
3. The agent will execute tools and create artifacts automatically

### Working with Project Plans

1. Go to the **Plan** tab
2. Click "Generate Project Plan" or ask the agent
3. Review the generated phases, milestones, and tasks
4. Use action buttons to:
   - Start a development session
   - Execute specific tasks
   - Review and update the plan

## 🏗️ Architecture

HedgeKit is built with modern web technologies:

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6 for fast development
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React hooks and contexts
- **Code Editor**: CodeMirror 6
- **AI Integration**: Multiple provider abstraction layer

### Key Components

- `AgentOrchestrator`: Manages AI providers and tool execution
- `ComponentGenerator`: Handles component creation logic
- `ProjectManager`: Multi-project state management
- `UnifiedPreview`: Live component rendering system
- `AgentTools`: Extensible tool system for AI actions

## 🛠️ Development

### Running Tests
```bash
npm run test
```

### Type Checking
```bash
npm run typecheck
```

### Linting
```bash
npm run lint
```

### Building for Production
```bash
npm run build
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/) components
- AI providers: [OpenAI](https://openai.com/), [Anthropic](https://anthropic.com/), [Vercel v0](https://v0.dev/)
- Icons by [Lucide](https://lucide.dev/)

## 📞 Support

- Create an [Issue](https://github.com/yourusername/hedgekit/issues) for bug reports
- Join our [Discord](https://discord.gg/hedgekit) for community support
- Check the [Wiki](https://github.com/yourusername/hedgekit/wiki) for documentation

---

Made with ❤️ by the HedgeKit Team 