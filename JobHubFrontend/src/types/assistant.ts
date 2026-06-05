// Types cho AI Assistant — tách riêng để tránh circular import issues

export interface AssistantMessage {
  role: 'user' | 'model';
  content: string;
}

export interface ActionItem {
  action_type: string;
  description: string;
  data?: any;
  requires_confirmation: boolean;
  tool_name?: string;
}

export interface AssistantChatResponse {
  reply: string;
  actions_taken: ActionItem[];
  pending_action?: ActionItem;
  suggestions: string[];
  error?: string;
}

export interface AssistantChatRequest {
  message: string;
  image_base64?: string;
  file_content?: string;
  conversation_history: AssistantMessage[];
}

export interface AssistantConfirmRequest {
  action_type: string;
  payload: any;
  confirmed: boolean;
}
