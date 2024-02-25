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

import { Button } from "@/components/ui/button";

const LayerControlCard = () => {
  const {
    layers,
    is_training,
    setLayers,
    setNumLayers,
    setNumNeurons,
    resetModelData,
  } = useModelStore();

  const updateStore = (newLayers: { name: string; neurons: number }[]) => {
    setLayers(newLayers);
    setNumLayers(newLayers.length);
    const totalNeurons = newLayers.reduce(
      (acc, layer) => acc + layer.neurons,
      1
    );
    setNumNeurons(totalNeurons);
  };

  const handleAddLayer = () => {
    if (layers.length < 3) {
      const newLayers = [
        ...layers,
        { name: `Layer ${layers.length + 1}`, neurons: 1 },
      ];
      updateStore(newLayers);
      resetModelData();
    }
  };

  const handleDeleteLayer = () => {
    const newLayers = layers.slice(0, layers.length - 1);
    updateStore(newLayers);
    resetModelData();
  };

  const handleAddNeuron = (index: number) => {
    if (layers[index].neurons >= 4) return;
    const newLayers = layers.map((layer, idx) =>
      idx === index ? { ...layer, neurons: layer.neurons + 1 } : layer
    );
    updateStore(newLayers);
    resetModelData();
  };

  const handleDeleteNeuron = (index: number) => {
    const newLayers = layers.map((layer, idx) =>
      idx === index
        ? { ...layer, neurons: Math.max(1, layer.neurons - 1) }
        : layer
    );
    updateStore(newLayers);
    resetModelData();
  };

  return (
    <div className="h-full overflow-auto">
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Layer Control</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-center mb-5">
            <Button
              variant="outline"
              id="add-layer-button"
              onClick={handleAddLayer}
              disabled={is_training}
            >
              Add
            </Button>
            <Button
              variant="outline"
              id="delete-layer-button"
              onClick={handleDeleteLayer}
              disabled={is_training}
            >
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
                    disabled={is_training}
                  >
                    +
                  </button>
                  <button
                    className="pill-button minus"
                    onClick={() => handleDeleteNeuron(index)}
                    disabled={is_training}
                  >
                    -
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <CardDescription>
            Dynamic model information updated in real-time
          </CardDescription>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LayerControlCard;
