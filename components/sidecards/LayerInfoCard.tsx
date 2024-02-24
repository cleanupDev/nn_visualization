"use client";

import * as React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Assuming BasicModelDataMock might be replaced with real data fetching in the future
const LayerInfoCard = () => {
  const [modelData, setModelData] = React.useState({
    num_neurons: 3,
    num_params: 100,
    curr_loss: 0.1,
    curr_acc: 0.9,
    curr_phase: "feed forward",
    curr_epoch: 10,
  });

  // Placeholder for a function that could update modelData, e.g., from an API call
  const updateModelData = (newData) => {
    setModelData(newData);
  };

  // Example usage, could be triggered by useEffect for data fetching or other events
  // React.useEffect(() => {
  //   fetchModelData().then(data => updateModelData(data));
  // }, []);

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
              <td>{modelData.curr_loss.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Accuracy:</td>
              <td>{(modelData.curr_acc * 100).toFixed(1)}%</td>
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
