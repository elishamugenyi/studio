'use client';

import { DollarSign, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import OverviewStats from '../overview-stats';
import { financialData, projects } from '@/lib/data';
import { cn } from '@/lib/utils';

export default function FinanceDashboard() {
  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8 mt-4">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <OverviewStats
          title="Total Revenue"
          value="$1.3M"
          description="YTD"
          Icon={DollarSign}
        />
        <OverviewStats
          title="Total Expenses"
          value="$850K"
          description="YTD"
          Icon={CreditCard}
        />
        <OverviewStats
          title="Net Profit"
          value="$450K"
          description="+15% from last year"
          Icon={TrendingUp}
        />
        <OverviewStats
          title="Burn Rate"
          value="$85K/mo"
          description="Avg. monthly spend"
          Icon={TrendingDown}
        />
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-headline">Revenue vs. Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={financialData}>
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(value) => `$${value/1000}k`} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" name="Revenue" />
                <Line type="monotone" dataKey="expenses" stroke="hsl(var(--accent))" name="Expenses" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle className="font-headline">Project Budgets</CardTitle>
                <CardDescription>An overview of budget vs. actual spend for all projects.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Project</TableHead>
                            <TableHead className="text-right">Budget</TableHead>
                            <TableHead className="text-right">Spent</TableHead>
                            <TableHead className="text-right">Variance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {projects.map(p => {
                            const variance = p.budget - p.spent;
                            return (
                                <TableRow key={p.name}>
                                    <TableCell className="font-medium">{p.name}</TableCell>
                                    <TableCell className="text-right">${p.budget.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">${p.spent.toLocaleString()}</TableCell>
                                    <TableCell className={cn("text-right font-medium", variance >= 0 ? 'text-primary' : 'text-destructive')}>
                                        ${variance.toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
