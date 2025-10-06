'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText, 
  DollarSign, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Download,
  Calendar,
  User
} from 'lucide-react';
import { format } from 'date-fns';

interface Payment {
  financeid: number;
  moduleid: number;
  module_name: string;
  module_description: string;
  project_name: string;
  developer_name: string;
  developer_email: string;
  modulecost: number;
  amount: number;
  currency: string;
  paymentstatus: string;
  processeddate: string;
  processed_by_name: string;
  notes: string;
  startdate: string;
  enddate: string;
  markedcompletedate: string;
}

interface Summary {
  total_payments: number;
  paid_count: number;
  pending_count: number;
  rejected_count: number;
  total_paid_amount: number;
  total_pending_amount: number;
  total_module_costs: number;
}

export default function PaymentReportsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const fetchReports = async () => {
    try {
      const params = new URLSearchParams();
      params.append('report', 'true');
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/finance?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
        setSummary(data.summary || null);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'Pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'Rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'default';
      case 'Pending':
        return 'secondary';
      case 'Rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Payment ID',
      'Module Name',
      'Project Name',
      'Developer',
      'Module Cost',
      'Amount Paid',
      'Currency',
      'Status',
      'Processed Date',
      'Processed By',
      'Notes'
    ];

    const csvData = payments.map(payment => [
      payment.financeid,
      payment.module_name,
      payment.project_name,
      payment.developer_name,
      payment.modulecost,
      payment.amount,
      payment.currency,
      payment.paymentstatus,
      format(new Date(payment.processeddate), 'yyyy-MM-dd'),
      payment.processed_by_name || 'N/A',
      payment.notes || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-reports-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-1/4" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Payment Reports
          </h1>
          <p className="text-muted-foreground">
            Comprehensive financial reports and payment history.
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_payments}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {summary.total_paid_amount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.paid_count} payments processed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {summary.total_pending_amount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.pending_count} pending payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Module Costs</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.total_module_costs.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">All modules</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>Filter payments by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Payment Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            Complete history of all processed payments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payment records found for the selected filters.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Developer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Processed</TableHead>
                  <TableHead>Processed By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.financeid}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payment.module_name}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {payment.module_description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{payment.project_name}</div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payment.developer_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {payment.developer_email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {payment.currency} {payment.amount.toLocaleString()}
                        </div>
                        {payment.amount !== payment.modulecost && (
                          <div className="text-xs text-muted-foreground">
                            Cost: {payment.currency} {payment.modulecost.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(payment.paymentstatus)}
                        <Badge variant={getStatusBadgeVariant(payment.paymentstatus)}>
                          {payment.paymentstatus}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(payment.processeddate), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {payment.processed_by_name || 'N/A'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
