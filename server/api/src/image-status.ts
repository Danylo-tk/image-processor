export interface ImageStatus {
  id: string;
  status: 'queued' | 'processing' | 'done' | 'failed';
  output?: string;
  error?: string;
}
