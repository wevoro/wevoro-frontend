'use client';

import { getUserDocuments } from '@/app/actions';
import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

interface Document {
  _id: string;
  title: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  privacy: string;
  consent: boolean;
  category: string;
  documentType: string;
}

interface DocumentContextValue {
  documents: Document[] | null;
  isDocumentsLoading: boolean;
  refetchDocuments: () => void;
}

const DocumentContext = createContext<DocumentContextValue | null>(null);

export function useDocumentContext() {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error(
      'useDocumentContext must be used within a DocumentProvider'
    );
  }
  return context;
}

interface DocumentProviderProps {
  children: ReactNode;
}

export function DocumentProvider({ children }: DocumentProviderProps) {
  const {
    refetch: refetchDocuments,
    data: documents,
    isLoading: isDocumentsLoading,
  } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      return await getUserDocuments();
    },
    refetchOnWindowFocus: false,
  });

  const value = useMemo<DocumentContextValue>(
    () => ({
      documents: documents ?? null,
      isDocumentsLoading,
      refetchDocuments,
    }),
    [documents, isDocumentsLoading, refetchDocuments]
  );

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
}

export default DocumentProvider;
