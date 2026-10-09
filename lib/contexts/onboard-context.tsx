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
  setExtractedData: React.Dispatch<React.SetStateAction<any>>;
  handleSavePersonalInfo: (source: string) => Promise<void>;
  /**
   * SCRUM-153: what a caregiver typed on a step and then left with Previous or
   * Back, before pressing Next. Each step has its own form and reads its saved
   * profile on mount, so anything unsaved was simply gone. The step keeps a
   * draft here on unmount and takes it back when it mounts again.
   */
  takeDraft: (step: string) => any;
  setDraft: (step: string, values: any) => void;
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
  const drafts = useRef<Record<string, any>>({});
  const setDraft = useCallback((step: string, values: any) => {
    if (values === undefined || values === null) delete drafts.current[step];
    else drafts.current[step] = values;
  }, []);
  const takeDraft = useCallback((step: string) => {
    const v = drafts.current[step];
    delete drafts.current[step];
    return v;
  }, []);

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
      takeDraft,
      setDraft,
    }),
    [handleSavePersonalInfo, extractedData, takeDraft, setDraft],
  );

  return (
    <OnboardContext.Provider value={value}>{children}</OnboardContext.Provider>
  );
}

export default OnboardProvider;
