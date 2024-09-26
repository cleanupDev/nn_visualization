export interface FeedbackRequest {
    name: string;
    email: string;
    feedback: string;
  }
  
  export interface FeedbackResponse {
    message?: string;
    error?: string;
  }
  