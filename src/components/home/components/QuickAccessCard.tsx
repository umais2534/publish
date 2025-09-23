import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

const QuickAccessCard = ({ card,borderColorClass }) => (
 
  <Card className={`overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 border-2 ${borderColorClass}`}>
    <CardContent className="transition-transform duration-300 ease-in-out hover:scale-110 cursor-pointer p-6 flex flex-col h-full">
      <div className={`rounded-full w-16 h-16 flex items-center justify-center mb-4 ${card.color}`}>
        {card.icon}
      </div>
      <h3 className="font-semibold text-lg mb-2">{card.title}</h3>
      <p className="text-muted-foreground text-sm mb-4">{card.description}</p>
      <div className="mt-auto">
        <Button onClick={card.action} className="w-full bg-[#0F172A] hover:bg-[#334155] text-white">
          Go to {card.title.split(" ").pop()}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </CardContent>
  </Card>


);

export default QuickAccessCard;
