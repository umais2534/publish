import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Zap } from "lucide-react";

const PaywallPage = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const handleContinue = () => {
    localStorage.setItem("isAuthenticated", "true");
    navigate("/dashboard");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Choose Your Plan</h1>
          <p className="text-muted-foreground">
            Get started with Vet Transcribe today
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Free Trial Plan */}
          <Card
            className={`border-2 ${selectedPlan === "trial" ? "border-primary" : "border-border"}`}
          >
            <CardHeader>
              <CardTitle>Free Trial</CardTitle>
              <CardDescription>Try all features for 14 days</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">$0</span>
                <span className="text-muted-foreground ml-1">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  <span>10 transcriptions per month</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  <span>Basic pet management</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  <span>Standard transcription formats</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  <span>Email support</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => setSelectedPlan("trial")}
                variant={selectedPlan === "trial" ? "default" : "outline"}
                className="w-full"
              >
                Start Free Trial
              </Button>
            </CardFooter>
          </Card>

          {/* Premium Plan */}
          <Card
            className={`border-2 ${selectedPlan === "premium" ? "border-primary" : "border-border"}`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Premium</CardTitle>
                  <CardDescription>
                    Unlimited access to all features
                  </CardDescription>
                </div>
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                  Recommended
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-bold">$29</span>
                <span className="text-muted-foreground ml-1">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  <span>Unlimited transcriptions</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  <span>Advanced pet & clinic management</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  <span>All transcription formats</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  <span>Data export & integrations</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => setSelectedPlan("premium")}
                variant={selectedPlan === "premium" ? "default" : "outline"}
                className="w-full"
              >
                <Zap className="mr-2 h-4 w-4" />
                Get Premium
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={handleContinue}
            disabled={!selectedPlan}
            size="lg"
            className="px-8"
          >
            Continue
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Questions? Contact our{" "}
          <a
            href="#"
            className="underline underline-offset-4 hover:text-primary"
          >
            support team
          </a>
        </p>
      </div>
    </div>
  );
};

export default PaywallPage;
