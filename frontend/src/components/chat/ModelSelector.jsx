import React from 'react';
import { Check, ChevronDown, Sparkles, Zap, Brain } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { useChatStore } from '../../store';

const MODELS = [
  { 
    id: 'gpt-5.2', 
    provider: 'openai', 
    name: 'GPT-5.2', 
    description: 'Most capable OpenAI model',
    icon: Sparkles
  },
  { 
    id: 'gpt-4o', 
    provider: 'openai', 
    name: 'GPT-4o', 
    description: 'Fast and efficient',
    icon: Zap
  },
  { 
    id: 'claude-sonnet-4-5-20250929', 
    provider: 'anthropic', 
    name: 'Claude Sonnet 4.5', 
    description: 'Anthropic\'s balanced model',
    icon: Brain
  }
];

export const ModelSelector = () => {
  const { selectedModel, selectedProvider, setSelectedModel } = useChatStore();
  
  const currentModel = MODELS.find(m => m.id === selectedModel) || MODELS[0];
  const Icon = currentModel.icon;
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 bg-muted/50 border-border hover:bg-muted"
          data-testid="model-selector"
        >
          <Icon className="w-4 h-4 text-primary" />
          <span className="font-medium">{currentModel.name}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground">
          Select Model
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {MODELS.map((model) => {
          const ModelIcon = model.icon;
          const isSelected = model.id === selectedModel;
          
          return (
            <DropdownMenuItem
              key={model.id}
              onClick={() => setSelectedModel(model.id, model.provider)}
              className="flex items-start gap-3 py-2 cursor-pointer"
              data-testid={`model-option-${model.id}`}
            >
              <ModelIcon className="w-4 h-4 mt-0.5 text-primary" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{model.name}</span>
                  {isSelected && <Check className="w-4 h-4 text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground">{model.description}</p>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

