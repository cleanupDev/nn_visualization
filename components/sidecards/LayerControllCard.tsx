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

import { Button } from "@/components/ui/button";

const LayerControllCard = () => {
  const [layers, setLayers] = React.useState<
    { name: string; neurons: number }[]
  >([]);

  const handleAddLayer = () => {
    if (layers.length < 3) {
      setLayers((prevLayers) => [
        ...prevLayers,
        { name: `Layer ${prevLayers.length + 1}`, neurons: 0 },
      ]);
    }
  };

  const handleDeleteLayer = () => {
    setLayers((prevLayers) => prevLayers.slice(0, prevLayers.length - 1));
  };

  const handleAddNeuron = (index: number) => {
    if (layers[index].neurons >= 4) return;
    setLayers((prevLayers) =>
      prevLayers.map((layer, idx) =>
        idx === index ? { ...layer, neurons: layer.neurons + 1 } : layer
      )
    );
  };

  const handleDeleteNeuron = (index: number) => {
    setLayers((prevLayers) =>
      prevLayers.map((layer, idx) =>
        idx === index
          ? { ...layer, neurons: Math.max(0, layer.neurons - 1) }
          : layer
      )
    );
  };

  return (
    <div className="h-full overflow-auto">
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-center">Layer Control</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-center mb-5">
            <Button id="add-layer-button" onClick={handleAddLayer}>
              Add
            </Button>
            <Button id="delete-layer-button" onClick={handleDeleteLayer}>
              Del
            </Button>
          </div>
          <CardDescription className="text-center mb-2">
            Layer | Units
          </CardDescription>
          <div id="layer-list" className="overflow-auto h-48 text-center">
            {layers.map((layer, index) => (
              <div
                key={index}
                className="layer-card grid grid-cols-2 mb-2 items-center p-2"
              >
                <p className="layer-name">
                  {layer.name} | {layer.neurons}
                </p>
                <div className="button-group flex justify-end">
                  <button
                    className="pill-button plus"
                    onClick={() => handleAddNeuron(index)}
                  >
                    +
                  </button>
                  <button
                    className="pill-button minus"
                    onClick={() => handleDeleteNeuron(index)}
                  >
                    -
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LayerControllCard;
