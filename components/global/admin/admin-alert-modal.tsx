import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAppContext } from "@/lib/context";
import { adminStatusMap } from "@/utils/status";

export default function AdminAlertModal({
  children,
  open,
  setOpen,
  alertType,
  data,
}: {
  open?: boolean;
  setOpen?: (open: boolean) => void;
  alertType?: "block" | "remove" | "approve" | "reject";
  data?: any;
  children?: React.ReactNode;
}) {
  const { refetchUsers, sendNotification, refetchQaUsers } = useAppContext();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [note, setNote] = useState("");
  const { toast } = useToast();
  const title =
    alertType === "block"
      ? "Blocking the user?"
      : alertType === "remove"
        ? "Removing the user?"
        : alertType === "approve"
          ? "Approving application?"
          : "Rejecting application?";
  const description =
    alertType === "block"
      ? "You are about to block the user from logging to his acacount. The user will be notified through his registered email that his account has been blocked by the admin. <strong>Would your like to proceed?</strong>"
      : alertType === "remove"
        ? "You are about to remove the user from the platform. The user will be notified through his registered email that his account has been deleted by the admin. <strong>Would your like to proceed?</strong>"
        : alertType === "approve"
          ? "You are about to approve the Pro application. The Pro will be notified by your response. <strong>Would your like to proceed?</strong>"
          : alertType === "reject"
            ? "You are about to reject the Pro application. The Pro will be notified by your response. <strong>Would your like to proceed?</strong>"
            : "";

  const placeholder =
    alertType === "block"
      ? "Explain the reasons for the block. The user will be emailed by those notes.."
      : alertType === "reject"
        ? "Explain the reasons for rejecting the application, The user will be emailed by those notes.."
        : "";

  const showTextArea = alertType === "block" || alertType === "reject";

  const handleSubmit = async () => {
    try {
      console.log({ data });
      setIsLoading(true);
      const response = await fetch(`/api/admin/update`, {
        method: "PATCH",

        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: adminStatusMap[alertType as keyof typeof adminStatusMap],
          id: data._id,
        }),
      });

      const responseData: any = await response.json();

      if (responseData.status === 200) {
        refetchUsers();
        refetchQaUsers();
        toast({
          variant: "success",
          title: `User ${adminStatusMap[alertType as keyof typeof adminStatusMap]} successfully!`,
          description: "The user will be notified by your response.",
        });
        buttonRef.current?.click();
        setIsLoading(false);
        setIsOpen(false);
        setOpen && setOpen(false);

        const messageMap = {
          block: note
            ? `<p style="font-size: 16px; color: red;">You have been <strong>blocked</strong> from the platform. <br/> <br/> <strong>Note:</strong> ${note}</p>`
            : `<p style="font-size: 16px; color: red;">You have been <strong>blocked</strong> from the platform.</p>`,
          remove: note
            ? `<p style="font-size: 16px; color: red;">You have been <strong>removed</strong> from the platform. <br/> <br/> <strong>Note:</strong> ${note}</p>`
            : `<p style="font-size: 16px; color: red;">You have been <strong>removed</strong> from the platform.</p>`,
          approve: note
            ? `<p style="font-size: 16px; color: green;">Your application has been <strong>approved</strong>. <br/> <br/> <strong>Note:</strong> ${note}</p>`
            : `<p style="font-size: 16px; color: green;">Your application has been <strong>approved</strong>.</p>`,
          reject: note
            ? `<p style="font-size: 16px; color: red;">Your application has been <strong>rejected</strong>. <br/> <br/> <strong>Note:</strong> ${note}</p>`
            : `<p style="font-size: 16px; color: red;">Your application has been <strong>rejected</strong>.</p>`,
        };

        await sendNotification(
          messageMap[alertType as keyof typeof messageMap],
          data._id,
          data.email
        );
        setNote("");
      } else {
        setIsLoading(false);
        return toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: "Please try again.",
        });
      }
    } catch (error) {
      console.log(error);
      setIsLoading(false);
      return toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "Please try again.",
      });
    }
  };

  return (
    <Dialog open={open || isOpen} onOpenChange={setOpen ? setOpen : setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-full sm:max-w-[852px] p-4 sm:p-8">
        <DialogHeader>
          <DialogTitle className="text-center mb-2 sm:mb-4 text-lg sm:text-xl">
            {title}
          </DialogTitle>
          <DialogDescription
            className="text-sm sm:text-base text-center"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </DialogHeader>

        {showTextArea && (
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={placeholder}
            className="min-h-[120px] sm:min-h-[160px] rounded-lg sm:rounded-xl"
          />
        )}

        <div className="flex flex-row gap-2 sm:gap-3 mt-2">
          <Button
            variant="outline"
            onClick={handleSubmit}
            className={cn(
              "flex-1 h-[50px] sm:h-[75px] rounded-lg sm:rounded-xl hover:text-black text-lg",
              alertType === "approve" && "bg-primary text-white"
            )}
            disabled={isLoading}
          >
            Yes! {isLoading && <Loader2 className="size-4 animate-spin" />}
          </Button>
          <DialogClose asChild ref={buttonRef}>
            <Button
              variant="outline"
              className={cn(
                "flex-1 h-[50px] sm:h-[75px] rounded-lg sm:rounded-xl text-lg",
                alertType !== "approve" &&
                  "bg-red-600 hover:bg-red-600/90 text-white"
              )}
              disabled={isLoading}
            >
              No
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
