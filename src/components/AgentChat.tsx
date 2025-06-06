import React, { useState, useRef, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { ProjectSchema } from '../types/schema'
import { AgentOrchestrator } from '../services/agentOrchestrator'
import type { AgentMessage, AgentProvider } from '../types/agent'
import type { UIActions } from '../services/agentTools'
import { Loader2, Send, Bot, User, Wrench, Settings, Zap } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: Date
  provider?: AgentProvider
  toolCalls?: Array<{
    id: string
    function: string
    args: any
    result: any
  }>
}

interface AgentChatProps {
  project: ProjectSchema
  onUpdateProject: (updater: (prev: ProjectSchema) => ProjectSchema) => void
  uiActions?: UIActions
  onNewMessages?: (messages: Message[]) => void // Callback when new messages are added
}

// Export a ref interface for programmatic control
export interface AgentChatRef {
  addMessage: (message: string, isAgent?: boolean) => void
  addAgentResponse: (response: any) => void
}

// Simple markdown parser for agent messages
const parseMarkdown = (text: string): React.ReactNode => {
  // Handle bold text
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }
    
    // Handle line breaks
    const lines = part.split('\n')
    return lines.map((line, lineIndex) => (
      <React.Fragment key={`${index}-${lineIndex}`}>
        {lineIndex > 0 && <br />}
        {line}
      </React.Fragment>
    ))
  })
}

