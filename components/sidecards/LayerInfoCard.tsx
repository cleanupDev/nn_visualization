"use client";

import * as React from "react";
import { useModelStore } from "@/components/store";

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
    <Card className="h-full model-info-card">
      <CardHeader>
        <CardTitle>Model Info</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="model-info-table">
          <tbody>
            <tr>
              <td>Neurons:</td>
              <td>{modelData.num_neurons}</td>
            </tr>
            <tr>
              <td>Params:</td>
              <td>{modelData.num_params}</td>
            </tr>
            <tr>
              <td>Loss:</td>
              <td>
                {typeof modelData.curr_loss === "number"
                  ? modelData.curr_loss.toFixed(4)
                  : modelData.curr_loss}
              </td>
            </tr>
            <tr>
              <td>Accuracy:</td>
              <td>
                {typeof modelData.curr_acc === "number"
                  ? modelData.curr_acc.toFixed(4)
                  : modelData.curr_acc}
              </td>
            </tr>
            <tr>
              <td>Phase:</td>
              <td>{modelData.curr_phase}</td>
            </tr>
            <tr>
              <td>Epoch:</td>
              <td>{modelData.curr_epoch}</td>
            </tr>
          </tbody>
        </table>
      </CardContent>
      <CardFooter>
        <CardDescription>
          Dynamic model information updated in real-time
        </CardDescription>
      </CardFooter>
    </Card>
  );
};

export default LayerInfoCard;
