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
