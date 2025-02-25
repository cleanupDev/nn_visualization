"use client";

import * as React from "react";
import { useModelStore } from "@/components/store";
import { Info } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const LayerInfoCard = () => {
  const modelData = useModelStore((state) => ({
    num_neurons: state.num_neurons,
    num_params: state.num_params,
    curr_loss: state.curr_loss,
    curr_acc: state.curr_acc,
    curr_phase: state.curr_phase,
    curr_epoch: state.curr_epoch,
  }));

  return (
    <Card className="border-zinc-800 bg-zinc-900/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center font-mono text-sm font-medium text-zinc-300">
          <Info className="mr-2 h-4 w-4" />
          MODEL.INFO
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 rounded-lg border border-zinc-800 bg-black/50 p-3 font-mono text-xs">
          <div className="flex justify-between">
            <span className="text-zinc-500">NEURONS.TOTAL</span>
            <span className="text-zinc-300">{modelData.num_neurons}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">PARAMETERS.TOTAL</span>
            <span className="text-zinc-300">{modelData.num_params}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">PHASE.CURRENT</span>
            <span className="text-zinc-300">{modelData.curr_phase}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">EPOCH.CURRENT</span>
            <span className="text-zinc-300">{modelData.curr_epoch}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">LOSS.CURRENT</span>
            <span className="text-emerald-400">
              {typeof modelData.curr_loss === "number"
                ? modelData.curr_loss.toFixed(4)
                : modelData.curr_loss}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">ACCURACY</span>
            <span className="text-emerald-400">
              {typeof modelData.curr_acc === "number"
                ? `${(modelData.curr_acc * 100).toFixed(2)}%`
                : modelData.curr_acc}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LayerInfoCard;
