import api from '@/lib/axiosInterceptor';
import { NextResponse } from 'next/server';

/**
 * Admin "Run AI check": read and decide every required credential this
 * caregiver has uploaded.
 *
 * Reading six documents takes the best part of half a minute, which is longer
 * than the platform's default function timeout, so this route asks for more.
 */
export const maxDuration = 300;

export async function POST(
  _req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    if (!userId) {
      return NextResponse.json(
        { status: 400, message: 'userId is required' },
        { status: 400 }
      );
    }

    const response = await api.post(`/document/ai-review/user/${userId}`);

    return NextResponse.json({
      status: 200,
      message: response.data?.message || 'Credentials checked',
      data: response.data?.data,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: error.response?.status || 500,
        message:
          error.response?.data?.message || 'The credentials could not be checked',
      },
      { status: error.response?.status || 500 }
    );
  }
}
