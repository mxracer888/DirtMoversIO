import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface LoadDataPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { ticketNumber: string | null; netWeight: number | null }) => void;
  materialType?: string;
}

export default function LoadDataPopup({ 
  isOpen, 
  onClose, 
  onSubmit, 
  materialType 
}: LoadDataPopupProps) {
  const [ticketNumber, setTicketNumber] = useState("");
  const [netWeight, setNetWeight] = useState("");
  const [noTicket, setNoTicket] = useState(false);

  // Check if material is export type - bypass popup for export materials
  const isExportMaterial = materialType?.toLowerCase().includes("export");

  const handleSubmit = () => {
    const data = {
      ticketNumber: noTicket ? null : ticketNumber || null,
      netWeight: netWeight ? parseFloat(netWeight) : null
    };
    onSubmit(data);
    
    // Reset form
    setTicketNumber("");
    setNetWeight("");
    setNoTicket(false);
    onClose();
  };

  const handleClose = () => {
    // Reset form
    setTicketNumber("");
    setNetWeight("");
    setNoTicket(false);
    onClose();
  };

  const isValid = (noTicket || ticketNumber.trim()) && netWeight.trim();

  return (
    <Dialog open={isOpen && !isExportMaterial} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Load Data Entry</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ticketNumber">Ticket Number</Label>
            <Input
              id="ticketNumber"
              type="text"
              placeholder="Enter ticket number"
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value)}
              disabled={noTicket}
            />
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="noTicket"
                checked={noTicket}
                onCheckedChange={(checked) => {
                  setNoTicket(checked as boolean);
                  if (checked) setTicketNumber("");
                }}
              />
              <Label htmlFor="noTicket" className="text-sm text-gray-600">
                No ticket provided (N/A)
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="netWeight">Net Weight (tons)</Label>
            <Input
              id="netWeight"
              type="number"
              step="0.01"
              placeholder="Enter net weight"
              value={netWeight}
              onChange={(e) => setNetWeight(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!isValid}
              className="flex-1"
            >
              Submit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}