export const AgentChat = React.forwardRef<AgentChatRef, AgentChatProps>(
  ({ project, onUpdateProject, uiActions, onNewMessages }, ref) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [orchestrator] = useState(() => new AgentOrchestrator())
  const [currentProvider, setCurrentProvider] = useState<AgentProvider>(() => orchestrator.getCurrentProvider())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load chat history from project or initialize with welcome message
  useEffect(() => {
    if (project.chatHistory && project.chatHistory.length > 0) {
      // Load existing chat history
      const loadedMessages: Message[] = project.chatHistory.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
        provider: msg.provider as AgentProvider
      }))
      setMessages(loadedMessages)
    } else {
      // Initialize with welcome message only if no chat history exists
      const providerInfo = orchestrator.getProviderInfo(currentProvider)
      if (providerInfo) {
        const welcomeMessage: Message = {
          id: '1',
          role: 'agent',
          content: `Hi! I'm your ${providerInfo.displayName} agent with real tool access. I can see your project "${project.name}" has ${project.components.length} components and ${project.assets?.length || 0} assets. I can actually generate components, create images, and modify your project. What would you like to build or improve?`,
          timestamp: new Date(),
          provider: currentProvider
        }
        setMessages([welcomeMessage])
        saveChatHistory([welcomeMessage])
      }
    }
  }, [project.id]) // Only run when project changes

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Save chat history to project
  const saveChatHistory = (messagesToSave: Message[]) => {
    const chatHistory = messagesToSave.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp.toISOString(),
      provider: msg.provider,
      toolCalls: msg.toolCalls
    }))

    onUpdateProject(prev => ({
      ...prev,
      chatHistory,
      updatedAt: new Date().toISOString()
    }))
  }

  const convertToAgentMessages = (messages: Message[]): AgentMessage[] => {
    return messages.map(msg => ({
      id: msg.id,
      role: msg.role === 'agent' ? 'assistant' : msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      toolCalls: msg.toolCalls
    }))
  }

  const handleProviderChange = (provider: AgentProvider) => {
    setCurrentProvider(provider)
    orchestrator.setCurrentProvider(provider)
    
    // Add a system message about the switch
    const switchMessage: Message = {
      id: Date.now().toString(),
      role: 'agent',
      content: `Switched to ${orchestrator.getProviderInfo(provider)?.displayName}. How can I help you continue?`,
      timestamp: new Date(),
      provider
    }
    const updatedMessages = [...messages, switchMessage]
    setMessages(updatedMessages)
    saveChatHistory(updatedMessages)
  }

  const handleSendMessage = async () => {
    if (!input.trim() || !orchestrator.isAnyProviderAvailable()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    const messageText = input
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsThinking(true)

    try {
      // Call the orchestrator with current provider
      const response = await orchestrator.chatWithAgent(
        {
          message: messageText,
          project,
          conversationHistory: convertToAgentMessages(messages),
          provider: currentProvider
        },
        onUpdateProject,
        uiActions
      )

      // Create separate messages for tool calls and final response for better UX
      const newMessages: Message[] = []
      
      // Add tool call messages first
      if (response.toolCalls && response.toolCalls.length > 0) {
        response.toolCalls.forEach((toolCall, index) => {
          const toolMessage: Message = {
            id: `${Date.now()}_tool_${index}`,
            role: 'agent',
            content: toolCall.result.summary || `Executed ${toolCall.function}`,
            timestamp: new Date(),
            provider: response.provider,
            toolCalls: [toolCall] // Show individual tool call
          }
          newMessages.push(toolMessage)
        })
      }
      
      // Add final agent response if there's additional content beyond tool summaries
      if (response.message && response.message.trim()) {
        const agentResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: 'agent',
          content: response.message,
          timestamp: new Date(),
          provider: response.provider
        }
        newMessages.push(agentResponse)
      }

      // If no messages were created, add a basic response
      if (newMessages.length === 0) {
        const agentResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: 'agent',
          content: response.message || 'Task completed.',
          timestamp: new Date(),
          provider: response.provider
        }
        newMessages.push(agentResponse)
      }

      const allNewMessages = [...messages, userMessage, ...newMessages]
      setMessages(allNewMessages)
      saveChatHistory(allNewMessages)
      
      // Notify parent about new messages
      if (onNewMessages) {
        onNewMessages(newMessages)
      }
    } catch (error) {
      console.error('Agent chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
        provider: currentProvider
      }
      const allNewMessages = [...messages, userMessage, errorMessage]
      setMessages(allNewMessages)
      saveChatHistory(allNewMessages)
    } finally {
      setIsThinking(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Expose methods for programmatic control
  React.useImperativeHandle(ref, () => ({
    addMessage: (message: string, isAgent: boolean = false) => {
      setMessages(prevMessages => {
        const newMessage: Message = {
          id: Date.now().toString(),
          role: isAgent ? 'agent' : 'user',
          content: message,
          timestamp: new Date(),
          provider: isAgent ? currentProvider : undefined
        }
        const updatedMessages = [...prevMessages, newMessage]
        saveChatHistory(updatedMessages)
        return updatedMessages
      })
    },
    addAgentResponse: (response: any) => {
      setMessages(prevMessages => {
        const newMessages: Message[] = []
        
        // Add tool call messages first
        if (response.toolCalls && response.toolCalls.length > 0) {
          response.toolCalls.forEach((toolCall: any, index: number) => {
            const toolMessage: Message = {
              id: `${Date.now()}_tool_${index}`,
              role: 'agent',
              content: toolCall.result.summary || `Executed ${toolCall.function}`,
              timestamp: new Date(),
              provider: response.provider,
              toolCalls: [toolCall]
            }
            newMessages.push(toolMessage)
          })
        }
        
        // Add final agent response if there's content
        if (response.message && response.message.trim()) {
          const agentResponse: Message = {
            id: (Date.now() + 1).toString(),
            role: 'agent',
            content: response.message,
            timestamp: new Date(),
            provider: response.provider
          }
          newMessages.push(agentResponse)
        }
        
        const allNewMessages = [...prevMessages, ...newMessages]
        
        // Save to project storage
        saveChatHistory(allNewMessages)
        
        if (onNewMessages) {
          onNewMessages(newMessages)
        }
        
        return allNewMessages
      })
    }
  }))

  const availableProviders = orchestrator.getAvailableProviders()
  const currentProviderInfo = orchestrator.getProviderInfo(currentProvider)

  return (
    <div className="h-full flex flex-col p-4">
      {/* Compact Header */}
      <div className="space-y-2 pb-3">
        {/* Agent Selection with inline info */}
        <div className="flex items-center gap-2">
          <Select value={currentProvider} onValueChange={handleProviderChange}>
            <SelectTrigger className="flex-1 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableProviders.map(({ provider, info }) => (
                <SelectItem key={provider} value={provider}>
                  <div className="flex items-center gap-2">
                    <Zap className="h-3 w-3" />
                    {info.displayName}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Condensed project info */}
        <div className="flex gap-1 text-xs">
          <Badge variant="outline" className="text-xs h-5">{project.components.length} comp</Badge>
          <Badge variant="outline" className="text-xs h-5">{project.assets?.length || 0} assets</Badge>
          <Badge variant="outline" className="text-xs h-5">{project.framework}</Badge>
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 min-h-0 px-4 py-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`flex gap-2 max-w-[80%] ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}>
                  {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                
                <div className={`rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}>
                  <p className="text-sm">{parseMarkdown(message.content)}</p>
                  
                  {/* Show provider info for agent messages */}
                  {message.role === 'agent' && message.provider && (
                    <div className="mt-2 text-xs opacity-70 flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {orchestrator.getProviderInfo(message.provider)?.displayName}
                    </div>
                  )}
                  
                  {message.toolCalls && message.toolCalls.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Wrench className="h-3 w-3" />
                        Tools used:
                      </div>
                      {message.toolCalls.map((toolCall, index) => (
                        <div key={index} className="p-2 bg-background/50 rounded text-xs">
                          <div className="font-medium flex items-center gap-1">
                            <span className="text-blue-600">{toolCall.function}</span>
                            {toolCall.result.success ? (
                              <span className="text-green-600">✓</span>
                            ) : (
                              <span className="text-red-600">✗</span>
                            )}
                          </div>
                          <div className="text-muted-foreground mt-1">
                            {toolCall.result.summary || toolCall.result.error}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isThinking && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          )}
          
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input - Fixed to bottom */}
      <div className="pt-3 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={orchestrator.isAnyProviderAvailable() ? "Ask me to build something..." : "Configure API keys to enable agent capabilities"}
            disabled={isThinking || !orchestrator.isAnyProviderAvailable()}
            className="flex-1 min-h-[44px]"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!input.trim() || isThinking || !orchestrator.isAnyProviderAvailable()}
            size="default"
            className="h-[44px] w-[44px] shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
        
      {!orchestrator.isAnyProviderAvailable() && (
        <div className="text-sm text-muted-foreground text-center p-3 bg-muted/50 rounded-lg">
          <div className="font-medium mb-2">No AI providers available</div>
                      <div className="text-xs space-y-1">
              <div>• Set VITE_OPEN_AI_KEY for OpenAI GPT-4</div>
              <div>• Set VITE_ANTHROPIC_API_KEY for Claude Sonnet 4 & Opus 4</div>
              <div>• Set VITE_BUNNYCDN_* vars for BunnyCDN image storage</div>
            </div>
        </div>
      )}
    </div>
  )
})

AgentChat.displayName = 'AgentChat'