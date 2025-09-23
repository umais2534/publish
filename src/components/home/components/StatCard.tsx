import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const StatCard = ({ title, value }) => (
  <Card className="transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl cursor-pointer">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

export default StatCard;
