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
  'Project Overview & Requirements',
  'Features & Goals',
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
      case 0: // Project Overview & Requirements
        return wizardData.projectName.trim() && 
               wizardData.projectDescription.trim() &&
               wizardData.requirements.businessGoals.trim()
      case 1: // Features & Goals
        return wizardData.targetUsers.length > 0 && 
               wizardData.coreFeatures.length > 0
      case 2: // Review
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
      case 0: // Project Overview & Requirements
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                Let's understand what you want to build. Be concise but clear about your goals.
              </p>
            </div>
            
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
                placeholder="Describe what your project does and its main purpose..."
                rows={3}
                className="mt-1"
              />
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
                placeholder="What kind of interface do you want to create? What's the visual style?"
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
        )
        
      case 1: // Features & Goals
        return (
          <div className="space-y-6">
            <div>
              <Label>Target Users</Label>
              <p className="text-sm text-gray-600 mb-3">
                Who will use this? (Add at least one)
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

            <div>
              <Label>Core Features</Label>
              <p className="text-sm text-gray-600 mb-3">
                What are the main features? (Add at least one)
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
        )

      case 2: // Review & Generate
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <h4 className="font-medium text-sm">Project: {wizardData.projectName}</h4>
                <p className="text-xs text-gray-600 mt-1">{wizardData.projectDescription}</p>
              </div>

              <div>
                <h4 className="font-medium text-sm">Goals</h4>
                <p className="text-xs text-gray-600 mt-1">{wizardData.requirements.businessGoals}</p>
              </div>

              <div>
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Users className="h-3 w-3" />
                  Target Users ({wizardData.targetUsers.length})
                </h4>
                <div className="flex flex-wrap gap-1 mt-1">
                  {wizardData.targetUsers.map((user) => (
                    <Badge key={user} variant="outline" className="text-xs">{user}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Lightbulb className="h-3 w-3" />
                  Core Features ({wizardData.coreFeatures.length})
                </h4>
                <div className="flex flex-wrap gap-1 mt-1">
                  {wizardData.coreFeatures.map((feature) => (
                    <Badge key={feature} variant="outline" className="text-xs">{feature}</Badge>
                  ))}
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
                <span className="text-sm font-medium text-blue-900">Ready to Generate</span>
              </div>
              <p className="text-xs text-blue-700">
                Claude will create a development plan with phases, tasks, and milestones based on your requirements.
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
                Next
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
                    Generate Plan
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