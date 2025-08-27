import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function VerifyEmailPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Alert className="max-w-md w-full">
        <AlertTitle>Email Verification Required</AlertTitle>
        <AlertDescription>
          Please check your email inbox and click the verification link to
          activate your account.
          <br />
          After verifying, refresh this page or log in again to continue.
        </AlertDescription>
      </Alert>
    </div>
  );
}
