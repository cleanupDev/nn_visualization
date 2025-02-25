"use client";

import * as React from "react";
import { useModelStore } from "@/components/store";
import { Layers } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

const LayerControlCard = () => {
  const {
    layers,
    is_training,
    setLayers,
    setNumLayers,
    setNumNeurons,
    rebuildModelFromLayers,
  } = useModelStore();

  const updateStore = (newLayers: { name: string; neurons: number }[]) => {
    setLayers(newLayers);
    setNumLayers(newLayers.length);
    const totalNeurons = newLayers.reduce(
      (acc, layer) => acc + layer.neurons,
      0
    );
    setNumNeurons(totalNeurons);
    
    // Rebuild the model with the new layer configuration
    rebuildModelFromLayers();
  };

  const handleAddLayer = () => {
    if (layers.length < 5) {
      const newLayers = [
        ...layers,
        { name: `Layer ${layers.length + 1}`, neurons: 1 },
      ];
      updateStore(newLayers);
    }
  };

  const handleDeleteLayer = () => {
    if (layers.length > 1) {
      const newLayers = [...layers];
      newLayers.pop();
      updateStore(newLayers);
    }
  };

  const handleAddNeuron = (index: number) => {
    if (layers[index].neurons < 8) {
      const newLayers = [...layers];
      newLayers[index].neurons += 1;
      updateStore(newLayers);
    }
  };

  const handleDeleteNeuron = (index: number) => {
    if (layers[index].neurons > 1) {
      const newLayers = [...layers];
      newLayers[index].neurons -= 1;
      updateStore(newLayers);
    }
  };

  const handleNeuronChange = (index: number, value: number[]) => {
    if (value[0] >= 1 && value[0] <= 8) {
      const newLayers = [...layers];
      newLayers[index].neurons = value[0];
      updateStore(newLayers);
    }
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center font-mono text-sm font-medium text-zinc-300">
          <Layers className="mr-2 h-4 w-4" />
          LAYER.CONTROL
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Button 
            className="flex-1 bg-zinc-800 font-mono text-xs text-zinc-300 hover:bg-zinc-700"
            onClick={handleAddLayer} 
            disabled={is_training || layers.length >= 5}
          >
            ADD.LAYER()
          </Button>
          <Button
            className="flex-1 border-zinc-800 bg-black/50 font-mono text-xs text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300"
            variant="outline"
            onClick={handleDeleteLayer}
            disabled={is_training || layers.length <= 1}
          >
            DEL.LAYER()
          </Button>
        </div>

        {layers.map((layer, index) => (
          <div key={layer.name} className="space-y-2 rounded-lg border border-zinc-800 bg-black/50 p-3">
            <div className="flex items-center justify-between">
              <Label className="font-mono text-xs text-zinc-500">{layer.name}</Label>
              <span className="font-mono text-xs text-zinc-400">{layer.neurons}</span>
            </div>
            <Slider
              value={[layer.neurons]}
              min={1}
              max={8}
              step={1}
              disabled={is_training}
              onValueChange={(value) => handleNeuronChange(index, value)}
              className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:border-zinc-800 [&_[role=slider]]:bg-zinc-900"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default LayerControlCard;
