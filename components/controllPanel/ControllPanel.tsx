"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { createAndCompileModel } from "@/model/tensorflowModel";

const ControlPanel = () => {
  const createModel = () => {
    const model = createAndCompileModel();
  };

  return (
    <div className="grid grid-cols-4 gap-1">
      <Button variant="outline" onClick={createModel}>
        Init
      </Button>
      <Button variant="ghost">+ Epoch</Button>
      <Button variant="ghost">+ Step</Button>
      <Button variant="ghost">+ Phase</Button>
    </div>
  );
};

export default ControlPanel;
