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
      console.log('Mock upload evidence', data);
      return { success: true, data: { id: 'mock-id' } };
    },
    isPending: false,
  };
};
