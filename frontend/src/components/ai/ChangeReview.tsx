"use client";

import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChangeReviewProps {
  onAccept: () => void;
  onReject: () => void;
  disabled?: boolean;
}

export function ChangeReview({ onAccept, onReject, disabled }: ChangeReviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Review Changes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <Button
            onClick={onAccept}
            disabled={disabled}
            className="flex-1"
            size="lg"
          >
            <Check className="h-5 w-5 mr-2" />
            Accept Changes
          </Button>
          <Button
            onClick={onReject}
            disabled={disabled}
            variant="destructive"
            className="flex-1"
            size="lg"
          >
            <X className="h-5 w-5 mr-2" />
            Reject Changes
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-4 text-center">
          Review the AI's changes and decide whether to accept or reject them.
        </p>
      </CardContent>
    </Card>
  );
}
