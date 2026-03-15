import React from "react";
import { useSignUp } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { ChevronLeftIcon } from "../../icons";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { Link } from "react-router-dom";
import AuthLayout from "./AuthPageLayout";

export default function VerifyEmail() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        navigate("/");
      }
    } catch (err) {
      setError(err.errors[0].longMessage || "Invalid verification code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Verify Email | Your App" 
      description="Email verification page"
    >
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/signup"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Back to sign up
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Verify Email
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter the verification code sent to your email
            </p>
          </div>
          <form onSubmit={handleVerify}>
            <div className="space-y-6">
              <div>
                <Label>
                  Verification Code <span className="text-error-500">*</span>
                </Label>
                <Input
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-error-500">{error}</p>
              )}
              <div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  size="sm"
                  disabled={isLoading}
                >
                  {isLoading ? "Verifying..." : "Verify Email"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
    </AuthLayout>
  );
}