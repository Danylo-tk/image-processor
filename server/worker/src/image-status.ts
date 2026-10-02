export interface ImageStatus {
  id: string;
  status: 'processing' | 'done' | 'failed';
  output?: string;
  error?: string;
}
