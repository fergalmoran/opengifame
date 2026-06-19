"use client";

import {Suspense} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {Card, CardContent} from "@/components/ui/card";
import {SignInForm} from "@/components/sign-in-form";

function SignInPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialError = searchParams.get("error") ? "Invalid credentials. Please try again." : "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <SignInForm
            onSuccess={() => router.push("/")}
            initialError={initialError}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInPageContent/>
    </Suspense>
  );
}
