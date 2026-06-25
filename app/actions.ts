'use server';
import api from '@/lib/axiosInterceptor';
import { client } from '@/sanity/lib/client';
import { cookies } from 'next/headers';
import * as jose from 'jose';

export async function getUser() {
  try {
    const response = await api.get(`/user/profile`);

    return response.data.data;
  } catch (error) {
    // console.error('Error fetching user profile:', error);
    return null;
  }
}
export async function getUserDocuments(userId?: string) {
  try {
    const response = await api.get(`/document`, {
      params: userId ? { userId } : undefined,
    });

    return response.data.data;
  } catch (error) {
    // console.error('Error fetching user profile:', error);
    return null;
  }
}
export async function getUsers() {
  try {
    const response = await api.get(`/user/all`);
    // console.log('response', response.data);
    return response.data.data;
  } catch (error) {
    // console.error('Error fetching user profile:', error);
    return null;
  }
}
export async function getQaUsers() {
  try {
    const response = await api.get(
      `${process.env.NEXT_PUBLIC_QA_API_URL}/user/all`,
    );
    // console.log('response', response.data);
    return response.data.data;
  } catch (error) {
    // console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function getUserById(id: string) {
  try {
    const response = await api.get(`/user/profile/${id}`);
    return response.data.data;
  } catch (error) {
    return null;
  }
}
export async function getOffers() {
  try {
    console.log('caledddddddddd');
    const response = await api.get(`/offer`);
    return response.data.data;
  } catch (error) {
    return null;
  }
} //
export async function getPros() {
  try {
    const response = await api.get(`/user/pros`);
    return response.data.data;
  } catch (error) {
    //  console.error('Error fetching pros:', error);
    return null;
  }
}

// SCRUM-87: caregiver's credentialing-mode Offers tab — Submitted/Received
// agency engagements ({ received: [], submitted: [] }).
export async function getCaregiverEngagements() {
  try {
    const response = await api.get(`/credentialing/caregiver-engagements`);
    return response.data.data;
  } catch (error) {
    return null;
  }
}

// SCRUM-88: agency's credentialing-mode Offers tab — Submitted/Received
// caregiver engagements ({ received: [], submitted: [] }).
export async function getAgencyEngagements() {
  try {
    const response = await api.get(`/credentialing/agency-engagements`);
    return response.data.data;
  } catch (error) {
    return null;
  }
}

export async function getAllAvailablePros() {
  try {
    const response = await api.get(`/user/all-pros`);
    return response.data.data;
  } catch (error) {
    return null;
  }
}

export async function getNotifications() {
  try {
    const response = await api.get(`/user/notification`);
    return response.data.data;
  } catch (error) {
    // console.error('Error fetching notifications:', error);
    return null;
  }
}
export async function getFeedbacks() {
  try {
    const response = await api.get(`/feedback`);
    return response.data.data;
  } catch (error) {
    // console.error('Error fetching notifications:', error);
    return null;
  }
}

export async function getQaFeedbacks() {
  try {
    const response = await api.get(
      `${process.env.NEXT_PUBLIC_QA_API_URL}/feedback`,
    );
    // console.log('response', response.data);
    return response.data.data;
  } catch (error) {
    // console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function getFeedbackById(id: string) {
  try {
    const response = await api.get(`/feedback/${id}`);
    return response.data.data;
  } catch (error) {
    // console.error('Error fetching notifications:', error);
    return null;
  }
}

export async function getAuthStatus() {
  const accessToken = cookies().get('accessToken')?.value;

  if (!accessToken) {
    return { isAuthenticated: false, expiresAt: null };
  }

  try {
    // Use jose to decode JWT (no verification, just reading claims)
    const decoded = jose.decodeJwt(accessToken);
    const expiresAt = decoded.exp ? decoded.exp * 1000 : null; // Convert seconds to ms

    return {
      isAuthenticated: true,
      expiresAt,
    };
  } catch (err) {
    console.error('[getAuthStatus] Error decoding JWT:', err);
    return { isAuthenticated: false, expiresAt: null };
  }
}

export async function logout() {
  cookies().delete('accessToken');
  cookies().delete('refreshToken');
}

// Sanity CMS functions - use tag-based caching for on-demand revalidation
// Tags are invalidated via webhook when content is published in Sanity

export async function getEnvironment() {
  const response = await client.fetch(
    `*[_type == "environment"][0]`,
    {},
    { next: { tags: ['sanity', 'sanity-environment'] } },
  );
  return response;
}

export async function getHomeData() {
  const response = await client.fetch(
    `*[_type == "home"][0]`,
    {},
    { next: { tags: ['sanity', 'sanity-home'] } },
  );
  return response;
}

export async function getProData() {
  const response = await client.fetch(
    `*[_type == "pro"][0]`,
    {},
    { next: { tags: ['sanity', 'sanity-pro'] } },
  );
  return response;
}

export async function getPartnerData() {
  const response = await client.fetch(
    `*[_type == "partner"][0]`,
    {},
    { next: { tags: ['sanity', 'sanity-partner'] } },
  );
  return response;
}

export async function getProLoginData() {
  const response = await client.fetch(
    `*[_type == "proLogin"][0]`,
    {},
    { next: { tags: ['sanity', 'sanity-proLogin'] } },
  );
  return response;
}

export async function getProSignupData() {
  const response = await client.fetch(
    `*[_type == "proRegister"][0]`,
    {},
    { next: { tags: ['sanity', 'sanity-proRegister'] } },
  );
  return response;
}

export async function getPartnerLoginData() {
  const response = await client.fetch(
    `*[_type == "partnerLogin"][0]`,
    {},
    { next: { tags: ['sanity', 'sanity-partnerLogin'] } },
  );
  return response;
}

export async function getPartnerSignupData() {
  const response = await client.fetch(
    `*[_type == "partnerRegister"][0]`,
    {},
    { next: { tags: ['sanity', 'sanity-partnerRegister'] } },
  );
  return response;
}

export async function getResourcePagesData() {
  const response = await client.fetch(
    `*[_type == "resourcePages"][0]`,
    {},
    { next: { tags: ['sanity', 'sanity-resourcePages'] } },
  );
  return response;
}

export async function getFooterData() {
  const response = await client.fetch(
    `*[_type == "footer"][0]`,
    {},
    { next: { tags: ['sanity', 'sanity-footer'] } },
  );
  return response;
}

export async function getCountry() {
  const response = await fetch('https://api.country.is/');
  const data = await response.json();

  return data.country;
}

export async function getCredentialStatus(userId: string) {
  try {
    const { REQUIRED_CREDENTIALS } = await import('@/lib/credential-config');
    const response = await api.get(`/document`, {
      params: { userId },
    });
    const documents = response.data.data || [];

    const docByType: Record<string, any> = {};
    documents.forEach((doc: any) => {
      docByType[doc.documentType] = doc;
    });

    return REQUIRED_CREDENTIALS.map((cred) => {
      const doc = docByType[cred.key] || null;
      let state: 'not_uploaded' | 'pending' | 'verified' | 'rejected' = 'not_uploaded';
      if (doc) {
        if (doc.reviewStatus === 'approved') state = 'verified';
        else if (doc.reviewStatus === 'rejected') state = 'rejected';
        else state = 'pending';
      }
      return {
        key: cred.key,
        label: cred.label,
        category: cred.category,
        state,
        document: doc,
      };
    });
  } catch (error) {
    console.error('Error fetching credential status:', error);
    return null;
  }
}

export async function getUserByShareId(shareId: string) {
  try {
    const response = await api.get(`/user/share/${shareId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching user by share ID:', error);
    return null;
  }
}

// SCRUM-66: Update GCHEXS status
export async function updateGchexsStatus(
  gchexsStatus: 'yes' | 'no',
  gchexsDocumentUrl?: string,
  gchexsDocumentFileId?: string,
) {
  try {
    const response = await api.patch('/user/gchexs', {
      gchexsStatus,
      gchexsDocumentUrl,
      gchexsDocumentFileId,
    });
    return response.data.data;
  } catch (error) {
    console.error('Error updating GCHEXS status:', error);
    return null;
  }
}

// SCRUM-67: Get download package for a caregiver
export async function getDownloadPackage(caregiverId: string) {
  try {
    const response = await api.get(`/document/download-package/${caregiverId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error getting download package:', error);
    return null;
  }
}

// SCRUM-67: Download individual document
export async function downloadDocument(documentId: string) {
  try {
    const response = await api.get(`/document/download/${documentId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error downloading document:', error);
    return null;
  }
}

// SCRUM-67: Request private access
export async function requestPrivateAccess(caregiverId: string) {
  try {
    const response = await api.post(`/document/request-private-access/${caregiverId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error requesting private access:', error);
    return null;
  }
}

// SCRUM-67: Update private access (grant/revoke)
export async function updatePrivateAccess(accessId: string, action: 'grant' | 'revoke') {
  try {
    const response = await api.patch(`/document/private-access/${accessId}`, { action });
    return response.data.data;
  } catch (error) {
    console.error('Error updating private access:', error);
    return null;
  }
}

// SCRUM-67: Get access requests for caregiver
export async function getAccessRequests() {
  try {
    const response = await api.get('/document/access-requests');
    return response.data.data;
  } catch (error) {
    console.error('Error getting access requests:', error);
    return null;
  }
}

// SCRUM-67: Get download audit log (admin)
export async function getDownloadAuditLog(caregiverId: string) {
  try {
    const response = await api.get(`/document/download-audit/${caregiverId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error getting download audit:', error);
    return null;
  }
}
