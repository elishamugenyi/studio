
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
import type { User, UserRole } from "@/hooks/use-user";
import { useUser } from "@/hooks/use-user";
import { Loader2, Lock, Check, ArrowLeft, UserPlus, Eye, EyeOff } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

type FormStep = "email" | "password" | "forgotPasswordEmail" | "forgotPasswordOtp" | "completeSignUp" | "success";

export default function LoginForm() {
  const { loginWithUserObject, fetchUser } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<FormStep>("email");
  const [email, setEmail] = useState("user@tekview.com");
  const [password, setPassword] = useState("password");
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // State for sign-up form
  const [signupForm, setSignupForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "" as UserRole | "",
    password: "",
    confirmPassword: "",
  });

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setStep("password");
    }
  };
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/reg_users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setStep("success");
        setTimeout(() => {
          // The user context will now be updated via the UserProvider's effect
          // which calls the /api/reg_users/me endpoint
          loginWithUserObject(data.user);
        }, 1000);
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: data.error || "An unexpected error occurred.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not log in. Please try again.",
      });
    } finally {
      setIsLoading(false);
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

  const handleEmailBlur = async () => {
    if (!signupForm.email) return;
    setIsVerifyingEmail(true);
    try {
      const res = await fetch(`/api/reg_users?email=${signupForm.email}`);
      if (res.status === 404) {
        toast({
          variant: "destructive",
          title: "User Not Found",
          description: "This email is not registered for sign-up.",
        });
        setSignupForm(prev => ({ ...prev, firstName: "", lastName: "", role: "" }));
      } else if (res.ok) {
        const data = await res.json();
        if (data.password) {
            toast({
                variant: "destructive",
                title: "Account Already Active",
                description: "This account has already been set up. Please log in.",
            });
            setStep("email");
            setEmail(data.email);
        } else {
            setSignupForm(prev => ({
                ...prev,
                firstName: data.firstname,
                lastName: data.lastname,
                role: data.role,
            }));
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to verify email.",
      });
    } finally {
        setIsVerifyingEmail(false);
    }
  };
  
  const handleCompleteSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupForm.password !== signupForm.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords do not match",
        description: "Please re-enter your password.",
      });
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/reg_users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupForm),
      });

      const data = await res.json();

      if (res.ok) {
        setStep("success");
        const userToLogin: User = {
            name: `${data.user.firstName} ${data.user.lastName}`,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            email: data.user.email,
            role: data.user.role as UserRole,
            avatarUrl: `https://picsum.photos/seed/${data.user.email}/100/100`
        };
        setTimeout(() => {
          loginWithUserObject(userToLogin);
        }, 1000);

      } else {
        toast({
          variant: "destructive",
          title: "Sign-Up Failed",
          description: data.error || "An unexpected error occurred.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not complete sign-up.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    switch (step) {
      case "success":
        return (
          <div className="flex flex-col items-center justify-center text-center p-8">
            <Check className="h-16 w-16 text-green-500 mb-4 animate-pulse" />
            <p className="text-lg font-medium">Success!</p>
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
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
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
        );
        case "completeSignUp":
            return (
              <form onSubmit={handleCompleteSignUp} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your work email"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                    onBlur={handleEmailBlur}
                    required
                  />
                </div>
                {isVerifyingEmail && <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying email...</div>}
                {signupForm.firstName && (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="fname">First Name</Label>
                                <Input id="fname" value={signupForm.firstName} readOnly className="bg-muted/50" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="lname">Last Name</Label>
                                <Input id="lname" value={signupForm.lastName} readOnly className="bg-muted/50" />
                            </div>
                        </div>
                        <div className="grid gap-2">
                             <Label htmlFor="role-display">Role</Label>
                             <Input id="role-display" value={signupForm.role} readOnly className="bg-muted/50" />
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="signup-password">Password</Label>
                            <div className="relative">
                                <Input id="signup-password" type={showSignupPassword ? "text" : "password"} required value={signupForm.password} onChange={(e) => setSignupForm({...signupForm, password: e.target.value})} />
                                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1 h-8 w-8" onClick={() => setShowSignupPassword(!showSignupPassword)}>
                                    {showSignupPassword ? <EyeOff /> : <Eye />}
                                </Button>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <div className="relative">
                                <Input id="confirm-password" type={showConfirmPassword ? "text" : "password"} required value={signupForm.confirmPassword} onChange={(e) => setSignupForm({...signupForm, confirmPassword: e.target.value})} />
                                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1 h-8 w-8" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                                </Button>
                            </div>
                        </div>
                    </>
                )}
                <Button type="submit" className="w-full" disabled={isLoading || isVerifyingEmail || !signupForm.firstName}>
                    {isLoading ? <Loader2 className="animate-spin" /> : 'Complete Sign-Up'}
                </Button>
                <Button variant="link" size="sm" onClick={() => setStep("email")}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                </Button>
              </form>
            );
      case "password":
        return (
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1 h-8 w-8" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : 'Login'}
            </Button>
             <Button variant="link" size="sm" onClick={() => setStep("email")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
          </form>
        );
      case "email":
      default:
        return (
          <div className="grid gap-4">
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
                Login
                </Button>
            </form>
             <Button variant="outline" className="w-full" onClick={() => setStep("completeSignUp")}>
                <UserPlus className="mr-2 h-4 w-4" />
                Complete Sign-Up
            </Button>
          </div>
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
      case "completeSignUp":
        return "Complete Your Registration";
      case "password":
        return "Welcome Back";
      default:
        return "TPM-Login";
    }
  }

  const getDescription = () => {
    switch (step) {
      case "forgotPasswordEmail":
        return "Enter your email to receive a password reset link.";
      case "forgotPasswordOtp":
        return "Check your email for the One-Time Password.";
      case "password":
        return "Enter your password to continue.";
      case "success":
        return "";
      case "completeSignUp":
        return "Enter your email to load your details and set a password.";
      case "email":
      default:
        return "Enter your email to login or sign up.";
    }
  }

  return (
    <Card className="w-full max-w-sm bg-white/95 shadow-2xl backdrop-blur-sm text-card-foreground">
      <CardHeader className="items-center text-center">
        {step !== 'success' && step !== 'completeSignUp' && <Lock className="h-8 w-8 text-primary mb-2" />}
        {step === 'completeSignUp' && <UserPlus className="h-8 w-8 text-primary mb-2" />}
        <CardTitle className="text-2xl font-headline">{getTitle()}</CardTitle>
        <CardDescription className="text-sm text-black">
          {getDescription()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
