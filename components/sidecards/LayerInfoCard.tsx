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
    <Card>
      <CardHeader>
        <CardTitle>Layer Control</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>
          <p>Layer control description</p>
        </CardDescription>
      </CardContent>
      <CardFooter>
        <Button>Button</Button>
      </CardFooter>
    </Card>
  );
};

export default LayerInfoCard;
