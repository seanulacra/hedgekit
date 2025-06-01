import { WebContainer } from '@webcontainer/api'
import type { FileSystemTree } from '@webcontainer/api'
import type { ProjectSchema, ComponentSchema } from '../types/schema'

export class WebContainerManager {
  private container: WebContainer | null = null
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      this.container = await WebContainer.boot()
      this.initialized = true
      console.log('WebContainer initialized successfully')
    } catch (error) {
      console.error('Failed to initialize WebContainer:', error)
      throw error
    }
  }

  async createProject(schema: ProjectSchema): Promise<void> {
    if (!this.container) {
      throw new Error('WebContainer not initialized')
    }

    try {
      const files = this.generateProjectFiles(schema)
      
      await this.container.mount(files)
      
      // Write component files after mounting
      for (const component of schema.components) {
        if (component.source === 'local') {
          const componentPath = `components/${component.name}.tsx`
          const componentCode = this.generateComponentCode(component)
          await this.container.fs.writeFile(componentPath, componentCode)
        }
      }
      
      const installProcess = await this.container.spawn('npm', ['install'])
      await installProcess.exit
      
      console.log('Project created and dependencies installed')
    } catch (error) {
      console.error('Failed to create project:', error)
      throw error
    }
  }

  async updateComponent(component: ComponentSchema): Promise<void> {
    if (!this.container || !component.filePath) {
      throw new Error('WebContainer not initialized or component has no file path')
    }

    const componentCode = this.generateComponentCode(component)
    
    await this.container.fs.writeFile(component.filePath, componentCode)
    console.log(`Component ${component.name} updated`)
  }

  async startDevServer(): Promise<string> {
    if (!this.container) {
      throw new Error('WebContainer not initialized')
    }

    // Start the dev server
    this.container.spawn('npm', ['run', 'dev'])
    
    // Wait for `server-ready` event and return the URL
    return new Promise((resolve) => {
      this.container!.on('server-ready', (_port, url) => {
        console.log(`Dev server ready at ${url}`)
        resolve(url)
      })
    })
  }

  private generateProjectFiles(schema: ProjectSchema): FileSystemTree {
    return {
      'package.json': {
        file: {
          contents: JSON.stringify({
            name: schema.name.toLowerCase().replace(/\s+/g, '-'),
            version: '0.1.0',
            private: true,
            scripts: {
              dev: 'next dev',
              build: 'next build',
              start: 'next start',
              lint: 'next lint'
            },
            dependencies: {
              '@radix-ui/react-slot': '^1.1.0',
              'class-variance-authority': '^0.7.0',
              'clsx': '^2.1.1',
              'lucide-react': '^0.446.0',
              'next': '13.5.1',
              'react': '18.2.0',
              'react-dom': '18.2.0',
              'tailwind-merge': '^2.5.2',
              'tailwindcss-animate': '^1.0.7',
              ...schema.dependencies
            },
            devDependencies: {
              '@types/node': '20.6.2',
              '@types/react': '18.2.22',
              '@types/react-dom': '18.2.7',
              'autoprefixer': '10.4.15',
              'eslint': '8.49.0',
              'eslint-config-next': '13.5.1',
              'postcss': '8.4.30',
              'tailwindcss': '3.3.3',
              'typescript': '5.2.2'
            }
          }, null, 2)
        }
      },
      'next.config.js': {
        file: {
          contents: `/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;`
        }
      },
      'tailwind.config.ts': {
        file: {
          contents: `import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;`
        }
      },
      'postcss.config.js': {
        file: {
          contents: `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`
        }
      },
      app: {
        directory: {
          'layout.tsx': {
            file: {
              contents: `import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '${schema.name}',
  description: '${schema.description}',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}`
            }
          },
          'page.tsx': {
            file: {
              contents: this.generateAppComponent(schema)
            }
          },
          'globals.css': {
            file: {
              contents: `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.9%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 0 0% 96.1%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: 0 0% 3.9%;
    --radius: 0.5rem;
  }
  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    --card: 0 0% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9%;
    --secondary: 0 0% 14.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 14.9%;
    --muted-foreground: 0 0% 63.9%;
    --accent: 0 0% 14.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 14.9%;
    --input: 0 0% 14.9%;
    --ring: 0 0% 83.1%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}`
            }
          }
        }
      },
      lib: {
        directory: {
          'utils.ts': {
            file: {
              contents: `import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`
            }
          }
        }
      },
      components: {
        directory: {
          ui: {
            directory: {}
          }
        }
      },
      'tsconfig.json': {
        file: {
          contents: JSON.stringify({
            compilerOptions: {
              lib: ['dom', 'dom.iterable', 'es6'],
              allowJs: true,
              skipLibCheck: true,
              strict: true,
              noEmit: true,
              esModuleInterop: true,
              module: 'esnext',
              moduleResolution: 'bundler',
              resolveJsonModule: true,
              isolatedModules: true,
              jsx: 'preserve',
              incremental: true,
              plugins: [
                {
                  name: 'next'
                }
              ],
              baseUrl: '.',
              paths: {
                '@/*': ['./*']
              }
            },
            include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
            exclude: ['node_modules']
          }, null, 2)
        }
      },
    }
  }

  private generateAppComponent(schema: ProjectSchema): string {
    // Separate components with actual generated code vs simple placeholders
    const componentsWithCode = schema.components.filter(c => c.generatedCode && c.generatedCode.trim().length > 0)
    const simpleComponents = schema.components.filter(c => c.source === 'local' && (!c.generatedCode || c.generatedCode.trim().length === 0))
    
    // Imports for simple components
    const imports = simpleComponents
      .map(c => `import ${c.name} from '@/components/${c.name}'`)
      .join('\n')

    // Inline components with code
    const inlineComponents = componentsWithCode
      .map(c => {
        // Extract the component function from the code if it exists
        if (c.generatedCode && c.generatedCode.includes('function ' + c.name)) {
          return c.generatedCode
        }
        // Otherwise create a wrapper
        return `function ${c.name}() {
  ${c.generatedCode || 'return <div>Component placeholder</div>'}
}`
      })
      .join('\n\n')

    // Usage of all components
    const componentUsage = schema.components
      .map(c => `        <${c.name} />`)
      .join('\n')

    return `${imports}

${inlineComponents}

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-4">${schema.name}</h1>
      <p className="text-xl text-muted-foreground mb-8">${schema.description}</p>
      <div className="space-y-6">
${componentUsage}
      </div>
    </div>
  )
}`
  }

  private generateComponentCode(component: ComponentSchema): string {
    const propsInterface = this.generatePropsInterface(component)
    const componentBody = this.generateComponentBody(component)

    return `${propsInterface}

export default function ${component.name}(${Object.keys(component.props).length > 0 ? `props: ${component.name}Props` : ''}) {
${componentBody}
}`
  }

  private generatePropsInterface(component: ComponentSchema): string {
    if (Object.keys(component.props).length === 0) return ''

    const props = Object.entries(component.props)
      .map(([name, def]) => `  ${name}${def.required ? '' : '?'}: ${def.type}`)
      .join('\n')

    return `interface ${component.name}Props {
${props}
}`
  }

  private generateComponentBody(component: ComponentSchema): string {
    return `  return (
    <div className="p-6 border rounded-lg bg-card">
      <h3 className="text-lg font-semibold">${component.name}</h3>
      <p className="text-muted-foreground">Generated component with Shadcn styling</p>
    </div>
  )`
  }
}