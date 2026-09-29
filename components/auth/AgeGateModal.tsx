"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const AGE_GATE_MINIMUM = process.env.NEXT_PUBLIC_AGE_GATE_MINIMUM ?? "21";

export interface AgeGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

export function AgeGateModal({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting = false,
}: AgeGateModalProps) {
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [jurisdictionConfirmed, setJurisdictionConfirmed] = useState(false);

  const canContinue = ageConfirmed && jurisdictionConfirmed && !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Before you continue</DialogTitle>
          <DialogDescription>
            SharpLine provides sports betting odds data and analysis only. You
            must confirm the following to create an account.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          <Label className="flex items-start gap-2 font-normal">
            <Checkbox
              checked={ageConfirmed}
              onCheckedChange={(checked) => setAgeConfirmed(checked === true)}
            />
            <span>
              I confirm that I am at least {AGE_GATE_MINIMUM} years old.
            </span>
          </Label>

          <Label className="flex items-start gap-2 font-normal">
            <Checkbox
              checked={jurisdictionConfirmed}
              onCheckedChange={(checked) =>
                setJurisdictionConfirmed(checked === true)
              }
            />
            <span>
              I confirm that I am legally permitted to access sports betting
              information in my jurisdiction.
            </span>
          </Label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!canContinue} onClick={onConfirm}>
            {isSubmitting ? "Creating account..." : "Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
