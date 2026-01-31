import api from '@/lib/axiosInterceptor';
import { NextResponse } from 'next/server';

export async function DELETE(req: Request) {
  try {
    const id = await req.json();
    console.log({ id });
    const response = await api.delete(`/offer/${id}`);

    if (response.status === 200) {
      const res = NextResponse.json({
        status: 200,
        message: 'Offer deleted successfully!',
      });
      return res;
    }
  } catch (error: any) {
    console.error('Offer delete failed:', error.response.status);
    return NextResponse.json({
      status: error.response.status || 500,
      message: error.response.data.message,
    });
  }
}
