'use client';

import { useEffect, useState } from 'react';
import { Download, FileText, Package, Clock } from 'lucide-react';

interface AuditLog {
  _id: string;
  agencyName: string;
  agencyEmail: string;
  documentTitle?: string;
  downloadType: 'individual' | 'bulk';
  documentsIncluded?: Array<{ documentId: string; title: string }>;
  createdAt: string;
}

export default function DownloadAuditTrail({ userId }: { userId: string }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;

    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/download-audit/${userId}`);
        const data = await res.json();
        if (data?.data) {
          setLogs(data.data);
        } else {
          setLogs([]);
        }
      } catch (err) {
        console.error('Failed to fetch audit logs:', err);
        setError('Failed to load audit trail');
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [userId]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center gap-2'>
        <Download className='size-5 text-muted-foreground' />
        <h2 className='text-lg font-semibold'>Download Audit Trail</h2>
      </div>

      {loading && (
        <div className='flex items-center justify-center py-8 text-muted-foreground text-sm'>
          <Clock className='size-4 mr-2 animate-spin' />
          Loading audit trail...
        </div>
      )}

      {!loading && error && (
        <div className='text-sm text-red-500 py-4'>{error}</div>
      )}

      {!loading && !error && logs.length === 0 && (
        <div className='flex flex-col items-center justify-center py-8 text-muted-foreground border border-dashed rounded-xl'>
          <FileText className='size-10 mb-2 opacity-40' />
          <p className='text-sm'>No download activity recorded yet</p>
        </div>
      )}

      {!loading && logs.length > 0 && (
        <div className='border rounded-xl overflow-hidden'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='bg-gray-50 border-b'>
                <th className='text-left px-4 py-3 font-medium text-muted-foreground'>Agency</th>
                <th className='text-left px-4 py-3 font-medium text-muted-foreground'>Document</th>
                <th className='text-left px-4 py-3 font-medium text-muted-foreground'>Type</th>
                <th className='text-left px-4 py-3 font-medium text-muted-foreground'>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr
                  key={log._id || index}
                  className='border-b last:border-b-0 hover:bg-gray-50/50 transition-colors'
                >
                  <td className='px-4 py-3'>
                    <div className='flex flex-col'>
                      <span className='font-medium text-tertiary'>
                        {log.agencyName || 'Unknown Agency'}
                      </span>
                      <span className='text-xs text-muted-foreground'>
                        {log.agencyEmail || ''}
                      </span>
                    </div>
                  </td>
                  <td className='px-4 py-3'>
                    {log.downloadType === 'bulk' ? (
                      <div className='flex flex-col'>
                        <span className='text-tertiary'>Bulk Package</span>
                        {log.documentsIncluded && log.documentsIncluded.length > 0 && (
                          <span className='text-xs text-muted-foreground'>
                            {log.documentsIncluded.length} documents
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className='text-tertiary'>
                        {log.documentTitle || 'Document'}
                      </span>
                    )}
                  </td>
                  <td className='px-4 py-3'>
                    {log.downloadType === 'bulk' ? (
                      <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200'>
                        <Package className='size-3' />
                        Bulk
                      </span>
                    ) : (
                      <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200'>
                        <FileText className='size-3' />
                        Individual
                      </span>
                    )}
                  </td>
                  <td className='px-4 py-3 text-muted-foreground'>
                    {formatDate(log.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
