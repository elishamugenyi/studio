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
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  Calendar,
  User,
  FileText,
  Loader2
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
  notes: string;
  startdate: string;
  enddate: string;
  markedcompletedate: string;
}

export default function PendingPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processAmount, setProcessAmount] = useState('');
  const [processNotes, setProcessNotes] = useState('');
  const [processStatus, setProcessStatus] = useState<'Paid' | 'Rejected'>('Paid');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/finance?status=Pending');
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch pending payments.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedPayment) return;

    if (processStatus === 'Paid' && (!processAmount || parseFloat(processAmount) <= 0)) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a valid amount for payment.'
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/finance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          financeId: selectedPayment.financeid,
          paymentStatus: processStatus,
          amount: processStatus === 'Paid' ? parseFloat(processAmount) : 0,
          notes: processNotes
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to process payment.');

      toast({
        title: 'Success',
        description: `Payment ${processStatus.toLowerCase()} successfully.`
      });

      // Reset form and close dialog
      setSelectedPayment(null);
      setProcessAmount('');
      setProcessNotes('');
      setProcessStatus('Paid');
      setIsDialogOpen(false);
      
      // Refresh payments list
      fetchPayments();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const openProcessDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setProcessAmount(payment.modulecost.toString());
    setProcessNotes('');
    setProcessStatus('Paid');
    setIsDialogOpen(true);
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-1/4" />
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
            <CreditCard className="h-8 w-8" />
            Pending Payments
          </h1>
          <p className="text-muted-foreground">
            Process payments for completed modules.
          </p>
        </div>
      </div>

      {payments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
            <p className="text-muted-foreground">
              No pending payments to process at the moment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Pending Payments ({payments.length})</CardTitle>
            <CardDescription>
              Review and process payments for completed modules.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Developer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Actions</TableHead>
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
                      <div className="font-medium">
                        {payment.currency} {payment.modulecost.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(payment.markedcompletedate), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => openProcessDialog(payment)}
                        size="sm"
                        className="w-full"
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Process
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Process Payment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              Review and process payment for the completed module.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label className="text-sm font-medium">Module</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <div className="font-medium">{selectedPayment.module_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedPayment.module_description}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Project</Label>
                    <div className="p-3 bg-muted rounded-md text-sm">
                      {selectedPayment.project_name}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Developer</Label>
                    <div className="p-3 bg-muted rounded-md text-sm">
                      {selectedPayment.developer_name}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Module Cost</Label>
                    <div className="p-3 bg-muted rounded-md text-sm font-medium">
                      {selectedPayment.currency} {selectedPayment.modulecost.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Completed</Label>
                    <div className="p-3 bg-muted rounded-md text-sm">
                      {format(new Date(selectedPayment.markedcompletedate), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="status">Payment Status</Label>
                  <select
                    id="status"
                    value={processStatus}
                    onChange={(e) => setProcessStatus(e.target.value as 'Paid' | 'Rejected')}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="Paid">Approve Payment</option>
                    <option value="Rejected">Reject Payment</option>
                  </select>
                </div>

                {processStatus === 'Paid' && (
                  <div>
                    <Label htmlFor="amount">Payment Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={processAmount}
                      onChange={(e) => setProcessAmount(e.target.value)}
                      placeholder="Enter payment amount"
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={processNotes}
                    onChange={(e) => setProcessNotes(e.target.value)}
                    placeholder="Add any notes about this payment..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProcessPayment}
              disabled={isProcessing}
              variant={processStatus === 'Rejected' ? 'destructive' : 'default'}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {processStatus === 'Paid' ? 'Approve Payment' : 'Reject Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
