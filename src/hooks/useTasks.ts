import { TaskItem, EvidenceFile } from '../types';

export const useGetTaskEvidence = (fileId?: string) => {
  return {
    data: null as Blob | null,
    isLoading: false,
    isError: false,
    error: null,
  };
};

export const useUploadTaskEvidence = () => {
  return {
    mutateAsync: async (data: any) => {
      const file = data.file;
      if (!file) throw new Error('No file provided');
      
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error('Failed to upload file');
      }
      
      return await res.json();
    },
    isPending: false,
  };
};
