import React, { useState, useRef, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { ProjectSchema } from '../types/schema'
import { AgentService, type AgentMessage } from '../services/agentService'
import { Loader2, Send, Bot, User, Wrench } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: Date
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
}

export function AgentChat({ project, onUpdateProject }: AgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'agent',
      content: `Hi! I'm your UI agent with real tool access. I can see your project "${project.name}" has ${project.components.length} components and ${project.assets?.length || 0} assets. I can actually generate components, create images, and modify your project. What would you like to build or improve?`,
      timestamp: new Date(),
    }
  ])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [agentService] = useState(() => {
    try {
      return new AgentService()
    } catch (error) {
      console.error('Failed to initialize agent service:', error)
      return null
    }
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const convertToAgentMessages = (messages: Message[]): AgentMessage[] => {
    return messages.map(msg => ({
      id: msg.id,
      role: msg.role === 'agent' ? 'assistant' : msg.role,
      content: msg.content,
      timestamp: msg.timestamp
    }))
  }

  const handleSendMessage = async () => {
    if (!input.trim() || !agentService) return

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
      // Call the real agent service with tool access
      const response = await agentService.chatWithAgent(
        {
          message: messageText,
          project,
          conversationHistory: convertToAgentMessages(messages)
        },
        onUpdateProject
      )

      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: response.message,
        timestamp: new Date(),
        toolCalls: response.toolCalls
      }

      setMessages(prev => [...prev, agentResponse])
    } catch (error) {
      console.error('Agent chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
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

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex gap-2 text-sm text-muted-foreground">
        <Badge variant="outline">{project.components.length} components</Badge>
        <Badge variant="outline">{project.assets?.length || 0} assets</Badge>
        <Badge variant="outline">{project.framework}</Badge>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4">
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
                    : 'bg-muted'
                }`}>
                  <p className="text-sm">{message.content}</p>
                  
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

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={agentService ? "Describe what you want to build or improve..." : "OpenAI API key required for agent"}
          disabled={isThinking || !agentService}
        />
        <Button 
          onClick={handleSendMessage} 
          disabled={!input.trim() || isThinking || !agentService}
          size="icon"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
        
      {!agentService && (
        <div className="text-sm text-muted-foreground text-center p-2 bg-muted/50 rounded">
          Configure VITE_OPEN_AI_KEY to enable AI agent capabilities
        </div>
      )}
    </div>
  )
}