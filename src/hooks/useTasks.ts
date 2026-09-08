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
      return { 
        success: true, 
        data: { 
          id: `ev-${Date.now()}`,
          name: file ? file.name : 'Unknown File',
          size: file ? file.size : 0,
          type: file ? file.type : 'application/octet-stream',
          url: file ? URL.createObjectURL(file) : undefined
        } 
      };
    },
    isPending: false,
  };
};
