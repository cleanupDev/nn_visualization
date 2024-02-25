import React from "react";
import { Button } from "@/components/ui/button";

const ControlPanel = () => {
  return (
    <div className="grid grid-cols-4 gap-1">
      <Button variant="destructive">Init</Button>
      <Button variant="ghost">+ Epoch</Button>
      <Button variant="ghost">+ Step</Button>
      <Button variant="ghost">+ Phase</Button>
    </div>
  );
};

export default ControlPanel;
