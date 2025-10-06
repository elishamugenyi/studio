'use client';

import { useEffect, useState } from 'react';
import { DollarSign, CreditCard, CheckCircle2, Clock, AlertCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import OverviewStats from '../overview-stats';
import Link from 'next/link';

interface Summary {
  total_payments: number;
  paid_count: number;
  pending_count: number;
  rejected_count: number;
  total_paid_amount: number;
  total_pending_amount: number;
  total_module_costs: number;
}

export default function FinanceDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const response = await fetch('/api/finance?report=true');
      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary || null);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 mt-4">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8 mt-4">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <OverviewStats
          title="Total Payments"
          value={summary?.total_payments?.toString() || '0'}
          description="All time"
          Icon={FileText}
        />
        <OverviewStats
          title="Paid Amount"
          value={`${summary?.total_paid_amount?.toLocaleString() || '0'}`}
          description={`${summary?.paid_count || 0} payments processed`}
          Icon={CheckCircle2}
        />
        <OverviewStats
          title="Pending Amount"
          value={`${summary?.total_pending_amount?.toLocaleString() || '0'}`}
          description={`${summary?.pending_count || 0} pending payments`}
          Icon={Clock}
        />
        <OverviewStats
          title="Total Module Costs"
          value={`${summary?.total_module_costs?.toLocaleString() || '0'}`}
          description="All modules"
          Icon={DollarSign}
        />
      </div>
      
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-headline">Quick Actions</CardTitle>
            <CardDescription>Manage payments and generate reports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/dashboard/pending-payments">
              <Button className="w-full justify-start" variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                Process Pending Payments
                {(summary?.pending_count ?? 0) > 0 && (
                  <span className="ml-auto bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                    {summary?.pending_count ?? 0}
                  </span>
                )}
              </Button>
            </Link>
            <Link href="/dashboard/payment-reports">
              <Button className="w-full justify-start" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                View Payment Reports
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-headline">Payment Status Overview</CardTitle>
            <CardDescription>Current payment processing status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Paid</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{summary?.paid_count || 0}</div>
                  <div className="text-xs text-muted-foreground">
                    {summary?.total_paid_amount?.toLocaleString() || '0'} total
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">Pending</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{summary?.pending_count || 0}</div>
                  <div className="text-xs text-muted-foreground">
                    {summary?.total_pending_amount?.toLocaleString() || '0'} total
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">Rejected</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{summary?.rejected_count || 0}</div>
                  <div className="text-xs text-muted-foreground">payments</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
