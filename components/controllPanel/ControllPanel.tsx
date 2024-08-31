"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  createAndCompileModel,
  inputTensor,
  targetTensor,
} from "@/model/tensorflowModel";
import { useModelStore } from "@/components/store";
import * as tf from "@tensorflow/tfjs";

const ControlPanel = () => {
  const {
    model,
    curr_epoch,
    is_training,
    setCurrAcc,
    setCurrLoss,
    setCurrPhase,
    setCurrEpoch,
    setModel,
    setIsTraining,
  } = useModelStore();

  const createModel = () => {
    if (model) model.dispose();
    const newModel = createAndCompileModel();
    setModel(newModel);
    setCurrAcc(0);
    setCurrLoss(0);
    setCurrPhase("training");
    setCurrEpoch(0);
  };

  const addEpoch = async () => {
    if (!model) return;
    setIsTraining(true);

    try {
      const history = await model.fit(inputTensor, targetTensor, {
        epochs: 100,
        callbacks: {
          onEpochEnd: async (epoch: number, logs: any) => {
            console.log(
              `Epoch ${epoch + 1}: Loss = ${logs.loss}, Accuracy = ${logs.acc}`
            );
            // Update state with the latest accuracy and loss after each epoch
            setCurrAcc(logs.acc);
            setCurrLoss(logs.loss);
            setCurrEpoch(curr_epoch + epoch + 1);
          },
        },
      });
      const acc = history.history.acc ? history.history.acc[0] : null;
      const loss = history.history.loss ? history.history.loss[0] : null;

      //setCurrAcc(acc);
      //setCurrLoss(loss);
      //setCurrPhase("training");
      // setCurrEpoch(curr_epoch + 10);
    } catch (error) {
      console.error("Training failed:", error);
    } finally {
      setIsTraining(false);
    }
  };

  const manualForwardPass = async () => {
    if (!model) return;
  };

  const addStep = async () => {};

  return (
    <div className="grid grid-cols-4 gap-1">
      <Button variant={model ? "ghost" : "destructive"} onClick={createModel}>
        Init
      </Button>
      <Button
        variant="secondary"
        disabled={!model || is_training}
        onClick={addEpoch}
      >
        +100 Epochs
      </Button>
      <Button variant="ghost" disabled={!model || is_training}>
        + Stepss
      </Button>
      <Button variant="ghost" disabled={!model || is_training}>
        + Phase
      </Button>
    </div>
  );
};

export default ControlPanel;
