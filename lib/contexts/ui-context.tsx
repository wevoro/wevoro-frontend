'use client';

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  ReactNode,
} from 'react';

interface UIContextValue {
  // Alert Modal
  isOpenAlert: boolean;
  openAlert: () => void;
  closeAlert: () => void;

  // Partner Modal
  isPartnerOpen: boolean;
  offerData: any;
  openPartner: (data: any) => void;
  closePartner: () => void;
  setOfferData: React.Dispatch<React.SetStateAction<any>>;

  // Offer Action Modal
  isOpenOfferAction: boolean;
  actionData: any;
  openOfferAction: () => void;
  closeOfferAction: () => void;
  setActionData: React.Dispatch<React.SetStateAction<any>>;

  // Feedback Modal
  openFeedbackModal: boolean;
  setOpenFeedbackModal: React.Dispatch<React.SetStateAction<boolean>>;

  // AutoFill Modal
  openAutoFillModal: boolean;
  autoFillClicked: string;
  setOpenAutoFillModal: React.Dispatch<React.SetStateAction<boolean>>;
  setAutoFillClicked: React.Dispatch<React.SetStateAction<string>>;

  // SCRUM-154: the Completing Profile modal (SCRUM-40) opens once, by itself,
  // after sign-up and is then gone for good. "Complete credentials" reopens it
  // through this flag when there is no credential section to scroll to yet.
  openCompleteProfile: boolean;
  setOpenCompleteProfile: React.Dispatch<React.SetStateAction<boolean>>;
  // SCRUM-154: asks the floating Credentials box (SCRUM-40) to expand once.
  expandCredentialsPanel: boolean;
  setExpandCredentialsPanel: React.Dispatch<React.SetStateAction<boolean>>;
}

const UIContext = createContext<UIContextValue | null>(null);

export function useUIContext() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUIContext must be used within a UIProvider');
  }
  return context;
}

interface UIProviderProps {
  children: ReactNode;
}

export function UIProvider({ children }: UIProviderProps) {
  // Alert Modal
  const [isOpenAlert, setIsOpenAlert] = useState(false);

  // Partner Modal
  const [isPartnerOpen, setIsPartnerOpen] = useState(false);
  const [offerData, setOfferData] = useState<any>(null);

  // Offer Action Modal
  const [isOpenOfferAction, setIsOpenOfferAction] = useState(false);
  const [actionData, setActionData] = useState<any>(null);

  // Edit Modal (Admin)
  const [isOpenEditModal, setIsOpenEditModal] = useState(false);

  // Feedback Modal
  const [openFeedbackModal, setOpenFeedbackModal] = useState(false);

  // AutoFill Modal
  const [openAutoFillModal, setOpenAutoFillModal] = useState(false);
  const [openCompleteProfile, setOpenCompleteProfile] = useState(false);
  const [expandCredentialsPanel, setExpandCredentialsPanel] = useState(false);
  const [autoFillClicked, setAutoFillClicked] = useState('');

  // Alert Modal handlers
  const openAlert = useCallback(() => {
    setIsOpenAlert(true);
  }, []);

  const closeAlert = useCallback(() => {
    setIsOpenAlert(false);
  }, []);

  // Partner Modal handlers
  const openPartner = useCallback((data: any) => {
    setIsPartnerOpen(true);
    setOfferData(data);
  }, []);

  const closePartner = useCallback(() => {
    setIsPartnerOpen(false);
  }, []);

  // Offer Action Modal handlers
  const openOfferAction = useCallback(() => {
    setIsOpenOfferAction(true);
  }, []);

  const closeOfferAction = useCallback(() => {
    setIsOpenOfferAction(false);
  }, []);

  const closeEditModal = useCallback(() => {
    setIsOpenEditModal(false);
  }, []);

  const value = useMemo<UIContextValue>(
    () => ({
      // Alert Modal
      isOpenAlert,
      openAlert,
      closeAlert,

      // Partner Modal
      isPartnerOpen,
      offerData,
      openPartner,
      closePartner,
      setOfferData,

      // Offer Action Modal
      isOpenOfferAction,
      actionData,
      openOfferAction,
      closeOfferAction,
      setActionData,

      // Edit Modal
      isOpenEditModal,

      closeEditModal,

      // Feedback Modal
      openFeedbackModal,
      setOpenFeedbackModal,

      // AutoFill Modal
      openAutoFillModal,
      setOpenAutoFillModal,
      autoFillClicked,
      setAutoFillClicked,

      openCompleteProfile,
      setOpenCompleteProfile,
      expandCredentialsPanel,
      setExpandCredentialsPanel,
    }),
    [
      isOpenAlert,
      openAlert,
      closeAlert,
      isPartnerOpen,
      offerData,
      openPartner,
      closePartner,
      isOpenOfferAction,
      actionData,
      openOfferAction,
      closeOfferAction,
      isOpenEditModal,
      closeEditModal,
      openFeedbackModal,
      openAutoFillModal,
      autoFillClicked,
      setAutoFillClicked,
      openCompleteProfile,
      expandCredentialsPanel,
    ],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export default UIProvider;
