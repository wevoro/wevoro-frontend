import { getUser } from '@/app/actions';
import OverviewPage from '@/components/global/admin/admin-overview';
import { redirect } from 'next/navigation';
import React from 'react';

const AdminPage = async () => {
  // const user = await getUser();

  // if (!user) {
  //   redirect('/admin/login');
  // }

  return <OverviewPage />;
};

export default AdminPage;
