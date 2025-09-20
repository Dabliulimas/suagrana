"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

// Widget temporário para resolver erro de compilação
export const MarketTickerWidget = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Ticker</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Widget de cotações em desenvolvimento
        </p>
      </CardContent>
    </Card>
  );
};

export default MarketTickerWidget;
