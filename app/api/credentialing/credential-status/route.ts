import { NextRequest, NextResponse } from 'next/server';
import api from '@/lib/axiosInterceptor';
import {
  REQUIRED_CREDENTIALS,
  isPrimaryCredentialRow,
  isSignoffRow,
} from '@/lib/credential-config';

/**
 * The caregiver's credential list, as a plain request.
 *
 * This used to be reached only through the `getCredentialStatus` server action.
 * Next runs server actions one at a time per client and drops the one in flight
 * when the page changes, so after a caregiver uploaded their fifth credential
 * the share box behind the Completing Profile window kept saying "0 of 5
 * verified" for around twenty seconds — the invalidated query was sitting in
 * that queue. A route handler is an ordinary fetch: it starts immediately and
 * runs alongside everything else. Same fix as the agency Onboarding list.
 *
 * The action is kept for the server-rendered callers that already use it.
 */
export const dynamic = 'force-dynamic';

type Doc = Record<string, unknown> & { reviewStatus?: string; documentType?: string };

/** One ladder for the credential and the PCA sign-off alike. */
const stateOf = (doc: Doc | null): 'not_uploaded' | 'pending' | 'verified' | 'rejected' => {
  if (!doc) return 'not_uploaded';
  if (doc.reviewStatus === 'approved') return 'verified';
  if (doc.reviewStatus === 'rejected') return 'rejected';
  return 'pending';
};

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ status: 400, message: 'userId is required', data: null });
  }

  try {
    const response = await api.get('/document', { params: { userId } });
    const documents: Doc[] = response.data?.data || [];

    // SCRUM-165: the PCA sign-off is a second 'certifications' row, so only the
    // primary row stands for the credential and the sign-off rides beside it.
    // Keyed by type alone, a pending sign-off would keep a verified caregiver's
    // share link locked.
    const docByType: Record<string, Doc> = {};
    documents.forEach((doc) => {
      if (isPrimaryCredentialRow(doc as never)) docByType[doc.documentType as string] = doc;
    });
    const signoffDoc = documents.find((doc) => isSignoffRow(doc as never)) || null;

    // Still exactly 5 items: the share gate takes the list length as its total.
    const data = REQUIRED_CREDENTIALS.map((cred) => {
      const doc = docByType[cred.key] || null;
      return {
        key: cred.key,
        label: cred.label,
        category: cred.category,
        state: stateOf(doc),
        document: doc,
        ...(cred.key === 'certifications'
          ? { signoff: { state: stateOf(signoffDoc), document: signoffDoc } }
          : {}),
      };
    });

    return NextResponse.json({ status: 200, data });
  } catch (error) {
    console.error('Error fetching credential status:', error);
    return NextResponse.json({ status: 500, message: 'Failed to load', data: null });
  }
}
