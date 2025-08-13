"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CreditCard, ExternalLink, CheckCircle2, CircleDollarSign, ArrowRight, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface PaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  premium: number
  onPaymentComplete: () => void
  calculationType: string
}

export function PaymentModal({ open, onOpenChange, premium, onPaymentComplete, calculationType }: PaymentModalProps) {
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false)
  const [animateCheckmark, setAnimateCheckmark] = useState<boolean>(false)

  // Reset animation state when modal opens
  useEffect(() => {
    if (open) {
      setIsRedirecting(false)
      setAnimateCheckmark(false)
    }
  }, [open])

  // Process payment (redirect to QBCC website)
  const processPayment = () => {
    setIsRedirecting(true)

    // Show checkmark animation
    setTimeout(() => {
      setAnimateCheckmark(true)
    }, 300)

    // Delay redirect slightly to show animation
    setTimeout(() => {
      window.open("https://www.qbcc.qld.gov.au/online-services/payment-options", "_blank")
      onOpenChange(false)
      onPaymentComplete()
    }, 1500)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        // Prevent closing during redirect animation
        if (!isRedirecting) {
          onOpenChange(isOpen)
        }
      }}
    >
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden max-w-[95vw] rounded-lg">
        <div className="bg-primary/10 dark:bg-primary/5 p-4 sm:p-6 pb-3 sm:pb-4 border-b">
          <DialogHeader className="mb-1">
            <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2">
              <CircleDollarSign className="h-5 w-5 sm:h-6 sm:w-6" />
              <span>Payment Confirmation</span>
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              You're about to pay your {calculationType.toLowerCase()} premium
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between mt-3 sm:mt-4">
            <div>
              <div className="text-xs sm:text-sm text-muted-foreground">Amount</div>
              <div className="text-2xl sm:text-3xl font-bold">${premium.toFixed(2)}</div>
            </div>
            <Badge variant="secondary" className="text-xs px-2 py-1 sm:px-3 sm:py-1">
              QBCC Premium
            </Badge>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="space-y-4">
            {/* Payment info card */}
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-3 sm:p-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <div
                  className={cn(
                    "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-primary/10 text-primary shrink-0",
                    isRedirecting && "animate-pulse",
                  )}
                >
                  {animateCheckmark ? (
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 animate-in zoom-in duration-300" />
                  ) : (
                    <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-sm sm:text-base">QBCC Payment Portal</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    You'll be redirected to the official QBCC website to securely complete your payment.
                  </p>
                </div>
              </div>
            </div>

            {/* Security note */}
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <ShieldCheck className="h-3 w-3 sm:h-4 sm:w-4" />
              <p>Your payment is securely processed by QBCC</p>
            </div>
          </div>
        </div>

        <DialogFooter className="bg-muted/50 p-4 sm:p-6 pt-3 sm:pt-4 border-t flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRedirecting}
            className="w-full sm:w-auto order-2 sm:order-1 h-12 sm:h-10"
          >
            Cancel
          </Button>
          <Button
            onClick={processPayment}
            className={cn(
              "bg-primary text-primary-foreground w-full sm:w-auto order-1 sm:order-2 h-12 sm:h-10",
              isRedirecting && "opacity-90 pointer-events-none",
            )}
            disabled={isRedirecting}
          >
            {isRedirecting ? (
              <span className="flex items-center">
                Processing
                <span className="ml-2 flex gap-1">
                  <span className="animate-bounce inline-block h-1 w-1 bg-current rounded-full"></span>
                  <span className="animate-bounce inline-block h-1 w-1 bg-current rounded-full animation-delay-200"></span>
                  <span className="animate-bounce inline-block h-1 w-1 bg-current rounded-full animation-delay-500"></span>
                </span>
              </span>
            ) : (
              <span className="flex items-center">
                <CreditCard className="mr-2 h-4 w-4" />
                Proceed to Payment
                <ArrowRight className="ml-2 h-4 w-4" />
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
