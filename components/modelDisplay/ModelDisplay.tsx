"use client";

import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import { useModelStore } from "@/components/store";

const ModelDisplay = () => {
  const svgRef = useRef();
  const { input_neurons, layers, output_neurons = 1 } = useModelStore();
  const width = 800;
  const height = 600;
  const radius = 20;
  const squareSide = 40;
  const totalColumns = layers.length + 2;
  const columnWidth = width / totalColumns;

  useEffect(() => {
    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("stroke-width", 2);

    const calculatePositions = (neuronCount, columnIndex) => {
      const spacing = height / Math.max(neuronCount, 1);
      return Array.from({ length: neuronCount }, (_, i) => ({
        x: columnWidth * columnIndex + columnWidth / 2,
        y: (i + 1) * spacing - spacing / 2,
      }));
    };

    const updateInputNeurons = () => {
      const inputPositions = calculatePositions(input_neurons, 0);
      svg
        .selectAll(".input-neuron")
        .data(inputPositions)
        .join("rect")
        .attr("class", "input-neuron")
        .attr("x", (d) => d.x - squareSide / 2)
        .attr("y", (d) => d.y - squareSide / 2)
        .attr("width", squareSide)
        .attr("height", squareSide)
        .attr("transform", (d) => `rotate(45,${d.x},${d.y})`)
        .attr("fill", "lightblue");
    };

    const updateLayerNeurons = () => {
      svg.selectAll(".intermediate-neuron").remove();

      layers.forEach((layer, i) => {
        const layerPositions = calculatePositions(layer.neurons, i + 1);
        svg
          .selectAll(`.layer-${i}`)
          .data(layerPositions)
          .join("circle")
          .attr("class", `intermediate-neuron layer-${i}`)
          .attr("cx", (d) => d.x)
          .attr("cy", (d) => d.y)
          .attr("r", radius)
          .attr("fill", d3.schemeCategory10[i % 10]);
      });

      const outputPosition = calculatePositions(
        output_neurons,
        layers.length + 1
      );
      svg
        .selectAll(".output-neuron")
        .data(outputPosition)
        .join("circle")
        .attr("class", "output-neuron")
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y)
        .attr("r", radius)
        .attr("fill", "orange");
    };
    const updateConnections = () => {
      svg.selectAll("line").remove();

      const inputPositions = calculatePositions(input_neurons, 0);
      if (layers.length > 0) {
        const firstLayerPositions = calculatePositions(layers[0].neurons, 1);
        inputPositions.forEach((inputPosition) => {
          firstLayerPositions.forEach((layerPosition) => {
            svg
              .append("line")
              .attr("x1", inputPosition.x)
              .attr("y1", inputPosition.y)
              .attr("x2", layerPosition.x)
              .attr("y2", layerPosition.y)
              .attr("stroke", "gray")
              .attr("stroke-width", 1);
          });
        });
      }

      if (layers.length === 0) {
        const outputPositions = calculatePositions(output_neurons, 1);
        inputPositions.forEach((inputPosition) => {
          outputPositions.forEach((outputPosition) => {
            svg
              .append("line")
              .attr("x1", inputPosition.x)
              .attr("y1", inputPosition.y)
              .attr("x2", outputPosition.x)
              .attr("y2", outputPosition.y)
              .attr("stroke", "gray")
              .attr("stroke-width", 1);
          });
        });
      }

      layers.forEach((layer, i) => {
        if (i < layers.length - 1) {
          const currentLayerPositions = calculatePositions(
            layer.neurons,
            i + 1
          );
          const nextLayerPositions = calculatePositions(
            layers[i + 1].neurons,
            i + 2
          );
          currentLayerPositions.forEach((currentPosition) => {
            nextLayerPositions.forEach((nextPosition) => {
              svg
                .append("line")
                .attr("x1", currentPosition.x)
                .attr("y1", currentPosition.y)
                .attr("x2", nextPosition.x)
                .attr("y2", nextPosition.y)
                .attr("stroke", "gray")
                .attr("stroke-width", 1);
            });
          });
        }
      });

      if (layers.length > 0) {
        const lastLayerPositions = calculatePositions(
          layers[layers.length - 1].neurons,
          layers.length
        );
        const outputPositions = calculatePositions(
          output_neurons,
          layers.length + 1
        );
        lastLayerPositions.forEach((lastPosition) => {
          outputPositions.forEach((outputPosition) => {
            svg
              .append("line")
              .attr("x1", lastPosition.x)
              .attr("y1", lastPosition.y)
              .attr("x2", outputPosition.x)
              .attr("y2", outputPosition.y)
              .attr("stroke", "gray")
              .attr("stroke-width", 1);
          });
        });
      }
    };

    updateInputNeurons();
    updateLayerNeurons();
    updateConnections();
  }, [input_neurons, layers, output_neurons]);

  return (
    <div>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default ModelDisplay;
