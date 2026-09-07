import { AbsenceActivity } from '../types';

export const useCreateAbsence = () => {
  return {
    mutate: async (data: Partial<AbsenceActivity>) => {
      console.log('Mock create absence', data);
    },
    mutateAsync: async (data: Partial<AbsenceActivity>) => {
      console.log('Mock create absence', data);
      return { id: 'mock-id' };
    },
    isPending: false,
  };
};
