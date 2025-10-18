import { CardContent } from '@/components/ui/card';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Tabs } from '@/components/ui/tabs';
import moment from 'moment';
import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { SelectContent, SelectItem } from '@/components/ui/select';
import Title from '../title';
import { Select, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ChartData {
  month: string;
  pro: number;
  partner: number;
}

const Chart = ({ pros, partners }: any) => {
  const [selectedRole, setSelectedRole] = useState<'pro' | 'partner' | 'both'>(
    'both'
  );
  const [selectedRange, setSelectedRange] = useState<
    'lastYear' | 'lastMonth' | 'last90Days'
  >('lastYear');
  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => {
    processData();
  }, [pros, partners, selectedRole, selectedRange]);

  const processData = () => {
    let months: string[] = [];

    if (selectedRange === 'lastYear') {
      months = Array.from({ length: 12 }, (_, i) =>
        moment().month(i).format('MMM')
      ); // Jan, Feb, ...
    } else if (selectedRange === 'lastMonth') {
      months = Array.from({ length: 30 }, (_, i) =>
        moment().subtract(i, 'days').format('DD MMM')
      ).reverse();
    } else if (selectedRange === 'last90Days') {
      months = Array.from({ length: 90 }, (_, i) =>
        moment().subtract(i, 'days').format('DD MMM')
      ).reverse();
    }

    const dataByMonth: any = months.map((label, index) => {
      const dateKey =
        selectedRange === 'lastYear'
          ? moment().month(index).format('YYYY-MM')
          : moment().subtract(index, 'days').format('YYYY-MM-DD');

      const proCount =
        selectedRole !== 'partner'
          ? pros?.filter((user: any) =>
              moment(user.createdAt).format('YYYY-MM-DD').startsWith(dateKey)
            ).length || 0
          : 0;

      const partnerCount =
        selectedRole !== 'pro'
          ? partners?.filter((user: any) =>
              moment(user.createdAt).format('YYYY-MM-DD').startsWith(dateKey)
            ).length || 0
          : 0;

      return { month: label, PRO: proCount, PARTNER: partnerCount };
    });

    setChartData(dataByMonth);
  };

  // console.log({ chartData });

  return (
    <Card className='shadow-none border-none rounded-[16px]'>
      <CardContent className='p-4 sm:p-6'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4'>
          <Title
            className='mb-2 sm:mb-0 text-lg sm:text-xl'
            text='Registrations'
          />
          <Select
            defaultValue='lastYear'
            onValueChange={(value) =>
              setSelectedRange(value as 'lastYear' | 'lastMonth' | 'last90Days')
            }
          >
            <SelectTrigger className='w-full sm:w-[150px] py-3 sm:py-4 text-secondary font-medium text-sm sm:text-base px-3 sm:px-4 bg-[#F9F9FA] border-none shadow-none rounded-[12px] sm:rounded-[16px]'>
              <SelectValue placeholder='Select period' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='lastYear'>Last Year</SelectItem>
              <SelectItem value='lastMonth'>Last Month</SelectItem>
              <SelectItem value='last90Days'>Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs
          defaultValue='pro'
          className='mb-4'
          onValueChange={(value) => setSelectedRole(value as 'pro' | 'partner')}
        >
          <TabsList className='rounded-[8px] bg-[#F9F9FA] p-1 sm:p-2 py-4 sm:py-6'>
            <TabsTrigger
              value='pro'
              className='rounded-[8px] py-1 sm:py-2 px-2 sm:px-4'
            >
              Pro's
            </TabsTrigger>
            <TabsTrigger
              value='partner'
              className='rounded-[8px] py-1 sm:py-2 px-2 sm:px-4'
            >
              Partner's
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className='h-[400px] mt-8 bg-[#F9F9FA] rounded-[16px] pl-0 p-6'>
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray='3 3' vertical={false} />

              <XAxis
                dataKey='month'
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                ticks={[0, 10, 20, 30, 40, 50]}
              />
              <Tooltip />
              <Legend />
              <Line
                type='monotone'
                dataKey='PRO'
                stroke='#008000'
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type='monotone'
                dataKey='PARTNER'
                stroke='#BBF8DC'
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default Chart;
