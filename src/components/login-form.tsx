"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserRole } from "@/hooks/use-user";
import { useUser } from "@/hooks/use-user";
import { Loader2, Lock, Check, ArrowLeft } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"


type FormStep = "email" | "password" | "forgotPasswordEmail" | "forgotPasswordOtp" | "success";

export default function LoginForm() {
  const { login } = useUser();
  const [step, setStep] = useState<FormStep>("email");
  const [email, setEmail] = useState("user@tekview.com");
  const [password, setPassword] = useState("password");
  const [selectedRole, setSelectedRole] = useState<UserRole | "">("");
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setStep("password");
    }
  };
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole) {
      setIsLoading(true);
      // Simulate network request
      setTimeout(() => {
        setIsLoading(false);
        setStep("success");
        setTimeout(() => {
          login(selectedRole);
        }, 1000);
      }, 1000);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("forgotPasswordEmail");
  };

  const handleForgotPasswordEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you'd send a reset email here
    setStep("forgotPasswordOtp");
  };

  const handleForgotPasswordOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you'd verify the OTP here
    alert("OTP Verified! (Frontend only)");
    setStep("email");
  };

  const renderContent = () => {
    switch (step) {
      case "success":
        return (
          <div className="flex flex-col items-center justify-center text-center p-8">
            <Check className="h-16 w-16 text-green-500 mb-4 animate-pulse" />
            <p className="text-lg font-medium">Login Successful!</p>
            <p className="text-muted-foreground">Redirecting...</p>
          </div>
        );
      case "forgotPasswordEmail":
        return (
          <form onSubmit={handleForgotPasswordEmailSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="Enter your email to reset password"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Send Reset Link
            </Button>
            <Button variant="link" onClick={() => setStep("email")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
            </Button>
          </form>
        );
      case "forgotPasswordOtp":
        return (
          <form onSubmit={handleForgotPasswordOtpSubmit} className="grid gap-4 place-items-center">
            <div className="grid gap-2 text-center">
              <Label htmlFor="otp">Enter OTP</Label>
              <p className="text-sm text-muted-foreground">An OTP has been sent to your email.</p>
            </div>
            <InputOTP maxLength={6}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <Button type="submit" className="w-full">
              Verify OTP
            </Button>
             <Button variant="link" onClick={() => setStep("email")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
            </Button>
          </form>
        )
      case "password":
        return (
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                readOnly
                className="bg-muted/50"
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <a
                  href="#"
                  className="ml-auto inline-block text-sm underline"
                  onClick={handleForgotPassword}
                >
                  Forgot your password?
                </a>
              </div>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select
                onValueChange={(value) => setSelectedRole(value as UserRole)}
                defaultValue={selectedRole}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CEO">CEO</SelectItem>
                  <SelectItem value="Team Lead">Team Lead</SelectItem>
                  <SelectItem value="Developer">Developer</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={!selectedRole || isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : 'Verify'}
            </Button>
             <Button variant="link" size="sm" onClick={() => setStep("email")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
          </form>
        );
      case "email":
      default:
        return (
          <form onSubmit={handleNext} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Next
            </Button>
          </form>
        );
    }
  };

  const getTitle = () => {
    switch (step) {
      case "forgotPasswordEmail":
      case "forgotPasswordOtp":
        return "Forgot Password";
      case "success":
        return "Success";
      default:
        return "Login";
    }
  }

  const getDescription = () => {
    switch (step) {
      case "forgotPasswordEmail":
        return "Enter your email to receive a password reset link.";
      case "forgotPasswordOtp":
        return "Check your email for the One-Time Password.";
      case "password":
        return "Enter your password and select your role to continue.";
      case "success":
        return "";
      case "email":
      default:
        return "Enter your email to login to your dashboard.";
    }
  }

  return (
    <Card className="w-full max-w-sm border-none bg-background/60 shadow-2xl backdrop-blur-lg md:border-solid">
      <CardHeader className="items-center text-center">
        {step !== 'success' && <Lock className="h-8 w-8 text-primary mb-2" />}
        <CardTitle className="text-2xl font-headline">{getTitle()}</CardTitle>
        <CardDescription>
          {getDescription()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
