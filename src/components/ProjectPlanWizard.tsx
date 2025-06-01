import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { 
  ArrowRight, 
  ArrowLeft, 
  Target, 
  Users, 
  Lightbulb, 
  Settings, 
  Sparkles,
  Plus,
  X,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react'
import { ProjectPlanningService, type ProjectPlanRequest } from '../services/projectPlanningService'
import type { ProjectSchema } from '../types/schema'

interface ProjectPlanWizardProps {
  project: ProjectSchema
  onPlanGenerated: (plan: any) => void
  onClose: () => void
  trigger?: React.ReactNode
}

interface WizardData extends Omit<ProjectPlanRequest, 'projectName' | 'projectDescription'> {
  projectName: string
  projectDescription: string
  requirements: {
    businessGoals: string
    targetAudience: string
    keyProblems: string
    successMetrics: string
    constraints: string
  }
  targetUsers: string[]
  coreFeatures: string[]
  preferences: {
    framework: 'react' | 'vue' | 'svelte'
    styling: 'tailwind' | 'styled-components' | 'emotion'
    complexity: 'simple' | 'moderate' | 'complex'
    timeline: 'quick' | 'standard' | 'thorough'
  }
}

const STEP_TITLES = [
  'Requirements Gathering',
  'Project Overview',
  'Target Users', 
  'Core Features',
  'Technical Preferences',
  'Confirmation',
  'Review & Generate'
]

const EXAMPLE_USERS = [
  'End Users', 'Developers', 'Admins', 'Content Creators', 'Students', 
  'Business Owners', 'Designers', 'Analysts', 'Customer Support', 'Marketing Teams'
]

const EXAMPLE_FEATURES = [
  'User Authentication', 'Dashboard', 'Data Visualization', 'File Upload', 
  'Real-time Chat', 'Search & Filter', 'API Integration', 'Admin Panel',
  'Mobile Responsive', 'Notifications', 'Export/Import', 'User Profiles'
]

export function ProjectPlanWizard({ project, onPlanGenerated, onClose, trigger }: ProjectPlanWizardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [wizardData, setWizardData] = useState<WizardData>({
    projectName: project.name || '',
    projectDescription: project.description || '',
    requirements: {
      businessGoals: '',
      targetAudience: '',
      keyProblems: '',
      successMetrics: '',
      constraints: ''
    },
    targetUsers: [],
    coreFeatures: [],
    preferences: {
      framework: 'react',
      styling: 'tailwind',
      complexity: 'moderate',
      timeline: 'standard'
    }
  })

  const [newUser, setNewUser] = useState('')
  const [newFeature, setNewFeature] = useState('')

  const handleNext = () => {
    if (currentStep < STEP_TITLES.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const addUser = (user: string) => {
    if (user && !wizardData.targetUsers.includes(user)) {
      setWizardData(prev => ({
        ...prev,
        targetUsers: [...prev.targetUsers, user]
      }))
    }
    setNewUser('')
  }

  const removeUser = (user: string) => {
    setWizardData(prev => ({
      ...prev,
      targetUsers: prev.targetUsers.filter(u => u !== user)
    }))
  }

  const addFeature = (feature: string) => {
    if (feature && !wizardData.coreFeatures.includes(feature)) {
      setWizardData(prev => ({
        ...prev,
        coreFeatures: [...prev.coreFeatures, feature]
      }))
    }
    setNewFeature('')
  }

  const removeFeature = (feature: string) => {
    setWizardData(prev => ({
      ...prev,
      coreFeatures: prev.coreFeatures.filter(f => f !== feature)
    }))
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const plan = await ProjectPlanningService.generateProjectPlan(wizardData)
      onPlanGenerated(plan)
      setIsOpen(false)
      setCurrentStep(0) // Reset for next use
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate project plan')
    } finally {
      setIsGenerating(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Requirements Gathering
        return wizardData.requirements.businessGoals.trim() && 
               wizardData.requirements.targetAudience.trim() &&
               wizardData.requirements.keyProblems.trim()
      case 1: // Project Overview
        return wizardData.projectName.trim() && wizardData.projectDescription.trim()
      case 2: // Target Users
        return wizardData.targetUsers.length > 0
      case 3: // Core Features
        return wizardData.coreFeatures.length > 0
      case 4: // Technical Preferences
        return true // All have defaults
      case 5: // Confirmation
        return true
      case 6: // Review
        return true
      default:
        return false
    }
  }

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      {STEP_TITLES.map((title, index) => (
        <div key={index} className="flex items-center">
          <div className={`
            flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
            ${index <= currentStep 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-500'
            }
          `}>
            {index < currentStep ? <CheckCircle className="h-4 w-4" /> : index + 1}
          </div>
          {index < STEP_TITLES.length - 1 && (
            <div className={`w-12 h-1 mx-2 ${index < currentStep ? 'bg-blue-600' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Requirements Gathering
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                Let's understand what components and assets you want to build. Focus on UI elements and visual design goals.
              </p>
            </div>
            
            <div>
              <Label htmlFor="businessGoals">Visual & UI Goals</Label>
              <Textarea
                id="businessGoals"
                value={wizardData.requirements.businessGoals}
                onChange={(e) => setWizardData(prev => ({ 
                  ...prev, 
                  requirements: { ...prev.requirements, businessGoals: e.target.value }
                }))}
                placeholder="What kind of interface do you want to create? What visual style or aesthetic are you aiming for?"
                rows={3}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="targetAudience">UI Users & Context</Label>
              <Textarea
                id="targetAudience"
                value={wizardData.requirements.targetAudience}
                onChange={(e) => setWizardData(prev => ({ 
                  ...prev, 
                  requirements: { ...prev.requirements, targetAudience: e.target.value }
                }))}
                placeholder="Who will interact with these components? What's the usage context? (e.g., mobile app, web dashboard, game UI)"
                rows={3}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="keyProblems">UI Challenges to Address</Label>
              <Textarea
                id="keyProblems"
                value={wizardData.requirements.keyProblems}
                onChange={(e) => setWizardData(prev => ({ 
                  ...prev, 
                  requirements: { ...prev.requirements, keyProblems: e.target.value }
                }))}
                placeholder="What UI/UX problems need solving? Any specific design patterns or interactions you need?"
                rows={3}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="successMetrics">Design Success Criteria (Optional)</Label>
              <Textarea
                id="successMetrics"
                value={wizardData.requirements.successMetrics}
                onChange={(e) => setWizardData(prev => ({ 
                  ...prev, 
                  requirements: { ...prev.requirements, successMetrics: e.target.value }
                }))}
                placeholder="How will you measure design success? (e.g., usability, visual appeal, component reusability)"
                rows={2}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="constraints">Design Constraints (Optional)</Label>
              <Textarea
                id="constraints"
                value={wizardData.requirements.constraints}
                onChange={(e) => setWizardData(prev => ({ 
                  ...prev, 
                  requirements: { ...prev.requirements, constraints: e.target.value }
                }))}
                placeholder="Any design system requirements, accessibility needs, or visual constraints?"
                rows={2}
                className="mt-1"
              />
            </div>
          </div>
        )
        
      case 1: // Project Overview
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                value={wizardData.projectName}
                onChange={(e) => setWizardData(prev => ({ ...prev, projectName: e.target.value }))}
                placeholder="My Awesome Project"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="projectDescription">Project Description</Label>
              <Textarea
                id="projectDescription"
                value={wizardData.projectDescription}
                onChange={(e) => setWizardData(prev => ({ ...prev, projectDescription: e.target.value }))}
                placeholder="Describe what your project does, its main purpose, and key goals..."
                rows={4}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Be detailed - this helps generate better technical recommendations
              </p>
            </div>
          </div>
        )

      case 2: // Target Users
        return (
          <div className="space-y-4">
            <div>
              <Label>Who will use this project?</Label>
              <p className="text-sm text-gray-600 mb-3">
                Identify the main user types or personas. This helps determine features and complexity.
              </p>
              
              {/* Current users */}
              <div className="flex flex-wrap gap-2 mb-3">
                {wizardData.targetUsers.map((user) => (
                  <Badge key={user} variant="default" className="flex items-center gap-1">
                    {user}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeUser(user)}
                    />
                  </Badge>
                ))}
              </div>

              {/* Add new user */}
              <div className="flex gap-2 mb-3">
                <Input
                  value={newUser}
                  onChange={(e) => setNewUser(e.target.value)}
                  placeholder="Enter user type..."
                  onKeyPress={(e) => e.key === 'Enter' && addUser(newUser)}
                />
                <Button onClick={() => addUser(newUser)} disabled={!newUser.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Quick add suggestions */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Quick add:</p>
                <div className="flex flex-wrap gap-1">
                  {EXAMPLE_USERS.filter(user => !wizardData.targetUsers.includes(user)).slice(0, 6).map((user) => (
                    <Badge 
                      key={user} 
                      variant="outline" 
                      className="cursor-pointer text-xs"
                      onClick={() => addUser(user)}
                    >
                      + {user}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 3: // Core Features
        return (
          <div className="space-y-4">
            <div>
              <Label>What are the core features?</Label>
              <p className="text-sm text-gray-600 mb-3">
                List the main features your project needs. Focus on core functionality first.
              </p>
              
              {/* Current features */}
              <div className="flex flex-wrap gap-2 mb-3">
                {wizardData.coreFeatures.map((feature) => (
                  <Badge key={feature} variant="default" className="flex items-center gap-1">
                    {feature}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeFeature(feature)}
                    />
                  </Badge>
                ))}
              </div>

              {/* Add new feature */}
              <div className="flex gap-2 mb-3">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Enter core feature..."
                  onKeyPress={(e) => e.key === 'Enter' && addFeature(newFeature)}
                />
                <Button onClick={() => addFeature(newFeature)} disabled={!newFeature.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Quick add suggestions */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Common features:</p>
                <div className="flex flex-wrap gap-1">
                  {EXAMPLE_FEATURES.filter(feature => !wizardData.coreFeatures.includes(feature)).slice(0, 8).map((feature) => (
                    <Badge 
                      key={feature} 
                      variant="outline" 
                      className="cursor-pointer text-xs"
                      onClick={() => addFeature(feature)}
                    >
                      + {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 4: // Technical Preferences
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="framework">Frontend Framework</Label>
                <Select 
                  value={wizardData.preferences.framework} 
                  onValueChange={(value: any) => setWizardData(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, framework: value }
                  }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="react">React</SelectItem>
                    <SelectItem value="vue">Vue.js</SelectItem>
                    <SelectItem value="svelte">Svelte</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="styling">Styling Approach</Label>
                <Select 
                  value={wizardData.preferences.styling} 
                  onValueChange={(value: any) => setWizardData(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, styling: value }
                  }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tailwind">Tailwind CSS</SelectItem>
                    <SelectItem value="styled-components">Styled Components</SelectItem>
                    <SelectItem value="emotion">Emotion</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="complexity">Project Complexity</Label>
                <Select 
                  value={wizardData.preferences.complexity} 
                  onValueChange={(value: any) => setWizardData(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, complexity: value }
                  }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simple - Basic features, minimal complexity</SelectItem>
                    <SelectItem value="moderate">Moderate - Standard features, some integrations</SelectItem>
                    <SelectItem value="complex">Complex - Advanced features, multiple integrations</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="timeline">Development Timeline</Label>
                <Select 
                  value={wizardData.preferences.timeline} 
                  onValueChange={(value: any) => setWizardData(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, timeline: value }
                  }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quick">Quick - Fast iteration, MVP focus</SelectItem>
                    <SelectItem value="standard">Standard - Balanced development pace</SelectItem>
                    <SelectItem value="thorough">Thorough - Comprehensive planning, robust features</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )

      case 5: // Confirmation
        return (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900 mb-2">Confirm AI Plan Generation</h4>
                  <p className="text-sm text-amber-800 mb-3">
                    Once you proceed, the AI will generate a component and asset creation plan. This will include:
                  </p>
                  <ul className="text-sm text-amber-700 space-y-1 ml-4">
                    <li>• Component creation phases and priorities</li>
                    <li>• Asset generation tasks (images, icons, etc.)</li>
                    <li>• UI component hierarchy and relationships</li>
                    <li>• Design system recommendations</li>
                    <li>• Visual milestones and design goals</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">The AI will analyze:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium text-gray-700 mb-1">Requirements</p>
                  <p className="text-gray-600 text-xs">
                    {wizardData.requirements.businessGoals.substring(0, 100)}...
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium text-gray-700 mb-1">Target Users</p>
                  <p className="text-gray-600 text-xs">
                    {wizardData.targetUsers.length} user types defined
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium text-gray-700 mb-1">Features</p>
                  <p className="text-gray-600 text-xs">
                    {wizardData.coreFeatures.length} core features specified
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium text-gray-700 mb-1">Technical Stack</p>
                  <p className="text-gray-600 text-xs">
                    {wizardData.preferences.framework} + {wizardData.preferences.styling}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-800">
                  Ready to generate your project plan. Click "Continue to Review" to see a final summary before generation.
                </p>
              </div>
            </div>
          </div>
        )

      case 6: // Review & Generate
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div>
                <h4 className="font-medium flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  Design Requirements
                </h4>
                <div className="text-xs text-gray-600 mt-1 space-y-1">
                  <p><span className="font-medium">UI Goals:</span> {wizardData.requirements.businessGoals}</p>
                  <p><span className="font-medium">UI Challenges:</span> {wizardData.requirements.keyProblems}</p>
                  {wizardData.requirements.constraints && (
                    <p><span className="font-medium">Constraints:</span> {wizardData.requirements.constraints}</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Project Overview
                </h4>
                <p className="text-sm text-gray-600 mt-1">{wizardData.projectName}</p>
                <p className="text-xs text-gray-500 mt-1">{wizardData.projectDescription}</p>
              </div>

              <div>
                <h4 className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Target Users ({wizardData.targetUsers.length})
                </h4>
                <div className="flex flex-wrap gap-1 mt-1">
                  {wizardData.targetUsers.map((user) => (
                    <Badge key={user} variant="outline" className="text-xs">{user}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Core Features ({wizardData.coreFeatures.length})
                </h4>
                <div className="flex flex-wrap gap-1 mt-1">
                  {wizardData.coreFeatures.map((feature) => (
                    <Badge key={feature} variant="outline" className="text-xs">{feature}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Technical Preferences
                </h4>
                <div className="grid grid-cols-2 gap-2 mt-1 text-xs text-gray-600">
                  <div>Framework: {wizardData.preferences.framework}</div>
                  <div>Styling: {wizardData.preferences.styling}</div>
                  <div>Complexity: {wizardData.preferences.complexity}</div>
                  <div>Timeline: {wizardData.preferences.timeline}</div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">AI Plan Generation</span>
              </div>
              <p className="text-xs text-blue-700">
                Claude will analyze your requirements and generate a focused component and asset creation plan 
                with UI development phases, design tasks, and visual milestones.
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild onClick={() => setIsOpen(true)}>
        {trigger || (
          <Button className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Generate Project Plan
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Create Project Plan
          </DialogTitle>
          <DialogDescription>
            Step {currentStep + 1} of {STEP_TITLES.length}: {STEP_TITLES[currentStep]}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <StepIndicator />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{STEP_TITLES[currentStep]}</CardTitle>
            </CardHeader>
            <CardContent>
              {renderStep()}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={handlePrevious} 
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            {currentStep < STEP_TITLES.length - 1 ? (
              <Button 
                onClick={handleNext} 
                disabled={!canProceed()}
                className="flex items-center gap-2"
              >
                {currentStep === 5 ? 'Continue to Review' : 'Next'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !canProceed()}
                className="flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Clock className="h-4 w-4 animate-spin" />
                    Generating Plan...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Comprehensive Plan
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}