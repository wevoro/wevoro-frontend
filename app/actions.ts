"use server";
import api from "@/lib/axiosInterceptor";
import { client } from "@/sanity/lib/client";
import { cookies } from "next/headers";
export async function getUser() {
  try {
    const response = await api.get(`/user/profile`);

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
      `${process.env.NEXT_PUBLIC_QA_API_URL}/user/all`
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
    const response = await api.get(`/user/offer`);
    return response.data.data;
  } catch (error) {
    return null;
  }
}
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
      `${process.env.NEXT_PUBLIC_QA_API_URL}/feedback`
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

export async function getTokens() {
  const accessToken = cookies().get("accessToken")?.value;
  const refreshToken = cookies().get("refreshToken")?.value;
  const tokenRefreshIn = cookies().get("tokenRefreshIn")?.value;
  return { accessToken, refreshToken, tokenRefreshIn };
}

export async function logout() {
  cookies().delete("accessToken");
  cookies().delete("refreshToken");
  cookies().delete("tokenRefreshIn");
}

export async function getEnvironment() {
  const response = await client.fetch(`*[_type == "environment"][0]`);
  return response;
}
export async function getHomeData() {
  const response = await client.fetch(`*[_type == "home"][0]`);
  return response;
}
export async function getProData() {
  const response = await client.fetch(`*[_type == "pro"][0]`);
  return response;
}
export async function getPartnerData() {
  const response = await client.fetch(`*[_type == "partner"][0]`);
  return response;
}
export async function getProLoginData() {
  const response = await client.fetch(`*[_type == "proLogin"][0]`);
  return response;
}
export async function getProSignupData() {
  const response = await client.fetch(`*[_type == "proRegister"][0]`);
  return response;
}
export async function getPartnerLoginData() {
  const response = await client.fetch(`*[_type == "partnerLogin"][0]`);
  return response;
}
export async function getPartnerSignupData() {
  const response = await client.fetch(`*[_type == "partnerRegister"][0]`);
  return response;
}
export async function getResourcePagesData() {
  const response = await client.fetch(`*[_type == "resourcePages"][0]`);
  return response;
}

export async function getFooterData() {
  const response = await client.fetch(`*[_type == "footer"][0]`);
  return response;
}

export async function getCountry() {
  const response = await fetch("https://api.country.is/");
  const data = await response.json();

  return data.country;
}
