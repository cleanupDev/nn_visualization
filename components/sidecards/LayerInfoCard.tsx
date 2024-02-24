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

const LayerInfoCard = () => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Layer Info</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>Layer Info description</CardDescription>
      </CardContent>
      <CardFooter>
        <Button>Button</Button>
      </CardFooter>
    </Card>
  );
};

export default LayerInfoCard;
