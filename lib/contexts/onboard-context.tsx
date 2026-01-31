'use client';

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useCallback,
  ReactNode,
  useState,
} from 'react';

interface FormRef extends HTMLFormElement {
  submitForm: () => Promise<void>;
}

interface OnboardContextValue {
  personalInfoRef: React.RefObject<FormRef>;
  professionalInfoRef: React.RefObject<FormRef>;
  documentUploadRef: React.RefObject<FormRef>;
  extractedData: any;
  setExtractedData: (data: any) => void;
  handleSavePersonalInfo: (source: string) => Promise<void>;
}

const OnboardContext = createContext<OnboardContextValue | null>(null);

export function useOnboardContext() {
  const context = useContext(OnboardContext);
  if (!context) {
    throw new Error('useOnboardContext must be used within an OnboardProvider');
  }
  return context;
}

interface OnboardProviderProps {
  children: ReactNode;
}

export function OnboardProvider({ children }: OnboardProviderProps) {
  const [extractedData, setExtractedData] = useState<any>(null);

  // Form refs for onboarding
  const personalInfoRef = useRef<FormRef>(null);
  const professionalInfoRef = useRef<FormRef>(null);
  const documentUploadRef = useRef<FormRef>(null);

  const handleSavePersonalInfo = useCallback(async (source: string) => {
    try {
      if (personalInfoRef.current) {
        console.log('insidee', personalInfoRef.current);
        await personalInfoRef.current.submitForm();
      }

      if (source === 'pro' && professionalInfoRef.current) {
        await professionalInfoRef.current.submitForm();
      }

      if (source === 'pro' && documentUploadRef.current) {
        console.log('documentUploadRef.current', documentUploadRef.current);
        await documentUploadRef.current.submitForm();
      }
    } catch (error) {
      console.error('Error submitting forms:', error);
    }
  }, []);

  const value = useMemo<OnboardContextValue>(
    () => ({
      personalInfoRef,
      professionalInfoRef,
      documentUploadRef,
      handleSavePersonalInfo,
      extractedData,
      setExtractedData,
    }),
    [handleSavePersonalInfo, extractedData],
  );

  return (
    <OnboardContext.Provider value={value}>{children}</OnboardContext.Provider>
  );
}

export default OnboardProvider;
